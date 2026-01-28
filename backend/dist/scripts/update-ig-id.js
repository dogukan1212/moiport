"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
async function main() {
    const config = await prisma.facebookConfig.findFirst();
    if (!config || !config.userAccessToken) {
        console.log('Config veya Token bulunamadı.');
        return;
    }
    console.log('Sayfa bilgileri çekiliyor...');
    try {
        const response = await axios_1.default.get('https://graph.facebook.com/v21.0/me/accounts', {
            params: {
                access_token: config.userAccessToken,
                fields: 'id,name,instagram_business_account',
            },
        });
        const pages = response.data.data;
        const connectedPage = pages.find((p) => p.id === config.pageId);
        if (connectedPage && connectedPage.instagram_business_account) {
            const igId = connectedPage.instagram_business_account.id;
            console.log(`Instagram ID bulundu: ${igId}`);
            await prisma.facebookConfig.update({
                where: { id: config.id },
                data: { instagramBusinessAccountId: igId }
            });
            console.log('Veritabanı güncellendi!');
        }
        else {
            console.log('Seçili sayfa için Instagram hesabı bulunamadı.');
            console.log('API Yanıtı:', JSON.stringify(pages, null, 2));
        }
    }
    catch (error) {
        console.error('Hata:', error.response?.data || error.message);
    }
}
main();
//# sourceMappingURL=update-ig-id.js.map