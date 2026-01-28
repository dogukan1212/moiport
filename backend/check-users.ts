
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      tenantId: true,
      role: true
    }
  });

  console.log('Total users found:', users.length);
  users.forEach(u => {
    console.log(`- ${u.name} (${u.email}): tenantId=${u.tenantId}, isActive=${u.isActive}, role=${u.role}`);
  });

  const tenants = await prisma.tenant.findMany();
  console.log('\nTenants found:', tenants.length);
  tenants.forEach(t => {
    console.log(`- ${t.name}: id=${t.id}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
