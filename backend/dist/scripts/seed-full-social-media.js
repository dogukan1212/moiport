"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting full seed for Social Media Plans...');
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.error('Tenant not found. Please run initial seed first.');
        return;
    }
    const tenantId = tenant.id;
    console.log(`Using tenant: ${tenant.name} (${tenantId})`);
    const staffMembers = [
        { name: 'ECEM', email: 'ecem@demo.com' },
        { name: 'TUĞÇE', email: 'tugce@demo.com' },
        { name: 'Ali', email: 'ali@demo.com' },
        { name: 'İbrahim Alp', email: 'ibrahim@demo.com' },
        { name: 'Bahar', email: 'bahar@demo.com' },
    ];
    const userMap = new Map();
    for (const staff of staffMembers) {
        let user = await prisma.user.findUnique({ where: { email: staff.email } });
        if (!user) {
            const hashedPassword = '$2a$10$Xk/X.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x';
            user = await prisma.user.create({
                data: {
                    email: staff.email,
                    name: staff.name,
                    password: 'hashed_password_placeholder',
                    role: 'STAFF',
                    tenantId,
                    isActive: true,
                },
            });
            console.log(`Created user: ${staff.name}`);
        }
        else {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { name: staff.name },
            });
            console.log(`Found/Updated user: ${staff.name}`);
        }
        userMap.set(staff.name, user.id);
    }
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
    const customerMap = new Map();
    for (const name of customerNames) {
        let customer = await prisma.customer.findFirst({
            where: { name, tenantId },
        });
        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    name,
                    tenantId,
                    email: `info@${name.toLowerCase().replace(/\s+/g, '').replace(/[İıĞğÜüŞşÖöÇç]/g, 'x')}.com`,
                },
            });
            console.log(`Created customer: ${name}`);
        }
        else {
            console.log(`Found customer: ${name}`);
        }
        customerMap.set(name, customer.id);
    }
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
                brandName: p.brand,
                customerId: customerId,
                currentPlanEndDate: p.end ? new Date(p.end).toISOString() : null,
                newPlanStartDate: p.start ? new Date(p.start).toISOString() : null,
                briefDeadline: p.brief ? new Date(p.brief).toISOString() : null,
                presentationDeadline: p.pres ? new Date(p.pres).toISOString() : null,
                briefStatus: p.bStat,
                designStatus: p.dStat,
                socialMediaManager: p.mgr,
                socialMediaManagerId: mgrId,
                designer: p.dsg,
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
//# sourceMappingURL=seed-full-social-media.js.map