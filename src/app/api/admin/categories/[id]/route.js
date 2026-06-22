import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, order, active } = body;

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    const dataToUpdate = {
      order: order !== undefined ? parseInt(order) : existingCategory.order,
      active: active !== undefined ? !!active : existingCategory.active,
    };

    if (name && name !== existingCategory.name) {
      dataToUpdate.name = name;
      const baseSlug = slugify(name);
      let slug = baseSlug;
      let counter = 1;
      while (
        await prisma.category.findFirst({
          where: { slug, id: { not: id } },
        })
      ) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      dataToUpdate.slug = slug;
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    // Verificar se a categoria possui produtos associados
    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir esta categoria porque ela possui produtos associados.' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Categoria excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 500 });
  }
}
