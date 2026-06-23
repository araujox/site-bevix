import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { emitInvoice, queryInvoiceStatus, cancelInvoice } from '@/lib/fiscalService';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, justification } = body;

    // 1. Obter e-mail do admin logado a partir do cookie da sessão (já verificado pelo middleware)
    const sessionToken = request.cookies.get('admin_session')?.value;
    let adminEmail = 'admin@loja.com.br';
    if (sessionToken) {
      const decoded = await verifyToken(sessionToken);
      if (decoded && decoded.email) {
        adminEmail = decoded.email;
      }
    }

    if (!action) {
      return NextResponse.json({ error: 'Ação fiscal não especificada.' }, { status: 400 });
    }

    // 2. Executar ação fiscal solicitada
    if (action === 'emit') {
      const result = await emitInvoice(id, adminEmail);
      if (result.success) {
        return NextResponse.json({ success: true, order: result.order });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: result.error || 'Erro na emissão fiscal.',
          validationErrors: result.errors 
        }, { status: 400 });
      }
    } 
    
    else if (action === 'query') {
      const result = await queryInvoiceStatus(id, adminEmail);
      if (result.success) {
        return NextResponse.json({ success: true, order: result.order });
      } else {
        return NextResponse.json({ success: false, error: result.error || 'Erro ao consultar status.' }, { status: 400 });
      }
    } 
    
    else if (action === 'cancel') {
      if (!justification) {
        return NextResponse.json({ error: 'Justificativa de cancelamento é obrigatória.' }, { status: 400 });
      }
      const result = await cancelInvoice(id, justification, adminEmail);
      if (result.success) {
        return NextResponse.json({ success: true, order: result.order });
      } else {
        return NextResponse.json({ success: false, error: result.error || 'Erro ao cancelar nota.' }, { status: 400 });
      }
    } 
    
    else {
      return NextResponse.json({ error: `Ação fiscal "${action}" desconhecida.` }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro na API fiscal do pedido:', error);
    return NextResponse.json({ error: 'Erro interno ao processar operação fiscal.' }, { status: 500 });
  }
}
