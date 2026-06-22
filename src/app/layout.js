import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { prisma } from '@/lib/db';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export async function generateMetadata() {
  let settings = null;
  try {
    settings = await prisma.storeSettings.findUnique({
      where: { id: 'settings' },
    });
  } catch (error) {
    // Banco não semeado ou build inicial
  }

  return {
    title: settings?.storeName || 'NOME_DA_LOJA | Catálogo de Roupas',
    description: settings?.description || 'Coleção de roupas premium no atacado e varejo. Compre com pedido mínimo e finalize via WhatsApp.',
    icons: {
      icon: settings?.favicon || '/favicon.ico',
    },
  };
}

export default async function RootLayout({ children }) {
  let settings = null;
  try {
    settings = await prisma.storeSettings.findUnique({
      where: { id: 'settings' },
    });
  } catch (error) {
    // Fallback
  }

  const primaryColor = settings?.primaryColor || '#e11d48';
  const secondaryColor = settings?.secondaryColor || '#1e293b';

  return (
    <html lang="pt-BR" className={`${outfit.variable} ${plusJakarta.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body
        style={{
          '--color-primary': primaryColor,
          '--color-primary-hover': `${primaryColor}e0`, // ligeiramente transparente para hover
          '--color-secondary': secondaryColor,
          fontFamily: 'var(--font-jakarta), var(--font-outfit), sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
