# Documentação da Integração de Nota Fiscal Eletrônica (NF-e)

Esta documentação explica o funcionamento, a configuração e a operação do sistema de emissão de Notas Fiscais Eletrônicas (NF-e) integrado ao painel administrativo da **Bevix Moda Fitness**.

---

## 1. Visão Geral

A integração fiscal foi estruturada seguindo o padrão de **Service/Adapter**. Isso significa que a interface do sistema (painel administrativo) não se comunica diretamente com a Focus NFe ou com qualquer provedor específico; toda a comunicação é mediada por uma classe de serviço central (`src/lib/fiscalService.js`) e mapeada de forma dinâmica com base nas variáveis do arquivo `.env`.

### Provedores Fiscais Suportados:
1. **`mock`:** Um provedor simulado local (offline) ideal para desenvolvimento e testes rápidos de fluxo sem necessidade de certificados digitais ou chaves de API reais.
2. **`focus_nfe`:** Integração real com a API Focus NFe, compatível tanto com o ambiente de testes (Homologação) quanto de produção (SEFAZ real).

---

## 2. Configurações de Ambiente (Arquivo `.env`)

Copie o arquivo `.env.example` para `.env` (se já não o fez) e preencha as variáveis fiscais conforme necessário.

```bash
# Provedores suportados: mock, focus_nfe
FISCAL_API_PROVIDER=mock
# URL Base da Focus NFe (Homologação ou Produção)
FISCAL_API_BASE_URL=https://homologacao.focusnfe.com.br
# Token gerado no painel da Focus NFe
FISCAL_API_TOKEN=seu_token_aqui
# Ambiente fiscal: homologation (testes), production (SEFAZ Real)
FISCAL_ENVIRONMENT=homologation

# Dados Fiscais da Empresa Emitente (Devem bater com o certificado digital)
COMPANY_CNPJ=00000000000100
COMPANY_IE=123456789
COMPANY_RAZAO_SOCIAL=Bevix Comercio de Modas Ltda
COMPANY_NOME_FANTASIA=Bevix Moda Fitness
COMPANY_EMAIL=financeiro@bevix.com.br
COMPANY_PHONE=81999999999
COMPANY_ADDRESS=Rua da Moda Fitness
COMPANY_ADDRESS_NUMBER=123
COMPANY_NEIGHBORHOOD=Centro
COMPANY_CITY=Santa Cruz do Capibaribe
COMPANY_STATE=PE
COMPANY_ZIPCODE=55190000
```

> [!WARNING]
> Nunca exponha chaves de API, tokens ou certificado digital no front-end. Toda a comunicação com a API fiscal é efetuada no backend da aplicação em APIs rest protegidas.

---

## 3. Campos Fiscais do Produto

Para que um produto possa ser faturado em uma NF-e, ele precisa conter dados tributários. Esses dados devem ser preenchidos na seção **"Dados Fiscais (NFe)"** no modal de cadastro/edição de produtos do painel administrativo:

* **NCM (Nomenclatura Comum do Mercosul):** Código de 8 dígitos que identifica o tipo do item (ex: `61091000` para camisetas de algodão). *Consulte seu contador.*
* **CFOP (Código Fiscal de Operações e Prestações):** Identifica a operação fiscal (ex: `5102` para venda de mercadoria adquirida de terceiros no estado).
* **CST / CSOSN:** Código de Situação Tributária (ex: `102` para Simples Nacional - Tributada sem permissão de crédito).
* **Unidade de Medida:** Código de medida comercial (ex: `UN` para unidade, `PC` para peça).
* **Origem da Mercadoria:** Identifica a procedência do produto (de 0 a 8, ex: `0 - Nacional`).
* **Peso (kg):** Peso bruto unitário do item em quilos (ex: `0.150` para 150g).
* **EAN / Código de Barras (Opcional):** Código de barras GTIN/EAN do produto.
* **Alíquota ICMS (Opcional):** Percentual de imposto do produto.
* **Observações Fiscais (Opcional):** Notas tributárias específicas do produto que aparecerão na NF-e.

---

## 4. Operações Fiscais por Pedido

