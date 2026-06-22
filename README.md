# Catálogo / E-Commerce Atacadista de Moda Premium

Este é um projeto completo e funcional de catálogo/e-commerce voltado para atacado e varejo de moda, desenvolvido com **Next.js (App Router)**, **Prisma ORM** e **SQLite**. A finalização do pedido é feita via WhatsApp da loja, com suporte a pagamento Pix manual.

---

## 🛠️ Tecnologias Utilizadas

- **Core**: Next.js v16.2.7 (React v19)
- **Banco de Dados**: SQLite integrado (arquivo `prisma/dev.db` autogerado)
- **ORM**: Prisma ORM v6.2.1
- **Estilização**: CSS Vanilla moderno (com uso extensivo de variáveis CSS, responsividade fluida e layouts flexíveis)
- **Autenticação**: Hash de senhas com `bcryptjs` e sessões gerenciadas com Cookies JWT HTTP-only via biblioteca `jose` (compatível com a Edge Runtime do Next.js)
- **Ícones**: Lucide React
- **Integração de Mensagem**: WhatsApp Web Link Generator
- **Upload local**: API nativa de FormData que grava imagens diretamente na pasta `/public/uploads/` do projeto.

---

## 📦 Como Instalar e Rodar Localmente

1. **Instalar Dependências**:
   No diretório do projeto, execute o comando para baixar todos os pacotes necessários:
   ```bash
   npm install
   ```

2. **Gerar o Cliente Prisma**:
   Execute o comando para ler o schema e criar o client do banco de dados local:
   ```bash
   npx prisma generate
   ```

3. **Rodar as Migrations do Banco**:
   Crie o arquivo SQLite local (`prisma/dev.db`) e aplique a estrutura de tabelas:
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Popular o Banco com Dados Iniciais (Seed)**:
   Rode o script que criará o usuário administrador padrão, categorias de moda de exemplo, banners promocionais e 5 produtos na vitrine:
   ```bash
   node prisma/seed.js
   ```

5. **Iniciar Servidor de Desenvolvimento**:
   Coloque o projeto em execução localmente:
   ```bash
   npm run dev
   ```

   O site estará disponível no endereço [http://localhost:3000](http://localhost:3000).

---

## 🔐 Acesso Administrativo (Rota Oculta)

A área de gerenciamento do site fica sob uma rota administrativa que não aparece em sitemaps, rodapés ou menus públicos:

- **URL de Acesso**: `/gestao-interna-catalogo` (ou `/gestao-interna-catalogo/login` caso não esteja autenticado)
- **E-mail de Login**: `admin@loja.com`
- **Senha Padrão**: `admin123`

> [!IMPORTANT]  
> Altere a sua senha e as credenciais padrão no banco de dados para segurança em produção.

---

## 📲 Como Configurar WhatsApp e Pix

Toda a personalização de canais de venda e dados bancários pode ser efetuada diretamente pelo **Painel Administrativo** na seção **Configurações**, sem necessidade de mexer em código:

- **WhatsApp**: Insira o número com DDI e DDD (ex: `5511999999999`). O site gerará automaticamente botões de dúvida rápida e o link de envio de pedido montando o texto detalhado.
- **Pedido Mínimo**: Configure o número de peças mínimas exigidas (ex: 6 ou 12 peças). O carrinho lateral exibirá uma barra de progresso em tempo real e travará o checkout enquanto a quantidade mínima não for atingida.
- **Chave Pix**: Defina o tipo de chave (CPF, CNPJ, Telefone, E-mail ou Aleatória), o valor da chave, o banco e o nome do recebedor titular da conta. No checkout do cliente, um modal exibirá o resumo com um botão de cópia de chave Pix (Copia e Cola).
- **Cores da Marca (CSS Dinâmico)**: Você pode definir a cor principal e secundária do site usando seletores visuais de cor. Ao salvar, as cores principais e hover da interface inteira são re-injetadas dinamicamente no layout público.

---

## 🚀 Como Hospedar (ex: Hostinger / VPS)

### Requisitos Mínimos
- Ambiente Node.js (v18+) instalado na hospedagem.
- Permissão de escrita para criar arquivos locais na pasta `public/uploads` e gravar no arquivo `prisma/dev.db`.

### Configuração de Produção
1. **Build do Projeto**:
   Gere a versão de produção otimizada do Next.js:
   ```bash
   npm run build
   ```
2. **Variáveis de Ambiente**:
   Crie um arquivo `.env` na raiz da hospedagem com as seguintes configurações:
   ```env
   # Link de conexão do banco (já configurado para o SQLite local)
   DATABASE_URL="file:./dev.db"

   # Chave de segurança para assinatura dos tokens JWT da sessão do admin
   JWT_SECRET="insira-uma-chave-forte-aqui-123456"

   # Configuração de Ambiente
   NODE_ENV="production"
   ```
3. **Execução**:
   Inicie o servidor em produção usando PM2 ou pelo próprio painel do Hostinger:
   ```bash
   npm run start
   ```
