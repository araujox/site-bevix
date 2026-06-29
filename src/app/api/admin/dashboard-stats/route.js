import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // 1. Contagens Básicas
    const totalProducts = await prisma.product.count();
    const lowStock = await prisma.product.count({
      where: { stock: { lte: 5 } },
    });

    const totalOrders = await prisma.order.count();
    const pendingOrders = await prisma.order.count({
      where: { status: 'PENDING' },
    });

    // 2. Total Vendido (Somatório dos Pedidos Pagos ou Concluídos)
    const paidOrders = await prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'SHIPPED', 'FINISHED', 'Pago', 'Enviado', 'Finalizado'] },
      },
      select: { total: true },
    });
    const totalSales = paidOrders.reduce((sum, order) => sum + order.total, 0);

    // 2.1 Estatísticas de Notas Fiscais Eletrônicas (NF-e)
    const fiscalAuthorized = await prisma.order.count({
      where: { fiscalStatus: 'nota_autorizada' }
    });
    const fiscalProcessing = await prisma.order.count({
      where: { fiscalStatus: 'nota_em_processamento' }
    });
    const fiscalRejected = await prisma.order.count({
      where: { fiscalStatus: { in: ['nota_rejeitada', 'erro_emissao'] } }
    });
    const fiscalCancelled = await prisma.order.count({
      where: { fiscalStatus: 'nota_cancelada' }
    });

    // Pedidos pagos sem nota fiscal
    const paidWithoutInvoice = await prisma.order.count({
      where: {
        status: { in: ['PAID', 'SHIPPED', 'FINISHED', 'Pago', 'Enviado', 'Finalizado'] },
        fiscalStatus: { in: ['nota_nao_emitida', 'erro_emissao', 'nota_rejeitada'] }
      }
    });

    // Valor total faturado com nota fiscal
    const invoicedOrders = await prisma.order.findMany({
      where: { fiscalStatus: 'nota_autorizada' },
      select: { total: true }
    });
    const totalInvoiced = invoicedOrders.reduce((sum, order) => sum + order.total, 0);

    // 3. Pedidos Recentes (Últimos 5)
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    // 4. Vendas nos últimos 7 dias (para o gráfico)
    const chartData = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const dayOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: { in: ['PAID', 'SHIPPED', 'FINISHED'] },
        },
        select: { total: true },
      });

      const daySales = dayOrders.reduce((sum, order) => sum + order.total, 0);
      
      const formattedDate = startOfDay.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });

      chartData.push({
        date: formattedDate,
        sales: daySales,
      });
    }

    // Obter visualizações reais e lista de visitantes recentes
    const realVisitsCount = await prisma.visitor.count();
    const recentVisitors = await prisma.visitor.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      stats: {
        totalProducts,
        lowStock,
        totalOrders,
        pendingOrders,
        totalSales,
        visits: realVisitsCount,
      },
      fiscalStats: {
        authorized: fiscalAuthorized,
        processing: fiscalProcessing,
        rejected: fiscalRejected,
        cancelled: fiscalCancelled,
        paidWithoutInvoice: paidWithoutInvoice,
        totalInvoiced: totalInvoiced,
      },
      recentOrders,
      recentVisitors,
      chartData,
    });
  } catch (error) {
    console.error('Erro ao processar estatísticas do dashboard:', error);
    return NextResponse.json({ error: 'Erro ao gerar dados do painel' }, { status: 500 });
  }
}
