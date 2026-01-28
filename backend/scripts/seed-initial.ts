import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Create Tenant
  let tenant = await prisma.tenant.findFirst({
    where: { slug: 'ajans-panel' }
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Ajans Paneli',
        slug: 'ajans-panel',
        email: 'info@ajans.local',
      }
    });
    console.log('Tenant created:', tenant.id);
  } else {
    console.log('Tenant already exists:', tenant.id);
  }

  // 2. Create User
  const email = 'admin@ajans.local';
  const password = '123456'; // Password must be at least 6 chars
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { 
        password: hashedPassword,
        role: 'ADMIN',
        tenantId: tenant.id
      }
    });
    console.log('User updated:', email);
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        tenantId: tenant.id
      }
    });
    console.log('User created:', email);
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
