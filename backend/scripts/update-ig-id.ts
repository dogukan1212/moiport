import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function main() {
  const config = await prisma.facebookConfig.findFirst();
  if (!config || !config.userAccessToken) {
    console.log('Config veya Token bulunamadı.');
    return;
  }

  console.log('Sayfa bilgileri çekiliyor...');
  try {
    const response = await axios.get(
      'https://graph.facebook.com/v21.0/me/accounts',
      {
        params: {
          access_token: config.userAccessToken,
          fields: 'id,name,instagram_business_account',
        },
      }
    );

    const pages = response.data.data;
    const connectedPage = pages.find((p: any) => p.id === config.pageId);

    if (connectedPage && connectedPage.instagram_business_account) {
      const igId = connectedPage.instagram_business_account.id;
      console.log(`Instagram ID bulundu: ${igId}`);

      await prisma.facebookConfig.update({
        where: { id: config.id },
        data: { instagramBusinessAccountId: igId }
      });

      console.log('Veritabanı güncellendi!');
    } else {
      console.log('Seçili sayfa için Instagram hesabı bulunamadı.');
      console.log('API Yanıtı:', JSON.stringify(pages, null, 2));
    }

  } catch (error: any) {
    console.error('Hata:', error.response?.data || error.message);
  }
}

main();
