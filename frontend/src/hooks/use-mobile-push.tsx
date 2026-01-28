import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
// import api from '@/lib/api';

export const useMobilePush = (userId?: string) => {
  const addListeners = async () => {
    await PushNotifications.removeAllListeners();

    await PushNotifications.addListener('registration', async token => {
      console.info('Push registration success, token: ' + token.value);
      // TODO: Bu token'ı backend'e gönderip kullanıcı ile eşleştirmeniz gerekir.
      // await api.post('/notifications/device-token', { token: token.value, platform: Capacitor.getPlatform() });
    });

    await PushNotifications.addListener('registrationError', err => {
      console.error('Push registration error: ', err.error);
    });

    await PushNotifications.addListener('pushNotificationReceived', notification => {
      // Uygulama açıkken bildirim gelirse toast göster
      toast(notification.title || 'Bildirim', {
        description: notification.body,
      });
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
      // Bildirime tıklandığında yapılacak işlem (örn: sayfaya git)
      console.log('Notification action performed', notification);
    });
  };

  const registerNotifications = async () => {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive === 'granted') {
      await PushNotifications.register();
    }
  };

  useEffect(() => {
    // Sadece mobil uygulamada (iOS/Android) ve kullanıcı giriş yapmışsa çalışır
    if (Capacitor.isNativePlatform() && userId) {
      const initPush = async () => {
        await addListeners();
        await registerNotifications();
      };
      initPush();
    }
  }, [userId]);
};
