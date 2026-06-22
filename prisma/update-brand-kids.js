const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: 'file:./dev.db',
});

async function main() {
  console.log('Atualizando a marca do site para estilo infantil/juvenil...');

  // 1. Atualizar as Configurações da Loja com cores lúdicas
  const settings = await prisma.storeSettings.upsert({
    where: { id: 'settings' },
    update: {
      storeName: 'Use Antonyny',
      logo: '/uploads/logo-antonyny.jpg',
      favicon: '/uploads/logo-antonyny.jpg',
      description: 'Use Antonyny - Estilo Contemporâneo e Atemporal para Moda Infantojuvenil. As melhores coleções de atacado de roupas do Brás. Peças alegres, divertidas e confortáveis com o melhor preço de revenda.',
      primaryColor: '#f43f5e', // Rosa lúdico e vibrante (Rose 500)
      secondaryColor: '#0ea5e9', // Azul céu alegre e infantil (Sky 500)
      footerText: '© 2026 Use Antonyny. CNPJ: 12.345.678/0001-99. Todos os direitos reservados. Moda Infantojuvenil com Estilo.',
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
      description: 'Use Antonyny - Estilo Contemporâneo e Atemporal para Moda Infantojuvenil. As melhores coleções de atacado de roupas do Brás. Peças alegres, divertidas e confortáveis com o melhor preço de revenda.',
      minimumItems: 6,
      pixKey: '5511999999999',
      pixKeyType: 'TELEFONE',
      pixReceiverName: 'Use Antonyny Ltda',
      pixBank: 'Banco Itaú',
      primaryColor: '#f43f5e',
      secondaryColor: '#0ea5e9',
      footerText: '© 2026 Use Antonyny. CNPJ: 12.345.678/0001-99. Todos os direitos reservados. Moda Infantojuvenil com Estilo.',
    },
  });
  console.log('Configurações lúdicas da Use Antonyny gravadas com sucesso!');

  // 2. Criar e ativar múltiplos banners para o carrossel
  // Limpar banners antigos para reiniciar o carrossel com temas infantojuvenis
  await prisma.banner.deleteMany({});

  const bannersToCreate = [
    {
      title: 'Coleção Kids Antonyny',
      subtitle: 'Moda infantil alegre, confortável e estilosa. Peças a partir de R$ 24,90 no atacado.',
      image: '/uploads/banner-kids-1.webp',
      buttonText: 'Ver Linha Kids',
      buttonLink: '#produtos',
      active: true,
    },
    {
      title: 'Estilo Teen & Juvenil',
      subtitle: 'Tendências modernas para o público infantojuvenil. Revenda e lucre até 100%.',
      image: '/uploads/banner-kids-2.webp',
      buttonText: 'Ver Linha Teen',
      buttonLink: '#produtos',
      active: true,
    },
    {
      title: 'Use Antonyny Atacado',
      subtitle: 'Mínimo de 6 peças variadas. Enviamos para todo o Brasil via ônibus de excursão ou correios.',
      image: '/uploads/banner-antonyny.webp',
      buttonText: 'Comprar Agora',
      buttonLink: '#produtos',
      active: true,
    }
  ];

  for (const b of bannersToCreate) {
    await prisma.banner.create({
      data: b,
    });
  }

  console.log('3 Banners infantojuvenis ativos inseridos no banco de dados!');
}

main()
  .catch((e) => {
    console.error('Erro ao atualizar marca kids:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
