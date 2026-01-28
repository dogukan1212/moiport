import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@ajans.local' } });
  if (!user) {
    console.log('User not found');
    return;
  }

  const passwordToTest = 'admin123';
  const isMatch = await bcrypt.compare(passwordToTest, user.password);
  console.log('Testing password:', passwordToTest);
  console.log('Hash in DB:', user.password);
  console.log('Is Match?', isMatch);

  // Re-hash and compare
  const newHash = await bcrypt.hash(passwordToTest, 10);
  const isMatchNew = await bcrypt.compare(passwordToTest, newHash);
  console.log('New Hash:', newHash);
  console.log('Is Match with New Hash?', isMatchNew);
}

test().finally(() => prisma.$disconnect());
