
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        tenantId: true,
        role: true,
        isActive: true
      }
    });
    console.log('--- Active Users ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('Total active users:', users.length);
    
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true }
    });
    console.log('--- Tenants ---');
    console.log(JSON.stringify(tenants, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
