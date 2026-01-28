import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function main() {
  const config = await prisma.facebookConfig.findFirst();
  if (!config || !config.accessToken || !config.pageId) {
    console.log('Aktif bir sayfa yapılandırması bulunamadı.');
    return;
  }

  console.log(`Sayfa (${config.pageName} - ${config.pageId}) için abonelik başlatılıyor...`);

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${config.pageId}/subscribed_apps`,
      {
        subscribed_fields: [
          'messages',
          'messaging_postbacks',
          'messaging_optins',
          'message_deliveries',
          'message_reads',
          'feed',
        ],
      },
      {
        params: { access_token: config.accessToken },
      }
    );

    if (response.data.success) {
        console.log('BAŞARILI! Sayfa başarıyla abone edildi.');
        console.log('Artık Instagram/Facebook mesajları sisteme düşecektir.');
    } else {
        console.log('İşlem tamamlandı ama yanıt beklenen gibi değil:', response.data);
    }

  } catch (error: any) {
    console.error('Hata:', error.response?.data || error.message);
  }
}

main();
