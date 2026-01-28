import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'info@lekamotors.com';
  const hashedPassword = await bcrypt.hash('123456', 10);

  // Müşteriyi bul
  const customer = await prisma.customer.findFirst({
      where: { email }
  });

  if (!customer) {
      console.log('Customer not found for email:', email);
      // Create a customer if not exists (for testing)
      // We need tenantId
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) return;

      const newCustomer = await prisma.customer.create({
          data: {
              name: 'Leka Motors',
              email,
              tenantId: tenant.id
          }
      });
      console.log('Created new customer:', newCustomer.id);
  }

  // Kullanıcıyı güncelle
  const user = await prisma.user.update({
    where: { email },
    data: { 
        password: hashedPassword,
        customerId: customer?.id // Link to customer if found
    },
  });

  console.log('Updated user:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
