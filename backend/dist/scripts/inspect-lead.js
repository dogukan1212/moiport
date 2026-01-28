"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const leads = await prisma.lead.findMany({
        where: {
            name: { contains: 'Ahmet' }
        },
        include: {
            pipeline: true
        }
    });
    console.log('Found leads:', JSON.stringify(leads, null, 2));
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=inspect-lead.js.map