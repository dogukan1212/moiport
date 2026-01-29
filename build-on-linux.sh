#!/bin/bash

# Bu scripti Linux sunucunuzda projenin ana dizininde çalıştırın.
# Gereksinimler: Docker

echo "🐳 Android Build Docker imajı hazırlanıyor..."
docker build -t ajans-android-builder -f Dockerfile.android .

echo "🚀 Build işlemi başlatılıyor..."
# Çıktı klasörü oluştur
mkdir -p output

# Docker konteynerini çalıştır ve çıktıyı output klasörüne eşle
docker run --rm -v "$(pwd)/output:/app/output" ajans-android-builder

echo "✅ İşlem tamamlandı. APK dosyanız 'output' klasöründe: output/app-debug.apk"
