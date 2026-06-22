import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(banners);
  } catch (error) {
    console.error('Erro ao listar banners:', error);
    return NextResponse.json({ error: 'Erro ao listar banners' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, subtitle, image, buttonText, buttonLink, active } = body;

    if (!image) {
      return NextResponse.json({ error: 'A imagem do banner é obrigatória' }, { status: 400 });
    }

    const banner = await prisma.banner.create({
      data: {
        title: title || null,
        subtitle: subtitle || null,
        image,
        buttonText: buttonText || null,
        buttonLink: buttonLink || null,
        active: active !== false,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar banner:', error);
    return NextResponse.json({ error: 'Erro ao criar banner' }, { status: 500 });
  }
}
