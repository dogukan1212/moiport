"use client";

import Link from "next/link";
import {
  Check,
  ArrowRight,
  Target,
  Users,
  MessageSquare,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Instagram,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Calendar,
  Zap,
  Wallet,
  MessageCircle,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LandingHeader,
  LandingFooter,
  primaryColor,
} from "@/components/landing-layout";

function PipelineCard({ title, company, value, stage, color }: { title: string, company: string, value: string, stage: string, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-grab active:cursor-grabbing"
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 uppercase tracking-wider">{stage}</span>
        <button className="text-zinc-600 hover:text-white transition-colors"><MoreHorizontal size={14} /></button>
      </div>
      <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
      <p className="text-xs text-zinc-500 mb-4">{company}</p>
      <div className="flex justify-between items-center">
        <div className="text-xs font-bold text-[#00e676]">{value}</div>
        <div className="flex -space-x-2">
          {[1, 2].map(i => (
            <div key={i} className="size-6 rounded-full border-2 border-[#050505] bg-zinc-800 flex items-center justify-center text-[10px] font-bold">U{i}</div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function CRMBoard() {
  const [activeIgTab, setActiveIgTab] = useState<'comments' | 'messages'>('comments');

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#00e676] selection:text-black">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-10 lg:pt-48 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] blur-[120px] rounded-full opacity-10 pointer-events-none bg-[#00e676]"></div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e676]/10 text-[#00e676] text-xs font-bold mb-6"
              >
                <Target size={14} />
                <span>CRM YÖNETİMİ</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6"
              >
                Müşteri İlişkilerinizi <br /><span className="text-[#00e676]">Uçtan Uca Yönetin</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-zinc-400"
              >
                Lead'den satışa, WhatsApp'tan Instagram'a tüm kanalları tek merkezden yönetin. 
                Yapay zeka desteğiyle müşteri memnuniyetini ve satışlarınızı maksimize edin.
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex gap-4"
            >
              <button className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                <Filter size={18} />
                Filtrele
              </button>
              <button className="bg-[#00e676] text-black px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2">
                <Plus size={18} />
                Yeni Fırsat
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Kanban Board Preview */}
      <section className="relative pt-20 pb-32">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-[0.03]" 
               style={{ backgroundImage: `radial-gradient(${primaryColor} 1px, transparent 1px)`, backgroundSize: '32px 32px' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[#00e676]/10 blur-[120px] rounded-full opacity-50"></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative p-8 md:p-12 rounded-[3rem] bg-white/[0.01] border border-white/5 backdrop-blur-sm overflow-hidden group">
            {/* Board Background Glow */}
            <div className="absolute -top-24 -left-24 size-96 bg-[#00e676]/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            
            <div className="grid md:grid-cols-4 gap-8 overflow-x-auto pb-4 relative z-10">
            {/* Column 1: Yeni Lead */}
            <div className="min-w-[280px] space-y-4">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-blue-500"></div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">Yeni Lead</h3>
                  <span className="text-xs text-zinc-500 font-bold bg-white/5 px-2 py-0.5 rounded-full">12</span>
                </div>
              </div>
              <div className="space-y-3">
                <PipelineCard title="Logo Tasarımı" company="TechCorp Solutions" value="₺15,000" stage="Düşük Öncelik" color="blue" />
                <PipelineCard title="Web Arayüz Yenileme" company="Global Logistics" value="₺45,000" stage="Orta Öncelik" color="blue" />
                <PipelineCard title="Sosyal Medya Paketi" company="Fresh Eats" value="₺8,500" stage="Yüksek Öncelik" color="blue" />
              </div>
            </div>

            {/* Column 2: İletişim Kuruldu */}
            <div className="min-w-[280px] space-y-4">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-purple-500"></div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">İletişim</h3>
                  <span className="text-xs text-zinc-500 font-bold bg-white/5 px-2 py-0.5 rounded-full">8</span>
                </div>
              </div>
              <div className="space-y-3">
                <PipelineCard title="E-ticaret Danışmanlığı" company="Urban Style" value="₺25,000" stage="Toplantı Bekleniyor" color="purple" />
                <PipelineCard title="SEO Optimizasyonu" company="Legal Partners" value="₺12,000" stage="Yanıt Bekleniyor" color="purple" />
              </div>
            </div>

            {/* Column 3: Teklif Sunuldu */}
            <div className="min-w-[280px] space-y-4">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-orange-500"></div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">Teklif</h3>
                  <span className="text-xs text-zinc-500 font-bold bg-white/5 px-2 py-0.5 rounded-full">5</span>
                </div>
              </div>
              <div className="space-y-3">
                <PipelineCard title="Full-Stack Geliştirme" company="Innovate Lab" value="₺120,000" stage="Teklif İncelemede" color="orange" />
                <PipelineCard title="Mobil Uygulama (MVP)" company="Startup X" value="₺85,000" stage="Revize İstendi" color="orange" />
              </div>
            </div>

            {/* Column 4: Müzakere & Kapanış */}
            <div className="min-w-[280px] space-y-4">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-[#00e676]"></div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">Kapanış</h3>
                  <span className="text-xs text-zinc-500 font-bold bg-white/5 px-2 py-0.5 rounded-full">3</span>
                </div>
              </div>
              <div className="space-y-3">
                <PipelineCard title="Kurumsal Kimlik" company="Build It" value="₺35,000" stage="Sözleşme Aşaması" color="green" />
              </div>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* CRM Statistics */}
      <section className="py-20 bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Toplam Fırsat Değeri", value: "₺345.500", trend: "+12.5%", icon: <Wallet size={20} /> },
              { label: "Kazanma Oranı", value: "%68", trend: "+5.2%", icon: <Target size={20} /> },
              { label: "Aktif Lead", value: "42", trend: "+8", icon: <Users size={20} /> },
              { label: "Ort. Kapanış Süresi", value: "14 Gün", trend: "-2 Gün", icon: <Calendar size={20} /> },
            ].map((stat, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3 text-zinc-500 mb-4">
                  {stat.icon}
                  <span className="text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className={`text-xs font-bold ${stat.trend.startsWith('+') ? 'text-[#00e676]' : 'text-zinc-400'}`}>{stat.trend}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Integration Section */}
      <section className="py-20 lg:py-40 relative overflow-hidden bg-white/[0.01]">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#25D366]/10 blur-[120px] rounded-full opacity-20 pointer-events-none"></div>
        
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#25D366]/10 text-[#25D366] text-xs font-bold mb-6"
                >
                  <MessageCircle size={14} />
                  <span>WHATSAPP ENTEGRASYONU</span>
                </motion.div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  WhatsApp'tan Gelen <br />Talepleri <span className="text-[#25D366]">Anında Yakalayın</span>
                </h2>
                <p className="text-zinc-400 text-lg mb-8">
                  WhatsApp hattınıza gelen her mesaj otomatik olarak bir "Lead" kartına dönüşür. 
                  Müşteriyle yazışmalarınız CRM geçmişine kaydedilir, hiçbir detayı unutmazsınız.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { title: "Otomatik Yanıt", desc: "Mesai dışı saatlerde AI yanıt verir." },
                    { title: "Lead Skorlama", desc: "Talebin ciddiyetini analiz eder." },
                    { title: "Dosya Paylaşımı", desc: "Teklif ve katalogları anında iletin." },
                    { title: "Ekip Atama", desc: "İlgili satış temsilcisine yönlendirir." }
                  ].map((feat, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="text-[#25D366] font-bold text-sm mb-1">{feat.title}</div>
                      <div className="text-zinc-500 text-xs">{feat.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-[#25D366]/5 blur-3xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                  <div className="size-10 rounded-full bg-[#25D366] flex items-center justify-center text-white">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">+90 532 *** ** 00</div>
                    <div className="text-[10px] text-[#25D366] font-medium">Çevrimiçi • Lead Kartı Oluşturuldu</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-3 max-w-[80%]">
                    <p className="text-xs text-zinc-300">Merhaba, yeni web sitemiz için fiyat teklifi alabilir miyim?</p>
                    <span className="text-[9px] text-zinc-500 mt-1 block">14:20</span>
                  </div>
                  <div className="bg-[#25D366]/10 border border-[#25D366]/20 rounded-lg p-3 max-w-[80%] ml-auto">
                    <p className="text-xs text-zinc-200 italic">"AI: Merhaba! Tabii ki, size yardımcı olmaktan mutluluk duyarız. Sektörünüzü öğrenebilir miyim?"</p>
                    <span className="text-[9px] text-[#25D366] mt-1 block text-right">14:20 • AI Yanıtı</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Integration Section */}
      <section className="py-20 lg:py-40 relative overflow-hidden bg-black">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-[#E4405F]/10 blur-[120px] rounded-full opacity-20 pointer-events-none"></div>
        
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative group lg:order-2">
              <div className="absolute inset-0 bg-[#E4405F]/5 blur-3xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-4">
                    <button 
                      onMouseEnter={() => setActiveIgTab('comments')}
                      className={`text-xs font-bold uppercase tracking-widest pb-1 transition-all ${activeIgTab === 'comments' ? 'text-white border-b-2 border-[#E4405F]' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Yorumlar
                    </button>
                    <button 
                      onMouseEnter={() => setActiveIgTab('messages')}
                      className={`text-xs font-bold uppercase tracking-widest pb-1 transition-all ${activeIgTab === 'messages' ? 'text-white border-b-2 border-[#E4405F]' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Mesajlar (DM)
                    </button>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#E4405F]/10 text-[#E4405F] text-[10px] font-bold">
                    {activeIgTab === 'comments' ? '3 Yeni Yorum' : '3 Yeni Mesaj'}
                  </span>
                </div>
                
                <div className="space-y-4 min-h-[320px]">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeIgTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {(activeIgTab === 'comments' ? [
                        { user: "ayse_tasarim", content: "Fiyat bilgisi alabilir miyim?", sentiment: "POZİTİF", time: "2dk", type: "comment" },
                        { user: "mert_demir", content: "Harika bir çalışma, tebrikler!", sentiment: "POZİTİF", time: "15dk", type: "comment" },
                        { user: "zeynep_v", content: "Hangi paketleri önerirsiniz?", sentiment: "NÖTR", time: "1s", type: "comment" }
                      ] : [
                        { user: "can_dev", content: "Harika bir proje olmuş! Detaylar için DM atar mısınız?", sentiment: "POZİTİF", time: "1s", type: "message" },
                        { user: "selin_style", content: "Merhaba, iş birliği için yazıyorum. Uygun bir vaktiniz var mı?", sentiment: "NÖTR", time: "3s", type: "message" },
                        { user: "tech_guru", content: "Yeni API entegrasyonu hakkında bilgi alabilir miyim?", sentiment: "POZİTİF", time: "12s", type: "message" }
                      ]).map((item, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex gap-3 items-start group/item">
                          <div className="size-8 rounded-full bg-gradient-to-tr from-[#FFB700] via-[#E4405F] to-[#833AB4] p-[1px]">
                            <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center text-[10px] font-bold">
                              {item.user[0].toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-white">@{item.user}</span>
                                {item.type === 'message' && <span className="text-[8px] bg-blue-500/10 text-blue-500 px-1 rounded uppercase font-bold">DM</span>}
                              </div>
                              <span className="text-[9px] text-zinc-600">{item.time}</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mb-2">{item.content}</p>
                            <div className="flex gap-2">
                              <button className="text-[9px] font-bold text-[#E4405F] hover:underline">AI Yanıtla</button>
                              <button className="text-[9px] font-bold text-[#00e676] hover:underline">Lead Olarak Kaydet</button>
                              <span className={`ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-full ${item.sentiment === 'POZİTİF' ? 'bg-green-500/10 text-green-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                                {item.sentiment}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="space-y-12 lg:order-1">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E4405F]/10 text-[#E4405F] text-xs font-bold mb-6"
                >
                  <Instagram size={14} />
                  <span>INSTAGRAM YÖNETİMİ</span>
                </motion.div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  Instagram <span className="text-[#E4405F]">Yorum ve Mesajlarını</span> <br />Satışa Dönüştürün
                </h2>
                <p className="text-zinc-400 text-lg mb-8">
                  Hem gönderi yorumlarını hem de direkt mesajları (DM) tek bir ekrandan yönetin. 
                  AI desteğiyle talepleri anında yanıtlayın ve CRM hattınıza bağlayın.
                </p>

                <div className="space-y-4">
                  {[
                    { icon: <MessageSquare size={18} />, title: "Yorum & DM Yönetimi", desc: "Tüm etkileşimleri tek bir merkezi gelen kutusunda toplayın." },
                    { icon: <Sparkles size={18} />, title: "AI Otomatik Mesaj", desc: "DM üzerinden gelen sorulara yapay zeka ile 7/24 anında yanıt verin." },
                    { icon: <Target size={18} />, title: "Sosyal CRM Entegrasyonu", desc: "Potansiyel müşterileri tek tıkla satış hunisine (pipeline) ekleyin." },
                    { icon: <Zap size={18} />, title: "Gelişmiş Filtreleme", desc: "Yorumları duygu analizine göre filtreleyerek önceliklendirin." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                      <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-[#E4405F] group-hover:bg-[#E4405F]/10 transition-all">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm mb-1">{item.title}</h4>
                        <p className="text-zinc-500 text-xs">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Details */}
      <section className="py-20 lg:py-40 bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="bg-[#050505] border border-white/5 rounded-[40px] p-8 lg:p-20 relative overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">
                  Tüm Kanalları <br /><span className="text-[#00e676]">Tek Merkezde</span> Toplayın
                </h2>
                <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                  WhatsApp, Instagram, Facebook ve web sitenizden gelen tüm talepler otomatik olarak CRM sistemine düşer. 
                  Yapay zeka bu lead'leri analiz eder, puanlar ve doğru temsilciye atar.
                </p>
                <div className="space-y-6">
                  {[
                    { title: "Otomatik Lead Yakalama", desc: "Tüm form ve mesajları anında CRM kartına dönüştürür." },
                    { title: "AI Lead Puanlama", desc: "Müşterinin ciddiyetini yapay zeka ile ölçün." },
                    { title: "Merkezi Mesajlaşma", desc: "Platformlar arası geçiş yapmadan yanıt verin." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="size-6 rounded-full bg-[#00e676]/20 flex items-center justify-center text-[#00e676] shrink-0 mt-1">
                        <Check size="14" strokeWidth={3} />
                      </div>
                      <div>
                        <h4 className="text-white font-bold mb-1">{item.title}</h4>
                        <p className="text-zinc-500 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-[#00e676]/10 blur-[100px] rounded-full"></div>
                <div className="relative bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-[#00e676]/10 flex items-center justify-center text-[#00e676]">
                        <Zap size={24} />
                      </div>
                      <div>
                        <div className="text-base font-bold text-white">Akıllı Lead Analizi</div>
                        <div className="text-xs text-zinc-500 font-medium">Yapay Zeka Devrede</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-zinc-400">Lead Skoru</span>
                        <span className="text-xs font-bold text-[#00e676]">92/100</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="w-[92%] h-full bg-[#00e676]"></div>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="text-xs text-zinc-400 mb-2">Önerilen Aksiyon</div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <ArrowRight size={14} className="text-[#00e676]" />
                        Hemen Teklif Gönder
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#00e676] to-[#00b25a] rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
              <Zap size={200} className="text-white" />
            </div>
            
            <div className="relative z-10 text-center lg:text-left max-w-3xl">
              <h2 className="text-3xl md:text-5xl font-extrabold text-black mb-4 leading-tight">
                Satışlarınızı Katlamaya Hazır Mısınız?
              </h2>
              <p className="text-black/80 text-lg font-medium">
                Modern CRM board ile ajansınızın satış performansını takip edin, hiçbir fırsatı kaçırmayın.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row gap-4 shrink-0">
              <Link href="/register" className="bg-black text-white px-8 py-4 rounded-full font-bold text-base hover:scale-105 transition-transform text-center">
                Hemen Ücretsiz Dene
              </Link>
              <Link href="/overview" className="bg-white/20 backdrop-blur-md text-black px-8 py-4 rounded-full font-bold text-base hover:bg-white/30 transition-all text-center">
                Tüm Özellikleri Gör
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
