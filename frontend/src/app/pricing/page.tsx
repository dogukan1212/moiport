"use client";

import { LandingHeader, LandingFooter } from "@/components/landing-layout";
import { motion } from "framer-motion";
import {
  Check,
  Zap,
  Shield,
  CreditCard,
  ArrowRight,
  LayoutDashboard,
  Users,
  Briefcase,
  MessageSquare,
  Wallet,
  Settings,
  Target,
  FileText,
  Clock,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#00e676] selection:text-black">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[#00e676]/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e676]/10 text-[#00e676] text-xs font-bold mb-6"
          >
            <CreditCard size={14} />
            <span>FİYATLANDIRMA</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6"
          >
            Sizinle Birlikte Büyüyen <br />
            <span className="text-[#00e676]">Esnek Planlar</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10"
          >
            Gizli ücret yok, sürpriz yok. İhtiyacınıza uygun paketi seçin ve hemen başlayın. 14 gün ücretsiz deneyin.
          </motion.p>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-16">
            <div className="bg-white/5 p-1 rounded-full inline-flex border border-white/10 relative">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                  !isAnnual ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                  isAnnual ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Yıllık
                <span className="bg-[#00e676] text-black text-[10px] px-2 py-0.5 rounded-full font-extrabold">-%20</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-32 relative z-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard 
              title="Başlangıç" 
              description="Küçük ekipler ve freelancerlar için ideal." 
              monthlyPrice={1495}
              annualPrice={1245}
              isAnnual={isAnnual}
              features={[
                "Görevler ve Projeler",
                "Sohbet (Chat)",
                "AI Teklifler ve AI İçerik (sınırlı)",
                "Finans: Genel Bakış ve Faturalar",
                "İK: Ekip Yönetimi",
                "Temel Entegrasyonlar (Trello, Calendar)",
                "Rol bazlı erişim",
                "5 Kullanıcı",
                "1GB Depolama",
                "E-posta destek"
              ]} 
              buttonText="Ücretsiz Deneyin"
              href="/register?plan=starter"
            />
            <PricingCard 
              title="Profesyonel" 
              description="Büyüyen ajanslar ve profesyoneller için kapsamlı paket." 
              monthlyPrice={2495}
              annualPrice={2079}
              isAnnual={isAnnual}
              popular={true}
              features={[
                "CRM, WhatsApp, Instagram ve Müşteri Yönetimi",
                "Görevler ve Görev Raporları",
                "Projeler",
                "Sohbet (Chat)",
                "Sosyal Medya Planları",
                "AI Teklifler ve AI İçerik",
                "Finans: Gelir/Gider, Düzenli İşlemler, Faturalar",
                "Paraşüt & Google Calendar Entegrasyonu",
                "İK: Ekip, Bordro & Maaşlar, Sözleşme & Evrak, İzinler",
                "Gelişmiş raporlama",
                "Rol bazlı erişim",
                "20 Kullanıcı",
                "100GB Depolama",
                "Öncelikli destek"
              ]} 
              buttonText="Hemen Başlayın"
              href="/register?plan=pro"
            />
            <PricingCard 
              title="Kurumsal" 
              description="Büyük ölçekli organizasyonlar için tam kontrol." 
              monthlyPrice={7495}
              annualPrice={6245}
              isAnnual={isAnnual}
              features={[
                "Sınırsız modül ve özellikler",
                "Tüm Entegrasyonlar (PayTR, Netgsm, VatanSMS vb.)",
                "Özel entegrasyonlar ve API erişimi",
                "Yapay Zeka Asistanı",
                "Gelişmiş güvenlik ve denetim",
                "CRM, WhatsApp, Instagram, Müşteri Yönetimi",
                "Görevler, Raporlar ve Projeler",
                "Sohbet (Chat), Sosyal Medya Planları",
                "Finans: Tüm modüller",
                "İK: Tüm modüller",
                "100+ Kullanıcı",
                "500GB Depolama",
                "7/24 Canlı Destek"
              ]} 
              buttonText="Satışla Görüşün"
              href="/contact"
            />
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 border-t border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Özellik Karşılaştırması</h2>
            <p className="text-zinc-400">Hangi paketin size uygun olduğuna detaylıca bakın.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-4 text-sm font-bold text-zinc-500 uppercase tracking-wider border-b border-white/10 w-1/4">Özellikler</th>
                  <th className="p-4 text-sm font-bold text-white border-b border-white/10 text-center w-1/4">Başlangıç</th>
                  <th className="p-4 text-sm font-bold text-[#00e676] border-b border-white/10 text-center w-1/4">Profesyonel</th>
                  <th className="p-4 text-sm font-bold text-white border-b border-white/10 text-center w-1/4">Kurumsal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <ComparisonRow feature="Kullanıcı Sayısı" starter="5" pro="20" enterprise="Sınırsız" />
                <ComparisonRow feature="Depolama Alanı" starter="1GB" pro="100GB" enterprise="Sınırsız" />
                <ComparisonRow feature="CRM & Pipeline" starter={<Check size={18} className="text-zinc-500 mx-auto"/>} pro={<CheckCircle2 size={18} className="text-[#00e676] mx-auto"/>} enterprise={<CheckCircle2 size={18} className="text-[#00e676] mx-auto"/>} />
                <ComparisonRow feature="WhatsApp & Instagram" starter="-" pro={<CheckCircle2 size={18} className="text-[#00e676] mx-auto"/>} enterprise={<CheckCircle2 size={18} className="text-[#00e676] mx-auto"/>} />
                <ComparisonRow feature="Yapay Zeka (AI)" starter="Sınırlı" pro="Tam Erişim" enterprise="Tam Erişim + Özel Model" />
                <ComparisonRow feature="Finans Yönetimi" starter="-" pro={<CheckCircle2 size={18} className="text-[#00e676] mx-auto"/>} enterprise={<CheckCircle2 size={18} className="text-[#00e676] mx-auto"/>} />
                <ComparisonRow feature="API Erişimi" starter="-" pro="-" enterprise={<CheckCircle2 size={18} className="text-[#00e676] mx-auto"/>} />
                <ComparisonRow feature="Destek" starter="E-posta" pro="Öncelikli E-posta" enterprise="7/24 Canlı Destek" />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Sıkça Sorulan Sorular</h2>
          </div>
          
          <div className="space-y-6">
            <FaqItem 
              question="Ücretsiz deneme süresi var mı?" 
              answer="Evet, tüm planlarımızı 14 gün boyunca kredi kartı bilgisi girmeden ücretsiz deneyebilirsiniz." 
            />
            <FaqItem 
              question="Planımı daha sonra değiştirebilir miyim?" 
              answer="Kesinlikle. İstediğiniz zaman paketinizi yükseltebilir veya düşürebilirsiniz. Değişiklik anında yansıtılır." 
            />
            <FaqItem 
              question="Ekstra kullanıcı ekleyebilir miyim?" 
              answer="Evet, paket limitlerini aşan her kullanıcı için ek ücret ödeyerek kullanıcı sayınızı artırabilirsiniz." 
            />
            <FaqItem 
              question="İptal politikası nedir?" 
              answer="Memnun kalmazsanız üyeliğinizi istediğiniz an iptal edebilirsiniz. Yıllık ödemelerde ilk 30 gün iade garantisi sunuyoruz." 
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Hala Kararsız Mısınız?</h2>
          <p className="text-zinc-400 mb-10 max-w-xl mx-auto">Satış ekibimizle iletişime geçin, ihtiyaçlarınıza en uygun çözümü birlikte belirleyelim.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/contact" 
              className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
            >
              Satışla Görüşün
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

function PricingCard({ 
  title, 
  description, 
  monthlyPrice, 
  annualPrice, 
  isAnnual, 
  features, 
  popular = false,
  buttonText,
  href
}: { 
  title: string, 
  description: string, 
  monthlyPrice: number, 
  annualPrice: number, 
  isAnnual: boolean, 
  features: string[], 
  popular?: boolean,
  buttonText: string,
  href: string
}) {
  const price = isAnnual ? annualPrice : monthlyPrice;
  const formattedPrice = price.toLocaleString('tr-TR');

  return (
    <div className={`border rounded-[2rem] p-8 flex flex-col relative transition-all duration-300 group ${popular ? 'bg-white/[0.03] border-[#00e676]/50 shadow-2xl shadow-[#00e676]/10' : 'border-white/10 bg-transparent hover:border-white/20'}`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00e676] text-black text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg">
          En Çok Tercih Edilen
        </div>
      )}
      
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-500 md:h-10">{description}</p>
      </div>

      <div className="flex items-baseline gap-1 mb-8">
        <span className="text-5xl font-extrabold text-white tracking-tight">₺{formattedPrice}</span>
        <span className="text-zinc-500 font-medium">/ay</span>
      </div>

      <ul className="space-y-4 mb-8 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex gap-3 text-sm text-zinc-300 items-start">
            <div className={`mt-0.5 size-5 rounded-full flex items-center justify-center shrink-0 ${popular ? 'bg-[#00e676]/10 text-[#00e676]' : 'bg-white/10 text-white'}`}>
              <Check size={12} strokeWidth={3} />
            </div>
            {feature}
          </li>
        ))}
      </ul>

      <Link 
        href={href}
        className={`w-full py-4 rounded-xl text-sm font-bold transition-all text-center ${popular ? 'bg-[#00e676] text-black hover:scale-105 hover:shadow-lg hover:shadow-[#00e676]/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
      >
        {buttonText}
      </Link>
      
      {isAnnual && (
        <p className="text-center text-[10px] text-zinc-500 mt-4 font-medium">
          Yıllık ₺{(price * 12).toLocaleString('tr-TR')} olarak faturalandırılır
        </p>
      )}
    </div>
  );
}

function ComparisonRow({ feature, starter, pro, enterprise }: { feature: string, starter: React.ReactNode, pro: React.ReactNode, enterprise: React.ReactNode }) {
  return (
    <tr className="hover:bg-white/[0.02] transition-colors">
      <td className="p-4 text-sm font-medium text-zinc-300 border-b border-white/5">{feature}</td>
      <td className="p-4 text-sm text-zinc-400 border-b border-white/5 text-center">{starter}</td>
      <td className="p-4 text-sm font-bold text-white border-b border-white/5 text-center bg-[#00e676]/5">{pro}</td>
      <td className="p-4 text-sm text-zinc-400 border-b border-white/5 text-center">{enterprise}</td>
    </tr>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex justify-between items-center hover:bg-white/[0.02] transition-colors"
      >
        <span className="font-bold text-white">{question}</span>
        <div className={`size-8 rounded-full bg-white/5 flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180 bg-white/10' : ''}`}>
          <ArrowRight size={16} className="rotate-90" />
        </div>
      </button>
      <motion.div 
        initial={false}
        animate={{ height: isOpen ? "auto" : 0 }}
        className="overflow-hidden"
      >
        <div className="p-6 pt-0 text-sm text-zinc-400 leading-relaxed">
          {answer}
        </div>
      </motion.div>
    </div>
  );
}
