import axios from 'axios';

const IG_BUSINESS_ID = '17841454594155308'; // Az önce bulduğumuz ID
const SENDER_ID = '1234567890'; // Fake Sender

const payload = {
  object: 'instagram',
  entry: [
    {
      id: IG_BUSINESS_ID,
      messaging: [
        {
          sender: { id: SENDER_ID },
          recipient: { id: IG_BUSINESS_ID },
          timestamp: Date.now(),
          message: { 
            mid: `mid.${Date.now()}`,
            text: "Merhaba, bu bir test mesajıdır! 🚀" 
          }
        }
      ]
    }
  ]
};

async function main() {
  try {
    console.log('Webhook gönderiliyor...');
    const res = await axios.post('http://localhost:3001/webhooks/meta', payload);
    console.log('Başarılı:', res.data);
  } catch (error: any) {
    console.error('Hata:', error.response?.data || error.message);
  }
}

main();
