"use client";

import Link from "next/link";
import {
  Infinity,
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
  Search,
  Download,
  Eye,
  Send,
  MoreVertical,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  FileSearch,
  Bot,
  Globe,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  LandingHeader,
  LandingFooter,
  primaryColor,
} from "@/components/landing-layout";

function ProposalCard({ title, client, value, status, date }: { 
  title: string, client: string, value: string, status: 'Kabul Edildi' | 'Beklemede' | 'Reddedildi', date: string 
}) {
  const statusStyles = {
    'Kabul Edildi': 'text-[#00e676] bg-[#00e676]/10',
    'Beklemede': 'text-blue-400 bg-blue-400/10',
    'Reddedildi': 'text-red-400 bg-red-400/10'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-[#00e676] transition-colors">
          <FileText size={20} />
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusStyles[status]}`}>
          {status}
        </span>
      </div>
      <h3 className="text-sm font-bold text-white mb-1 group-hover:text-[#00e676] transition-colors">{title}</h3>
      <p className="text-xs text-zinc-500 mb-4">{client}</p>
      <div className="flex justify-between items-center pt-4 border-t border-white/5">
        <div className="text-xs font-bold text-white">{value}</div>
        <div className="text-[10px] text-zinc-600">{date}</div>
      </div>
      <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="flex-1 py-2 rounded-lg bg-white/5 text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
          <Eye size={12} /> Önizle
        </button>
        <button className="flex-1 py-2 rounded-lg bg-[#00e676]/10 text-[10px] font-bold text-[#00e676] hover:bg-[#00e676]/20 transition-all flex items-center justify-center gap-2">
          <Download size={12} /> İndir
        </button>
      </div>
    </motion.div>
  );
}

export default function AIProposals() {
  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#00e676] selection:text-black">
      <LandingHeader />

      <main className="pt-32 pb-20 px-6 lg:px-8 max-w-7xl mx-auto relative">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[#00e676]/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16 relative z-10">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold mb-6"
            >
              <Sparkles size={14} />
              <span>AKILLI TEKLİF SİSTEMİ</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6"
            >
              Dakikalar İçinde <br /><span className="text-blue-400">Kazanan Teklifler</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-zinc-400"
            >
              Müşterinizin ihtiyaçlarını analiz edin ve yapay zeka ile kişiselleştirilmiş, profesyonel tekliflerinizi anında oluşturun.
            </motion.p>
          </div>
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-black transition hover:scale-105 active:scale-95 shadow-xl shadow-[#00e676]/20 group"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus size={20} />
            <span>Yeni Teklif Oluştur</span>
            <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        </div>

        {/* Proposal Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20 relative z-10">
          {[
            { label: 'Aktif Teklifler', value: '24', sub: '+3 Bu Hafta', color: 'text-white' },
            { label: 'Kabul Oranı', value: '%78', sub: 'Sektör Ort. %45', color: 'text-[#00e676]' },
            { label: 'Bekleyen Değer', value: '₺1.2M', sub: '12 Proje', color: 'text-blue-400' },
            { label: 'Ort. Hazırlama', value: '4dk', sub: 'AI Desteğiyle', color: 'text-purple-400' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-sm"
            >
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{stat.label}</div>
              <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-[10px] font-medium text-zinc-600 uppercase">{stat.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Tabs/Layout */}
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left: Recent Proposals */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <FileText size={20} className="text-[#00e676]" />
                Son Teklifler
              </h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                  <input 
                    type="text" 
                    placeholder="Teklif ara..." 
                    className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#00e676]/50 transition-colors w-48"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <ProposalCard 
                title="Kurumsal Kimlik & Web Tasarım"
                client="Global Tech Solutions"
                value="₺120.000"
                status="Kabul Edildi"
                date="12 Oca 2026"
              />
              <ProposalCard 
                title="Sosyal Medya Yönetimi (1 Yıl)"
                client="Lüks Mobilya A.Ş."
                value="₺85.000"
                status="Beklemede"
                date="15 Oca 2026"
              />
              <ProposalCard 
                title="E-Ticaret Altyapı Geliştirme"
                client="Trend Moda Butik"
                value="₺240.000"
                status="Beklemede"
                date="18 Oca 2026"
              />
              <ProposalCard 
                title="SEO & Performans Pazarlaması"
                client="Sağlık Grubu"
                value="₺45.000"
                status="Kabul Edildi"
                date="05 Oca 2026"
              />
            </div>

            <button className="w-full py-4 rounded-2xl border border-dashed border-white/10 text-zinc-500 text-sm font-bold hover:bg-white/[0.02] hover:border-white/20 transition-all uppercase tracking-widest">
              Tüm Teklifleri Gör
            </button>
          </div>

          {/* Right: AI Assistant & Templates */}
          <div className="space-y-8">
            {/* AI Assistant Card */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-500/10 via-transparent to-transparent border border-blue-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 text-blue-500/5 group-hover:text-blue-500/10 transition-colors">
                <Bot size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-blue-400 mb-6">
                  <Sparkles size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">AI Satış Asistanı</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-4 leading-tight">Müşterinizi <br />Etkilemeye Hazır Mısınız?</h4>
                <p className="text-xs text-zinc-400 mb-8 leading-relaxed">
                  "Trend Moda Butik için hazırladığınız teklifin kabul edilme ihtimali %85. AI, bütçe kısmında ufak bir revizyon öneriyor."
                </p>
                <div className="space-y-3 mb-8">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/item">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="size-2 rounded-full bg-blue-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Fiyat Analizi</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed group-hover/item:text-zinc-300 transition-colors">Sektör ortalamasına göre %10 daha rekabetçi bir fiyatlandırma.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/item">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="size-2 rounded-full bg-[#00e676]" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Teslimat Süresi</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed group-hover/item:text-zinc-300 transition-colors">AI, proje süresini 4 hafta yerine 3.5 hafta olarak optimize etti.</p>
                  </div>
                </div>
                <button className="w-full py-3 rounded-xl bg-blue-500 text-black font-bold text-xs hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                  <Send size={14} /> Analizi Uygula
                </button>
              </div>
            </div>

            {/* Smart Templates */}
            <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                <Layers size={18} className="text-zinc-500" />
                Şablonlar
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Target size={16} />, title: "Satış" },
                  { icon: <Briefcase size={16} />, title: "Hizmet" },
                  { icon: <FileSearch size={16} />, title: "Denetim" },
                  { icon: <Plus size={16} />, title: "Özel" }
                ].map((tpl, i) => (
                  <button key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#00e676]/30 transition-all group text-left">
                    <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 mb-3 group-hover:text-[#00e676] group-hover:bg-[#00e676]/10 transition-all">
                      {tpl.icon}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-400 group-hover:text-white uppercase tracking-widest">{tpl.title}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Features Section */}
        <section className="mt-40 space-y-40">
          {/* AI Generation Feature */}
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold mb-6"
              >
                <Sparkles size={14} />
                <span>AKILLI İÇERİK</span>
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">
                AI ile Teklifiniz <br /><span className="text-blue-400">Kendini Yazsın</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                Müşterinizin web sitesini veya mevcut dökümanlarını AI'ya taratın. Sistem, en uygun çözümleri ve fiyatlandırmayı otomatik olarak taslak haline getirsin.
              </p>
              <div className="space-y-6">
                {[
                  { title: "Müşteri Analizi", desc: "AI, müşterinizin sektörünü ve rakiplerini analiz ederek teklifi özelleştirir." },
                  { title: "Dinamik Fiyatlandırma", desc: "Kapasitenize ve maliyetlerinize göre en karlı teklifi hesaplar." },
                  { title: "Marka Uyumu", desc: "Teklifin dilini ve tasarımını markanızın kimliğiyle eşleştirir." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="size-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-1">
                      <CheckCircle2 size="14" strokeWidth={3} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold mb-1">{item.title}</h4>
                      <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full"></div>
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-[#00e676]/10 flex items-center justify-center text-[#00e676]">
                        <Infinity size={24} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white uppercase tracking-widest">Teklif Taslağı #042</div>
                        <div className="text-[10px] text-zinc-500">AI Tarafından Oluşturuluyor...</div>
                      </div>
                    </div>
                    <div className="size-8 rounded-full border-2 border-[#00e676] border-t-transparent animate-spin"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 w-3/4 bg-white/10 rounded-lg animate-pulse"></div>
                    <div className="h-4 w-1/2 bg-white/5 rounded-lg animate-pulse delay-75"></div>
                    <div className="h-20 w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                      <div className="h-2 w-full bg-blue-500/20 rounded mb-2"></div>
                      <div className="h-2 w-4/5 bg-blue-500/10 rounded mb-2"></div>
                      <div className="h-2 w-3/5 bg-blue-500/5 rounded"></div>
                    </div>
                  </div>
                  <div className="pt-4 grid grid-cols-2 gap-4">
                    <div className="h-12 rounded-xl bg-white/5 border border-white/5"></div>
                    <div className="h-12 rounded-xl bg-[#00e676]/10 border border-[#00e676]/20"></div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Market & Competitor Intelligence Feature */}
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-[#00e676]/10 blur-[100px] rounded-full"></div>
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
              >
                {/* Competitor Analysis Simulation */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Globe size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white uppercase tracking-widest">Pazar Taraması</div>
                        <div className="text-[10px] text-zinc-500">Rakip Verileri Analiz Ediliyor</div>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-[#00e676]/10 text-[#00e676] text-[10px] font-bold">CANLI</div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { name: 'Rakip A', price: '₺150k', strength: 'Yüksek', color: 'bg-blue-500' },
                      { name: 'Rakip B', price: '₺120k', strength: 'Orta', color: 'bg-yellow-500' },
                      { name: 'Sizin Teklifiniz', price: '₺125k', strength: 'Optimize', color: 'bg-[#00e676]' },
                    ].map((item, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between group/row hover:bg-white/[0.05] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`size-2 rounded-full ${item.color}`} />
                          <span className="text-xs font-bold text-zinc-300">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-xs font-bold text-white">{item.price}</span>
                          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">{item.strength}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 text-blue-400 mb-3">
                      <ShieldCheck size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">AI Strateji Önerisi</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                      "Pazardaki benzer projeler incelendi. Teklifinize 'Sürekli Destek' paketi ekleyerek Rakip A karşısında %40 daha fazla avantaj sağlayabilirsiniz."
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="order-1 lg:order-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e676]/10 text-[#00e676] text-xs font-bold mb-6"
              >
                <Search size={14} />
                <span>PAZAR İSTİHBARATI</span>
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">
                Müşterinizi ve <br /><span className="text-[#00e676]">Rakiplerinizi Tanıyın</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                Sadece teklif yazmayın, pazarı domine edin. AI sistemimiz, teklif hazırlamadan önce sektörel trendleri ve rakip stratejilerini saniyeler içinde analiz eder.
              </p>
              <div className="space-y-6">
                {[
                  { title: "Otomatik Rakip Analizi", desc: "Benzer projeler için piyasadaki fiyatlandırma ve hizmet kapsamlarını karşılaştırır." },
                  { title: "Müşteri Geçmişi Taraması", desc: "Müşterinizin dijital ayak izini analiz ederek en doğru dili (tonality) belirler." },
                  { title: "Trend Tahminleme", desc: "Sektördeki yükselen talepleri belirleyerek teklifinize 'geleceğe hazır' maddeler ekler." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="size-6 rounded-full bg-[#00e676]/20 flex items-center justify-center text-[#00e676] shrink-0 mt-1">
                      <TrendingUp size="14" strokeWidth={3} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold mb-1">{item.title}</h4>
                      <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-40">
          <div className="relative rounded-[3rem] bg-gradient-to-br from-blue-600/20 via-[#0a0a0a] to-[#0a0a0a] border border-white/10 p-12 md:p-20 overflow-hidden text-center">
            <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
              <FileText size={400} />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto relative z-10"
            >
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-8 tracking-tight">
                Satış Sürecinizi <br /><span className="text-blue-400">Yapay Zeka ile Hızlandırın</span>
              </h2>
              <p className="text-lg text-zinc-400 mb-10 leading-relaxed">
                Daha profesyonel, daha hızlı ve daha ikna edici tekliflerle tanışın. MOI Port AI yanınızda.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-blue-500 text-black px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl shadow-blue-500/20">
                  Hemen Başlayın
                </button>
                <button className="bg-white/5 border border-white/10 text-white px-10 py-4 rounded-2xl font-bold hover:bg-white/10 transition-colors">
                  Örnekleri İncele
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
