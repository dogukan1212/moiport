"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const tenant = await prisma.tenant.findFirst({
        where: { slug: 'ajans-panel' }
    });
    if (!tenant) {
        console.log('Tenant not found. Please run seed-initial.ts first.');
        return;
    }
    const admin = await prisma.user.findFirst({
        where: { email: 'admin@ajans.local' }
    });
    if (!admin) {
        console.log('Admin user not found. Please run seed-initial.ts first.');
        return;
    }
    console.log('Cleaning up existing Instagram data...');
    const instagramUsers = await prisma.user.findMany({
        where: { email: { endsWith: '@instagram.placeholder' } }
    });
    for (const user of instagramUsers) {
        await prisma.chatMembership.deleteMany({
            where: { userId: user.id }
        });
        await prisma.chatMessage.deleteMany({
            where: { userId: user.id }
        });
        await prisma.user.delete({
            where: { id: user.id }
        });
    }
    await prisma.chatRoom.deleteMany({
        where: {
            tenantId: tenant.id,
            platform: 'INSTAGRAM'
        }
    });
    console.log('Creating Instagram Mock Data...');
    const igUser1 = await prisma.user.create({
        data: {
            name: 'Ayşe Yılmaz',
            email: 'ig_ayse@instagram.placeholder',
            password: 'mock',
            role: 'CLIENT',
            tenantId: tenant.id,
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        }
    });
    const dmRoom = await prisma.chatRoom.create({
        data: {
            tenantId: tenant.id,
            name: igUser1.name,
            type: 'DM',
            platform: 'INSTAGRAM',
            externalId: 'ig_dm_1',
            memberships: {
                create: [
                    { userId: igUser1.id, tenantId: tenant.id, role: 'MEMBER' },
                    { userId: admin.id, tenantId: tenant.id, role: 'ADMIN' }
                ]
            }
        }
    });
    await prisma.chatMessage.createMany({
        data: [
            {
                roomId: dmRoom.id,
                tenantId: tenant.id,
                userId: igUser1.id,
                content: 'Merhaba, fiyatlarınız hakkında bilgi alabilir miyim?',
                platform: 'INSTAGRAM',
                status: 'READ',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
            },
            {
                roomId: dmRoom.id,
                tenantId: tenant.id,
                userId: admin.id,
                content: 'Selamlar Ayşe Hanım, tabii ki. Hangi hizmetimizle ilgileniyorsunuz?',
                platform: 'INSTAGRAM',
                status: 'READ',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.9),
            },
            {
                roomId: dmRoom.id,
                tenantId: tenant.id,
                userId: igUser1.id,
                content: 'Sosyal medya yönetimi için aylık paketlerinizi merak ediyorum.',
                platform: 'INSTAGRAM',
                status: 'SENT',
                createdAt: new Date(Date.now() - 1000 * 60 * 5),
            }
        ]
    });
    const igUser2 = await prisma.user.create({
        data: {
            name: 'Mehmet Demir',
            email: 'ig_mehmet@instagram.placeholder',
            password: 'mock',
            role: 'CLIENT',
            tenantId: tenant.id,
            avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
        }
    });
    const postRoom = await prisma.chatRoom.create({
        data: {
            tenantId: tenant.id,
            name: 'Post: Yeni Kampanya Başladı! 🚀',
            type: 'CHANNEL',
            platform: 'INSTAGRAM',
            externalId: 'ig_media_1',
            memberships: {
                create: [
                    { userId: igUser2.id, tenantId: tenant.id, role: 'MEMBER' },
                    { userId: admin.id, tenantId: tenant.id, role: 'ADMIN' }
                ]
            }
        }
    });
    await prisma.chatMessage.createMany({
        data: [
            {
                roomId: postRoom.id,
                tenantId: tenant.id,
                userId: igUser2.id,
                content: 'Harika görünüyor! 🔥 Detayları DM atar mısınız?',
                platform: 'INSTAGRAM',
                status: 'SENT',
                createdAt: new Date(Date.now() - 1000 * 60 * 30),
            }
        ]
    });
    console.log('Instagram Mock Data Created Successfully!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-instagram-mock.js.map