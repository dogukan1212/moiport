"use client";

import { motion } from "framer-motion";
import { LandingHeader, LandingFooter } from "@/components/landing-layout";

const updates = [
  {
    version: "v2.4",
    date: "Ocak 2026",
    label: "Yeni",
    color: "text-[#00e676]",
    items: [
      "Görevler sayfasında 2x2 KPI yerleşimi ve mobil optimizasyon tamamlandı.",
      "Finans modülü için gelişmiş özet kartları ve AI tahmin bloğu eklendi.",
      "Landing alt sayfalarının (Projeler, Görevler, Finans vb.) mobil uyumluluğu iyileştirildi.",
    ],
  },
  {
    version: "v2.3",
    date: "Kasım 2025",
    label: "İyileştirme",
    color: "text-blue-400",
    items: [
      "CRM board ve WhatsApp entegrasyonu için daha akıcı gerçek zamanlı güncellemeler.",
      "Finans tablolarında performans iyileştirmeleri ve daha net durum etiketleri.",
      "Dashboard’da proje ve görev özet kartlarının görsel yenilemesi.",
    ],
  },
  {
    version: "v2.2",
    date: "Ağustos 2025",
    label: "Özellik",
    color: "text-purple-400",
    items: [
      "AI Teklifler modülü için yeni şablon yapısı ve çoklu dil desteği.",
      "AI İçerik tarafında blog, sosyal medya ve kampanya metinleri için hazır preset’ler.",
      "Müşteriler sayfasında gelişmiş filtreleme ve segment bazlı listeleme.",
    ],
  },
  {
    version: "v2.1",
    date: "Nisan 2025",
    label: "İyileştirme",
    color: "text-orange-400",
    items: [
      "Görev kartlarında daha okunabilir etiketler ve durum rozetleri.",
      "Takvim görünümünde haftalık ve aylık bakış arasında hızlı geçiş.",
      "Kullanıcı deneyimini iyileştiren çok sayıda küçük arayüz düzeltmesi.",
    ],
  },
  {
    version: "v2.0",
    date: "Ocak 2025",
    label: "Dönüm Noktası",
    color: "text-[#00e676]",
    items: [
      "MOI Port v2.0 ile yeni landing deneyimi ve modern arayüz tasarımı.",
      "Projeler, Görevler, Finans ve CRM modüllerinin tek bir Agency OS altında birleşmesi.",
      "Ajanslara özel rol ve yetki kurgusu ile çoklu müşteri yönetimi.",
    ],
  },
  {
    version: "v1.x",
    date: "2024",
    label: "Temel",
    color: "text-zinc-400",
    items: [
      "İlk MOI Port sürümleri: proje, görev ve müşteri takibi için çekirdek özellikler.",
      "Temel finans görünümü ve basit raporlama panelleri.",
      "Ajans operasyonlarını tek ekranda toplama fikrinin hayata geçmesi.",
    ],
  },
];

export default function UpdatesPage() {
  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#00e676] selection:text-black">
      <LandingHeader />
      <main className="pt-32 pb-20 lg:pt-40">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="mb-10 lg:mb-14">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e676]/10 text-[#00e676] text-xs font-bold mb-4"
            >
              <span>Ürün Güncellemeleri</span>
              <span className="text-[10px] text-zinc-300">
                Son 24 ayda yayınlanan yenilikler
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4"
            >
              Yenilikler & Sürüm Notları
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-zinc-400 text-lg leading-relaxed"
            >
              Son iki yılda MOI Port&apos;u onlarca ajansla birlikte büyüttük.
              Aşağıda, ürünün nasıl evrildiğini ve hangi alanlarda sürekli
              yatırım yaptığımızı görebilirsiniz.
            </motion.p>
          </div>

          <section className="mb-14 grid gap-4 md:grid-cols-3">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                Odak
              </div>
              <div className="text-sm font-bold text-white mb-1">
                Ajans verimliliği
              </div>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                Proje, görev ve finansı aynı ekosistemde toplayan bir Agency OS
                inşa ediyoruz.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                Zaman Çizelgesi
              </div>
              <div className="text-sm font-bold text-white mb-1">
                2024 → 2026
              </div>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                Çekirdek takibin ötesine geçip, AI destekli otomasyon ve
                finansal görünürlüğe odaklandık.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#00e676]/10 border border-[#00e676]/30">
              <div className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest mb-1">
                Son Sürüm
              </div>
              <div className="text-sm font-bold text-white mb-1">
                v2.4 • Ocak 2026
              </div>
              <p className="text-[12px] text-zinc-100 leading-relaxed">
                Mobil uyumluluk, görev ve finans panelleri için büyük bir
                iyileştirme paketi.
              </p>
            </div>
          </section>

          <section className="space-y-8">
            {updates.map((release, index) => (
              <motion.div
                key={release.version}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-6 border-l border-white/10"
              >
                <div className="absolute -left-[5px] top-1 size-2 rounded-full bg-[#00e676]" />
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    {release.date}
                  </span>
                  <span className="text-xs font-bold text-zinc-600">•</span>
                  <span className="text-xs font-bold text-zinc-400">
                    {release.version}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${release.color}`}
                  >
                    {release.label}
                  </span>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {release.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-sm text-zinc-300 leading-relaxed"
                    >
                      <span className="mt-[6px] block h-[3px] w-[3px] rounded-full bg-zinc-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

