import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo Ajans',
      slug: 'demo-ajans',
      title: 'Demo Ajans Yönetim Paneli',
      email: 'info@demoajans.com',
      subscriptionPlan: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
      industry: 'HEALTH_TOURISM', // Default industry
      enabledModules: 'CRM,WHATSAPP,FINANCE,PROJECTS,TASKS,CHAT,SOCIAL_MEDIA_PLANS,HEALTH_TOURISM,STORAGE',
    },
  });

  console.log('Tenant created:', tenant.name);

  // 2. Create Admin User
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      password: hashedPassword,
      name: 'Sistem Yöneticisi',
      role: 'ADMIN',
      tenantId: tenant.id,
      isActive: true,
      allowedModules: 'CRM,WHATSAPP,FINANCE,PROJECTS,TASKS,CHAT,SOCIAL_MEDIA_PLANS,HEALTH_TOURISM,STORAGE',
    },
  });

  console.log('Admin user created:', admin.email);
  console.log('Password:', '123456');

  // 3. Create a Demo Customer first
  const customer = await prisma.customer.create({
    data: {
        name: 'Ajans İçi',
        email: 'internal@demo.com',
        tenantId: tenant.id,
    }
  });

  // 4. Create a Demo Project
  const project = await prisma.project.create({
    data: {
      name: 'Genel Operasyonlar',
      description: 'Ajans içi genel görevler',
      status: 'ACTIVE',
      tenantId: tenant.id,
      customerId: customer.id
    },
  });
  
  console.log('Demo project created:', project.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });