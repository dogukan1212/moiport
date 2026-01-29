import type { CapacitorConfig } from '@capacitor/cli';

const isCI = process.env.CI === 'true';

const config: CapacitorConfig = {
  appId: 'com.kolayentegrasyon.app',
  appName: 'Kolayentegrasyon Paneli',
  webDir: 'out',
  server: isCI ? {
    androidScheme: 'https',
    cleartext: true
  } : {
    // Buraya canlı sitenizin adresini yazın (örn: https://panel.kolayentegrasyon.com)
    // Eğer yerel test yapacaksanız bilgisayarınızın IP'sini yazın (örn: http://192.168.1.5:3000)
    url: 'http://localhost:3000', 
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
