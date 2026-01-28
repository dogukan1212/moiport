"use client";

import Link from "next/link";
import {
  Infinity,
  Check,
  Briefcase,
  Plus,
  Filter,
  MoreHorizontal,
  Users,
  Clock,
  Calendar,
  Layers,
  LayoutDashboard,
  Target,
  Wallet,
  MessageCircle,
  Sparkles,
  FileText,
  Settings,
  ArrowUpRight,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LandingHeader,
  LandingFooter,
  primaryColor,
} from "@/components/landing-layout";

function ProjectCard({ title, client, progress, deadline, status, members, category }: { 
  title: string, 
  client: string, 
  progress: number, 
  deadline: string, 
  status: 'Devam Ediyor' | 'Planlandı' | 'Beklemede' | 'Tamamlandı',
  members: number,
  category: string
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{category}</div>
        <button className="text-zinc-600 hover:text-white transition-colors"><MoreHorizontal size={18} /></button>
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00e676] transition-colors">{title}</h3>
      <p className="text-sm text-zinc-500 mb-6">{client}</p>
      
      <div className="space-y-4 mb-8">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
          <span className="text-zinc-500">İlerleme</span>
          <span className="text-white">%{progress}</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: `${progress}%` }}
            viewport={{ once: true }}
            className="h-full bg-[#00e676] rounded-full shadow-[0_0_10px_rgba(0,230,118,0.3)]"
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-6 border-t border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3].slice(0, members).map(i => (
              <div key={i} className="size-8 rounded-full border-2 border-[#050505] bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                U{i}
              </div>
            ))}
            {members > 3 && (
              <div className="size-8 rounded-full border-2 border-[#050505] bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                +{members - 3}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            <Clock size={12} />
            {deadline}
          </div>
          <div className={`text-[10px] font-bold uppercase tracking-widest ${
            status === 'Devam Ediyor' ? 'text-blue-400' :
            status === 'Planlandı' ? 'text-purple-400' :
            status === 'Beklemede' ? 'text-orange-400' :
            'text-[#00e676]'
          }`}>{status}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const [activeTab, setActiveTab] = useState('Hepsi');

  const projects = [
    { title: "E-Ticaret Platformu", client: "TechCorp Solutions", progress: 65, deadline: "12 ŞUB", status: "Devam Ediyor" as const, members: 5, category: "Geliştirme" },
    { title: "Kurumsal Kimlik", client: "Global Logistics", progress: 100, deadline: "Tamamlandı", status: "Tamamlandı" as const, members: 2, category: "Tasarım" },
    { title: "SEO Optimizasyonu", client: "Fresh Eats", progress: 20, deadline: "25 OCA", status: "Devam Ediyor" as const, members: 3, category: "Pazarlama" },
    { title: "Mobil Uygulama", client: "Urban Style", progress: 10, deadline: "15 MAR", status: "Planlandı" as const, members: 4, category: "Geliştirme" },
    { title: "Sosyal Medya Yönetimi", client: "Legal Partners", progress: 85, deadline: "Sürekli", status: "Devam Ediyor" as const, members: 2, category: "Pazarlama" },
    { title: "Web Sitesi Yenileme", client: "Innovate Lab", progress: 0, deadline: "1 ŞUB", status: "Beklemede" as const, members: 3, category: "Tasarım" },
  ];

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
                <Briefcase size={14} />
                <span>PROJE YÖNETİMİ</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6"
              >
                Aktif <br /><span className="text-[#00e676]">Çalışmalar</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-zinc-400"
              >
                Tüm projelerinizi, ilerleme durumlarını ve ekip performansını anlık olarak takip edin.
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex gap-4"
            >
              <button className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                <Calendar size={18} />
                Zaman Çizelgesi
              </button>
              <button className="bg-[#00e676] text-black px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2">
                <Plus size={18} />
                Yeni Proje
              </button>
            </motion.div>
          </div>

          {/* Project Filters */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
            <div className="flex flex-nowrap gap-1 bg-white/5 px-1 py-0.5 rounded-full border border-white/10 max-w-full overflow-x-auto">
              {['Hepsi', 'Devam Edenler', 'Bekleyenler', 'Tamamlananlar'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2 md:px-4 lg:px-5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all ${activeTab === tab ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                placeholder="Proje ara..." 
                className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#00e676]/50 transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid Section */}
      <section className="relative pb-32">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-[0.03]" 
               style={{ backgroundImage: `radial-gradient(${primaryColor} 1px, transparent 1px)`, backgroundSize: '32px 32px' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[#00e676]/5 blur-[120px] rounded-full opacity-50"></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, i) => (
              <ProjectCard key={i} {...project} />
            ))}
          </div>

          {/* Project Summary / Stats */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 backdrop-blur-sm flex items-center gap-6">
              <div className="size-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Layers size={32} />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">24</div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Aktif Görev</div>
              </div>
            </div>
            <div className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 backdrop-blur-sm flex items-center gap-6">
              <div className="size-16 rounded-3xl bg-[#00e676]/10 flex items-center justify-center text-[#00e676]">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">152</div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tamamlanan İş</div>
              </div>
            </div>
            <div className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 backdrop-blur-sm flex items-center gap-6">
              <div className="size-16 rounded-3xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <AlertCircle size={32} />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">3</div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Geciken Proje</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
