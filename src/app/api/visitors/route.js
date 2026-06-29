import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request) {
  try {
    const { name, whatsapp, city } = await request.json();

    if (!name || !whatsapp || !city) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    const visitor = await prisma.visitor.create({
      data: {
        name,
        whatsapp,
        city,
      },
    });

    return NextResponse.json({ success: true, visitorId: visitor.id });
  } catch (error) {
    console.error('Erro ao salvar visitante:', error);
    return NextResponse.json({ error: 'Erro interno ao registrar acesso.' }, { status: 500 });
  }
}
