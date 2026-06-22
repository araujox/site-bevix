import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, subtitle, image, buttonText, buttonLink, active } = body;

    const existingBanner = await prisma.banner.findUnique({
      where: { id },
    });

    if (!existingBanner) {
      return NextResponse.json({ error: 'Banner não encontrado' }, { status: 404 });
    }

    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingBanner.title,
        subtitle: subtitle !== undefined ? subtitle : existingBanner.subtitle,
        image: image !== undefined ? image : existingBanner.image,
        buttonText: buttonText !== undefined ? buttonText : existingBanner.buttonText,
        buttonLink: buttonLink !== undefined ? buttonLink : existingBanner.buttonLink,
        active: active !== undefined ? !!active : existingBanner.active,
      },
    });

    return NextResponse.json(updatedBanner);
  } catch (error) {
    console.error('Erro ao atualizar banner:', error);
    return NextResponse.json({ error: 'Erro ao atualizar banner' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const existingBanner = await prisma.banner.findUnique({
      where: { id },
    });

    if (!existingBanner) {
      return NextResponse.json({ error: 'Banner não encontrado' }, { status: 404 });
    }

    await prisma.banner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Banner excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir banner:', error);
    return NextResponse.json({ error: 'Erro ao excluir banner' }, { status: 500 });
  }
}
