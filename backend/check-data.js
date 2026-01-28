
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const leads = await prisma.lead.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        tenantId: true,
      }
    });
    console.log('Sample Leads:', JSON.stringify(leads, null, 2));
    
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
      }
    });
    console.log('Tenants:', JSON.stringify(tenants, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
