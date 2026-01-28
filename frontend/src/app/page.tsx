"use client";

import Link from "next/link";
import {
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LandingHeader,
  LandingFooter,
  primaryColor,
} from "@/components/landing-layout";

import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsPopover } from "@/components/notifications-popover";

export default function Home() {
  const [dashboardView, setDashboardView] = useState<'agency' | 'customer'>('agency');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setSidebarCollapsed(false);
    }
  }, []);

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#00e676] selection:text-black">
      <LandingHeader />

      <section className="relative pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] blur-[120px] rounded-full opacity-20 pointer-events-none"
          style={{ backgroundColor: "#00e676" }}
        ></div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col items-center text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl text-4xl xs:text-5xl sm:text-6xl lg:text-8xl xl:text-9xl font-extrabold tracking-tighter text-white mb-6 sm:mb-8 leading-tight"
          >
            Gücü <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">Yönet</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-2xl text-base sm:text-lg text-zinc-400 mb-8 sm:mb-10"
          >
            Ajans operasyonlarınızı, müşteri ilişkilerinizi ve yapay zeka destekli iş süreçlerinizi tek bir platformdan kusursuzca yönetin.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center gap-6 sm:gap-8 w-full"
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <Link 
                className="w-full sm:w-auto text-center rounded-full px-6 sm:px-8 py-3.5 sm:py-4 text-sm font-bold text-black transition hover:scale-105 active:scale-95" 
                style={{ backgroundColor: primaryColor }}
                href="/register"
              >
                Hemen Ücretsiz Deneyin
              </Link>
              <button className="w-full sm:w-auto text-center rounded-full border border-white/10 px-6 sm:px-8 py-3.5 sm:py-4 text-sm font-bold text-white transition hover:bg-white/5">
                Daha Fazla Bilgi
              </button>
            </div>

            {/* Dashboard Toggle */}
            <div className="flex bg-white/5 p-1 rounded-full border border-white/10 max-w-xs w-full justify-between">
              <button 
                onClick={() => setDashboardView('agency')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${dashboardView === 'agency' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
              >
                Ajans Paneli
              </button>
              <button 
                onClick={() => setDashboardView('customer')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${dashboardView === 'customer' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
              >
                Müşteri Paneli
              </button>
            </div>
          </motion.div>

          {/* Realistic Dashboard Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-10 sm:mt-16 w-full max-w-6xl bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden flex flex-row min-h-[380px] sm:min-h-[420px] max-h-[520px]"
          >
            <div
              className={`border-r border-zinc-800 bg-zinc-950 p-4 sm:p-6 flex flex-col gap-6 shrink-0 text-left transition-all duration-300 ${
                sidebarCollapsed ? "w-14" : "w-56 sm:w-64"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded" style={{ backgroundColor: primaryColor }}>
                    <LayoutDashboard size={18} strokeWidth={2} className="text-white" />
                  </div>
                  {!sidebarCollapsed && (
                    <span className="text-sm font-bold text-white tracking-tight">MOI PORT</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((prev) => !prev)}
                  className="md:hidden inline-flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 p-1 text-zinc-400 hover:text-white hover:border-zinc-600"
                >
                  {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <span
                    className={`text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-3 ${
                      sidebarCollapsed ? "hidden" : "block"
                    }`}
                  >
                    Yönetim
                  </span>
                  <SidebarItem icon={<LayoutDashboard size={16} />} label="Genel Bakış" active={true} collapsed={sidebarCollapsed} />
                  {dashboardView === 'agency' && (
                    <>
                      <SidebarItem icon={<Target size={16} />} label="CRM Board" collapsed={sidebarCollapsed} />
                      <SidebarItem icon={<Users size={16} />} label="Müşteriler" collapsed={sidebarCollapsed} />
                      <SidebarItem icon={<Wallet size={16} />} label="Finans" collapsed={sidebarCollapsed} />
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <span
                    className={`text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-3 ${
                      sidebarCollapsed ? "hidden" : "block"
                    }`}
                  >
                    İş Akışı
                  </span>
                  <SidebarItem icon={<Briefcase size={16} />} label="Projeler" collapsed={sidebarCollapsed} />
                  <SidebarItem icon={<Layers size={16} />} label="Görevler" collapsed={sidebarCollapsed} />
                  <SidebarItem icon={<MessageCircle size={16} />} label="Sohbet" collapsed={sidebarCollapsed} />
                </div>

                {dashboardView === 'agency' && (
                  <div className="flex flex-col gap-1">
                    <span
                      className={`text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-3 ${
                        sidebarCollapsed ? "hidden" : "block"
                      }`}
                    >
                      MOI PORT AI
                    </span>
                    <SidebarItem icon={<Sparkles size={16} />} label="AI İçerik" collapsed={sidebarCollapsed} />
                    <SidebarItem icon={<FileText size={16} />} label="AI Teklifler" collapsed={sidebarCollapsed} />
                  </div>
                )}

                <div className="mt-auto flex flex-col gap-1">
                  <SidebarItem icon={<Settings size={16} />} label="Ayarlar" collapsed={sidebarCollapsed} />
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-zinc-900/50 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="h-12 sm:h-16 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 sm:px-8 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-500">Genel Bakış</span>
                </div>
                <div className="flex items-center gap-4">
                  <ThemeToggle />
                  <NotificationsPopover />
                  <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-white text-[10px] font-bold">JD</div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="flex-1 p-4 sm:p-8 overflow-y-auto text-left">
                <AnimatePresence mode="wait">
                  {dashboardView === 'agency' ? (
                    <motion.div 
                      key="agency"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                        <div>
                          <h2 className="text-[32px] font-normal tracking-[-0.03em] text-white leading-none">Genel Bakış</h2>
                          <p className="text-sm text-zinc-400 mt-2">Ajansınızın operasyon ve performans özeti burada.</p>
                        </div>
                        <button className="self-start sm:self-auto bg-white text-black px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold transition-transform hover:scale-105 active:scale-95">Yeni Ekle</button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
                        <StatCard label="Aylık Gelir" value="₺142.000" trend="+12%" />
                        <StatCard label="Aktif Projeler" value="24" trend="+4" />
                        <StatCard label="Bekleyen Görevler" value="86" trend="-5" />
                        <StatCard label="Yeni Müşteriler" value="12" trend="+2" />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-zinc-900 rounded-xl border border-zinc-800 p-4 sm:p-6 h-64 sm:h-72 flex flex-col shadow-sm">
                          <div className="flex justify-between items-center mb-6">
                            <span className="text-sm font-bold text-white">Gelir Analizi</span>
                            <div className="flex gap-2">
                              <div className="h-2 w-8 bg-[#00e676] rounded-full"></div>
                              <div className="h-2 w-8 bg-zinc-800 rounded-full"></div>
                            </div>
                          </div>
                          <div className="flex-1 flex items-end gap-3 px-2">
                            {[40, 60, 45, 75, 55, 90, 70, 85].map((h, i) => (
                              <div key={i} className="flex-1 h-full bg-zinc-800 rounded-t-sm relative group overflow-hidden">
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: `${h}%` }}
                                  transition={{ duration: 1, delay: i * 0.1 }}
                                  className="absolute bottom-0 left-0 right-0 bg-white group-hover:bg-[#00e676] transition-colors"
                                ></motion.div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 sm:p-6 flex flex-col gap-5 shadow-sm">
                          <span className="text-sm font-bold text-white mb-2">Son Aktiviteler</span>
                          <ActivityItem icon={<Clock size={14}/>} text="Yeni bir teklif oluşturuldu" time="2 dakika önce" />
                          <ActivityItem icon={<MessageSquare size={14}/>} text="Müşteriden yeni mesaj" time="15 dakika önce" />
                          <ActivityItem icon={<Check size={14}/>} text="Proje tamamlandı: MOI App" time="1 saat önce" />
                          <ActivityItem icon={<TrendingUp size={14}/>} text="Hedeflenen gelire ulaşıldı" time="3 saat önce" />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="customer"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                        <div>
                          <h2 className="text-[32px] font-normal tracking-[-0.03em] text-white leading-none">Müşteri Paneli</h2>
                          <p className="text-sm text-zinc-400 mt-2">Projelerinizin durumunu ve iş birliğimizi takip edin.</p>
                        </div>
                        <button className="self-start sm:self-auto bg-white text-black px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold transition-transform hover:scale-105 active:scale-95">Destek Talebi</button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
                        <StatCard label="Aktif Projelerim" value="3" />
                        <StatCard label="Açık Görevler" value="12" />
                        <StatCard label="Son Fatura" value="₺8.500" />
                        <StatCard label="Destek Talebi" value="1" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 sm:p-6 flex flex-col gap-6 shadow-sm">
                          <span className="text-sm font-bold text-white">Proje İlerlemesi</span>
                          <div className="space-y-6">
                            <ProgressItem label="E-Ticaret Tasarımı" percent={85} />
                            <ProgressItem label="SEO Optimizasyonu" percent={40} />
                            <ProgressItem label="Sosyal Medya Yönetimi" percent={65} />
                          </div>
                        </div>
                        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 sm:p-6 flex flex-col gap-4 shadow-sm">
                          <span className="text-sm font-bold text-white mb-2">Bekleyen Onaylar</span>
                          <div className="flex flex-col gap-3">
                            <div className="p-4 bg-zinc-800 rounded-xl border border-zinc-700 flex items-center justify-between group hover:border-[#00e676]/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-white flex items-center justify-center text-black"><FileText size={18}/></div>
                                <div>
                                  <p className="text-xs font-bold text-white">Web Sitesi Taslak Onayı</p>
                                  <p className="text-[10px] text-zinc-400 font-medium">Son tarih: Yarın</p>
                                </div>
                              </div>
                              <button className="text-[10px] font-bold text-white border border-white/10 px-4 py-2 rounded-lg hover:bg-[#00e676] hover:border-[#00e676] hover:text-black transition-all">İncele</button>
                            </div>
                            <div className="p-4 bg-zinc-800 rounded-xl border border-zinc-700 flex items-center justify-between group hover:border-[#00e676]/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-white flex items-center justify-center text-black"><Briefcase size={18}/></div>
                                <div>
                                  <p className="text-xs font-bold text-white">Yeni Kampanya Stratejisi</p>
                                  <p className="text-[10px] text-zinc-400 font-medium">Son tarih: 25 Ocak</p>
                                </div>
                              </div>
                              <button className="text-[10px] font-bold text-white border border-white/10 px-4 py-2 rounded-lg hover:bg-[#00e676] hover:border-[#00e676] hover:text-black transition-all">İncele</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-white/5 bg-black/40">
        <div className="mx-auto max-max-w-7xl px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-8">SEÇKİN EKİPLER TARAFINDAN GÜVENİLİYOR</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 text-white font-bold text-xl">
            <span>ACME STUDIO</span>
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-white rounded-full"></div> SPHERE</span>
            <span>MONOLITH</span>
            <span className="italic">VERTEX</span>
            <span>ONYX & CO.</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base font-bold tracking-wider uppercase text-[#00e676] mb-4">Özellikler</h2>
            <p className="text-4xl font-extrabold text-white sm:text-5xl">İşinizi bir üst seviyeye taşıyın</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Layers size={24} />} 
              title="Kapsamlı Yönetim" 
              description="Müşteriler, projeler, görevler ve finansal süreçler - her şey tek bir merkezde toplandı." 
            />
            <FeatureCard 
              icon={<Zap size={24} />} 
              title="Yapay Zeka Gücü" 
              description="İçerik üretimi ve teklif hazırlama süreçlerini MOI PORT AI ile saniyeler içinde tamamlayın." 
            />
            <FeatureCard 
              icon={<Shield size={24} />} 
              title="Güvenli Altyapı" 
              description="Verileriniz en yüksek güvenlik standartlarıyla korunur ve her an erişilebilir durumdadır." 
            />
          </div>
        </div>
      </section>

      {/* CRM Showcase Section */}
      <section id="crm-showcase" className="py-20 lg:py-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e676]/10 text-[#00e676] text-xs font-bold mb-6">
                <Users size={14} />
                <span>HEPSİ BİR ARADA CRM</span>
              </div>
              <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight">
                Müşteri İlişkilerinizi <br />
                <span className="text-[#00e676]">Tek Merkezden</span> Yönetin
              </h2>
              <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
                WhatsApp, Instagram ve web sitenizden gelen tüm talepleri tek bir panelde toplayın. Kaçan fırsatlara son verin.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-[#00e676] shrink-0 border border-white/10">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Omnichannel İletişim</h4>
                    <p className="text-sm text-zinc-500">WhatsApp ve Instagram mesajlarını ekibinizle ortaklaşa yanıtlayın.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-[#00e676] shrink-0 border border-white/10">
                    <Target size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Lead & Pipeline Takibi</h4>
                    <p className="text-sm text-zinc-500">Potansiyel müşterilerinizi satış hunisinde sürükle-bırak ile yönetin.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-[#00e676] shrink-0 border border-white/10">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Dönüşüm Analitiği</h4>
                    <p className="text-sm text-zinc-500">Hangi kanaldan ne kadar satış yaptığınızı anlık raporlarla görün.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Dashboard Mockup */}
            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#00e676]/10 rounded-full blur-[100px]"></div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]"></div>
              
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {/* Window Controls */}
                <div className="h-10 border-b border-white/5 bg-white/[0.02] flex items-center px-4 gap-2">
                  <div className="size-3 rounded-full bg-red-500/20 border border-red-500/40"></div>
                  <div className="size-3 rounded-full bg-yellow-500/20 border border-yellow-500/40"></div>
                  <div className="size-3 rounded-full bg-green-500/20 border border-green-500/40"></div>
                  <div className="ml-4 h-5 w-32 bg-white/5 rounded-full"></div>
                </div>
                
                <div className="p-6">
                  {/* Pipeline Header */}
                  <div className="flex justify-between items-center mb-6">
                    <h5 className="text-white font-bold text-sm">Satış Hunisi (Pipeline)</h5>
                    <div className="flex gap-2">
                      <div className="size-8 rounded bg-[#00e676] flex items-center justify-center text-black">
                        <Plus size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Kanban Columns */}
                  <div className="grid grid-cols-3 gap-4">
                    {/* New Leads */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        <span>Yeni Talepler</span>
                        <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">4</span>
                      </div>
                      <div className="p-3 bg-white/[0.03] border border-white/5 rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-[11px] font-medium text-white">Ahmet Yılmaz</span>
                          <Instagram size={12} className="text-pink-500" />
                        </div>
                        <p className="text-[10px] text-zinc-500 line-clamp-1">Fiyat teklifi istiyor...</p>
                        <div className="flex justify-between items-center pt-2">
                          <div className="flex -space-x-1">
                            <div className="size-4 rounded-full bg-zinc-700 border border-black"></div>
                          </div>
                          <span className="text-[9px] text-zinc-600">2 dk önce</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white/[0.03] border border-white/5 rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-[11px] font-medium text-white">Mehmet Can</span>
                          <MessageSquare size={12} className="text-green-500" />
                        </div>
                        <p className="text-[10px] text-zinc-500 line-clamp-1">Toplantı planlandı mı?</p>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-[9px] text-zinc-600">1 saat önce</span>
                        </div>
                      </div>
                    </div>

                    {/* In Progress */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        <span>Görüşülüyor</span>
                        <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">2</span>
                      </div>
                      <div className="p-3 bg-white/[0.05] border border-[#00e676]/20 rounded-lg space-y-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1 h-full bg-[#00e676]"></div>
                        <div className="flex justify-between items-start">
                          <span className="text-[11px] font-medium text-white">Selin Demir</span>
                          <MessageSquare size={12} className="text-green-500" />
                        </div>
                        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full w-2/3 bg-[#00e676]"></div>
                        </div>
                        <p className="text-[10px] text-[#00e676]">Teklif Sunuldu</p>
                      </div>
                    </div>

                    {/* Won */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        <span>Kazanıldı</span>
                        <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">12</span>
                      </div>
                      <div className="p-3 bg-[#00e676]/5 border border-[#00e676]/10 rounded-lg flex items-center justify-center flex-col gap-2 py-8 border-dashed">
                        <div className="size-8 rounded-full bg-[#00e676]/10 flex items-center justify-center text-[#00e676]">
                          <Check size={16} />
                        </div>
                        <span className="text-[10px] text-zinc-400 italic">Buraya sürükleyin</span>
                      </div>
                    </div>
                  </div>

                  {/* Message Overlay Preview */}
                  <div className="absolute bottom-6 right-6 w-48 bg-[#121212] border border-white/10 rounded-xl shadow-2xl p-3 animate-bounce-slow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="size-6 rounded-full bg-green-500 flex items-center justify-center">
                        <MessageSquare size={12} className="text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-white">WhatsApp</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      "Yeni projemiz için hazırız, ödemeyi yaptık."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI / Feature Stats Bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 border-t border-white/5 pt-16">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-white/5 text-[#00e676] mb-4 group-hover:bg-[#00e676] group-hover:text-black transition-all duration-300">
                <MessageSquare size={24} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">WhatsApp</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Resmi API Hattı</div>
              <p className="mt-2 text-[11px] text-zinc-600 px-4">Tüm mesajları tek panelden yanıtlayın</p>
            </div>

            <div className="text-center group">
              <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-white/5 text-[#00e676] mb-4 group-hover:bg-[#00e676] group-hover:text-black transition-all duration-300">
                <Instagram size={24} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">Instagram</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">DM & Yorum</div>
              <p className="mt-2 text-[11px] text-zinc-600 px-4">Sosyal medya etkileşimlerini kaçırmayın</p>
            </div>

            <div className="text-center group">
              <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-white/5 text-[#00e676] mb-4 group-hover:bg-[#00e676] group-hover:text-black transition-all duration-300">
                <LayoutDashboard size={24} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">Pipeline</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Satış Hunisi</div>
              <p className="mt-2 text-[11px] text-zinc-600 px-4">Süreçlerinizi sürükle-bırak ile yönetin</p>
            </div>

            <div className="text-center group">
              <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-white/5 text-[#00e676] mb-4 group-hover:bg-[#00e676] group-hover:text-black transition-all duration-300">
                <Target size={24} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">Lead Yönetimi</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Potansiyel Takip</div>
              <p className="mt-2 text-[11px] text-zinc-600 px-4">Aday müşterileri kazanca dönüştürün</p>
            </div>

            <div className="text-center group md:col-span-2 lg:col-span-1">
              <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-white/5 text-[#00e676] mb-4 group-hover:bg-[#00e676] group-hover:text-black transition-all duration-300">
                <Layers size={24} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">Omnichannel</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Tek Merkez</div>
              <p className="mt-2 text-[11px] text-zinc-600 px-4">Tüm kanalları tek panelden kontrol edin</p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 lg:py-32 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <h2 className="text-4xl font-extrabold text-white mb-8">İş akışınızı optimize edin</h2>
              <div className="space-y-12 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5 ml-3">
                <TimelineStep 
                  icon={<MousePointer2 size={20} />} 
                  title="Hızlı Başlangıç" 
                  description="Dakikalar içinde ajansınızı kurun ve ekibinizi davet edin." 
                  active={true}
                />
                <TimelineStep 
                  icon={<Layers size={20} />} 
                  title="Süreç Yönetimi" 
                  description="Görevleri atayın, projeleri takip edin ve iş birliğini artırın." 
                />
                <TimelineStep 
                  icon={<Zap size={20} />} 
                  title="Otomasyon" 
                  description="Tekrarlayan işleri yapay zeka ile otomatikleştirin ve zamandan tasarruf edin." 
                />
              </div>
            </div>
            <div className="bg-gradient-to-br from-zinc-800 to-black p-1 rounded-2xl">
              <div className="bg-black rounded-[15px] p-8 aspect-square flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#00e676]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="text-center relative z-10">
                  <div className="w-20 h-20 rounded-full bg-[#00e676]/10 flex items-center justify-center text-[#00e676] mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Zap size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Hızlanmaya Hazır Mısınız?</h3>
                  <p className="text-zinc-500 text-sm">MOI Port ile verimliliğinizi %40 oranında artırın.</p>
                </div>
              </div>
            </div>
          </div>

          {/* New System Features Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-white/5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-[#00e676]/10 flex items-center justify-center text-[#00e676]">
                  <MessageCircle size={20} />
                </div>
                <h4 className="text-lg font-bold text-white">CRM & İletişim</h4>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                WhatsApp ve Instagram mesajlarınızı tek merkezden yönetin. Müşteri adaylarınızı pipeline üzerinden takip ederek satışa dönüştürün.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-[#00e676]/10 flex items-center justify-center text-[#00e676]">
                  <Wallet size={20} />
                </div>
                <h4 className="text-lg font-bold text-white">Finans Yönetimi</h4>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Gelir-gider dengenizi koruyun. Otomatik faturalandırma, düzenli ödeme takibi ve detaylı finansal raporlarla karlılığınızı artırın.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-[#00e676]/10 flex items-center justify-center text-[#00e676]">
                  <Sparkles size={20} />
                </div>
                <h4 className="text-lg font-bold text-white">AI Asistanı</h4>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Saniyeler içinde profesyonel teklifler hazırlayın. Sosyal medya içeriklerinizi ve kampanya metinlerinizi yapay zeka desteğiyle oluşturun.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base font-bold tracking-wider uppercase text-[#00e676] mb-4">Fiyatlandırma</h2>
            <p className="text-4xl font-extrabold text-white sm:text-5xl">Sizinle birlikte büyüyen planlar</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard 
              title="Başlangıç" 
              description="Küçük ekipler ve yeni başlayanlar için temel paket." 
              price="1.495" 
              features={[
                "Görevler ve Projeler",
                "Sohbet (Chat)",
                "AI Teklifler ve AI İçerik (sınırlı)",
                "Finans: Genel Bakış ve Faturalar",
                "İK: Ekip Yönetimi",
                "Rol bazlı erişim",
                "5 Kullanıcı",
                "1GB Depolama",
                "E-posta destek"
              ]} 
            />
            <PricingCard 
              title="Profesyonel" 
              description="Büyüyen ajanslar ve profesyoneller için kapsamlı paket." 
              price="2.495" 
              features={[
                "CRM, WhatsApp, Instagram ve Müşteri Yönetimi",
                "Görevler ve Görev Raporları",
                "Projeler",
                "Sohbet (Chat)",
                "Sosyal Medya Planları",
                "AI Teklifler ve AI İçerik",
                "Finans: Gelir/Gider, Düzenli İşlemler, Faturalar",
                "İK: Ekip, Bordro & Maaşlar, Sözleşme & Evrak, İzinler",
                "Gelişmiş raporlama",
                "Rol bazlı erişim",
                "20 Kullanıcı",
                "100GB Depolama",
                "Öncelikli destek"
              ]} 
              popular={true}
            />
            <PricingCard 
              title="Kurumsal" 
              description="Büyük ölçekli organizasyonlar için tam kontrol." 
              price="7.495" 
              features={[
                "Sınırsız modül ve özellikler",
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
            />
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="border border-white/10 rounded-lg p-6 flex flex-col gap-4 group transition-all duration-300 hover:border-[#00e676]/50 hover:bg-white/5">
      <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-white group-hover:bg-[#00e676] group-hover:text-black transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function TimelineStep({ icon, title, description, active = false }: { icon: React.ReactNode, title: string, description: string, active?: boolean }) {
  return (
    <div className="relative group">
      <div 
        className={`absolute -left-[41px] top-1 h-5 w-5 rounded-full border-2 bg-[#050505] z-10 flex items-center justify-center transition-colors ${active ? 'border-[#00e676]' : 'border-zinc-700 group-hover:border-[#00e676]'}`}
      >
        {active && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }}></div>}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className={`transition-colors ${active ? 'text-[#00e676]' : 'text-zinc-400 group-hover:text-[#00e676]'}`}>
            {icon}
          </div>
          <h3 className={`text-lg font-bold transition-colors ${active ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>{title}</h3>
        </div>
        <p className={`text-sm pl-8 transition-colors ${active ? 'text-zinc-500' : 'text-zinc-600 group-hover:text-zinc-500'}`}>{description}</p>
      </div>
    </div>
  );
}

function PricingCard({ title, description, price, features, popular = false }: { title: string, description: string, price: string, features: string[], popular?: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const displayFeatures = showAll ? features : features.slice(0, 5);

  return (
    <div className={`border rounded-xl p-8 flex flex-col relative transition-all duration-300 ${popular ? 'bg-white/5 border-[#00e676]/50' : 'border-white/10 bg-transparent hover:border-white/20'}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-black text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ backgroundColor: primaryColor }}>
          En Popüler
        </div>
      )}
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 mb-6 min-h-[40px]">{description}</p>
      <div className="flex items-baseline gap-1 mb-8">
        <span className="text-4xl font-bold text-white">{price === 'Özel' ? price : `₺${price}`}</span>
        {price !== 'Özel' && <span className="text-zinc-500">/ay</span>}
      </div>
      <ul className="space-y-4 mb-4 flex-1">
        {displayFeatures.map((feature, i) => (
          <li key={i} className="flex gap-3 text-sm text-zinc-300">
            <Check size={18} className={popular ? 'text-[#00e676]' : 'text-green-500'} />
            {feature}
          </li>
        ))}
      </ul>
      
      {features.length > 5 && (
        <button 
          onClick={() => setShowAll(!showAll)}
          className="text-xs font-bold text-zinc-500 hover:text-[#00e676] transition-colors mb-8 text-left flex items-center gap-1"
        >
          {showAll ? 'Daha az göster' : `+${features.length - 5} özellik daha fazla`}
          <ArrowRight size={12} className={showAll ? '-rotate-90' : 'rotate-90'} />
        </button>
      )}

      <button 
        className={`w-full py-3 rounded text-sm font-bold transition ${popular ? 'bg-white text-black hover:bg-zinc-200' : 'border border-zinc-700 text-white hover:border-zinc-500'}`}
        style={popular ? { backgroundColor: primaryColor, color: 'black' } : {}}
      >
        Planı Seç
      </button>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, collapsed = false }: { icon: React.ReactNode, label: string, active?: boolean, collapsed?: boolean }) {
  return (
    <div
      className={`flex items-center ${
        collapsed ? "justify-center px-0" : "justify-start px-3"
      } gap-3 py-2 rounded-lg transition-colors cursor-pointer ${
        active ? "bg-[#00e676]/10 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
      }`}
    >
      <div className={active ? 'text-[#00e676]' : ''}>
        {icon}
      </div>
      {!collapsed && (
        <span className={`text-[13px] font-medium truncate ${active ? 'font-bold' : ''}`}>{label}</span>
      )}
    </div>
  );
}

function StatCard({ label, value, trend }: { label: string, value: string, trend?: string }) {
  return (
    <div className="bg-zinc-900 p-4 sm:p-5 rounded-xl border border-zinc-800 flex flex-col gap-1 shadow-sm">
      <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.12em]">{label}</span>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              trend.startsWith('+')
                ? 'bg-[#00e676]/10 text-[#00c853]'
                : 'bg-red-500/10 text-red-500'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ icon, text, time }: { icon: React.ReactNode, text: string, time: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="size-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-zinc-200 truncate">{text}</p>
        <p className="text-[10px] text-zinc-500 font-medium">{time}</p>
      </div>
    </div>
  );
}

function ProgressItem({ label, percent }: { label: string, percent: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-white">{label}</span>
        <span className="text-[10px] font-bold text-zinc-500">%{percent}</span>
      </div>
      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-[#00e676] transition-all duration-1000" style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}
