import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, signToken, hashPassword } from '@/lib/auth';

async function autoSeedIfEmpty() {
  try {
    const adminCount = await prisma.adminUser.count();
    if (adminCount > 0) return;

    console.log('Banco de dados vazio detectado. Executando auto-semeadura...');

    // 1. Criar admin padrão
    const hashedPassword = await hashPassword('admin123');
    await prisma.adminUser.create({
      data: {
        email: 'admin@loja.com.br',
        password: hashedPassword,
      },
    });

    // 2. Configurações padrão
    await prisma.storeSettings.upsert({
      where: { id: 'settings' },
      update: {},
      create: {
        id: 'settings',
        storeName: 'Bevix Moda Fitness',
        whatsapp: '5581999999999',
        email: 'contato@bevix.com.br',
        cnpj: '00.000.000/0001-00',
        address: 'Rua Principal, 100',
        description: 'Bevix Moda Fitness - Sua loja de moda fitness no atacado e varejo.',
        minimumItems: 6,
        minimumValue: 0.00,
        maintenanceMode: false,
        maintenanceTitle: 'Preparando Novidades!',
        maintenanceMessage: 'Estamos atualizando nosso catálogo com a nova coleção. Voltamos em breve com muitas novidades para você!',
        pixKey: '5581999999999',
        pixKeyType: 'TELEFONE',
        pixReceiverName: 'BEVIX MODA FITNESS',
        originAddress: 'Rua Principal, 100',
        originCity: 'Santa Cruz do Capibaribe',
        originState: 'PE',
        originCep: '55190-000',
        shippingMode: 'FALLBACK',
        fallbackShippingFee: 20.00,
        primaryColor: '#e11d48',
        secondaryColor: '#1e293b',
      },
    });

    // 3. Categorias padrão
    const categoriesData = [
      { name: 'Calças & Leggings', slug: 'calcas-leggings', order: 1 },
      { name: 'Tops & Croppeds', slug: 'tops-croppeds', order: 2 },
      { name: 'Shorts & Bermudas', slug: 'shorts-bermudas', order: 3 },
    ];
    for (const cat of categoriesData) {
      await prisma.category.create({ data: cat });
    }

    // 4. Métodos de entrega
    const deliveryMethods = [
      { name: 'Entrega Padrão (Correios)', description: 'Envio via PAC para todo o Brasil.', fixedFee: 20.00 },
      { name: 'Entrega Rápida (SEDEX)', description: 'Envio expresso para todo o Brasil.', fixedFee: 45.00 },
      { name: 'Retirada na Loja', description: 'Retirada grátis em nosso endereço comercial.', fixedFee: 0.00 },
    ];
    for (const method of deliveryMethods) {
      await prisma.deliveryMethod.create({ data: method });
    }

    // 5. Banner padrão
    await prisma.banner.create({
      data: {
        title: 'Nova Coleção Bevix',
        subtitle: 'As melhores roupas fitness do mercado atacado com preços imperdíveis.',
        image: '/uploads/banner-principal.webp',
        buttonText: 'Ver Coleção',
        buttonLink: '#produtos',
        active: true,
      },
    });

    console.log('Auto-semeadura concluída com sucesso!');
  } catch (error) {
    console.error('Erro na auto-semeadura:', error);
  }
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
    }

    // Garante que o banco está semeado se estiver vazio
    await autoSeedIfEmpty();

    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 });
    }

    const passwordMatch = await comparePassword(password, admin.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 });
    }

    const token = await signToken({ id: admin.id, email: admin.email });

    const response = NextResponse.json({ success: true, message: 'Login realizado com sucesso' });

    // Definir cookie de sessão seguro
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 dia
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
