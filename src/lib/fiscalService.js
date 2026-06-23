import { prisma } from './db';

/**
 * Valida se o pedido e todos os produtos possuem os dados cadastrais obrigatórios para emissão de NF-e.
 */
export function validateFiscalData(order, items) {
  const errors = [];

  // 1. Validar dados da empresa emitente nas variáveis de ambiente se em produção
  const isProduction = process.env.FISCAL_ENVIRONMENT === 'production';
  if (isProduction) {
    const requiredEnv = [
      'COMPANY_CNPJ', 'COMPANY_IE', 'COMPANY_RAZAO_SOCIAL', 'COMPANY_NOME_FANTASIA',
      'COMPANY_ADDRESS', 'COMPANY_ADDRESS_NUMBER', 'COMPANY_NEIGHBORHOOD',
      'COMPANY_CITY', 'COMPANY_STATE', 'COMPANY_ZIPCODE'
    ];
    for (const envVar of requiredEnv) {
      if (!process.env[envVar]) {
        errors.push(`Configuração da empresa emitente ausente: ${envVar} no arquivo .env`);
      }
    }
  }

  // 2. Validar dados do destinatário (cliente)
  if (!order.customerName?.trim()) errors.push('Nome do cliente está vazio.');
  if (!order.customerCpfCnpj?.trim()) {
    errors.push('CPF ou CNPJ do cliente é obrigatório para emissão de nota fiscal.');
  } else {
    const cleanCpfCnpj = order.customerCpfCnpj.replace(/\D/g, '');
    if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
      errors.push('CPF ou CNPJ do cliente é inválido (deve conter 11 ou 14 dígitos).');
    }
  }
  if (!order.customerWhatsapp?.trim()) errors.push('WhatsApp/Telefone do cliente é obrigatório.');
  
  // Validar campos de endereço postal
  const isRetirada = order.deliveryMethod?.toLowerCase().includes('retirada');
  if (!isRetirada) {
    if (!order.cep?.trim()) errors.push('CEP de entrega é obrigatório.');
    if (!order.street?.trim()) errors.push('Endereço/Rua de entrega é obrigatório.');
    if (!order.number?.trim()) errors.push('Número do endereço de entrega é obrigatório.');
    if (!order.neighborhood?.trim()) errors.push('Bairro de entrega é obrigatório.');
  }
  if (!order.city?.trim()) errors.push('Cidade de entrega é obrigatória.');
  if (!order.state?.trim()) errors.push('Estado/UF de entrega é obrigatório.');

  // 3. Validar dados fiscais de cada item (produto)
  if (!items || items.length === 0) {
    errors.push('O pedido não possui nenhum item cadastrado.');
  } else {
    items.forEach((item, index) => {
      const prodName = item.productName || `Item #${index + 1}`;
      const product = item.product;

      if (!product) {
        errors.push(`Dados do produto para o item "${prodName}" não foram carregados.`);
        return;
      }

      if (!product.sku?.trim()) errors.push(`Produto "${prodName}" está sem SKU/Código interno.`);
      if (!product.ncm?.trim()) {
        errors.push(`Produto "${prodName}" está sem NCM cadastrado (obrigatório para NF-e).`);
      } else {
        const cleanNcm = product.ncm.replace(/\D/g, '');
        if (cleanNcm.length !== 8) {
          errors.push(`NCM do produto "${prodName}" é inválido (deve conter 8 dígitos).`);
        }
      }
      if (!product.cfop?.trim()) errors.push(`Produto "${prodName}" está sem CFOP de saída cadastrado.`);
      if (!product.cst?.trim()) errors.push(`Produto "${prodName}" está sem CST ou CSOSN cadastrado.`);
      if (product.origin === null || product.origin === undefined) {
        errors.push(`Produto "${prodName}" está sem Origem da Mercadoria cadastrada.`);
      }
      if (!product.unit?.trim()) errors.push(`Produto "${prodName}" está sem Unidade de Medida (ex: UN, PC).`);
      if (item.unitPrice <= 0) errors.push(`O preço unitário do produto "${prodName}" deve ser maior que zero.`);
    });
  }

  return errors;
}

