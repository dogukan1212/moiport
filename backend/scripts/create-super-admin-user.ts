import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Revert existing admin to ADMIN role
  const existingAdmin = await prisma.user.findFirst({
    where: { email: 'admin@ajans.local' },
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { role: 'ADMIN' },
    });
    console.log('admin@ajans.local rolü ADMIN olarak geri alındı.');
  }

  // 2. Create new Super Admin user
  // We need a tenant for the user, let's use the first available tenant or create a system tenant
  let tenant = await prisma.tenant.findFirst();
  
  if (!tenant) {
     console.log("Hiç ajans yok, önce ajans oluşturulmalı.");
     return;
  }

  const superEmail = 'super@saas.com';
  const superPassword = 'saas123'; // Basit şifre
  const hashedPassword = await bcrypt.hash(superPassword, 10);

  // Check if super user already exists
  const existingSuper = await prisma.user.findUnique({
      where: { email: superEmail }
  });

  if (existingSuper) {
      await prisma.user.update({
          where: { id: existingSuper.id },
          data: { 
              role: 'SUPER_ADMIN',
              password: hashedPassword // Update password just in case
          }
      });
      console.log(`Mevcut kullanıcı güncellendi: ${superEmail}`);
  } else {
      await prisma.user.create({
        data: {
          email: superEmail,
          password: hashedPassword,
          name: 'SaaS Super Admin',
          role: 'SUPER_ADMIN',
          tenantId: tenant.id, // Attached to an existing tenant for now (system requirement)
        },
      });
      console.log(`Yeni Super Admin oluşturuldu: ${superEmail}`);
  }

  console.log('----------------------------------------');
  console.log(`Giriş Bilgileri:`);
  console.log(`Email: ${superEmail}`);
  console.log(`Şifre: ${superPassword}`);
  console.log('----------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
