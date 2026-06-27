import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request) {
  try {
    // Auto-seed de produtos se o banco de dados estiver com 0 produtos
    const productCount = await prisma.product.count();
    if (productCount === 0) {
      console.log('Nenhum produto cadastrado no banco. Executando semeadura automática de produtos...');
      try {
        let categories = await prisma.category.findMany();
        if (categories.length === 0) {
          const categoriesData = [
            { name: 'Calças & Leggings', slug: 'calcas-leggings', order: 1 },
            { name: 'Tops & Croppeds', slug: 'tops-croppeds', order: 2 },
            { name: 'Shorts & Bermudas', slug: 'shorts-bermudas', order: 3 },
          ];
          for (const cat of categoriesData) {
            await prisma.category.create({ data: cat });
          }
          categories = await prisma.category.findMany();
        }

        const catMap = {};
        categories.forEach(c => {
          catMap[c.slug] = c.id;
        });

        const productsToSeed = [
          {
            name: "Top Cropped Lastex Premium",
            slug: "top-cropped-lastex-premium",
            sku: "BV-001",
            price: 49.90,
            stock: 100,
            sizes: "P,M,G",
            colors: "Preto, Branco, Rosa",
            mainImage: "/uploads/cropped-lastex.webp",
            categoryId: catMap['tops-croppeds'] || categories[0].id,
            description: "Top Cropped com lastex de alta qualidade, caimento perfeito no corpo. Ideal para treinos de alta performance.",
            ncm: "61091000",
            cfop: "5102",
            cst: "102",
            origin: 0,
            unit: "UN",
            weight: 0.120,
            featured: true,
          },
          {
            name: "Legging Fitness Empina Bumbum",
            slug: "legging-fitness-empina-bumbum",
            sku: "BV-002",
            price: 89.90,
            promotionalPrice: 79.90,
            stock: 80,
            sizes: "P,M,G,GG",
            colors: "Cinza Mescla, Preto, Azul Marinho",
            mainImage: "/uploads/vestido-longo.webp",
            categoryId: catMap['calcas-leggings'] || categories[0].id,
            description: "Calça Legging de alta compressão, tecido blackout zero transparência, ideal para agachamentos e treinos intensos.",
            ncm: "61046200",
            cfop: "5102",
            cst: "102",
            origin: 0,
            unit: "UN",
            weight: 0.280,
            featured: true,
          },
          {
            name: "Shorts Alfaiataria Comfort",
            slug: "shorts-alfaiataria-comfort",
            sku: "BV-003",
            price: 59.90,
            stock: 50,
            sizes: "M,G",
            colors: "Preto, Off White",
            mainImage: "/uploads/short-alfaiataria.webp",
            categoryId: catMap['shorts-bermudas'] || categories[0].id,
            description: "Shorts confortável com modelagem premium, cós largo para modelação da cintura.",
            ncm: "62046200",
            cfop: "5102",
            cst: "102",
            origin: 0,
            unit: "UN",
            weight: 0.180,
            featured: true,
          }
        ];

        for (const prod of productsToSeed) {
          await prisma.product.create({ data: prod });
        }
        console.log('Semeadura automática de produtos finalizada com sucesso.');
      } catch (seedErr) {
        console.error('Erro ao semear produtos automaticamente:', seedErr);
      }
    }

    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const size = searchParams.get('size');
    const color = searchParams.get('color');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const inStock = searchParams.get('inStock');
    const search = searchParams.get('search');
    const orderBy = searchParams.get('orderBy') || 'featured';
    
    // Novos filtros
    const type = searchParams.get('type');
    const pockets = searchParams.get('pockets');
    const compression = searchParams.get('compression');
    const transparency = searchParams.get('transparency');
    const fabric = searchParams.get('fabric');
    const semLogomarca = searchParams.get('semLogomarca');

    const where = { active: true };

    // Filtro por Categoria especial ou normal
    if (categorySlug && categorySlug !== 'all') {
      if (categorySlug === 'plus-size') {
        where.plusSize = true;
      } else if (categorySlug === 'sem-logomarca') {
        where.OR = [
          { variations: { contains: 'Sem logomarca' } },
          { category: { slug: 'sem-logomarca' } }
        ];
      } else if (categorySlug === 'zero-transparencia') {
        where.OR = [
          { variations: { contains: 'Zero transparência' } },
          { category: { slug: 'zero-transparencia' } }
        ];
      } else if (categorySlug === 'alta-compressao') {
        where.OR = [
          { variations: { contains: 'Alta compressão' } },
          { category: { slug: 'alta-compressao' } }
        ];
      } else {
        where.category = {
          slug: categorySlug,
        };
      }
    }

    // Filtro por Tipo de Peça
    if (type && type !== 'all') {
      if (type === 'conjunto-short') {
        where.category = { slug: 'conjuntos-com-short' };
      } else if (type === 'conjunto-calca') {
        where.category = { slug: 'conjuntos-com-calca' };
      } else if (type === 'macaquinho') {
        if (!where.AND) where.AND = [];
        where.AND.push({
          OR: [
            { name: { contains: 'macaquinho' } },
            { category: { slug: 'macaquinhos' } }
          ]
        });
      } else if (type === 'macacao') {
        if (!where.AND) where.AND = [];
        where.AND.push({
          OR: [
            { name: { contains: 'macacão' } },
            { category: { slug: 'macacoes' } }
          ]
        });
      }
    }

    // Filtro por Bolsos
    if (pockets === 'true') {
      if (!where.AND) where.AND = [];
      where.AND.push({
        OR: [
          { description: { contains: 'bolso' } },
          { variations: { contains: 'bolso' } }
        ]
      });
    }

    // Filtro por Compressão
    if (compression === 'true') {
      if (!where.AND) where.AND = [];
      where.AND.push({
        OR: [
          { description: { contains: 'compressão' } },
          { variations: { contains: 'compressão' } }
        ]
      });
    }

    // Filtro por Transparência
    if (transparency === 'true') {
      if (!where.AND) where.AND = [];
      where.AND.push({
        OR: [
          { description: { contains: 'transparência' } },
          { variations: { contains: 'transparência' } }
        ]
      });
    }

    // Filtro por Tamanho (Será feito com precisão em memória)

    // Filtro por Cor
    if (color && color !== 'all') {
      where.colors = {
        contains: color,
      };
    }

    // Filtro por Faixa de Preço
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Filtro por Disponibilidade em Estoque
    if (inStock === 'true') {
      where.stock = {
        gt: 0,
      };
    }

    // Filtro por Plus Size
    const plusSize = searchParams.get('plusSize');
    if (plusSize === 'true') {
      where.plusSize = true;
    }

    // Filtro por Sem Logomarca
    if (semLogomarca === 'true') {
      if (!where.AND) where.AND = [];
      where.AND.push({
        OR: [
          { variations: { contains: 'Sem logomarca' } },
          { category: { slug: 'sem-logomarca' } }
        ]
      });
    }

    // Busca Textual
    if (search) {
      if (!where.AND) where.AND = [];
      where.AND.push({
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
          { description: { contains: search } },
          { variations: { contains: search } },
        ]
      });
    }

    // Ordenação
    let prismaOrderBy = { createdAt: 'desc' };
    if (orderBy === 'cheap') {
      prismaOrderBy = { price: 'asc' };
    } else if (orderBy === 'expensive') {
      prismaOrderBy = { price: 'desc' };
    } else if (orderBy === 'az') {
      prismaOrderBy = { name: 'asc' };
    } else if (orderBy === 'za') {
      prismaOrderBy = { name: 'desc' };
    } else if (orderBy === 'featured') {
      // Ordena por destaque e depois por data de criação
      prismaOrderBy = [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        images: true,
      },
      orderBy: prismaOrderBy,
    });

    let filteredProducts = products;

    // Filtro preciso por Tamanho (G, GG, Extra G, etc. sem colisões parciais)
    if (size && size !== 'all') {
      filteredProducts = filteredProducts.filter(p => {
        const sizeArr = p.sizes.split(',').map(s => s.trim().toLowerCase());
        return sizeArr.includes(size.toLowerCase());
      });
    }

    // Filtro preciso por Tecido (Poliamida, Poliamida Blackout, Caneladinho Brilhoso, etc.)
    if (fabric && fabric !== 'all') {
      filteredProducts = filteredProducts.filter(p => {
        let parsed = { tecido: '' };
        if (p.variations) {
          try {
            parsed = JSON.parse(p.variations);
          } catch (e) {}
        }
        const pFabric = (parsed.tecido || '').toLowerCase();
        if (fabric === 'Poliamida Blackout') {
          return pFabric.includes('blackout');
        } else if (fabric === 'Caneladinho Brilhoso') {
          return pFabric.includes('caneladinho') || pFabric.includes('brilhoso');
        } else if (fabric === 'Poliamida') {
          return pFabric.includes('poliamida');
        }
        return false;
      });
    }

    return NextResponse.json(filteredProducts);
  } catch (error) {
    console.error('Erro ao buscar produtos públicos:', error);
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
  }
}
