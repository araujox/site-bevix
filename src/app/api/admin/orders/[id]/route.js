import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      status, 
      internalNotes,
      customerName,
      customerWhatsapp,
      customerCpfCnpj,
      customerEmail,
      cep,
      street,
      number,
      neighborhood,
      city,
      state,
      complement,
    } = body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: status !== undefined ? status : existingOrder.status,
        internalNotes: internalNotes !== undefined ? internalNotes : existingOrder.internalNotes,
        customerName: customerName !== undefined ? customerName : existingOrder.customerName,
        customerWhatsapp: customerWhatsapp !== undefined ? customerWhatsapp : existingOrder.customerWhatsapp,
        customerCpfCnpj: customerCpfCnpj !== undefined ? customerCpfCnpj : existingOrder.customerCpfCnpj,
        customerEmail: customerEmail !== undefined ? customerEmail : existingOrder.customerEmail,
        cep: cep !== undefined ? cep : existingOrder.cep,
        street: street !== undefined ? street : existingOrder.street,
        number: number !== undefined ? number : existingOrder.number,
        neighborhood: neighborhood !== undefined ? neighborhood : existingOrder.neighborhood,
        city: city !== undefined ? city : existingOrder.city,
        state: state !== undefined ? state : existingOrder.state,
        complement: complement !== undefined ? complement : existingOrder.complement,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Pedido excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir pedido:', error);
    return NextResponse.json({ error: 'Erro ao excluir pedido' }, { status: 500 });
  }
}