/**
 * Adiciona um registro no histórico de logs fiscais do pedido.
 */
function addFiscalLog(existingLogsStr, actionType, status, message, adminEmail) {
  let logs = [];
  if (existingLogsStr) {
    try {
      logs = JSON.parse(existingLogsStr);
    } catch (e) {
      logs = [];
    }
  }
  logs.push({
    action: actionType,
    status: status, // 'success' | 'error' | 'warning'
    message: message,
    timestamp: new Date().toISOString(),
    admin: adminEmail || 'Sistema'
  });
  return JSON.stringify(logs);
}

/**
 * Serviço de Emissão Fiscal (Adapter Router)
 */
export async function emitInvoice(orderId, adminEmail) {
  try {
    // 1. Carregar pedido completo com itens e detalhes dos produtos
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      throw new Error('Pedido não encontrado no banco de dados.');
    }

    // 2. Prevenir emissão duplicada
    if (['nota_autorizada', 'nota_em_processamento', 'nota_cancelada'].includes(order.fiscalStatus)) {
      throw new Error(`Este pedido já possui uma nota fiscal vinculada com status: ${order.fiscalStatus}.`);
    }

    // 3. Executar validações cadastrais locais
    const validationErrors = validateFiscalData(order, order.items);
    if (validationErrors.length > 0) {
      // Atualiza o banco com o erro e gera log
      const updatedLogs = addFiscalLog(
        order.fiscalLogs,
        'EMISSAO_REJEITADA_LOCAL',
        'error',
        `Rejeitado localmente na pré-validação: ${validationErrors.join(' | ')}`,
        adminEmail
      );
      
      await prisma.order.update({
        where: { id: orderId },
        data: {
          fiscalStatus: 'erro_emissao',
          fiscalErrorMessage: `Erro de validação: ${validationErrors[0]} (e mais ${validationErrors.length - 1} erros)`,
          fiscalLogs: updatedLogs
        }
      });
      
      return { success: false, errors: validationErrors };
    }

    const provider = process.env.FISCAL_API_PROVIDER || 'mock';
    const environment = process.env.FISCAL_ENVIRONMENT || 'homologation';

    // 4. Delegar ao adaptador correspondente
    if (provider === 'mock') {
      return await emitMockInvoice(order, adminEmail, environment);
    } else if (provider === 'focus_nfe') {
      return await emitFocusNfeInvoice(order, adminEmail, environment);
    } else {
      throw new Error(`Provedor fiscal "${provider}" configurado é desconhecido ou não suportado.`);
    }
  } catch (error) {
    console.error('Erro no processamento da emissão fiscal:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Consulta o status da nota fiscal no provedor correspondente.
 */
export async function queryInvoiceStatus(orderId, adminEmail) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) throw new Error('Pedido não encontrado.');
    if (!order.fiscalInvoiceId && !order.fiscalAccessKey) {
      throw new Error('Não há nota fiscal emitida para este pedido.');
    }

    const provider = order.fiscalProvider || process.env.FISCAL_API_PROVIDER || 'mock';
    
    if (provider === 'mock') {
      return await queryMockStatus(order, adminEmail);
    } else if (provider === 'focus_nfe') {
      return await queryFocusNfeStatus(order, adminEmail);
    } else {
      throw new Error(`Provedor fiscal "${provider}" não suportado para consulta.`);
    }
  } catch (error) {
    console.error('Erro na consulta do status fiscal:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Solicita o cancelamento da nota fiscal autorizada.
 */
export async function cancelInvoice(orderId, justification, adminEmail) {
  try {
    if (!justification || justification.trim().length < 15) {
      throw new Error('A justificativa de cancelamento deve conter no mínimo 15 caracteres.');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) throw new Error('Pedido não encontrado.');
    if (order.fiscalStatus !== 'nota_autorizada') {
      throw new Error('Somente notas fiscais com status "nota_autorizada" podem ser canceladas.');
    }

    const provider = order.fiscalProvider || process.env.FISCAL_API_PROVIDER || 'mock';

    if (provider === 'mock') {
      return await cancelMockInvoice(order, justification, adminEmail);
    } else if (provider === 'focus_nfe') {
      return await cancelFocusNfeInvoice(order, justification, adminEmail);
    } else {
      throw new Error(`Provedor fiscal "${provider}" não suportado para cancelamento.`);
    }
  } catch (error) {
    console.error('Erro no cancelamento da nota fiscal:', error.message);
    return { success: false, error: error.message };
  }
}


/* ==========================================================================
   ADAPTADOR SIMULADO (MOCK ADAPTER)
   ========================================================================== */

async function emitMockInvoice(order, adminEmail, environment) {
  const invoiceId = `MOCK-INV-${order.id.slice(0, 8).toUpperCase()}-${Math.floor(Math.random() * 10000)}`;
  
  const rawResponse = {
    message: "Nota fiscal enviada com sucesso para a SEFAZ de teste.",
    reference: order.id,
    id: invoiceId,
    status: "processando_autorizacao"
  };

  const updatedLogs = addFiscalLog(
    order.fiscalLogs,
    'EMISSAO_SOLICITADA',
    'success',
    `Emissão solicitada via provedor MOCK em ambiente de ${environment}. ID da Nota: ${invoiceId}`,
    adminEmail
  );

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      fiscalStatus: 'nota_em_processamento',
      fiscalProvider: 'mock',
      fiscalEnvironment: environment,
      fiscalInvoiceId: invoiceId,
      fiscalRawResponse: JSON.stringify(rawResponse),
      fiscalErrorMessage: null,
      fiscalLogs: updatedLogs
    }
  });

  return { success: true, order: updatedOrder };
}

