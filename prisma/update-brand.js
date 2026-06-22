const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: 'file:./dev.db',
});

async function main() {
  console.log('Atualizando a marca do site para Use Antonyny...');

  // 1. Atualizar as Configurações da Loja
  const settings = await prisma.storeSettings.upsert({
    where: { id: 'settings' },
    update: {
      storeName: 'Use Antonyny',
      logo: '/uploads/logo-antonyny.jpg',
      favicon: '/uploads/logo-antonyny.jpg',
      description: 'Use Antonyny - Estilo Contemporâneo e Atemporal. A melhor marca de atacado de roupas do Brás. Peças premium com alta qualidade e o melhor preço de revenda.',
      primaryColor: '#1a365d', // Azul escuro do símbolo da logo
      secondaryColor: '#dd6b20', // Laranja do texto da logo
      footerText: '© 2026 Use Antonyny. CNPJ: 12.345.678/0001-99. Todos os direitos reservados. Estilo Contemporâneo e Atemporal.',
    },
    create: {
      id: 'settings',
      storeName: 'Use Antonyny',
      logo: '/uploads/logo-antonyny.jpg',
      favicon: '/uploads/logo-antonyny.jpg',
      whatsapp: '5511999999999',
      instagram: 'use_antonyny',
      email: 'contato@useantonyny.com.br',
      cnpj: '12.345.678/0001-99',
      address: 'Rua Silva Teles, 150 - Brás, São Paulo - SP',
      description: 'Use Antonyny - Estilo Contemporâneo e Atemporal. A melhor marca de atacado de roupas do Brás. Peças premium com alta qualidade e o melhor preço de revenda.',
      minimumItems: 6,
      pixKey: '5511999999999',
      pixKeyType: 'TELEFONE',
      pixReceiverName: 'Use Antonyny Ltda',
      pixBank: 'Banco Itaú',
      primaryColor: '#1a365d',
      secondaryColor: '#dd6b20',
      footerText: '© 2026 Use Antonyny. CNPJ: 12.345.678/0001-99. Todos os direitos reservados. Estilo Contemporâneo e Atemporal.',
    },
  });
  console.log('Configurações da Use Antonyny gravadas com sucesso!');

  // 2. Atualizar/Inserir o Banner da Marca
  // Desativar banners antigos
  await prisma.banner.updateMany({
    data: { active: false }
  });

  // Criar o novo banner da marca
  const newBanner = await prisma.banner.create({
    data: {
      title: 'Use Antonyny',
      subtitle: 'Estilo Contemporâneo e Atemporal. Peças premium para revenda a partir de R$ 29,90 no atacado.',
      image: '/uploads/banner-antonyny.webp',
      buttonText: 'Ver Coleção',
      buttonLink: '#produtos',
      active: true,
    }
  });

  console.log('Novo banner da marca cadastrado:', newBanner.title);
  console.log('Marca atualizada no banco de dados!');
}

main()
  .catch((e) => {
    console.error('Erro ao atualizar marca:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
