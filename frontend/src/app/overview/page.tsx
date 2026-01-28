"use client";

import Link from "next/link";
import {
  Infinity,
  Check,
  ArrowRight,
  Layers,
  Zap,
  Shield,
  MousePointer2,
  LayoutDashboard,
  Target,
  Users,
  Wallet,
  Briefcase,
  MessageSquare,
  Sparkles,
  FileText,
  Settings,
  CreditCard,
  BarChart3,
  TrendingUp,
  Clock,
  MessageCircle,
  Plus,
  Instagram,
  Globe,
  Headphones,
  Cpu,
  BarChart,
  ShieldCheck,
  ZapIcon,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  LandingHeader,
  LandingFooter,
  primaryColor,
} from "@/components/landing-layout";

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
    >
      <div className={`size-12 rounded-xl flex items-center justify-center mb-6 text-white`} style={{ backgroundColor: `${color}20`, color: color }}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#00e676] transition-colors">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

export default function Overview() {
  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#00e676] selection:text-black">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] blur-[120px] rounded-full opacity-10 pointer-events-none bg-[#00e676]"></div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e676]/10 text-[#00e676] text-xs font-bold mb-6"
          >
            <Globe size={14} />
            <span>TÜM ÖZELLİKLER VE ARAÇLAR</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8"
          >
            Ajansınızı <span className="text-[#00e676]">Geleceğe</span> Taşıyın
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto text-lg text-zinc-400 mb-12"
          >
            MOI Port, bir ajansın ihtiyaç duyabileceği her şeyi tek bir çatı altında birleştirir. 
            CRM'den AI asistanına, finans yönetiminden ekip takibine kadar her şey parmaklarınızın ucunda.
          </motion.p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<MessageSquare size={24} />}
              title="Omnichannel CRM"
              description="WhatsApp, Instagram ve Messenger mesajlarını tek bir panelde toplayın. Müşteri temsilcileriniz tüm kanallardan gelen talepleri tek bir yerden yanıtlasın."
              color="#00e676"
            />
            <FeatureCard 
              icon={<Target size={24} />}
              title="Pipeline & Lead Takibi"
              description="Potansiyel müşterilerinizi satış hunisinde (pipeline) sürükle-bırak ile yönetin. Hangi aşamada kaç aday olduğunu ve satış ihtimallerini anlık görün."
              color="#3b82f6"
            />
            <FeatureCard 
              icon={<Sparkles size={24} />}
              title="MOI PORT AI Asistanı"
              description="Yapay zeka ile saniyeler içinde sosyal medya içerikleri, blog yazıları ve profesyonel teklifler hazırlayın. Yaratıcı süreçlerinizi 10 kat hızlandırın."
              color="#a855f7"
            />
            <FeatureCard 
              icon={<Briefcase size={24} />}
              title="Proje & Görev Yönetimi"
              description="Projelerinizi alt görevlere bölün, ekip arkadaşlarınıza atayın ve termin sürelerini takip edin. Kanban, liste ve takvim görünümleriyle iş akışınızı kontrol edin."
              color="#f97316"
            />
            <FeatureCard 
              icon={<Wallet size={24} />}
              title="Finans & Fatura"
              description="Gelir-gider takibi yapın, müşterilerinize otomatik faturalar gönderin ve ödeme durumlarını izleyin. Ajansınızın finansal sağlığını anlık raporlarla takip edin."
              color="#10b981"
            />
            <FeatureCard 
              icon={<Users size={24} />}
              title="İK & Ekip Yönetimi"
              description="Çalışanlarınızın sözleşmelerini, izinlerini ve maaş bordrolarını yönetin. Ekibinizin performansını ve iş yükünü tek bir yerden izleyin."
              color="#ef4444"
            />
            <FeatureCard 
              icon={<LayoutDashboard size={24} />}
              title="Müşteri Paneli"
              description="Müşterileriniz için özel bir panel sağlayın. Proje ilerlemelerini görsünler, dosyaları paylaşsınlar ve sizinle güvenli bir şekilde iletişim kursunlar."
              color="#6366f1"
            />
            <FeatureCard 
              icon={<BarChart3 size={24} />}
              title="Gelişmiş Analitik"
              description="Satış, finans ve ekip performansı hakkında derinlemesine raporlar alın. Veriye dayalı kararlar vererek ajansınızı büyütün."
              color="#ec4899"
            />
            <FeatureCard 
              icon={<ShieldCheck size={24} />}
              title="Güvenlik & Yedekleme"
              description="Tüm verileriniz en üst düzey güvenlik standartlarıyla korunur ve düzenli olarak yedeklenir. KVKK uyumlu altyapımızla verileriniz güvende."
              color="#06b6d4"
            />
          </div>
        </div>
      </section>

      {/* Deep Dive Sections */}
      <section className="py-20 lg:py-40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-32">
          {/* CRM Detail */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Müşteri İlişkilerinde <br/><span className="text-[#00e676]">Sınırları Kaldırın</span></h2>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                Geleneksel CRM sistemlerinin ötesine geçin. WhatsApp ve Instagram entegrasyonu sayesinde müşterilerinizin olduğu her yerdesiniz. 
                Sürükle-bırak pipeline yönetimi ile satış süreçlerinizi optimize edin.
              </p>
              <ul className="space-y-4">
                {[
                  "Resmi WhatsApp Business API entegrasyonu",
                  "Instagram DM ve Yorum yönetimi",
                  "Özelleştirilebilir satış aşamaları",
                  "Aday müşteri (Lead) puanlama sistemi"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-300">
                    <div className="size-5 rounded-full bg-[#00e676]/20 flex items-center justify-center text-[#00e676]">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 p-8 aspect-video flex items-center justify-center relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00e676]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <Target size={120} className="text-[#00e676] opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">CRM Yönetimi</div>
                  <div className="text-[#00e676] font-medium tracking-widest uppercase text-xs">Pipeline Visualization</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Detail */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 bg-white/5 rounded-2xl border border-white/10 p-8 aspect-video flex items-center justify-center relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <Sparkles size={120} className="text-purple-500 opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">AI Engine</div>
                  <div className="text-purple-500 font-medium tracking-widest uppercase text-xs">Generative Intelligence</div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Yapay Zeka ile <br/><span className="text-purple-500">Üretkenliği Artırın</span></h2>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                İçerik üretim süreçlerini dert etmeyin. AI asistanımız sizin için en etkili başlıkları, 
                sosyal medya metinlerini ve hatta karmaşık iş tekliflerini saniyeler içinde hazırlar.
              </p>
              <ul className="space-y-4">
                {[
                  "Çok dilli içerik üretimi",
                  "Sektöre özel teklif şablonları",
                  "Görsel içerik planlama önerileri",
                  "AI destekli müşteri yanıt asistanı"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-300">
                    <div className="size-5 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#00e676] to-[#00b25a] rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
              <ZapIcon size={200} className="text-white" />
            </div>
            
            <div className="relative z-10 text-center lg:text-left max-w-3xl">
              <h2 className="text-3xl md:text-5xl font-extrabold text-black mb-4 leading-tight">
                Ajansınızı Bugün Dijitalleştirin
              </h2>
              <p className="text-black/80 text-lg font-medium">
                Binlerce ajansın kullandığı MOI Port ile siz de verimliliğinizi artırın. 
                Tüm araçlar, tek panel, sınırsız güç.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row gap-4 shrink-0">
              <Link href="/register" className="bg-black text-white px-8 py-4 rounded-full font-bold text-base hover:scale-105 transition-transform text-center">
                Ücretsiz Başlayın
              </Link>
              <Link href="/#pricing" className="bg-white/20 backdrop-blur-md text-black px-8 py-4 rounded-full font-bold text-base hover:bg-white/30 transition-all text-center">
                Planları İncele
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
