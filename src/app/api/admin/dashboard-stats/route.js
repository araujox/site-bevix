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
        status: { in: ['PAID', 'SHIPPED', 'FINISHED'] },
      },
      select: { total: true },
    });
    const totalSales = paidOrders.reduce((sum, order) => sum + order.total, 0);

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

    const settings = await prisma.storeSettings.findUnique({
      where: { id: 'settings' },
      select: { visits: true }
    });

    return NextResponse.json({
      stats: {
        totalProducts,
        lowStock,
        totalOrders,
        pendingOrders,
        totalSales,
        visits: settings?.visits || 1450,
      },
      recentOrders,
      chartData,
    });
  } catch (error) {
    console.error('Erro ao processar estatísticas do dashboard:', error);
    return NextResponse.json({ error: 'Erro ao gerar dados do painel' }, { status: 500 });
  }
}
