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
    const {
      name,
      sku,
      description,
      price,
      promotionalPrice,
      categoryId,
      stock,
      sizes,
      colors,
      variations,
      featured,
      plusSize,
      active,
      mainImage,
      galleryImages, // array of image paths
    } = body;

    // Verificar se produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    const dataToUpdate = {
      description: description !== undefined ? description : existingProduct.description,
      price: price !== undefined ? parseFloat(price) : existingProduct.price,
      promotionalPrice: promotionalPrice !== undefined ? (promotionalPrice ? parseFloat(promotionalPrice) : null) : existingProduct.promotionalPrice,
      categoryId: categoryId !== undefined ? categoryId : existingProduct.categoryId,
      stock: stock !== undefined ? parseInt(stock) : existingProduct.stock,
      sizes: sizes !== undefined ? sizes : existingProduct.sizes,
      colors: colors !== undefined ? colors : existingProduct.colors,
      variations: variations !== undefined ? variations : existingProduct.variations,
      featured: featured !== undefined ? !!featured : existingProduct.featured,
      plusSize: plusSize !== undefined ? !!plusSize : existingProduct.plusSize,
      active: active !== undefined ? !!active : existingProduct.active,
      mainImage: mainImage !== undefined ? mainImage : existingProduct.mainImage,
    };

    if (name && name !== existingProduct.name) {
      dataToUpdate.name = name;
      const baseSlug = slugify(name);
      let slug = baseSlug;
      let counter = 1;
      while (
        await prisma.product.findFirst({
          where: { slug, id: { not: id } },
        })
      ) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      dataToUpdate.slug = slug;
    }

    if (sku && sku !== existingProduct.sku) {
      dataToUpdate.sku = sku;
    }

    // Atualizar produto
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
    });

    // Atualizar galeria se fornecido
    if (galleryImages && Array.isArray(galleryImages)) {
      // Excluir imagens antigas e salvar novas
      await prisma.productImage.deleteMany({
        where: { productId: id },
      });

      for (const imgUrl of galleryImages) {
        await prisma.productImage.create({
          data: {
            productId: id,
            url: imgUrl,
          },
        });
      }
    }

    const finalProduct = await prisma.product.findUnique({
      where: { id },
      include: { images: true, category: true },
    });

    return NextResponse.json(finalProduct);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe um produto com este SKU ou Slug' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // A deleção do OrderItem não é em cascata automática no SQLite sem a configuração no prisma.
    // Deletar o produto. As imagens serão deletadas via onDelete: Cascade definido no schema Prisma!
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 });
  }
}
