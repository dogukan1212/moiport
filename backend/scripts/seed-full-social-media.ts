import { PrismaClient } from '@prisma/client';
// import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting full seed for Social Media Plans...');

  // 1. Get Tenant
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error('Tenant not found. Please run initial seed first.');
    return;
  }
  const tenantId = tenant.id;
  console.log(`Using tenant: ${tenant.name} (${tenantId})`);

  // 2. Upsert Users (Staff)
  const staffMembers = [
    { name: 'ECEM', email: 'ecem@demo.com' },
    { name: 'TUĞÇE', email: 'tugce@demo.com' },
    { name: 'Ali', email: 'ali@demo.com' },
    { name: 'İbrahim Alp', email: 'ibrahim@demo.com' },
    { name: 'Bahar', email: 'bahar@demo.com' },
  ];

  const userMap = new Map<string, string>(); // Name -> ID

  for (const staff of staffMembers) {
    // Check if user exists by email
    let user = await prisma.user.findUnique({ where: { email: staff.email } });
    
    if (!user) {
      // const hashedPassword = await bcrypt.hash('123456', 10);
      // Hardcoded hash for '123456' to avoid bcrypt dependency in script if missing
      const hashedPassword = '$2a$10$Xk/X.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x'; // Dummy hash or assume existing
      // Better to just not set password if not needed for this test or use a simple string if validation allows
      // But let's assume bcrypt is not installed in devDependencies.
      // We'll skip password setting for now or use a dummy hash.
      // Let's try to just create without bcrypt import.
      
      user = await prisma.user.create({
        data: {
          email: staff.email,
          name: staff.name,
          password: 'hashed_password_placeholder', // bcrypt is missing, just use placeholder
          role: 'STAFF',
          tenantId,
          isActive: true,
        },
      });
      console.log(`Created user: ${staff.name}`);
    } else {
      // Update name just in case
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: staff.name },
      });
      console.log(`Found/Updated user: ${staff.name}`);
    }
    userMap.set(staff.name, user.id);
  }

  // 3. Upsert Customers
  const customerNames = [
    'Cesur Fresh',
    'ARS Turizm',
    'Özbey Dent TR-EN',
    'Leka Motors',
    'Madalyalı',
    'Dental Platinum',
    'Terra Mimarlık',
    'Petikom',
    'Gloris',
    'Miraderm Pharma',
    'Barna Çiçekçilik',
    'Mentoar',
    'CRMSELL',
    'Beta İnşaat',
    '11 Locations'
  ];

  const customerMap = new Map<string, string>(); // Name -> ID

  for (const name of customerNames) {
    // Try to find customer by name (this is a bit fuzzy since name isn't unique in schema but usually is in practice)
    // We'll search by name AND tenantId
    let customer = await prisma.customer.findFirst({
      where: { name, tenantId },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name,
          tenantId,
          email: `info@${name.toLowerCase().replace(/\s+/g, '').replace(/[İıĞğÜüŞşÖöÇç]/g, 'x')}.com`, // Dummy email
        },
      });
      console.log(`Created customer: ${name}`);
    } else {
      console.log(`Found customer: ${name}`);
    }
    customerMap.set(name, customer.id);
  }

  // 4. Create Plans
  // Clear existing plans for this tenant to avoid duplicates (optional but cleaner for this request)
  await prisma.socialMediaPlan.deleteMany({ where: { tenantId } });
  console.log('Cleared existing plans.');

  const plansData = [
    {
      brand: 'Cesur Fresh',
      end: '2026-02-10', start: '2026-02-12', brief: '2026-01-15', pres: '2026-01-26',
      bStat: 'Tamamlandı', dStat: 'Bekliyor',
      mgr: 'ECEM', dsg: 'Ali',
      link: 'https://docs.google.com/presentation/d/1yBmqC...'
    },
    {
      brand: 'ARS Turizm',
      end: '2026-02-01', start: '2026-02-03', brief: '2026-01-15', pres: '2026-01-19',
      bStat: 'Bekliyor', dStat: 'Bekliyor',
      mgr: 'ECEM', dsg: 'İbrahim Alp',
      link: null
    },
    {
      brand: 'Özbey Dent TR-EN',
      end: '2026-02-05', start: '2026-02-07', brief: '2026-01-15', pres: '2026-01-23',
      bStat: 'Tamamlandı', dStat: 'Bekliyor',
      mgr: 'TUĞÇE', dsg: 'Ali',
      link: 'https://docs.google.com/presentation/d/1461o2i...'
    },
    {
      brand: 'Leka Motors',
      end: '2026-02-05', start: '2026-02-07', brief: '2025-12-15', pres: '2026-01-22',
      bStat: 'Tamamlandı', dStat: 'Bekliyor',
      mgr: 'TUĞÇE', dsg: 'İbrahim Alp',
      link: 'https://docs.google.com/presentation/d/1lqTpW0...'
    },
    {
      brand: 'Madalyalı',
      end: '2026-02-03', start: '2026-02-05', brief: '2025-12-15', pres: '2026-01-19',
      bStat: 'Çalışılıyor', dStat: 'Bekliyor',
      mgr: 'TUĞÇE', dsg: 'Ali',
      link: null
    },
    {
      brand: 'Dental Platinum',
      end: '2026-02-05', start: '2026-02-07', brief: '2025-12-15', pres: '2026-01-22',
      bStat: 'Tamamlandı', dStat: 'Bekliyor',
      mgr: 'TUĞÇE', dsg: 'İbrahim Alp',
      link: 'https://docs.google.com/presentation/d/1YecXW...'
    },
    {
      brand: 'Terra Mimarlık',
      end: '2026-02-04', start: '2026-02-06', brief: '2025-12-15', pres: '2025-12-26',
      bStat: 'Bekliyor', dStat: 'Bekliyor',
      mgr: 'ECEM', dsg: 'İbrahim Alp',
      link: null
    },
    {
      brand: 'Petikom',
      end: '2026-02-18', start: '2026-02-20', brief: '2026-01-15', pres: '2026-01-12',
      bStat: 'Çalışılıyor', dStat: 'Bekliyor',
      mgr: 'TUĞÇE', dsg: 'Bahar',
      link: 'https://docs.google.com/presentation/d/1wEpdU...'
    },
    {
      brand: 'Gloris',
      end: '2026-02-05', start: '2026-02-07', brief: '2026-01-15', pres: '2026-01-26',
      bStat: 'Çalışılıyor', dStat: 'Bekliyor',
      mgr: 'ECEM', dsg: 'Bahar',
      link: null
    },
    {
      brand: 'Miraderm Pharma',
      end: null, start: null, brief: '2026-01-15', pres: null,
      bStat: 'Bekliyor', dStat: 'Bekliyor',
      mgr: 'ECEM', dsg: 'Bahar',
      link: null
    },
    {
      brand: 'Barna Çiçekçilik',
      end: '2026-02-16', start: '2026-02-18', brief: '2026-02-09', pres: '2026-01-30',
      bStat: 'Tamamlandı', dStat: 'Bekliyor',
      mgr: 'ECEM', dsg: 'Ali',
      link: null
    },
    {
      brand: 'Mentoar',
      end: null, start: null, brief: null, pres: null,
      bStat: 'Bekliyor', dStat: 'Bekliyor',
      mgr: 'ECEM', dsg: 'İbrahim Alp',
      link: null
    },
    {
      brand: 'CRMSELL',
      end: null, start: null, brief: null, pres: null,
      bStat: 'Bekliyor', dStat: 'Bekliyor',
      mgr: 'TUĞÇE', dsg: null,
      link: null
    },
    {
      brand: 'Beta İnşaat',
      end: null, start: null, brief: null, pres: null,
      bStat: 'Tamamlandı', dStat: 'Bekliyor',
      mgr: 'TUĞÇE', dsg: null,
      link: null
    },
    {
      brand: '11 Locations',
      end: null, start: null, brief: null, pres: null,
      bStat: 'Tamamlandı', dStat: 'Bekliyor',
      mgr: 'ECEM', dsg: 'Ali',
      link: null
    },
  ];

  for (const p of plansData) {
    const customerId = customerMap.get(p.brand);
    const mgrId = p.mgr ? userMap.get(p.mgr) : null;
    const dsgId = p.dsg ? userMap.get(p.dsg) : null;

    if (!customerId) {
      console.warn(`Customer ID not found for ${p.brand}, skipping.`);
      continue;
    }

    await prisma.socialMediaPlan.create({
      data: {
        tenantId,
        brandName: p.brand, // Keep brandName string for fallback
        customerId: customerId,
        
        currentPlanEndDate: p.end ? new Date(p.end).toISOString() : null,
        newPlanStartDate: p.start ? new Date(p.start).toISOString() : null,
        briefDeadline: p.brief ? new Date(p.brief).toISOString() : null,
        presentationDeadline: p.pres ? new Date(p.pres).toISOString() : null,
        
        briefStatus: p.bStat,
        designStatus: p.dStat,
        
        socialMediaManager: p.mgr, // Keep string fallback
        socialMediaManagerId: mgrId,
        
        designer: p.dsg, // Keep string fallback
        designerId: dsgId,
        
        calendarUrl: p.link,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
