import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
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
      deliveryMethod,
      shippingFee,
      notes,
      items, // array of { productId, size, color, quantity, unitPrice }
    } = body;

    // Validações básicas de campos de cliente e itens
    if (!customerName || !customerWhatsapp || !city || !state || !deliveryMethod || !items || !items.length) {
      return NextResponse.json({ error: 'Todos os campos obrigatórios e itens devem ser preenchidos' }, { status: 400 });
    }

    const isRetirada = deliveryMethod.toLowerCase().includes('retirada');
    const isExcursao = deliveryMethod.toLowerCase().includes('excursão') || deliveryMethod.toLowerCase().includes('excursao');

    // Se for Correios (não for Retirada nem Excursão), exigir campos de endereço postal
    if (!isRetirada && !isExcursao) {
      if (!cep || !street || !number || !neighborhood) {
        return NextResponse.json({ error: 'Todos os campos obrigatórios e itens devem ser preenchidos' }, { status: 400 });
      }
    } else if (isExcursao) {
      // Se for Excursão, exigir a identificação da excursão (enviada no campo 'street')
      if (!street) {
        return NextResponse.json({ error: 'Todos os campos obrigatórios e itens devem ser preenchidos' }, { status: 400 });
      }
    }

    // Verificar estoque dos produtos e calcular totais
    const computedItems = [];
    let orderTotal = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json({ error: `Produto com id ${item.productId} não encontrado` }, { status: 400 });
      }

      // Se a cor for "a confirmar", pulamos a verificação estrita de estoque (será confirmada manualmente no Whatsapp)
      const isColorToConfirm = item.color.toLowerCase().includes('confirmar');

      if (!isColorToConfirm) {
        let colorStock = null;
        if (product.variations) {
          try {
            const parsed = JSON.parse(product.variations);
            if (parsed.colorStock) {
              colorStock = parsed.colorStock;
            }
          } catch (e) {
            console.error('Erro ao processar JSON de variações:', e);
          }
        }

        let availableStock = product.stock;
        // Limpar o nome da cor para bater com a chave (ex: tirar espaços extras)
        const cleanColor = item.color.trim();
        
        if (colorStock && colorStock[cleanColor] !== undefined) {
          availableStock = colorStock[cleanColor];
        }

        if (availableStock < item.quantity) {
          return NextResponse.json(
            { error: `Estoque insuficiente para o produto "${product.name}" na cor "${item.color}". Disponível: ${availableStock}, Solicitado: ${item.quantity}` },
            { status: 400 }
          );
        }
      }

      let unitPrice = product.promotionalPrice || product.price;

      // Se houver preço específico por tamanho nas variações, usar esse preço
      if (product.variations && item.size) {
        try {
          const parsed = JSON.parse(product.variations);
          const cleanSize = item.size.trim();
          if (parsed.useSizePrices && parsed.sizePrices && parsed.sizePrices[cleanSize] !== undefined) {
            const sizePromoPrice = parsed.sizePromotionalPrices?.[cleanSize];
            const sizeBasePrice = parsed.sizePrices[cleanSize];
            unitPrice = sizePromoPrice || sizeBasePrice;
          }
        } catch (e) {
          console.error('Erro ao processar JSON de variações para preço no pedido:', e);
        }
      }

      const subtotal = unitPrice * item.quantity;
      orderTotal += subtotal;

      computedItems.push({
        productId: product.id,
        productName: product.name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: unitPrice,
        subtotal: subtotal,
        isColorToConfirm,
      });
    }

    // Executar a criação do pedido e atualização do estoque numa Transação Prisma
    const order = await prisma.$transaction(async (tx) => {
      // 1. Atualizar o estoque de cada produto
      for (const item of computedItems) {
        if (item.isColorToConfirm) {
          // Itens "a confirmar" não decrementam estoque
          continue;
        }

        // Buscar versão mais recente do produto dentro da transação
        const dbProduct = await tx.product.findUnique({
          where: { id: item.productId },
        });

        let updatedVariations = null;
        if (dbProduct && dbProduct.variations) {
          try {
            const parsed = JSON.parse(dbProduct.variations);
            const cleanColor = item.color.trim();
            if (parsed.colorStock && parsed.colorStock[cleanColor] !== undefined) {
              parsed.colorStock[cleanColor] = Math.max(0, parsed.colorStock[cleanColor] - item.quantity);
              updatedVariations = JSON.stringify(parsed);
            }
          } catch (e) {
            console.error('Erro ao atualizar estoque da cor na transação:', e);
          }
        }

        const dataToUpdate = {
          stock: {
            decrement: item.quantity,
          },
        };

        if (updatedVariations) {
          dataToUpdate.variations = updatedVariations;
        }

        await tx.product.update({
          where: { id: item.productId },
          data: dataToUpdate,
        });
      }

      // 2. Criar o pedido
      const newOrder = await tx.order.create({
        data: {
          customerName,
          customerWhatsapp,
          customerCpfCnpj: customerCpfCnpj || '',
          customerEmail: customerEmail || '',
          cep,
          street,
          number,
          neighborhood,
          city,
          state,
          complement: complement || '',
          deliveryMethod,
          paymentMethod: 'PIX',
          subtotal: orderTotal,
          shippingFee: parseFloat(shippingFee) || 0,
          total: orderTotal + (parseFloat(shippingFee) || 0),
          status: 'Aguardando pagamento',
          notes: notes || '',
          items: {
            create: computedItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return newOrder;
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar pedido público:', error);
    return NextResponse.json({ error: 'Erro interno ao criar pedido' }, { status: 500 });
  }
}
