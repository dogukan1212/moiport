"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageCircle, Phone, ChevronDown } from "lucide-react";
import { LandingHeader, LandingFooter } from "@/components/landing-layout";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [topic, setTopic] = useState("demo");
  const [isTopicOpen, setIsTopicOpen] = useState(false);

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
              <span>İletişim</span>
              <span className="text-[10px] text-zinc-300">
                Demo, iş ortaklığı ve destek talepleri
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6"
            >
              MOI Port ekibiyle iletişime geçin
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-zinc-400 text-lg leading-relaxed max-w-3xl"
            >
              Ürün hakkında sorularınız, ajansınıza özel demo talepleriniz veya
              olası iş birlikleri için formu doldurabilir ya da aşağıdaki
              kanallar üzerinden bize doğrudan ulaşabilirsiniz.
            </motion.p>
          </section>

          <section className="mb-16 grid gap-10 lg:grid-cols-2 items-start">
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-300">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">
                      E-posta
                    </div>
                    <div className="text-sm font-semibold text-white">
                      destek@moiport.com
                    </div>
                    <p className="text-[12px] text-zinc-500 mt-1">
                      Teknik destek, ürün soruları ve faturalandırma için.
                    </p>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-300">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">
                      Demo & İş Ortaklığı
                    </div>
                    <p className="text-sm text-zinc-300">
                      Ajansınıza özel demo talep etmek veya ürün ortaklığı
                      konuşmak için formu kullanabilirsiniz.
                    </p>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-300">
                    <Phone size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">
                      Destek Saatleri
                    </div>
                    <div className="text-sm font-semibold text-white">
                      Hafta içi 09:00 - 18:00
                    </div>
                    <p className="text-[12px] text-zinc-500 mt-1">
                      Bu saatler dışında iletilen taleplere ilk mesai
                      gününde dönüş yapıyoruz.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg md:text-xl font-bold text-white">
                İletişim formu
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Formu doldurduğunuzda ekibimiz, talebinize göre en kısa sürede
                sizinle e-posta üzerinden iletişime geçer. Şu an için form
                gönderimi demo amaçlıdır.
              </p>
              {submitted && (
                <div className="mb-2 rounded-xl border border-[#00e676]/30 bg-[#00e676]/10 px-4 py-3 text-[13px] text-[#bdfbd4]">
                  Mesajınız alındı. En kısa sürede sizinle iletişime geçeceğiz.
                </div>
              )}
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
                    Konu
                  </label>
                  <input type="hidden" name="topic" value={topic} />
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTopicOpen((prev) => !prev)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 pr-8 flex items-center justify-between hover:border-[#00e676]/60 transition-colors"
                    >
                      <span>
                        {topic === "demo"
                          ? "Ürün demosu talebi"
                          : topic === "partnership"
                          ? "İş ortaklığı"
                          : topic === "support"
                          ? "Teknik destek"
                          : "Diğer"}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-zinc-400 transition-transform ${
                          isTopicOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isTopicOpen && (
                      <div className="absolute z-20 mt-1 w-full rounded-lg border border-white/10 bg-[#050505] shadow-xl">
                        {[
                          { value: "demo", label: "Ürün demosu talebi" },
                          { value: "partnership", label: "İş ortaklığı" },
                          { value: "support", label: "Teknik destek" },
                          { value: "other", label: "Diğer" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setTopic(option.value);
                              setIsTopicOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm ${
                              topic === option.value
                                ? "bg-white/[0.06] text-zinc-50"
                                : "text-zinc-200 hover:bg-white/[0.04]"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Mesajınız
                  </label>
                  <textarea
                    name="message"
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#00e676]/60 resize-none"
                    placeholder="Kısaca talebinizi ve ajansınızın büyüklüğünü paylaşabilirsiniz."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full md:w-auto rounded-xl bg-[#00e676] text-black px-6 py-2.5 text-sm font-bold hover:scale-[1.02] transition-transform"
                >
                  Mesajı Gönder
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