Ao visualizar os detalhes de um pedido no painel de **Pedidos**, o painel administrativo realiza validações automáticas dos dados do cliente e dos produtos do pedido.

### 4.1 Validação Prévia (Segurança)
Antes de enviar o pedido à SEFAZ, o sistema valida localmente os seguintes dados básicos:
* **Cliente:** Nome, CPF/CNPJ (válido de 11 ou 14 dígitos), E-mail, CEP e Endereço de entrega preenchido (Rua, Número, Bairro, Cidade, Estado).
* **Produtos:** Todos os itens do pedido precisam ter NCM, CFOP, CST e Origem preenchidos no cadastro.

Se houver alguma inconsistência, o painel exibirá um banner informativo vermelho com a lista de dados faltantes e desabilitará o botão de emissão. O administrador pode corrigir os dados do cliente ali mesmo, clicar em **"Salvar Alterações"** e reemitir.

### 4.2 Botões de Fluxo
* **Emitir Nota Fiscal:** Envia a NF-e para a API fiscal.
  * Se o status for bem-sucedido, o pedido muda para `nota_em_processamento` (ou `nota_autorizada` no modo simulado/mock).
* **Consultar Status da Nota:** Caso a nota fique travada em processamento, este botão consulta a API para sincronizar com a SEFAZ. Se a nota for autorizada, o status mudará para `nota_autorizada` e os dados (Número da Nota, Série, Protocolo, Chave) serão atualizados no banco de dados.
* **Visualizar DANFE (PDF) / Baixar XML:** Disponíveis imediatamente após a nota ser autorizada, abrindo em nova guia do navegador.
* **Cancelar Nota Fiscal:** Disponível apenas para notas autorizadas. Exige preenchimento de uma justificativa formal com no mínimo 15 caracteres. O status mudará para `nota_cancelada`.

---

## 5. Histórico e Logs de Auditoria

Todas as interações fiscais geram logs que ficam salvos de forma encriptada/resumida no banco de dados e são mostrados na seção **"Logs de Auditoria Fiscal"** no final do detalhe do pedido. O log registra:
1. **Tipo de ação:** Emissão, Consulta ou Cancelamento.
2. **Data e Hora.**
3. **Administrador Responsável:** E-mail do administrador que clicou no botão.
4. **Mensagem:** Status detalhado do retorno da API ou SEFAZ.

---

## 6. Como Testar no Ambiente de Homologação

1. Configure no `.env` o `FISCAL_API_PROVIDER=mock`.
2. Acesse o painel de administração em `/admin-secure/login` (Admin: `admin@loja.com.br` / `admin123`).
3. Vá em **Produtos** e edite um produto para garantir que ele contenha dados fiscais (os produtos cadastrados no seed padrão já vêm pré-configurados com dados reais de vestuário).
4. Vá em **Pedidos** e abra um pedido concluído/pago.
5. Se o cliente não possuir CPF/CNPJ cadastrado (como em pedidos fictícios novos), digite um CPF válido na seção "Dados Cadastrais & Faturamento" e clique em **"Salvar Alterações"**.
6. Clique em **"Emitir Nota Fiscal"**. A nota entrará em status **Processando**.
7. Clique em **"Consultar Status da Nota"**. O sistema simulará a resposta da SEFAZ, alterando o status para **Autorizada (SEFAZ)** e gerando uma Chave de Acesso simulada e botões de download.
8. Teste o cancelamento digitando uma justificativa e confirmando a operação.

---

## 7. Transição para Produção (Focus NFe)

Quando for colocar o site no ar:
1. Cadastre-se na Focus NFe (ou outro provedor homologado) e obtenha os dados de Sandbox.
2. Altere no seu `.env` a chave `FISCAL_API_PROVIDER=focus_nfe` e `FISCAL_ENVIRONMENT=homologation` para testar com o certificado digital em modo de testes.
3. Obtenha a aprovação fiscal da SEFAZ do seu estado e altere a chave para `FISCAL_ENVIRONMENT=production` e `FISCAL_API_BASE_URL` para o endereço de produção da API da Focus NFe.
4. Preencha as credenciais da empresa emitente (`COMPANY_CNPJ`, `COMPANY_IE`, etc.) exatamente como cadastradas na SEFAZ.
