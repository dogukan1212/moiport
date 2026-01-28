import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const leads = await prisma.lead.findMany({
    include: {
      pipeline: true
    }
  });

  console.log('Found leads:', JSON.stringify(leads, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
