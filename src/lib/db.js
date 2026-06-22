import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  // Carrega a URL de conexão lendo a variável padrão ou as variáveis injetadas automaticamente pela integração Vercel-Supabase
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;

  return new PrismaClient(
    dbUrl
      ? {
          datasources: {
            db: {
              url: dbUrl,
            },
          },
        }
      : undefined
  );
};

const prisma = globalThis.prisma ?? prismaClientSingleton();

export { prisma };

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
