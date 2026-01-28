import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const emailArg = process.argv.slice(2).find((a) => a.includes('@'));
  const email = (emailArg || 'super@saas.com').trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('Kullanıcı bulunamadı:', email);
    return;
  }

  console.log(`Kullanıcı bulundu: ${user.email} (${user.name})`);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'SUPER_ADMIN' },
  });

  console.log(`Kullanıcı rolü güncellendi: ${updatedUser.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
