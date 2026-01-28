import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin811912@ajans.local' },
    });

    if (!admin) {
      console.error(
        'Belirtilen admin kullanıcısı bulunamadı: admin811912@ajans.local',
      );
      return;
    }

    const email = `staff.test.${Date.now()}@ajans.local`;
    const passwordPlain = 'ajans123';
    const hashedPassword = await bcrypt.hash(passwordPlain, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name: 'Test Personel',
        password: hashedPassword,
        role: 'STAFF',
        tenantId: admin.tenantId,
      },
    });

    console.log('Test personel oluşturuldu:');
    console.log(`EMAIL=${user.email}`);
    console.log(`PASSWORD=${passwordPlain}`);
  } catch (error) {
    console.error('Kullanıcı oluşturulurken hata oluştu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Beklenmeyen hata:', error);
});
