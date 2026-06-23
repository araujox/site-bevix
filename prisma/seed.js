const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando semeadura do banco de dados fictício...');

  // 1. Criar usuário Admin padrão
  const adminEmail = 'admin@loja.com.br';
  const rawPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
    },
  });
  console.log(`Admin criado: ${admin.email}`);

  // 2. Criar configurações padrão da loja (com placeholders)
  const settings = await prisma.storeSettings.upsert({
    where: { id: 'settings' },
    update: {
      storeName: 'NOME_DA_LOJA',
      logo: '/uploads/logo-placeholder.png',
      favicon: '/uploads/favicon-placeholder.png',
      whatsapp: '5581999999999',
      instagram: 'instagram_da_loja',
      email: 'contato@lojaexemplo.com.br',
      cnpj: '00.000.000/0001-00',
      address: 'ENDERECO_DA_LOJA',
      description: 'SLOGAN_DA_LOJA - Uma descrição curta e inspiradora sobre os seus produtos e o seu propósito comercial.',
      minimumItems: 6,
      pixKey: '5581999999999',
      pixKeyType: 'TELEFONE',
      pixReceiverName: 'RECEBEDOR_PIX_DA_LOJA',
      pixBank: 'Banco Exemplo',
      qrCodePix: '',
      originAddress: 'Rua Principal, 100',
      originCity: 'Cidade Exemplo',
      originState: 'PE',
      originCep: '55190-000',
      shippingMode: 'FALLBACK',
      fallbackShippingFee: 20.00,
      primaryColor: '#e11d48', // Rose 600
      secondaryColor: '#1e293b', // Slate 800
      footerText: '© 2026 NOME_DA_LOJA. CNPJ: 00.000.000/0001-00. Todos os direitos reservados.',
    },
    create: {
      id: 'settings',
      storeName: 'NOME_DA_LOJA',
      logo: '/uploads/logo-placeholder.png',
      favicon: '/uploads/favicon-placeholder.png',
      whatsapp: '5581999999999',
      instagram: 'instagram_da_loja',
      email: 'contato@lojaexemplo.com.br',
      cnpj: '00.000.000/0001-00',
      address: 'ENDERECO_DA_LOJA',
      description: 'SLOGAN_DA_LOJA - Uma descrição curta e inspiradora sobre os seus produtos e o seu propósito comercial.',
      minimumItems: 6,
      pixKey: '5581999999999',
      pixKeyType: 'TELEFONE',
      pixReceiverName: 'RECEBEDOR_PIX_DA_LOJA',
      pixBank: 'Banco Exemplo',
      qrCodePix: '',
      originAddress: 'Rua Principal, 100',
      originCity: 'Cidade Exemplo',
      originState: 'PE',
      originCep: '55190-000',
      shippingMode: 'FALLBACK',
      fallbackShippingFee: 20.00,
      primaryColor: '#e11d48',
      secondaryColor: '#1e293b',
      footerText: '© 2026 NOME_DA_LOJA. CNPJ: 00.000.000/0001-00. Todos os direitos reservados.',
    },
  });
  console.log('Configurações da loja criadas!');

  // 3. Criar 3 Categorias de Exemplo
  const categoriesData = [
    { name: 'Categoria Exemplo 1', slug: 'categoria-exemplo-1', order: 1 },
    { name: 'Categoria Exemplo 2', slug: 'categoria-exemplo-2', order: 2 },
    { name: 'Categoria Exemplo 3', slug: 'categoria-exemplo-3', order: 3 },
  ];

  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  const categoriesMap = {};
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.create({
      data: cat,
    });
    categoriesMap[cat.slug] = createdCat.id;
  }
  console.log('Categorias criadas!');

  // 4. Criar Métodos de Entrega
  const deliveryMethods = [
    { name: 'Entrega Padrão (Correios)', description: 'Envio via PAC para todo o Brasil.', fixedFee: 20.00 },
    { name: 'Entrega Rápida (SEDEX)', description: 'Envio expresso para todo o Brasil.', fixedFee: 45.00 },
    { name: 'Retirada na Loja', description: 'Retirada grátis em nosso endereço comercial.', fixedFee: 0.00 },
  ];

  await prisma.deliveryMethod.deleteMany({});
  for (const method of deliveryMethods) {
    await prisma.deliveryMethod.create({
      data: method,
    });
  }
  console.log('Métodos de entrega criados!');

  // 5. Criar Banner de Exemplo
  await prisma.banner.deleteMany({});
  await prisma.banner.create({
    data: {
      title: 'SLOGAN_PRINCIPAL_DO_BANNER',
      subtitle: 'Texto secundário do banner para campanhas de marketing ou promoções da loja.',
      image: '/uploads/banner-principal.webp',
      buttonText: 'Ver Produtos',
      buttonLink: '#produtos',
      active: true,
    },
  });
  console.log('Banner de exemplo criado!');

  // 6. Cadastrar 3 Produtos de Exemplo
  const productsToSeed = [
    {
      name: "Produto Exemplo 1",
      slug: "produto-exemplo-1",
      sku: "EX-001",
      price: 99.90,
      stock: 50,
      sizes: "P,M,G,GG",
      colors: "Preto, Branco, Vermelho",
      mainImage: "/uploads/cropped-lastex.webp",
      categorySlug: "categoria-exemplo-1",
      plusSize: false,
      description: "Descrição detalhada do Produto Exemplo 1. Use este espaço para colocar características técnicas, tecido, caimento e outras observações importantes.",
      ncm: "61091000",
      cfop: "5102",
      cst: "102",
      origin: 0,
      unit: "UN",
      weight: 0.150,
      variations: JSON.stringify({
        veste: "Tamanhos padrão P ao GG",
        tecido: "Tecido Exemplo",
        gramatura: "300g",
        caracteristicas: ["Alta Durabilidade", "Toque Macio"],
        observacao: "Nenhuma."
      })
    },
    {
      name: "Produto Exemplo 2",
      slug: "produto-exemplo-2",
      sku: "EX-002",
      price: 149.90,
      promotionalPrice: 129.90,
      stock: 35,
      sizes: "M,G",
      colors: "Azul, Cinza",
      mainImage: "/uploads/vestido-longo.webp",
      categorySlug: "categoria-exemplo-2",
      plusSize: false,
      description: "Descrição detalhada do Produto Exemplo 2. Esse produto contém um preço promocional ativado para demonstração.",
      ncm: "61091000",
      cfop: "5102",
      cst: "102",
      origin: 0,
      unit: "UN",
      weight: 0.250,
      variations: JSON.stringify({
        veste: "M ao G",
        tecido: "Premium Blend",
        gramatura: "280g",
        caracteristicas: ["Preço Promocional", "Modelagem Confortável"],
        observacao: "Edição Limitada."
      })
    },
    {
      name: "Produto Exemplo 3 (Plus Size)",
      slug: "produto-exemplo-3",
      sku: "EX-003",
      price: 119.90,
      stock: 20,
      sizes: "G,GG,XG",
      colors: "Preto, Azul marinho",
      mainImage: "/uploads/short-alfaiataria.webp",
      categorySlug: "categoria-exemplo-3",
      plusSize: true,
      description: "Descrição detalhada do Produto Exemplo 3. Este produto está marcado com a tag Plus Size nas opções de catálogo.",
      ncm: "61091000",
      cfop: "5102",
      cst: "102",
      origin: 0,
      unit: "UN",
      weight: 0.200,
      variations: JSON.stringify({
        veste: "G ao XG (46 ao 52)",
        tecido: "Flex Confort",
        gramatura: "320g",
        caracteristicas: ["Plus Size", "Alta Elasticidade"],
        observacao: "Alta compressão."
      })
    }
  ];

  for (const prod of productsToSeed) {
    const catId = categoriesMap[prod.categorySlug];
    if (!catId) continue;

    const { categorySlug, ...prodData } = prod;
    await prisma.product.create({
      data: {
        ...prodData,
        categoryId: catId,
      },
    });
  }
  console.log('Produtos de exemplo criados!');
  console.log('Semeadura concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
