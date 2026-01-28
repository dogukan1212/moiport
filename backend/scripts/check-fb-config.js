
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConfig() {
  try {
    const config = await prisma.systemConfig.findFirst();
    console.log('System Config:', JSON.stringify(config, null, 2));
    const facebookConfigs = await prisma.facebookConfig.findMany();
    console.log('Facebook Configs:', JSON.stringify(facebookConfigs, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConfig();
