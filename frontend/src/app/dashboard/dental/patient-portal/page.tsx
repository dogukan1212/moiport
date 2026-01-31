"use client";

import { Button } from "@/components/ui/button";
import {
  Calendar,
  FileText,
  MapPin,
  MessageCircle,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import Link from "next/link";

export default function DentalPatientPortalPreviewPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Diş Hasta Portalı Yönetimi
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Diş hastalarınızın randevu ve tedavi süreçlerini takip edeceği mobil
            uyumlu portalın deneyimini buradan kurgulayabilirsiniz.
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
        <div className="col-span-2 flex items-center justify-between rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-8">
          <div className="space-y-4 max-w-lg">
            <h2 className="text-xl font-bold text-emerald-900">
              Mobil Diş Hasta Deneyimi
            </h2>
            <p className="text-emerald-700">
              Hastalarınız; randevu tarihlerini, tedavi planlarını, ödemelerini
              ve klinik ile olan iletişim geçmişlerini kendi telefonlarından
              takip edebilir.
            </p>
            <div className="flex gap-3">
              <Link href="/portal/login" target="_blank">
                <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Giriş Ekranını Test Et
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative hidden h-64 w-32 overflow-hidden rounded-3xl border-4 border-slate-800 bg-slate-900 shadow-2xl md:block">
            <div className="flex h-6 items-center justify-center bg-slate-800">
              <div className="h-4 w-16 rounded-b-xl bg-black" />
            </div>
            <div className="mt-6 h-full space-y-2 bg-slate-50 p-2">
              <div className="h-8 w-8 rounded-full bg-emerald-200" />
              <div className="h-20 rounded-lg bg-white shadow-sm" />
              <div className="h-12 rounded-lg bg-white shadow-sm" />
              <div className="h-12 rounded-lg bg-white shadow-sm" />
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold">Randevu & Tedavi Akışı</h2>
              <p className="text-xs text-muted-foreground">
                Muayene, tedavi ve kontrol randevularının hastaya gösterilen
                zaman çizelgesi.
              </p>
            </div>
          </div>
          <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
            Klinik içinden oluşturulan randevu ve tedavi planları, diş hastası
            portalındaki timeline alanına otomatik yansır.
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold">Belgelerim</h2>
              <p className="text-xs text-muted-foreground">
                Radyografi görüntüleri, onam formları, reçete PDF&apos;leri ve
                ödeme dekontlarının listelendiği alan.
              </p>
            </div>
          </div>
          <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
            Klinikle paylaşılan tüm dosyalar, güvenli şekilde bu bölümde
            listelenir ve hasta tarafından görüntülenebilir.
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50">
              <MapPin className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <h2 className="font-semibold">Klinik Bilgileri</h2>
              <p className="text-xs text-muted-foreground">
                Konum, iletişim bilgileri ve kliniğe ulaşım için gerekli
                özet bilgiler.
              </p>
            </div>
          </div>
          <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
            Hasta; adres, konum linki ve çalışma saatleri gibi bilgilere bu
            ekrandan hızlıca erişebilir.
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50">
              <MessageCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h2 className="font-semibold">Destek & İletişim</h2>
              <p className="text-xs text-muted-foreground">
                Hasta ilişkileri ekibine tek tıkla ulaşılabilen mesajlaşma /
                destek alanı.
              </p>
            </div>
          </div>
          <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
            WhatsApp ve sohbet entegrasyonları eklendiğinde, hastalar bu
            bölümden kliniğe doğrudan mesaj gönderebilecek.
          </div>
        </div>
      </div>
    </div>
  );
}

