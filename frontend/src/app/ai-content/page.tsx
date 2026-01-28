"use client";

import Link from "next/link";
import {
  Infinity as InfinityIcon,
  LayoutDashboard,
  Target,
  Users,
  Wallet,
  Briefcase,
  Layers,
  MessageCircle,
  Sparkles,
  FileText,
  Settings,
  Plus,
  Wand2,
  Copy,
  RefreshCw,
  History,
  Type,
  Hash,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  FileSearch,
  CheckCircle2,
  Globe,
  Zap,
  Bot,
  ArrowRight,
  Search,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  LandingHeader,
  LandingFooter,
  primaryColor,
} from "@/components/landing-layout";

function AIHistoryItem({ title, date, type }: { title: string, date: string, type: string }) {
  return (
    <div className="p-3 rounded-lg hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all cursor-pointer group">
      <div className="flex justify-between items-start mb-1">
        <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors truncate">{title}</span>
        <span className="text-[9px] text-zinc-600 whitespace-nowrap">{date}</span>
      </div>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{type}</span>
    </div>
  );
}

export default function AIContent() {
  const [activeTab, setActiveTab] = useState('social');
  const [isGenerating, setIsGenerating] = useState(false);

  const simulateGeneration = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 3000);
  };

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#00e676] selection:text-black">
      <LandingHeader />

      <main className="pt-32 pb-20 px-6 lg:px-8 max-w-7xl mx-auto relative">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16 relative z-10">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold mb-6"
            >
              <Sparkles size={14} />
              <span>YAPAY ZEKA İÇERİK FABRİKASI</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6"
            >
              Marka Dilinizi <br /><span className="text-purple-500">Yapay Zeka ile Ölçekleyin</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-zinc-400"
            >
              Saniyeler içinde SEO uyumlu, yüksek etkileşimli ve profesyonel içerikler üretin. Pazar analizi ve rakip araştırması ile desteklenen akıllı stratejiler geliştirin.
            </motion.p>
          </div>
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => {
              const element = document.getElementById('content-tool');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white transition hover:scale-105 active:scale-95 shadow-xl shadow-purple-500/20 group bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            <Wand2 size={20} />
            <span>Hemen Üretmeye Başla</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {/* AI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20 relative z-10">
          {[
            { label: 'Toplam İçerik', value: '1,240+', sub: 'Bu Ay +156', color: 'text-white' },
            { label: 'Zaman Tasarrufu', value: '%85', sub: 'Haftalık 12 Saat', color: 'text-[#00e676]' },
            { label: 'SEO Skoru', value: '94/100', sub: 'Ortalama Başarı', color: 'text-purple-400' },
            { label: 'Aktif Markalar', value: '12', sub: 'Tüm Kanallarda', color: 'text-blue-400' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:bg-white/[0.04] transition-all"
            >
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{stat.label}</div>
              <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-[10px] font-medium text-zinc-600 uppercase">{stat.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* AI Intelligence Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-32 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Globe size={120} />
            </div>
            <div className="size-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
              <Globe size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Pazar Araştırması</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
              Yapay zekamız, hedef pazarınızdaki güncel trendleri ve tüketici davranışlarını gerçek zamanlı analiz ederek içeriğinizi şekillendirir.
            </p>
            <ul className="space-y-3">
              {['Trend Analizi', 'Hedef Kitle Segmentasyonu', 'Lokasyon Bazlı İçerik'].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 size={14} className="text-[#00e676]" /> {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Search size={120} />
            </div>
            <div className="size-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-6 group-hover:scale-110 transition-transform">
              <Search size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Rakip Analizi</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
              Rakiplerinizin hangi konularda başarılı olduğunu ve hangi boşlukları bıraktığını tespit ederek sizi bir adım öne çıkaracak stratejiler üretir.
            </p>
            <ul className="space-y-3">
              {['İçerik Boşluğu Analizi', 'Rakip Performans Takibi', 'SEO Strateji Kıyaslama'].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 size={14} className="text-[#00e676]" /> {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles size={120} />
            </div>
            <div className="size-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform">
              <Sparkles size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Akıllı İçerik Stratejisi</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
              Markanızın benzersiz sesini (Brand Voice) öğrenir ve her içerikte bu tonu koruyarak tutarlı bir iletişim kurmanızı sağlar.
            </p>
            <ul className="space-y-3">
              {['Marka Tonu Uyumu', 'Otomatik Yayın Takvimi', 'Performans Tahminleme'].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 size={14} className="text-[#00e676]" /> {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Content Factory Tool */}
        <div id="content-tool" className="relative z-10 pt-16 border-t border-white/5">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                className="size-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500"
              >
                <Sparkles size={28} />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">İçerik Fabrikası</span>
              </h2>
            </div>
            <p className="text-zinc-500 text-lg max-w-2xl">
              Aşağıdaki panelden platform ve içerik tipini seçerek hemen üretmeye başlayın.
            </p>
          </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - History & Types */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <History size={12} />
                Son Oluşturulanlar
              </h4>
              <div className="space-y-1">
                <AIHistoryItem title="E-Ticaret Kampanya Metni" date="2s önce" type="Sosyal Medya" />
                <AIHistoryItem title="SaaS Nedir? Blog Yazısı" date="5s önce" type="Blog" />
                <AIHistoryItem title="Kış İndirimi Duyurusu" date="Dün" type="E-Posta" />
                <AIHistoryItem title="Hizmet Tanıtım Yazısı" date="Dün" type="Web Sitesi" />
              </div>
              <button className="w-full mt-4 py-2 text-[10px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest border-t border-white/5 pt-4">
                Tüm Geçmişi Gör
              </button>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('social')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all group ${activeTab === 'social' ? 'bg-purple-500/10 border-purple-500/20 text-white' : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3">
                  <Instagram size={18} />
                  <span className="text-sm font-bold">Sosyal Medya</span>
                </div>
                <ArrowRight size={14} className={`opacity-0 group-hover:opacity-100 transition-all ${activeTab === 'social' ? 'opacity-100 translate-x-1' : ''}`} />
              </button>
              <button 
                onClick={() => setActiveTab('blog')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all group ${activeTab === 'blog' ? 'bg-purple-500/10 border-purple-500/20 text-white' : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3">
                  <Type size={18} />
                  <span className="text-sm font-bold">Blog Yazısı</span>
                </div>
                <ArrowRight size={14} className={`opacity-0 group-hover:opacity-100 transition-all ${activeTab === 'blog' ? 'opacity-100 translate-x-1' : ''}`} />
              </button>
              <button 
                onClick={() => setActiveTab('email')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all group ${activeTab === 'email' ? 'bg-purple-500/10 border-purple-500/20 text-white' : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} />
                  <span className="text-sm font-bold">E-Posta Bülteni</span>
                </div>
                <ArrowRight size={14} className={`opacity-0 group-hover:opacity-100 transition-all ${activeTab === 'email' ? 'opacity-100 translate-x-1' : ''}`} />
              </button>
              <button 
                onClick={() => setActiveTab('seo')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all group ${activeTab === 'seo' ? 'bg-purple-500/10 border-purple-500/20 text-white' : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3">
                  <Search size={18} />
                  <span className="text-sm font-bold">SEO Metinleri</span>
                </div>
                <ArrowRight size={14} className={`opacity-0 group-hover:opacity-100 transition-all ${activeTab === 'seo' ? 'opacity-100 translate-x-1' : ''}`} />
              </button>
              <button 
                onClick={() => setActiveTab('ads')}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all group ${activeTab === 'ads' ? 'bg-purple-500/10 border-purple-500/20 text-white' : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3">
                  <Target size={18} />
                  <span className="text-sm font-bold">Reklam Metni</span>
                </div>
                <ArrowRight size={14} className={`opacity-0 group-hover:opacity-100 transition-all ${activeTab === 'ads' ? 'opacity-100 translate-x-1' : ''}`} />
              </button>
            </div>
          </div>

          {/* Generator Area */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                <Wand2 size={200} />
              </div>

              <div className="space-y-6 relative z-10">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Konu veya Başlık</label>
                    <input 
                      type="text" 
                      placeholder="Örn: Yaz indirimleri hakkında kampanya..."
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Tonlama</label>
                    <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all appearance-none">
                      <option>Profesyonel</option>
                      <option>Samimi & Dostane</option>
                      <option>Heyecanlı</option>
                      <option>İkna Edici</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Anahtar Kelimeler veya Detaylar</label>
                  <textarea 
                    placeholder="İçerikte geçmesini istediğiniz önemli noktaları buraya yazın..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 px-4 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all h-32 resize-none"
                  />
                </div>

                <div className="flex justify-between items-center pt-4">
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-white/5 border border-white/5 text-zinc-400 hover:text-white transition-colors">
                      <Hash size={18} />
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 border border-white/5 text-zinc-400 hover:text-white transition-colors">
                      <Plus size={18} />
                    </button>
                  </div>
                  <button 
                    onClick={simulateGeneration}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Oluşturuluyor...
                      </>
                    ) : (
                      <>
                        <Wand2 size={18} />
                        İçerik Oluştur
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Result Area (Mock) */}
            <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-8 space-y-6 relative overflow-hidden">
              {isGenerating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-[#050505]/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4"
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="size-2 rounded-full bg-purple-500"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-widest animate-pulse">Yapay Zeka Yazıyor...</span>
                </motion.div>
              )}

              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Bot size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Oluşturulan İçerik</h3>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-zinc-400 text-xs hover:text-white transition-all">
                    <Copy size={14} />
                    Kopyala
                  </button>
                  <button 
                    onClick={simulateGeneration}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-zinc-400 text-xs hover:text-white transition-all"
                  >
                    <RefreshCw size={14} />
                    Yeniden Yaz
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 text-[10px] font-bold">SEO PUANI: 94</div>
                  <div className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold">OKUNABİLİRLİK: YÜKSEK</div>
                </div>
                <p className="text-zinc-300 leading-relaxed italic text-sm">
                  "Yazın sıcaklarını dert etmeyin! ☀️ MOI Port ile ajans işlerinizi serinletiyoruz. Tüm operasyonlarınızı tek bir yerden yöneterek kendinize daha fazla vakit ayırın. <br/><br/>
                  Şimdi %30 indirim fırsatıyla dijitalleşmeye başlayın! 🚀 Detaylar bio'daki linkte. <br/><br/>
                  #MOIPort #AgencyLife #DigitalMarketing #SaaS #BusinessOptimization"
                </p>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
                {[
                  { icon: <Instagram size={18} />, color: 'text-pink-500', label: 'Instagram' },
                  { icon: <Facebook size={18} />, color: 'text-blue-600', label: 'Facebook' },
                  { icon: <Twitter size={18} />, color: 'text-blue-400', label: 'Twitter' },
                  { icon: <Linkedin size={18} />, color: 'text-blue-700', label: 'LinkedIn' },
                ].map((social, i) => (
                  <div key={i} className="group/social cursor-pointer p-3 rounded-xl bg-white/[0.02] border border-white/5 flex-1 text-center hover:bg-white/[0.05] transition-all">
                    <div className={`${social.color} mb-2 flex justify-center group-hover/social:scale-110 transition-transform`}>
                      {social.icon}
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest group-hover/social:text-zinc-300">{social.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 pt-12">
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
                  <Globe size={20} />
                </div>
                <h4 className="text-white font-bold mb-2">Çoklu Dil Desteği</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">30+ dilde yerelleştirilmiş içerik üretimi ile global pazarlara açılın.</p>
              </div>
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4">
                  <Zap size={20} />
                </div>
                <h4 className="text-white font-bold mb-2">Anında Optimizasyon</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">Metinlerinizi platforma özel karakter limitlerine göre otomatik ayarlar.</p>
              </div>
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                <div className="size-10 rounded-xl bg-[#00e676]/10 flex items-center justify-center text-[#00e676] mb-4">
                  <CheckCircle2 size={20} />
                </div>
                <h4 className="text-white font-bold mb-2">Marka Sesi Analizi</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">Önceki içeriklerinizi analiz ederek marka tonunuzu birebir kopyalar.</p>
              </div>
            </div>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
