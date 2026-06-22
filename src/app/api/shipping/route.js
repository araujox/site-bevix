import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request) {
  try {
    const { cep } = await request.json();

    if (!cep) {
      return NextResponse.json({ error: 'CEP de destino é obrigatório' }, { status: 400 });
    }

    // Limpar o CEP para conter apenas números
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      return NextResponse.json({ error: 'CEP inválido, deve conter 8 dígitos' }, { status: 400 });
    }

    // Buscar configurações de frete
    const settings = await prisma.storeSettings.findUnique({
      where: { id: 'settings' },
    });

    const fallbackFee = settings?.fallbackShippingFee || 20.00;
    const shippingMode = settings?.shippingMode || 'FALLBACK';

    // Se estiver explicitamente em modo fixo simplificado
    if (shippingMode === 'FIXO') {
      return NextResponse.json({
        success: true,
        methods: [
          {
            name: 'Envio Fixo Atacado',
            price: fallbackFee,
            deadline: 'Prazo estimado de 5 a 10 dias úteis'
          }
        ]
      });
    }

    // Cálculo Simulado de Frete dos Correios com base na origem em Santa Cruz do Capibaribe - PE (CEP 55190-000)
    // Usamos os primeiros dígitos do CEP de destino para identificar o estado/região de destino
    const firstTwo = parseInt(cleanCep.substring(0, 2));
    const firstDigit = parseInt(cleanCep.substring(0, 1));

    let pacPrice = 0;
    let sedexPrice = 0;
    let pacDeadline = '';
    let sedexDeadline = '';

    // Regiões brasileiras (Regra baseada em CEP)
    if (firstTwo >= 50 && firstTwo <= 56) {
      // Pernambuco (Origem)
      pacPrice = 14.90;
      sedexPrice = 22.90;
      pacDeadline = '3 a 6 dias úteis';
      sedexDeadline = '1 a 2 dias úteis';
    } else if (firstTwo >= 57 && firstTwo <= 59) {
      // Paraíba, Alagoas, Rio Grande do Norte
      pacPrice = 18.90;
      sedexPrice = 28.90;
      pacDeadline = '4 a 8 dias úteis';
      sedexDeadline = '2 a 3 dias úteis';
    } else if (firstTwo >= 60 && firstTwo <= 63) {
      // Ceará
      pacPrice = 21.95;
      sedexPrice = 32.90;
      pacDeadline = '5 a 9 dias úteis';
      sedexDeadline = '2 a 4 dias úteis';
    } else if (firstTwo >= 40 && firstTwo <= 48) {
      // Bahia
      pacPrice = 24.50;
      sedexPrice = 37.90;
      pacDeadline = '5 a 10 dias úteis';
      sedexDeadline = '2 a 4 dias úteis';
    } else if (firstDigit === 4 || firstDigit === 6) {
      // Outros estados do Nordeste (SE, PI, MA) ou Norte próximo (PA, TO)
      pacPrice = 26.80;
      sedexPrice = 41.50;
      pacDeadline = '6 a 11 dias úteis';
      sedexDeadline = '3 a 5 dias úteis';
    } else if (firstDigit === 0 || firstDigit === 1 || firstDigit === 2 || firstDigit === 3) {
      // Região Sudeste (SP, RJ, MG, ES)
      pacPrice = 29.90;
      sedexPrice = 49.90;
      pacDeadline = '6 a 12 dias úteis';
      sedexDeadline = '3 a 5 dias úteis';
    } else if (firstDigit === 7 || firstDigit === 8) {
      // Sul (PR, SC) ou Centro-Oeste (GO, DF, MS, MT)
      pacPrice = 34.90;
      sedexPrice = 59.90;
      pacDeadline = '7 a 14 dias úteis';
      sedexDeadline = '4 a 6 dias úteis';
    } else if (firstDigit === 9) {
      // Rio Grande do Sul (Extremo Sul)
      pacPrice = 38.50;
      sedexPrice = 64.90;
      pacDeadline = '8 a 16 dias úteis';
      sedexDeadline = '4 a 7 dias úteis';
    } else {
      // Região Norte distante (AM, RR, RO, AC, AP)
      pacPrice = 42.00;
      sedexPrice = 72.00;
      pacDeadline = '10 a 18 dias úteis';
      sedexDeadline = '5 a 8 dias úteis';
    }

    return NextResponse.json({
      success: true,
      origin: 'Santa Cruz do Capibaribe - PE',
      cepOrigem: settings?.originCep || '55190-000',
      methods: [
        {
          id: 'correios-pac',
          name: 'Correios PAC',
          price: pacPrice,
          deadline: `Entrega em até ${pacDeadline}`
        },
        {
          id: 'correios-sedex',
          name: 'Correios SEDEX',
          price: sedexPrice,
          deadline: `Entrega em até ${sedexDeadline}`
        }
      ]
    });
  } catch (error) {
    console.error('Erro ao calcular frete:', error);
    return NextResponse.json({ error: 'Erro ao calcular frete' }, { status: 500 });
  }
}