async function queryMockStatus(order, adminEmail) {
  // Simular autorização na consulta se o status atual for em processamento
  if (order.fiscalStatus === 'nota_em_processamento') {
    const number = String(Math.floor(Math.random() * 900000) + 100000);
    const series = "1";
    const accessKey = Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join('');
    const protocol = String(Math.floor(Math.random() * 9000000000) + 1000000000);
    
    const rawResponse = {
      status: "autorizado",
      numero: number,
      serie: series,
      chave_nfe: accessKey,
      protocolo: protocol,
      data_autorizacao: new Date().toISOString(),
      caminho_xml_nota_fiscal: "https://homologacao.focusnfe.com.br/mock-xml.xml",
      caminho_pdf_danfe: "https://homologacao.focusnfe.com.br/mock-danfe.pdf"
    };

    const updatedLogs = addFiscalLog(
      order.fiscalLogs,
      'STATUS_CONSULTADO',
      'success',
      `Consulta de status: Nota Fiscal Autorizada com Sucesso! Chave: ${accessKey}`,
      adminEmail
    );

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        fiscalStatus: 'nota_autorizada',
        fiscalNumber: number,
        fiscalSeries: series,
        fiscalAccessKey: accessKey,
        fiscalProtocol: protocol,
        fiscalIssuedAt: new Date(),
        fiscalPdfUrl: rawResponse.caminho_pdf_danfe,
        fiscalXmlUrl: rawResponse.caminho_xml_nota_fiscal,
        fiscalRawResponse: JSON.stringify(rawResponse),
        fiscalErrorMessage: null,
        fiscalLogs: updatedLogs
      }
    });

    return { success: true, order: updatedOrder };
  } else {
    // Retornar status atual
    return { success: true, order };
  }
}

