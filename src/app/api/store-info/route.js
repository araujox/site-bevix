import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    let settings;
    try {
      settings = await prisma.storeSettings.update({
        where: { id: 'settings' },
        data: {
          visits: {
            increment: 1
          }
        }
      });
    } catch (e) {
      settings = await prisma.storeSettings.upsert({
        where: { id: 'settings' },
        update: {
          visits: {
            increment: 1
          }
        },
        create: {
          id: 'settings',
          storeName: 'NOME_DA_LOJA',
          whatsapp: '5581999999999',
          visits: 1
        }
      });
    }

    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });

    const banners = await prisma.banner.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    const deliveryMethods = await prisma.deliveryMethod.findMany({
      where: { active: true },
    });

    // Contagem rápida de estatísticas
    const productsCount = await prisma.product.count({ where: { active: true } });
    const ordersCount = await prisma.order.count();

    return NextResponse.json({
      settings: settings || {
        storeName: 'NOME_DA_LOJA',
        whatsapp: '5581999999999',
        minimumItems: 6,
        minimumValue: 0.00,
        primaryColor: '#e11d48',
        secondaryColor: '#1e293b',
      },
      categories,
      banners,
      deliveryMethods,
      stats: {
        products: productsCount,
        orders: ordersCount,
        visits: settings?.visits || 1450,
      }
    });
  } catch (error) {
    console.error('Erro ao buscar informações iniciais da loja:', error);
    return NextResponse.json({ error: 'Erro ao buscar informações da loja' }, { status: 500 });
  }
}
