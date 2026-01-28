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
    if (!config || !config.accessToken || !config.pageId) {
        console.log('Aktif bir sayfa yapılandırması bulunamadı.');
        return;
    }
    console.log(`Sayfa (${config.pageName} - ${config.pageId}) için abonelik başlatılıyor...`);
    try {
        const response = await axios_1.default.post(`https://graph.facebook.com/v21.0/${config.pageId}/subscribed_apps`, {
            subscribed_fields: [
                'messages',
                'messaging_postbacks',
                'messaging_optins',
                'message_deliveries',
                'message_reads',
                'feed',
            ],
        }, {
            params: { access_token: config.accessToken },
        });
        if (response.data.success) {
            console.log('BAŞARILI! Sayfa başarıyla abone edildi.');
            console.log('Artık Instagram/Facebook mesajları sisteme düşecektir.');
        }
        else {
            console.log('İşlem tamamlandı ama yanıt beklenen gibi değil:', response.data);
        }
    }
    catch (error) {
        console.error('Hata:', error.response?.data || error.message);
    }
}
main();
//# sourceMappingURL=subscribe-page.js.map