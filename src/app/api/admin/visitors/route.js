import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const visitors = await prisma.visitor.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(visitors);
  } catch (error) {
    console.error('Erro ao listar visitantes:', error);
    return NextResponse.json({ error: 'Erro ao listar visitantes' }, { status: 500 });
  }
}
