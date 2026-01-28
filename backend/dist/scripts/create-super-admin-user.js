"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
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
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.log("Hiç ajans yok, önce ajans oluşturulmalı.");
        return;
    }
    const superEmail = 'super@saas.com';
    const superPassword = 'saas123';
    const hashedPassword = await bcrypt.hash(superPassword, 10);
    const existingSuper = await prisma.user.findUnique({
        where: { email: superEmail }
    });
    if (existingSuper) {
        await prisma.user.update({
            where: { id: existingSuper.id },
            data: {
                role: 'SUPER_ADMIN',
                password: hashedPassword
            }
        });
        console.log(`Mevcut kullanıcı güncellendi: ${superEmail}`);
    }
    else {
        await prisma.user.create({
            data: {
                email: superEmail,
                password: hashedPassword,
                name: 'SaaS Super Admin',
                role: 'SUPER_ADMIN',
                tenantId: tenant.id,
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
//# sourceMappingURL=create-super-admin-user.js.map