async function cancelMockInvoice(order, justification, adminEmail) {
  const rawResponse = {
    status: "cancelado",
    justificativa: justification,
    data_cancelamento: new Date().toISOString()
  };

  const updatedLogs = addFiscalLog(
    order.fiscalLogs,
    'NOTA_CANCELADA',
    'warning',
    `Nota cancelada pelo admin com justificativa: "${justification}"`,
    adminEmail
  );

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      fiscalStatus: 'nota_cancelada',
      fiscalRawResponse: JSON.stringify(rawResponse),
      fiscalLogs: updatedLogs
    }
  });

  return { success: true, order: updatedOrder };
}


/* ==========================================================================
   ADAPTADOR FOCUS NFE (REAL ADAPTER)
   ========================================================================== */

/**
 * Constrói o cabeçalho de autenticação básica para o Focus NFe
 */
function getFocusHeaders() {
  const token = process.env.FISCAL_API_TOKEN || '';
  const base64Token = Buffer.from(token + ':').toString('base64');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${base64Token}`
  };
}

/**
 * Constrói o payload estruturado para a Focus NFe
 */
function buildFocusNfePayload(order, environment) {
  const emitenteCnpj = (process.env.COMPANY_CNPJ || '').replace(/\D/g, '');
  const destinatarioCpfCnpj = (order.customerCpfCnpj || '').replace(/\D/g, '');

  const items = order.items.map((item, index) => {
    const p = item.product;
    const itemTotal = item.subtotal;

    return {
      numero_item: String(index + 1),
      codigo_produto: p.sku || p.id.slice(0, 8),
      descricao: p.name,
      ncm: p.ncm.replace(/\D/g, ''),
      cfop: p.cfop.replace(/\D/g, ''),
      valor_unitario_comercial: item.unitPrice,
      valor_unitario_tributavel: item.unitPrice,
      valor_bruto: itemTotal,
      unidade_comercial: p.unit || 'UN',
      unidade_tributavel: p.unit || 'UN',
      quantidade_comercial: item.quantity,
      quantidade_tributavel: item.quantity,
      origem: p.origin !== null ? p.origin : 0,
      
      // Mapeamento tributário básico Simples Nacional
      // Se CST/CSOSN iniciar com '1', '2', '3', '4', '5' (geralmente CSOSN no Simples Nacional)
      icms_situacao_tributaria: p.cst || '102',
      icms_origem: p.origin !== null ? String(p.origin) : '0'
    };
  });

  const payload = {
    cnpj_emitente: emitenteCnpj,
    inscricao_estadual_emitente: (process.env.COMPANY_IE || '').replace(/\D/g, ''),
    regime_tributario_emitente: 1, // 1 = Simples Nacional
    opcao_pelo_simples_emitente: true,
    
    data_emissao: new Date().toISOString(),
    data_entrada_saida: new Date().toISOString(),
    tipo_documento: 1, // 1 = Saída
    local_destino: order.state === (process.env.COMPANY_STATE || 'PE') ? 1 : 2, // 1 = Interna, 2 = Interestadual
    finalidade_emissao: 1, // 1 = Normal
    consumidor_final: 1, // 1 = Consumidor final
    presenca_comprador: 2, // 2 = Internet
    
    // Destinatário
    nome_destinatario: order.customerName,
    email_destinatario: order.customerEmail || process.env.COMPANY_EMAIL,
    telefone_destinatario: order.customerWhatsapp.replace(/\D/g, ''),
    
    cep_destinatario: (order.cep || '').replace(/\D/g, ''),
    logradouro_destinatario: order.street || 'Retirada na Loja',
    numero_destinatario: order.number || 'S/N',
    bairro_destinatario: order.neighborhood || 'Centro',
    municipio_destinatario: order.city,
    uf_destinatario: order.state,
    
    // Valores globais
    valor_produtos: order.subtotal,
    valor_frete: order.shippingFee,
    valor_total: order.total,
    
    // Itens
    items: items,

    // Forma de Pagamento
    formas_pagamento: [
      {
        forma_pagamento: order.paymentMethod === 'PIX' ? '17' : '15', // 17 = Pix, 15 = Boleto/Sem Pagamento
        valor_pagamento: order.total
      }
    ],

    informacoes_adicionais_fisco: `Pedido ID: ${order.id}. Emitido por Bevix Moda Fitness.`
  };

  // Se for CNPJ, envia cnpj_destinatario. Se for CPF, envia cpf_destinatario
  if (destinatarioCpfCnpj.length === 14) {
    payload.cnpj_destinatario = destinatarioCpfCnpj;
  } else {
    payload.cpf_destinatario = destinatarioCpfCnpj;
  }

  return payload;
}

async function emitFocusNfeInvoice(order, adminEmail, environment) {
  const baseUrl = process.env.FISCAL_API_BASE_URL || 'https://homologacao.focusnfe.com.br';
  const url = `${baseUrl}/v2/autorizacoes?ref=${order.id}`;
  const payload = buildFocusNfePayload(order, environment);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getFocusHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.mensagem || data.error || 'Erro na requisição para Focus NFe';
      const updatedLogs = addFiscalLog(
        order.fiscalLogs,
        'EMISSAO_FALHOU',
        'error',
        `Focus NFe HTTP ${res.status}: ${errMsg}`,
        adminEmail
      );

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          fiscalStatus: 'erro_emissao',
          fiscalErrorMessage: errMsg,
          fiscalLogs: updatedLogs
        }
      });
      return { success: false, error: errMsg, order: updatedOrder };
    }

    const invoiceId = data.id || order.id;
    const focusStatus = data.status; // 'processando_autorizacao' | 'autorizado' | 'erro_autorizacao'
    
    let dbStatus = 'nota_em_processamento';
    let errorMessage = null;

    if (focusStatus === 'autorizado') {
      dbStatus = 'nota_autorizada';
    } else if (focusStatus === 'erro_autorizacao') {
      dbStatus = 'nota_rejeitada';
      errorMessage = data.mensagem_sefaz || data.erros?.[0]?.mensagem || 'Nota rejeitada pela SEFAZ.';
    }

    const logMessage = `Emissão enviada para Focus NFe. Status retornado: ${focusStatus}. ID da Nota: ${invoiceId}`;
    const updatedLogs = addFiscalLog(
      order.fiscalLogs,
      'EMISSAO_SOLICITADA',
      focusStatus === 'erro_autorizacao' ? 'error' : 'success',
      logMessage,
      adminEmail
    );

    const dataToUpdate = {
      fiscalStatus: dbStatus,
      fiscalProvider: 'focus_nfe',
      fiscalEnvironment: environment,
      fiscalInvoiceId: invoiceId,
      fiscalRawResponse: JSON.stringify(data),
      fiscalErrorMessage: errorMessage,
      fiscalLogs: updatedLogs
    };

    if (focusStatus === 'autorizado') {
      dataToUpdate.fiscalNumber = data.numero;
      dataToUpdate.fiscalSeries = data.serie;
      dataToUpdate.fiscalAccessKey = data.chave_nfe;
      dataToUpdate.fiscalProtocol = data.protocolo;
      dataToUpdate.fiscalIssuedAt = new Date();
      dataToUpdate.fiscalPdfUrl = data.caminho_pdf_danfe;
      dataToUpdate.fiscalXmlUrl = data.caminho_xml_nota_fiscal;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: dataToUpdate
    });

    return { success: true, order: updatedOrder };
  } catch (err) {
    console.error('Erro de rede na emissão Focus NFe:', err);
    const updatedLogs = addFiscalLog(
      order.fiscalLogs,
      'EMISSAO_FALHOU',
      'error',
      `Erro de rede/conexão: ${err.message}`,
      adminEmail
    );

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        fiscalStatus: 'erro_emissao',
        fiscalErrorMessage: `Erro de rede: ${err.message}`,
        fiscalLogs: updatedLogs
      }
    });

    return { success: false, error: err.message, order: updatedOrder };
  }
}

async function queryFocusNfeStatus(order, adminEmail) {
  const baseUrl = process.env.FISCAL_API_BASE_URL || 'https://homologacao.focusnfe.com.br';
  const url = `${baseUrl}/v2/autorizacoes/${order.fiscalInvoiceId || order.id}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: getFocusHeaders()
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.mensagem || 'Erro ao consultar status na Focus NFe';
      return { success: false, error: errMsg };
    }

    const focusStatus = data.status; // 'processando_autorizacao' | 'autorizado' | 'erro_autorizacao' | 'cancelado'
    let dbStatus = order.fiscalStatus;
    let errorMessage = null;

    if (focusStatus === 'autorizado') {
      dbStatus = 'nota_autorizada';
    } else if (focusStatus === 'erro_autorizacao') {
      dbStatus = 'nota_rejeitada';
      errorMessage = data.mensagem_sefaz || data.erros?.[0]?.mensagem || 'Nota rejeitada pela SEFAZ.';
    } else if (focusStatus === 'cancelado') {
      dbStatus = 'nota_cancelada';
    }

    const logMessage = `Consulta efetuada. Status na Focus NFe: ${focusStatus}`;
    const updatedLogs = addFiscalLog(
      order.fiscalLogs,
      'STATUS_CONSULTADO',
      focusStatus === 'erro_autorizacao' ? 'error' : 'success',
      logMessage,
      adminEmail
    );

    const dataToUpdate = {
      fiscalStatus: dbStatus,
      fiscalRawResponse: JSON.stringify(data),
      fiscalErrorMessage: errorMessage,
      fiscalLogs: updatedLogs
    };

    if (focusStatus === 'autorizado') {
      dataToUpdate.fiscalNumber = data.numero;
      dataToUpdate.fiscalSeries = data.serie;
      dataToUpdate.fiscalAccessKey = data.chave_nfe;
      dataToUpdate.fiscalProtocol = data.protocolo;
      if (!order.fiscalIssuedAt) {
        dataToUpdate.fiscalIssuedAt = new Date();
      }
      dataToUpdate.fiscalPdfUrl = data.caminho_pdf_danfe;
      dataToUpdate.fiscalXmlUrl = data.caminho_xml_nota_fiscal;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: dataToUpdate
    });

    return { success: true, order: updatedOrder };
  } catch (err) {
    console.error('Erro de rede na consulta Focus NFe:', err);
    return { success: false, error: err.message };
  }
}

