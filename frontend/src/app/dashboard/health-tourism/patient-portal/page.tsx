"use client";

import { Button } from "@/components/ui/button";
import { Calendar, FileText, MapPin, MessageCircle, ExternalLink, Smartphone } from "lucide-react";
import Link from "next/link";

export default function HealthTourismPatientPortalPreviewPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hasta Portalı Yönetimi</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Hastalarınızın giriş yapıp göreceği mobil uyumlu portalın içeriklerini buradan yönetebilirsiniz.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/portal" target="_blank">
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Portalı Görüntüle
            </Button>
          </Link>
          <Button className="bg-[#00e676] text-black hover:bg-[#00c853]">
            Portala Örnek Link Gönder
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="col-span-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-8 flex items-center justify-between">
          <div className="space-y-4 max-w-lg">
            <h2 className="text-xl font-bold text-emerald-900">Mobil Hasta Deneyimi</h2>
            <p className="text-emerald-700">
              Hastalarınız, kendilerine özel oluşturulan kullanıcı adı ve şifre ile sisteme giriş yaparak;
              seyahat planlarını, operasyon detaylarını, reçetelerini ve transfer bilgilerini tek bir yerden takip edebilirler.
            </p>
            <div className="flex gap-3">
              <Link href="/portal/login" target="_blank">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Giriş Ekranını Test Et
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:block relative h-64 w-32 border-4 border-slate-800 rounded-3xl bg-slate-900 overflow-hidden shadow-2xl">
             <div className="absolute top-0 left-0 right-0 h-6 bg-slate-800 flex justify-center">
                <div className="h-4 w-16 bg-black rounded-b-xl"></div>
             </div>
             <div className="mt-6 p-2 space-y-2 bg-slate-50 h-full">
                <div className="h-8 w-8 rounded-full bg-emerald-200"></div>
                <div className="h-20 bg-white rounded-lg shadow-sm"></div>
                <div className="h-12 bg-white rounded-lg shadow-sm"></div>
                <div className="h-12 bg-white rounded-lg shadow-sm"></div>
             </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold">Timeline (Seyahat Akışı)</h2>
              <p className="text-xs text-muted-foreground">
                Uçuş, karşılama, otel, ameliyat, kontrol ve dönüş adımlarının
                görsel zaman çizelgesi.
              </p>
            </div>
          </div>
          <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
            Tedavi planları modülünden oluşturulan planlar otomatik olarak buraya yansır.
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold">Belgelerim</h2>
              <p className="text-xs text-muted-foreground">
                Tetkik sonuçları, reçeteler ve faturaların tutulduğu dijital dosya alanı.
              </p>
            </div>
          </div>
          <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
            Hasta ile paylaşılan tüm belgeler, güvenli şekilde burada listelenecek.
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-sky-50 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <h2 className="font-semibold">Transfer Bilgisi</h2>
              <p className="text-xs text-muted-foreground">
                Araç plakası, model bilgisi ve mümkünse şoförün canlı konumu.
              </p>
            </div>
          </div>
          <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
            Aktif transfer kaydı olduğunda, hasta bu ekrandan tüm detayları
            canlı olarak takip edebilecek.
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h2 className="font-semibold">Destek Hattı</h2>
              <p className="text-xs text-muted-foreground">
                Hastanın kendi dilinde konuşan danışmana tek tıkla ulaşabileceği
                canlı destek alanı.
              </p>
            </div>
          </div>
          <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
            WhatsApp ve sohbet entegrasyonları tamamlandığında, hasta buradan
            doğrudan danışmanına yazabilecek.
          </div>
        </div>
      </div>
    </div>
  );
}

