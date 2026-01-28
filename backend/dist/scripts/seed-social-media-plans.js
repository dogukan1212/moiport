"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.error('Tenant not found');
        return;
    }
    const tenantId = tenant.id;
    const plans = [
        {
            brandName: 'Cesur Fresh',
            currentPlanEndDate: new Date('2026-02-10').toISOString(),
            newPlanStartDate: new Date('2026-02-12').toISOString(),
            briefDeadline: new Date('2026-01-15').toISOString(),
            presentationDeadline: new Date('2026-01-26').toISOString(),
            briefStatus: 'Tamamlandı',
            designStatus: 'Bekliyor',
            socialMediaManager: 'ECEM',
            designer: 'Ali',
            calendarUrl: 'https://docs.google.com/presentation/d/1yBmqC...',
        },
        {
            brandName: 'ARS Turizm',
            currentPlanEndDate: new Date('2026-02-01').toISOString(),
            newPlanStartDate: new Date('2026-02-03').toISOString(),
            briefDeadline: new Date('2026-01-15').toISOString(),
            presentationDeadline: new Date('2026-01-19').toISOString(),
            briefStatus: 'Bekliyor',
            designStatus: 'Bekliyor',
            socialMediaManager: 'ECEM',
            designer: 'İbrahim Alp',
            calendarUrl: null,
        },
        {
            brandName: 'Özbey Dent TR-EN',
            currentPlanEndDate: new Date('2026-02-05').toISOString(),
            newPlanStartDate: new Date('2026-02-07').toISOString(),
            briefDeadline: new Date('2026-01-15').toISOString(),
            presentationDeadline: new Date('2026-01-23').toISOString(),
            briefStatus: 'Tamamlandı',
            designStatus: 'Bekliyor',
            socialMediaManager: 'TUĞÇE',
            designer: 'Ali',
            calendarUrl: 'https://docs.google.com/presentation/d/1461o2i...',
        },
        {
            brandName: 'Leka Motors',
            currentPlanEndDate: new Date('2026-02-05').toISOString(),
            newPlanStartDate: new Date('2026-02-07').toISOString(),
            briefDeadline: new Date('2025-12-15').toISOString(),
            presentationDeadline: new Date('2026-01-22').toISOString(),
            briefStatus: 'Tamamlandı',
            designStatus: 'Bekliyor',
            socialMediaManager: 'TUĞÇE',
            designer: 'İbrahim Alp',
            calendarUrl: 'https://docs.google.com/presentation/d/1lqTpW0...',
        },
        {
            brandName: 'Madalyalı',
            currentPlanEndDate: new Date('2026-02-03').toISOString(),
            newPlanStartDate: new Date('2026-02-05').toISOString(),
            briefDeadline: new Date('2025-12-15').toISOString(),
            presentationDeadline: new Date('2026-01-19').toISOString(),
            briefStatus: 'Çalışılıyor',
            designStatus: 'Bekliyor',
            socialMediaManager: 'TUĞÇE',
            designer: 'Ali',
            calendarUrl: null,
        },
        {
            brandName: 'Dental Platinum',
            currentPlanEndDate: new Date('2026-02-05').toISOString(),
            newPlanStartDate: new Date('2026-02-07').toISOString(),
            briefDeadline: new Date('2025-12-15').toISOString(),
            presentationDeadline: new Date('2026-01-22').toISOString(),
            briefStatus: 'Tamamlandı',
            designStatus: 'Bekliyor',
            socialMediaManager: 'TUĞÇE',
            designer: 'İbrahim Alp',
            calendarUrl: 'https://docs.google.com/presentation/d/1YecXW...',
        },
        {
            brandName: 'Terra Mimarlık',
            currentPlanEndDate: new Date('2026-02-04').toISOString(),
            newPlanStartDate: new Date('2026-02-06').toISOString(),
            briefDeadline: new Date('2025-12-15').toISOString(),
            presentationDeadline: new Date('2025-12-26').toISOString(),
            briefStatus: 'Bekliyor',
            designStatus: 'Bekliyor',
            socialMediaManager: 'ECEM',
            designer: 'İbrahim Alp',
            calendarUrl: null,
        },
        {
            brandName: 'Petikom',
            currentPlanEndDate: new Date('2026-02-18').toISOString(),
            newPlanStartDate: new Date('2026-02-20').toISOString(),
            briefDeadline: new Date('2026-01-15').toISOString(),
            presentationDeadline: new Date('2026-01-12').toISOString(),
            briefStatus: 'Çalışılıyor',
            designStatus: 'Bekliyor',
            socialMediaManager: 'TUĞÇE',
            designer: 'Bahar',
            calendarUrl: 'https://docs.google.com/presentation/d/1wEpdU...',
        },
        {
            brandName: 'Gloris',
            currentPlanEndDate: new Date('2026-02-05').toISOString(),
            newPlanStartDate: new Date('2026-02-07').toISOString(),
            briefDeadline: new Date('2026-01-15').toISOString(),
            presentationDeadline: new Date('2026-01-26').toISOString(),
            briefStatus: 'Çalışılıyor',
            designStatus: 'Bekliyor',
            socialMediaManager: 'ECEM',
            designer: 'Bahar',
            calendarUrl: null,
        },
        {
            brandName: 'Miraderm Pharma',
            currentPlanEndDate: null,
            newPlanStartDate: null,
            briefDeadline: new Date('2026-01-15').toISOString(),
            presentationDeadline: null,
            briefStatus: 'Bekliyor',
            designStatus: 'Bekliyor',
            socialMediaManager: 'ECEM',
            designer: 'Bahar',
            calendarUrl: null,
        },
        {
            brandName: 'Barna Çiçekçilik',
            currentPlanEndDate: new Date('2026-02-16').toISOString(),
            newPlanStartDate: new Date('2026-02-18').toISOString(),
            briefDeadline: new Date('2026-02-09').toISOString(),
            presentationDeadline: new Date('2026-01-30').toISOString(),
            briefStatus: 'Tamamlandı',
            designStatus: 'Bekliyor',
            socialMediaManager: 'ECEM',
            designer: 'Ali',
            calendarUrl: null,
        },
        {
            brandName: 'Mentoar',
            currentPlanEndDate: null,
            newPlanStartDate: null,
            briefDeadline: null,
            presentationDeadline: null,
            briefStatus: 'Bekliyor',
            designStatus: 'Bekliyor',
            socialMediaManager: 'ECEM',
            designer: 'İbrahim Alp',
            calendarUrl: null,
        },
        {
            brandName: 'CRMSELL',
            currentPlanEndDate: null,
            newPlanStartDate: null,
            briefDeadline: null,
            presentationDeadline: null,
            briefStatus: 'Bekliyor',
            designStatus: 'Bekliyor',
            socialMediaManager: 'TUĞÇE',
            designer: null,
            calendarUrl: null,
        },
        {
            brandName: 'Beta İnşaat',
            currentPlanEndDate: null,
            newPlanStartDate: null,
            briefDeadline: null,
            presentationDeadline: null,
            briefStatus: 'Tamamlandı',
            designStatus: 'Bekliyor',
            socialMediaManager: 'TUĞÇE',
            designer: null,
            calendarUrl: null,
        },
        {
            brandName: '11 Locations',
            currentPlanEndDate: null,
            newPlanStartDate: null,
            briefDeadline: null,
            presentationDeadline: null,
            briefStatus: 'Tamamlandı',
            designStatus: 'Bekliyor',
            socialMediaManager: 'ECEM',
            designer: 'Ali',
            calendarUrl: null,
        },
    ];
    console.log(`Seeding ${plans.length} plans...`);
    for (const plan of plans) {
        await prisma.socialMediaPlan.create({
            data: {
                ...plan,
                tenantId,
            },
        });
    }
    console.log('Seeding completed.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-social-media-plans.js.map