async function cancelFocusNfeInvoice(order, justification, adminEmail) {
  const baseUrl = process.env.FISCAL_API_BASE_URL || 'https://homologacao.focusnfe.com.br';
  const url = `${baseUrl}/v2/autorizacoes/${order.fiscalInvoiceId || order.id}`;

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: getFocusHeaders(),
      body: JSON.stringify({ justificativa: justification })
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.mensagem || 'Erro ao cancelar na Focus NFe';
      const updatedLogs = addFiscalLog(
        order.fiscalLogs,
        'CANCELAMENTO_FALHOU',
        'error',
        `Cancelamento rejeitado pela API: ${errMsg}`,
        adminEmail
      );
      await prisma.order.update({
        where: { id: order.id },
        data: { fiscalLogs: updatedLogs }
      });
      return { success: false, error: errMsg };
    }

    const focusStatus = data.status; // 'cancelado' ou similar
    let dbStatus = 'nota_cancelada';
    
    if (focusStatus && focusStatus !== 'cancelado') {
      dbStatus = 'nota_autorizada'; // Se não foi cancelado na API por algum motivo
    }

    const updatedLogs = addFiscalLog(
      order.fiscalLogs,
      'NOTA_CANCELADA',
      'warning',
      `Cancelamento efetuado. Justificativa: "${justification}". Status Focus: ${focusStatus}`,
      adminEmail
    );

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        fiscalStatus: dbStatus,
        fiscalRawResponse: JSON.stringify(data),
        fiscalLogs: updatedLogs
      }
    });

    return { success: true, order: updatedOrder };
  } catch (err) {
    console.error('Erro de rede no cancelamento Focus NFe:', err);
    return { success: false, error: err.message };
  }
}
