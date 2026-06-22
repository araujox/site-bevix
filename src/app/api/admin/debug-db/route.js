import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request) {
  try {
    // Verificar se o Prisma Client está conectado a SQLite ou PostgreSQL
    // Fazemos uma query simples para inspecionar
    const envVars = {
      VERCEL: process.env.VERCEL || 'Não',
      HAS_DATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_MASKED: process.env.DATABASE_URL 
        ? process.env.DATABASE_URL.replace(/:([^@]+)@/, ':******@') 
        : 'Não definida',
      HAS_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      HAS_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    // Tenta obter o tipo de banco executando uma query de versão
    let dbProvider = 'Desconhecido';
    try {
      // No PostgreSQL, version() funciona. No SQLite, sqlite_version() funciona.
      const pgVersion = await prisma.$queryRaw`SELECT version()`;
      dbProvider = 'PostgreSQL (' + pgVersion[0].version + ')';
    } catch (pgError) {
      try {
        const sqliteVersion = await prisma.$queryRaw`SELECT sqlite_version()`;
        dbProvider = 'SQLite (' + sqliteVersion[0].sqlite_version + ')';
      } catch (sqliteError) {
        dbProvider = 'Erro ao identificar: ' + pgError.message + ' | ' + sqliteError.message;
      }
    }

    let tableCounts = {};
    try {
      tableCounts.AdminUser = await prisma.adminUser.count();
      tableCounts.Product = await prisma.product.count();
      tableCounts.Category = await prisma.category.count();
      tableCounts.StoreSettings = await prisma.storeSettings.count();
    } catch (countError) {
      tableCounts.error = countError.message;
    }

    return NextResponse.json({
      success: true,
      dbProvider,
      envVars,
      tableCounts
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
