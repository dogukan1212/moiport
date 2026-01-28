"use client";

import Link from "next/link";
import {
  Infinity,
  Briefcase,
  Layers,
  Sparkles,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Bot,
  ArrowRight,
  ListTodo,
  Kanban,
  Trophy,
  BarChart3,
  Check,
  CheckCircle,
  Table,
  GanttChartSquare,
  CalendarRange,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { LandingHeader, LandingFooter } from "@/components/landing-layout";

function TaskItem({ title, project, assignee, dueDate, priority, status }: { 
  title: string, project: string, assignee: string, dueDate: string, 
  priority: 'Düşük' | 'Orta' | 'Yüksek', status: 'Tamamlandı' | 'Devam Ediyor' | 'Beklemede'
}) {
  const priorityColors = {
    'Düşük': 'text-blue-400 bg-blue-400/10',
    'Orta': 'text-yellow-400 bg-yellow-400/10',
    'Yüksek': 'text-red-400 bg-red-400/10'
  };

  const statusIcons = {
    'Tamamlandı': <CheckCircle2 size={16} className="text-[#00e676]" />,
    'Devam Ediyor': <Clock size={16} className="text-blue-400" />,
    'Beklemede': <AlertCircle size={16} className="text-zinc-500" />
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#00e676]/30 hover:bg-white/[0.04] transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-5 flex-1">
        <div className={`size-12 rounded-2xl flex items-center justify-center transition-colors ${status === 'Tamamlandı' ? 'bg-[#00e676]/10 text-[#00e676]' : 'bg-white/5 text-zinc-500'}`}>
          {statusIcons[status]}
        </div>
        <div>
          <h4 className="text-sm font-bold text-white group-hover:text-[#00e676] transition-colors mb-1">{title}</h4>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Briefcase size={12} className="text-zinc-600" /> {project}
            </span>
            <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar size={12} className="text-zinc-600" /> {dueDate}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400 group-hover:border-[#00e676]/30 transition-colors">
            {assignee.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="hidden lg:block">
            <div className="text-[10px] font-bold text-white leading-none mb-1">{assignee}</div>
            <div className="text-[9px] text-zinc-500 font-medium">Sorumlu</div>
          </div>
        </div>

        <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${priorityColors[priority]}`}>
          {priority.toUpperCase()}
        </div>

        <button className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </motion.div>
  );
}

export default function Tasks() {
  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#00e676] selection:text-black">
      <LandingHeader />

      {/* Hero / Header Section */}
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
                <ListTodo size={14} />
                <span>GÖREV & VERİMLİLİK YÖNETİMİ</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6"
              >
                Ekibinizin <br /><span className="text-[#00e676]">Üretkenliğini</span> Katlayın
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-zinc-400"
              >
                Görevleri yapay zeka ile önceliklendirin, süreçleri otomatize edin ve projenin her aşamasını gerçek zamanlı izleyin.
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex gap-4"
            >
              <button className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors flex items-center gap-2 group">
                <Kanban size={18} className="group-hover:text-[#00e676] transition-colors" />
                Board Görünümü
              </button>
              <button className="bg-[#00e676] text-black px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2">
                <Plus size={18} />
                Yeni Görev
              </button>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Aktif Görevler</div>
              <div className="text-2xl md:text-3xl font-bold text-white">42</div>
              <div className="text-[9px] md:text-[10px] font-bold text-[#00e676] mt-1">+8 Bu Hafta</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Tamamlanan</div>
              <div className="text-2xl md:text-3xl font-bold text-white">128</div>
              <div className="text-[9px] md:text-[10px] font-bold text-[#00e676] mt-1">%94 Başarı</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Geciken</div>
              <div className="text-2xl md:text-3xl font-bold text-red-500">3</div>
              <div className="text-[9px] md:text-[10px] font-bold text-red-500/50 mt-1">Acil Müdahale</div>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#00e676]/10 to-transparent border border-[#00e676]/20">
              <div className="flex items-center gap-2 text-[#00e676] mb-2">
                <Trophy size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Haftanın Ekibi</span>
              </div>
              <div className="text-sm md:text-xl font-bold text-white">Tasarım Ekibi</div>
              <div className="text-[9px] md:text-[10px] text-zinc-400 mt-1">12 Görev Tamamlandı</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Task Management Section */}
      <section className="relative pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 mb-20">
            {/* Left: Task List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Güncel Görevler</h3>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                    <input 
                      type="text" 
                      placeholder="Görev ara..." 
                      className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-[#00e676]/50 transition-colors w-48"
                    />
                  </div>
                  <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors">
                    <Filter size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <TaskItem 
                  title="Anasayfa Redesign ve UI Kit Güncellemesi" 
                  project="MOI Port v2.0" 
                  assignee="Ali Yılmaz" 
                  dueDate="Yarın" 
                  priority="Yüksek" 
                  status="Devam Ediyor" 
                />
                <TaskItem 
                  title="API Entegrasyonu ve Test Senaryoları" 
                  project="Backend Core" 
                  assignee="Mert Demir" 
                  dueDate="25 Oca" 
                  priority="Yüksek" 
                  status="Devam Ediyor" 
                />
                <TaskItem 
                  title="Müşteri Paneli Dashboard Çizimleri" 
                  project="Design System" 
                  assignee="Selin Kaya" 
                  dueDate="Tamamlandı" 
                  priority="Orta" 
                  status="Tamamlandı" 
                />
                <TaskItem 
                  title="Mobil Uygulama Push Notification Ayarları" 
                  project="Mobile App" 
                  assignee="Can Öz" 
                  dueDate="28 Oca" 
                  priority="Düşük" 
                  status="Beklemede" 
                />
              </div>

              <button className="w-full py-4 rounded-xl border border-dashed border-white/10 text-zinc-500 text-sm font-medium hover:bg-white/[0.02] hover:border-white/20 transition-all">
                + Tüm Görevleri Görüntüle
              </button>
            </div>

            {/* Right: AI & Productivity Insights */}
            <div className="space-y-8">
              {/* AI Task Prioritizer */}
              <div className="p-8 rounded-[2rem] bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 text-purple-500/10 group-hover:text-purple-500/20 transition-colors">
                  <Bot size={80} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-purple-400 mb-6">
                    <Sparkles size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">AI Önceliklendirme</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-4">Akıllı İş Listesi</h4>
                  <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                    Yapay zeka, teslim tarihlerini ve ekip yoğunluğunu analiz ederek bugün odaklanmanız gereken en kritik 3 görevi belirledi.
                  </p>
                  <div className="space-y-3">
                    {['UI Kit Revizyonu', 'Ödeme API Testi', 'Müşteri Sunumu'].map((task, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="size-2 rounded-full bg-purple-500" />
                        <span className="text-xs font-bold text-zinc-200">{task}</span>
                        <ArrowRight size={12} className="ml-auto text-zinc-600" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Productivity Chart */}
              <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/5 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-white mb-8">Verimlilik Analizi</h3>
                <div className="h-40 flex items-end gap-2 px-2">
                  {[30, 45, 35, 60, 55, 80, 70].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <motion.div 
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        className="w-full bg-[#00e676]/20 border-t-2 border-[#00e676] rounded-t-sm"
                      />
                      <span className="text-[8px] font-bold text-zinc-600 uppercase">
                        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][i]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <span>Haftalık Artış</span>
                    <span className="text-[#00e676]">+%12.4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Task Explanations */}
      <section className="py-20 lg:py-40 relative overflow-hidden bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Kanban & Workflow Section */}
          <div className="grid lg:grid-cols-2 gap-20 items-center mb-40">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e676]/10 text-[#00e676] text-xs font-bold mb-6"
              >
                <Kanban size={14} />
                <span>MODERN İŞ AKIŞI</span>
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">
                Kanban ile <br /><span className="text-[#00e676]">Görsel Yönetim</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                Görevleri sürükle-bırak yöntemiyle yönetin. "Yapılacaklar"dan "Tamamlandı"ya kadar olan tüm süreci tek bir bakışta görün.
              </p>
              <div className="space-y-6">
                {[
                  { title: "Sürükle & Bırak Kolaylığı", desc: "Görev durumlarını anında güncelleyin, iş akışını hızlandırın." },
                  { title: "Özel Sütunlar", desc: "Ajansınıza özel süreçler (Tasarım, Onay, Yayında) oluşturun." },
                  { title: "Görsel Önceliklendirme", desc: "Renk kodlu etiketlerle acil işleri hemen fark edin." }
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
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
              >
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-blue-500 w-2/3" />
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-yellow-500 w-1/3" />
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-[#00e676] w-full" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="size-3 rounded-full bg-blue-500 mb-2" />
                      <div className="h-2 w-12 bg-white/10 rounded mb-2" />
                      <div className="h-2 w-8 bg-white/5 rounded" />
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="size-3 rounded-full bg-blue-500 mb-2" />
                      <div className="h-2 w-10 bg-white/10 rounded mb-2" />
                      <div className="h-2 w-14 bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="size-3 rounded-full bg-yellow-500 mb-2" />
                      <div className="h-2 w-14 bg-white/10 rounded mb-2" />
                      <div className="h-2 w-10 bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="p-3 rounded-xl bg-[#00e676]/10 border border-[#00e676]/20">
                      <CheckCircle size={16} className="text-[#00e676] mb-2" />
                      <div className="h-2 w-12 bg-[#00e676]/20 rounded mb-2" />
                      <div className="h-2 w-8 bg-[#00e676]/10 rounded" />
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex justify-center">
                  <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Board Simülasyonu
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Table & Timeline Section */}
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full"></div>
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
              >
                {/* Timeline Simulation */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-1">
                      {[1,2,3,4,5,6,7].map(i => (
                        <div key={i} className="size-6 rounded bg-white/5 flex items-center justify-center text-[8px] font-bold text-zinc-600">{i}</div>
                      ))}
                    </div>
                    <div className="text-[10px] font-bold text-[#00e676] uppercase tracking-widest">Ocak 2026</div>
                  </div>
                  
                  <div className="relative h-40 border-l border-white/5 ml-4">
                    <div className="absolute left-0 top-4 w-48 h-8 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center px-3 gap-2">
                      <div className="size-2 rounded-full bg-blue-500" />
                      <div className="h-1.5 w-20 bg-blue-500/40 rounded" />
                    </div>
                    <div className="absolute left-20 top-16 w-32 h-8 bg-[#00e676]/20 border border-[#00e676]/30 rounded-lg flex items-center px-3 gap-2">
                      <div className="size-2 rounded-full bg-[#00e676]" />
                      <div className="h-1.5 w-12 bg-[#00e676]/40 rounded" />
                    </div>
                    <div className="absolute left-10 top-28 w-40 h-8 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center px-3 gap-2">
                      <div className="size-2 rounded-full bg-purple-500" />
                      <div className="h-1.5 w-16 bg-purple-500/40 rounded" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <Table size={18} className="text-blue-400 mb-3" />
                    <div className="text-[10px] font-bold text-white uppercase mb-1">Tablo Görünümü</div>
                    <div className="text-[9px] text-zinc-500 leading-relaxed">Detaylı liste ve toplu düzenleme.</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <CalendarRange size={18} className="text-[#00e676] mb-3" />
                    <div className="text-[10px] font-bold text-white uppercase mb-1">Takvim Planlama</div>
                    <div className="text-[9px] text-zinc-500 leading-relaxed">Deadline takibi ve sürükle-bırak.</div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="order-1 lg:order-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold mb-6"
              >
                <GanttChartSquare size={14} />
                <span>ÇOKLU GÖRÜNÜM</span>
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">
                İşinizi İstediğiniz <br /><span className="text-blue-400">Açıdan Görün</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                Her ekip farklı çalışır. Tasarımcılar Kanban'ı, yöneticiler Tablo'yu, planlamacılar ise Zaman Çizelgesi'ni tercih eder. MOI Port ile tek tıkla geçiş yapın.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <Table size={20} />, title: "Tablo Görünümü", desc: "Excel hızı ve esnekliğinde veri yönetimi." },
                  { icon: <GanttChartSquare size={20} />, title: "Zaman Çizelgesi", desc: "Gantt şeması ile projelerin süresini planlayın." },
                  { icon: <CalendarRange size={20} />, title: "Takvim", desc: "Ekip takvimini ortaklaşa yönetin." },
                  { icon: <Layers size={20} />, title: "Liste", desc: "Klasik ve hızlı görev listeleme." }
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-all group">
                    <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <h4 className="text-white font-bold mb-2">{item.title}</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Productivity Section */}
          <div className="grid lg:grid-cols-2 gap-20 items-center mt-40">
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-purple-500/10 blur-[100px] rounded-full"></div>
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="size-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Sparkles size={28} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xl">AI Verimlilik Raporu</h4>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Haftalık Analiz</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="text-sm text-zinc-400">Tamamlanma Hızı</span>
                    <span className="text-sm font-bold text-[#00e676]">+%22 Hızlı</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="text-sm text-zinc-400">Ekip Mutluluğu</span>
                    <span className="text-sm font-bold text-blue-500">Yüksek</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                    <div className="flex items-center gap-2 mb-2 text-purple-400">
                      <Bot size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">AI Önerisi</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                      "Tasarım ekibi son 3 gündür %90 kapasiteyle çalışıyor. Yeni görevleri Pazartesi gününe planlamak tükenmişliği (burnout) önleyebilir."
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
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-xs font-bold mb-6"
              >
                <BarChart3 size={14} />
                <span>AKILLI ANALİTİK</span>
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">
                Verilerle <br /><span className="text-purple-500">Performans Analizi</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                Ekibinizin verimliliğini sadece hislerle değil, somut verilerle ölçün. Yapay zeka destekli raporlarla darboğazları tespit edin.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Zaman Takibi", desc: "Hangi göreve ne kadar vakit harcandığını görün." },
                  { title: "Kapasite Planlama", desc: "Ekip üyelerinin iş yükünü dengeli dağıtın." },
                  { title: "Gecikme Analizi", desc: "Tekrarlayan gecikmelerin nedenini bulun." },
                  { title: "Otomatik Rapor", desc: "Haftalık performans raporlarını PDF olarak alın." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="size-5 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 shrink-0 mt-1">
                      <Check size="12" strokeWidth={3} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">{item.title}</h4>
                      <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative rounded-[3rem] bg-gradient-to-br from-[#00e676]/20 via-[#0a0a0a] to-[#0a0a0a] border border-white/10 p-12 md:p-20 overflow-hidden text-center">
            <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
              <Infinity size={400} />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto"
            >
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-8 tracking-tight">
                İşlerinizi <br /><span className="text-[#00e676]">düzene sokmaya hazır mısınız?</span>
              </h2>
              <p className="text-lg text-zinc-400 mb-10">
                MOI Port Görev Yönetimi ile karmaşaya son verin, ekibinizin odaklanmasını sağlayın.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login" className="bg-[#00e676] text-black px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform">
                  Hemen Başlayın
                </Link>
                <button className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/10 transition-colors">
                  Tanıtım İzle
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
