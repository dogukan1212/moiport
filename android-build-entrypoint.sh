#!/bin/bash
set -e

echo "🚀 Build süreci başlıyor..."

# 1. Frontend Build
echo "📦 Next.js projesi derleniyor..."
cd /app/frontend
npm run build

# 2. Capacitor Sync
echo "🔄 Capacitor senkronizasyonu yapılıyor..."
# Android klasörü yoksa ekle, varsa sync et
if [ ! -d "android" ]; then
    npx cap add android
else
    npx cap sync android
fi

# 3. Google Services JSON (Dummy) Oluşturma
# Eğer gerçek dosya yoksa dummy oluştur
if [ ! -f "android/app/google-services.json" ]; then
    echo "⚠️ google-services.json bulunamadı, dummy dosya oluşturuluyor..."
    echo '{
      "project_info": {
        "project_number": "000000000000",
        "project_id": "mock-project-id",
        "storage_bucket": "mock-project-id.appspot.com"
      },
      "client": [
        {
          "client_info": {
            "mobilesdk_app_id": "1:000000000000:android:0000000000000000",
            "android_client_info": {
              "package_name": "com.kolayentegrasyon.app"
            }
          },
          "oauth_client": [],
          "api_key": [
            {
              "current_key": "mock-api-key"
            }
          ],
          "services": {
            "appinvite_service": {
              "other_platform_oauth_client": []
            }
          }
        }
      ],
      "configuration_version": "1"
    }' > android/app/google-services.json
fi

# 4. Android APK Build
echo "📱 Android APK derleniyor..."
cd android
chmod +x gradlew
./gradlew assembleDebug

echo "✅ Build tamamlandı!"
echo "📂 APK dosyası: frontend/android/app/build/outputs/apk/debug/app-debug.apk"

# Artifact'i dışarı aktarmak için kopyala (Docker volume mount ile alınacak)
mkdir -p /app/output
cp app/build/outputs/apk/debug/app-debug.apk /app/output/app-debug.apk
echo "🎉 APK dosyası /app/output klasörüne kopyalandı."
