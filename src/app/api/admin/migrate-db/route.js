import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const runPush = searchParams.get('push') === 'true';

    // Validação de segurança simples para evitar execuções indesejadas
    if (secret !== 'loja-migrate-123') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let pushOutput = '';
    if (runPush) {
      console.log('Executando prisma db push via node_modules...');
      try {
        const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
        const prismaCliPath = path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
        const result = execSync(`node "${prismaCliPath}" db push --accept-data-loss`, {
          env: {
            ...process.env,
            DATABASE_URL: dbUrl,
            HOME: '/tmp',
            XDG_DATA_HOME: '/tmp',
            XDG_CONFIG_HOME: '/tmp',
            PRISMA_CLI_BINARY_TARGETS: 'native'
          }
        });
        pushOutput = result.toString();
        console.log('Resultado do db push:', pushOutput);
      } catch (pushError) {
        console.error('Erro ao executar prisma db push:', pushError);
        return NextResponse.json({
          error: 'Falha ao sincronizar o esquema (db push)',
          details: pushError.message,
          stderr: pushError.stderr ? pushError.stderr.toString() : ''
        }, { status: 500 });
      }
    }

    const exportPath = path.join(process.cwd(), 'scratch', 'db-export.json');
    if (!fs.existsSync(exportPath)) {
      return NextResponse.json({ 
        error: 'Arquivo de backup db-export.json não encontrado', 
        pushOutput 
      }, { status: 404 });
    }

    console.log('Lendo dados de exportação...');
    const data = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

    console.log('Iniciando importação para o PostgreSQL...');

    // 1. Importar Categorias
    for (const cat of data.categories) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: {
          name: cat.name,
          slug: cat.slug,
          order: cat.order,
          active: cat.active,
        },
        create: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          order: cat.order,
          active: cat.active,
          createdAt: new Date(cat.createdAt)
        }
      });
    }

    // 2. Importar Produtos e Imagens
    for (const prod of data.products) {
      const { images, ...prodData } = prod;
      await prisma.product.upsert({
        where: { id: prod.id },
        update: {
          name: prodData.name,
          slug: prodData.slug,
          sku: prodData.sku,
          description: prodData.description,
          price: prodData.price,
          promotionalPrice: prodData.promotionalPrice,
          categoryId: prodData.categoryId,
          stock: prodData.stock,
          sizes: prodData.sizes,
          colors: prodData.colors,
          variations: prodData.variations,
          featured: prodData.featured,
          plusSize: prodData.plusSize,
          active: prodData.active,
          mainImage: prodData.mainImage,
        },
        create: {
          id: prodData.id,
          name: prodData.name,
          slug: prodData.slug,
          sku: prodData.sku,
          description: prodData.description,
          price: prodData.price,
          promotionalPrice: prodData.promotionalPrice,
          categoryId: prodData.categoryId,
          stock: prodData.stock,
          sizes: prodData.sizes,
          colors: prodData.colors,
          variations: prodData.variations,
          featured: prodData.featured,
          plusSize: prodData.plusSize,
          active: prodData.active,
          mainImage: prodData.mainImage,
          createdAt: new Date(prodData.createdAt)
        }
      });

      if (images && images.length) {
        for (const img of images) {
          await prisma.productImage.upsert({
            where: { id: img.id },
            update: {
              url: img.url,
              productId: img.productId,
            },
            create: {
              id: img.id,
              productId: img.productId,
              url: img.url,
              createdAt: new Date(img.createdAt)
            }
          });
        }
      }
    }

    // 3. Importar Configurações
    for (const setting of data.settings) {
      await prisma.storeSettings.upsert({
        where: { id: setting.id },
        update: setting,
        create: setting
      });
    }

    // 4. Importar Banners
    for (const banner of data.banners) {
      await prisma.banner.upsert({
        where: { id: banner.id },
        update: {
          title: banner.title,
          subtitle: banner.subtitle,
          image: banner.image,
          buttonText: banner.buttonText,
          buttonLink: banner.buttonLink,
          active: banner.active,
        },
        create: {
          id: banner.id,
          title: banner.title,
          subtitle: banner.subtitle,
          image: banner.image,
          buttonText: banner.buttonText,
          buttonLink: banner.buttonLink,
          active: banner.active,
          createdAt: new Date(banner.createdAt)
        }
      });
    }

    // 5. Importar Métodos de Entrega
    for (const m of data.deliveryMethods) {
      await prisma.deliveryMethod.upsert({
        where: { id: m.id },
        update: {
          name: m.name,
          description: m.description,
          fixedFee: m.fixedFee,
          requiresNote: m.requiresNote,
          active: m.active,
        },
        create: {
          id: m.id,
          name: m.name,
          description: m.description,
          fixedFee: m.fixedFee,
          requiresNote: m.requiresNote,
          active: m.active,
          createdAt: new Date(m.createdAt)
        }
      });
    }

    // 6. Importar Usuários Admin
    let adminUsersCount = 0;
    if (data.adminUsers && data.adminUsers.length) {
      adminUsersCount = data.adminUsers.length;
      for (const user of data.adminUsers) {
        await prisma.adminUser.upsert({
          where: { id: user.id },
          update: {
            email: user.email,
            password: user.password
          },
          create: {
            id: user.id,
            email: user.email,
            password: user.password,
            createdAt: new Date(user.createdAt)
          }
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Banco de dados PostgreSQL (Supabase) migrado e populado com sucesso!',
      categoriesCount: data.categories.length,
      productsCount: data.products.length,
      bannersCount: data.banners.length,
      settingsCount: data.settings.length,
      adminUsersCount
    });
  } catch (error) {
    console.error('Erro na migração do banco de dados:', error);
    return NextResponse.json({ error: 'Erro interno durante a migração', details: error.message }, { status: 500 });
  }
}
