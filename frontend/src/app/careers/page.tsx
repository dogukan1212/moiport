"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { LandingHeader, LandingFooter } from "@/components/landing-layout";

export default function CareersPage() {
  const [submitted, setSubmitted] = useState(false);

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
              <span>MOI Port&apos;ta Çalışmak</span>
              <span className="text-[10px] text-zinc-300">
                Uzaktan, ürün odaklı, ajanslarla iç içe
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6"
            >
              Birlikte ajansların çalışma şeklini değiştirelim
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-zinc-400 text-lg leading-relaxed max-w-3xl"
            >
              MOI Port&apos;ta ürün geliştirme, tasarım ve müşteri başarısı
              ekipleri tek hedef etrafında birleşiyor: ajansların işini her
              sprintte biraz daha kolaylaştırmak.
            </motion.p>
          </section>

          <section className="mb-16 grid gap-10 lg:grid-cols-2 items-start">
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Nasıl bir ekibiz?
              </h2>
              <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
                <p>
                  Küçük ama ürün odaklı bir ekibiz. Hızlı prototip çıkarıp,
                  gerçek ajanslardan gelen geri bildirimlerle ürünü sürekli
                  iterasyonluyoruz.
                </p>
                <p>
                  Çalışma şeklimiz tamamen şeffaf; herkes roadmap&apos;i,
                  metrikleri ve müşteri geri bildirimlerini görebiliyor. Her
                  ekip üyesi ürün kararlarına doğrudan etki ediyor.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                    Çalışma Modeli
                  </div>
                  <p className="text-[12px] text-zinc-400 leading-relaxed">
                    Ağırlıklı uzaktan, esnek çalışma saatleri ve odak blokları.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                    Kültür
                  </div>
                  <p className="text-[12px] text-zinc-400 leading-relaxed">
                    Az toplantı, net beklenti, yüksek sorumluluk ve düşük ego.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                    Etki Alanı
                  </div>
                  <p className="text-[12px] text-zinc-400 leading-relaxed">
                    Yaptığınız iş doğrudan ajans ekiplerinin günlük rutinine
                    yansıyor.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mb-1">
                    Gelişim
                  </div>
                  <p className="text-[12px] text-zinc-400 leading-relaxed">
                    Ürün, tasarım ve teknik taraflarda derinleşmeniz için alan
                    tanıyoruz.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Örnek rol alanları
              </h2>
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-sm font-bold text-white mb-1">
                    Ürün Odaklı Full-Stack Geliştirici
                  </div>
                  <p className="text-[12px] text-zinc-400 leading-relaxed">
                    Next.js, NestJS ve modern frontend pratikleriyle, ajans
                    iş akışlarını doğrudan etkileyen özellikler geliştirirsiniz.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-sm font-bold text-white mb-1">
                    Ürün Tasarımcısı (Product Designer)
                  </div>
                  <p className="text-[12px] text-zinc-400 leading-relaxed">
                    Karmaşık iş akışlarını basit ekranlara indirgeyen deneyimler
                    tasarlarsınız.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-sm font-bold text-white mb-1">
                    Müşteri Başarı Uzmanı
                  </div>
                  <p className="text-[12px] text-zinc-400 leading-relaxed">
                    Ajanslarla birebir çalışarak ürün uyumunu ve memnuniyetini
                    takip edersiniz.
                  </p>
                </div>
              </div>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                Listeye takılmayın; ajans ekosistemini iyi tanıyor ve bu dünyayı
                daha iyi hale getirmek istiyorsanız, başvuru formunu doldurun.
              </p>
            </div>
          </section>

          <section className="border-t border-white/5 pt-10 mt-10">
            <div className="grid gap-10 lg:grid-cols-2 items-start">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
                  Genel başvuru formu
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                  Şu anda belirli bir ilan aramıyoruz, ancak doğru kişiyle
                  tanışmayı her zaman önemsiyoruz. Aşağıdaki formu doldurun;
                  profiliniz uygun olduğunda sizinle iletişime geçelim.
                </p>
                {submitted && (
                  <div className="mb-4 rounded-xl border border-[#00e676]/30 bg-[#00e676]/10 px-4 py-3 text-[13px] text-[#bdfbd4]">
                    Başvurunuz alındı. En kısa sürede dönüş yapmaya çalışacağız.
                  </div>
                )}
              </div>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Ad Soyad
                  </label>
                  <input
                    name="name"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#00e676]/60"
                    placeholder="Örn. Ayşe Yılmaz"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    E-posta
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#00e676]/60"
                    placeholder="ornek@ajans.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Pozisyon Tercihi
                  </label>
                  <input type="hidden" name="role" value="fullstack" />
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 flex items-center justify-between hover:border-[#00e676]/60 transition-colors"
                    >
                      <span>Full-Stack Geliştirici</span>
                      <ChevronDown size={16} className="text-zinc-400" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Kısaca Kendini Anlat
                  </label>
                  <textarea
                    name="about"
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#00e676]/60 resize-none"
                    placeholder="Ekibimize neler katabileceğini birkaç cümleyle anlat."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    CV / Portfolyo Linki
                  </label>
                  <input
                    name="link"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#00e676]/60"
                    placeholder="Örn. LinkedIn, GitHub veya portfolyo adresi"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full md:w-auto rounded-xl bg-[#00e676] text-black px-6 py-2.5 text-sm font-bold hover:scale-[1.02] transition-transform"
                >
                  Başvuruyu Gönder
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
