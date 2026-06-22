import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: 'settings' },
    });

    if (!settings) {
      // Criar padrão se por algum motivo não existir
      const defaultSettings = await prisma.storeSettings.create({
        data: {
          id: 'settings',
        },
      });
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      storeName,
      logo,
      favicon,
      whatsapp,
      instagram,
      email,
      cnpj,
      address,
      description,
      minimumItems,
      pixKey,
      pixKeyType,
      pixReceiverName,
      pixBank,
      qrCodePix,
      originAddress,
      originCity,
      originState,
      originCep,
      shippingMode,
      fallbackShippingFee,
      primaryColor,
      secondaryColor,
      footerText,
    } = body;

    const settings = await prisma.storeSettings.upsert({
      where: { id: 'settings' },
      update: {
        storeName,
        logo,
        favicon,
        whatsapp,
        instagram,
        email,
        cnpj,
        address,
        description,
        minimumItems: minimumItems !== undefined ? parseInt(minimumItems) : undefined,
        pixKey,
        pixKeyType,
        pixReceiverName,
        pixBank,
        qrCodePix,
        originAddress,
        originCity,
        originState,
        originCep,
        shippingMode,
        fallbackShippingFee: fallbackShippingFee !== undefined ? parseFloat(fallbackShippingFee) : undefined,
        primaryColor,
        secondaryColor,
        footerText,
      },
      create: {
        id: 'settings',
        storeName: storeName || 'NOME_DA_LOJA',
        logo,
        favicon,
        whatsapp: whatsapp || '5581999999999',
        instagram,
        email,
        cnpj,
        address,
        description,
        minimumItems: minimumItems !== undefined ? parseInt(minimumItems) : 6,
        pixKey: pixKey || '5581999999999',
        pixKeyType: pixKeyType || 'TELEFONE',
        pixReceiverName: pixReceiverName || 'RECEBEDOR_PIX_DA_LOJA',
        pixBank,
        qrCodePix,
        originAddress: originAddress || 'Rua Principal, 100',
        originCity: originCity || 'Santa Cruz do Capibaribe',
        originState: originState || 'PE',
        originCep: originCep || '55190-000',
        shippingMode: shippingMode || 'FALLBACK',
        fallbackShippingFee: fallbackShippingFee !== undefined ? parseFloat(fallbackShippingFee) : 20.00,
        primaryColor: primaryColor || '#881337',
        secondaryColor: secondaryColor || '#0f172a',
        footerText,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 });
  }
}
