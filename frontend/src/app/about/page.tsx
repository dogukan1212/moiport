"use client";

import { motion } from "framer-motion";
import { LandingHeader, LandingFooter } from "@/components/landing-layout";

export default function AboutPage() {
  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#00e676] selection:text-black">
      <LandingHeader />
      <main className="pt-32 pb-20 lg:pt-40">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <section className="mb-16 lg:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e676]/10 text-[#00e676] text-xs font-bold mb-4"
            >
              <span>MOI Port Hakkında</span>
              <span className="text-[10px] text-zinc-300">
                Ajanslar için inşa edilen Agency OS
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6"
            >
              Ajansların arka plandaki işletim sistemi
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-zinc-400 text-lg leading-relaxed max-w-3xl"
            >
              MOI Port, dağınık araçlar ve Excel dosyaları arasında sıkışan
              ajanslar için tasarlandı. Operasyon, finans ve CRM&apos;i tek
              bir ekosistemde toplayarak ekibinizin odağını yeniden yaratıcı
              işe çekiyoruz.
            </motion.p>
          </section>

          <section className="mb-16 grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Neden MOI Port?
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Ajans dünyasında her gün onlarca proje, yüzlerce görev ve
                karmaşık müşteri ilişkileri yönetiliyor. Çoğu ekip, işi
                yürütmek için birden fazla parçalı araca bel bağlıyor.
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Biz, ajansların gerçekten kullandığı iş akışlarını referans
                alarak, tek bir Agency OS etrafında birleşen bir platform
                tasarladık. Böylece yönetim paneli değil, iş ortağı gibi
                çalışan bir ürün ortaya çıktı.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                  Odak
                </div>
                <div className="text-sm font-bold text-white mb-1">
                  Ajans verimliliği
                </div>
                <p className="text-[12px] text-zinc-500 leading-relaxed">
                  Operasyon, finans ve CRM verilerini aynı ekranda
                  birleştiriyoruz.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                  Yaklaşım
                </div>
                <div className="text-sm font-bold text-white mb-1">
                  Ürün + Ekip
                </div>
                <p className="text-[12px] text-zinc-500 leading-relaxed">
                  Sadece yazılım değil, ajansın çalışma şeklini dönüştüren bir
                  operasyon modeli sunuyoruz.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                  Teknoloji
                </div>
                <div className="text-sm font-bold text-white mb-1">
                  AI destekli
                </div>
                <p className="text-[12px] text-zinc-500 leading-relaxed">
                  Görev önceliklendirme, finansal projeksiyon ve teklif üretimi
                  için yapay zeka kullanıyoruz.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                  İşbirliği
                </div>
                <div className="text-sm font-bold text-white mb-1">
                  Ajanslarla birlikte
                </div>
                <p className="text-[12px] text-zinc-500 leading-relaxed">
                  Yol haritamızı gerçek ajansların günlük problemlerine göre
                  şekillendiriyoruz.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-16 grid gap-10 lg:grid-cols-2 items-start">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
                Vizyonumuz
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                Ajanslar için &quot;arka planda her şeyi organize eden, ön
                planda görünmeyen ama her zaman çalışan&quot; bir işletim
                sistemi olmak istiyoruz. Ekipler, hangi görevin nerede
                tutulduğunu değil, hangi işin müşteriye en fazla değer
                kattığını konuşsun.
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Bunu yaparken de esnek kalmayı, her ajansın kendine ait çalışma
                biçimini bozmadan süreçleri dijitalleştirmeyi önemsiyoruz.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                Ürün yolculuğu
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                    2024
                  </div>
                  <div className="text-sm font-bold text-white mb-1">
                    Çekirdek ürün
                  </div>
                  <p className="text-[12px] text-zinc-500 leading-relaxed">
                    Proje, görev ve müşteri takibi için ilk MOI Port sürümleri
                    ortaya çıktı.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                    2025
                  </div>
                  <div className="text-sm font-bold text-white mb-1">
                    Agency OS yaklaşımı
                  </div>
                  <p className="text-[12px] text-zinc-500 leading-relaxed">
                    Finans, CRM ve AI modülleri eklenerek ajansların tüm
                    operasyonu tek yerden yönetebilmesi sağlandı.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                    2026 ve sonrası
                  </div>
                  <div className="text-sm font-bold text-white mb-1">
                    Otomasyon ve öngörü
                  </div>
                  <p className="text-[12px] text-zinc-500 leading-relaxed">
                    Hedefimiz; ajanslar için tekrarlayan işleri otomatize eden,
                    riskleri önceden haber veren bir “arka ofis asistanı”
                    olmak.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-white/5 pt-10 mt-10">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
              Çalışma prensiplerimiz
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                  Basitlik
                </div>
                <p className="text-[12px] text-zinc-400 leading-relaxed">
                  Ajansların gerçekten kullandığı iş akışlarını sade bir
                  arayüze taşıyoruz.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                  Şeffaflık
                </div>
                <p className="text-[12px] text-zinc-400 leading-relaxed">
                  Finansal ve operasyonel görünürlüğü herkes için anlaşılır
                  hale getiriyoruz.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                  Süreklilik
                </div>
                <p className="text-[12px] text-zinc-400 leading-relaxed">
                  Ürünü bir kez kurup bırakmak yerine, ajanslarla birlikte
                  yaşayan bir sistem olarak geliştiriyoruz.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

