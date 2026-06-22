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

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return NextResponse.json({ error: 'Erro ao listar produtos' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
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

    if (!name || !sku || !categoryId || price === undefined || stock === undefined || !mainImage) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const baseSlug = slugify(name);
    // Verificar se slug já existe e gerar um único se necessário
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Criar produto no banco
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        sku,
        description: description || '',
        price: parseFloat(price),
        promotionalPrice: promotionalPrice ? parseFloat(promotionalPrice) : null,
        categoryId,
        stock: parseInt(stock),
        sizes: sizes || 'Único',
        colors: colors || 'Preto',
        variations: variations || '',
        featured: !!featured,
        plusSize: !!plusSize,
        active: active !== false,
        mainImage,
      },
    });

    // Salvar imagens da galeria
    if (galleryImages && Array.isArray(galleryImages)) {
      for (const imgUrl of galleryImages) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: imgUrl,
          },
        });
      }
    } else {
      // Por padrão, a imagem principal é a primeira da galeria
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: mainImage,
        },
      });
    }

    const createdProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: { images: true },
    });

    return NextResponse.json(createdProduct, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe um produto com este SKU' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 });
  }
}
