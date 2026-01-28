import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  await prisma.user.update({
    where: { email: 'admin@ajans.local' },
    data: { password: hashedPassword }
  });
  console.log('admin@ajans.local password reset to: 123456');
}
main().finally(() => prisma.$disconnect());
