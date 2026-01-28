import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const config = await prisma.systemConfig.findFirst();
  const newToken = "poL3wr4To7EKqJp1XxhgCBRp";
  
  if (config) {
    await prisma.systemConfig.update({
      where: { id: config.id },
      data: { facebookVerifyToken: newToken }
    });
    console.log('SystemConfig updated with new Facebook Verify Token.');
  } else {
    await prisma.systemConfig.create({
      data: {
        facebookAppId: '',
        facebookAppSecret: '',
        facebookVerifyToken: newToken
      }
    });
    console.log('SystemConfig created with new Facebook Verify Token.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
