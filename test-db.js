const { PrismaClient } = require('@prisma/client');
const path = require('path');
const dbPath = path.join(__dirname, 'prisma', 'dev.db');
console.log('Using database path:', dbPath);
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`
    }
  }
});
async function main() {
  const users = await prisma.adminUser.findMany();
  console.log('Admin users:', users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
