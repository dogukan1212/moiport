"use client";

import Link from "next/link";
import {
  Infinity,
  Check,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Users,
  LayoutDashboard,
  Target,
  Wallet,
  Briefcase,
  Layers,
  MessageCircle,
  Sparkles,
  FileText,
  Settings,
  Mail,
  Phone,
  Globe,
  ArrowUpRight,
  Download,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LandingHeader,
  LandingFooter,
  primaryColor,
} from "@/components/landing-layout";

function CustomerRow({ name, company, email, phone, status, revenue, projects }: { 
  name: string, 
  company: string, 
  email: string, 
  phone: string, 
  status: 'Aktif' | 'Beklemede' | 'Pasif', 
  revenue: string,
  projects: number
}) {
  return (
    <motion.tr 
      initial={{ opacity: 0, y: 5 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group border-b border-white/5 hover:bg-white/[0.01] transition-colors"
    >
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-xs font-bold text-zinc-400">
            {name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="text-sm font-bold text-white group-hover:text-[#00e676] transition-colors">{name}</div>
            <div className="text-xs text-zinc-500">{company}</div>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Mail size={12} />
            {email}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Phone size={12} />
            {phone}
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          status === 'Aktif' ? 'bg-[#00e676]/10 text-[#00e676]' : 
          status === 'Beklemede' ? 'bg-orange-500/10 text-orange-500' : 
          'bg-zinc-500/10 text-zinc-500'
        }`}>
          <div className={`size-1.5 rounded-full ${
            status === 'Aktif' ? 'bg-[#00e676]' : 
            status === 'Beklemede' ? 'bg-orange-500' : 
            'bg-zinc-500'
          }`} />
          {status}
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="text-sm font-bold text-white">{revenue}</div>
        <div className="text-[10px] text-zinc-500">Toplam Ödeme</div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold text-white">{projects}</div>
          <div className="text-[10px] text-zinc-500">Proje</div>
        </div>
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex justify-end gap-2">
          <button className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");

  const customers = [
    { name: "Ahmet Yılmaz", company: "TechCorp Solutions", email: "ahmet@techcorp.com", phone: "+90 532 123 45 67", status: "Aktif" as const, revenue: "₺145,000", projects: 4 },
    { name: "Selin Demir", company: "Global Logistics", email: "selin@globallog.com", phone: "+90 544 987 65 43", status: "Aktif" as const, revenue: "₺82,500", projects: 2 },
    { name: "Can Özkan", company: "Fresh Eats", email: "can@fresheats.co", phone: "+90 505 555 44 33", status: "Beklemede" as const, revenue: "₺12,000", projects: 1 },
    { name: "Merve Kaya", company: "Urban Style", email: "merve@urbanstyle.com", phone: "+90 533 222 11 00", status: "Aktif" as const, revenue: "₺210,000", projects: 6 },
    { name: "Burak Şahin", company: "Legal Partners", email: "burak@legalp.com", phone: "+90 530 444 33 22", status: "Pasif" as const, revenue: "₺45,000", projects: 3 },
    { name: "Zeynep Aksoy", company: "Innovate Lab", email: "zeynep@innovate.io", phone: "+90 541 777 88 99", status: "Aktif" as const, revenue: "₺320,000", projects: 5 },
    { name: "Deniz Yıldız", company: "Startup X", email: "deniz@startupx.com", phone: "+90 555 111 22 33", status: "Beklemede" as const, revenue: "₺0", projects: 0 },
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
                <Users size={14} />
                <span>MÜŞTERİ YÖNETİMİ</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6"
              >
                Müşteri <br /><span className="text-[#00e676]">Rehberi</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-zinc-400"
              >
                Tüm müşterilerinizin bilgilerini, proje durumlarını ve finansal geçmişlerini tek bir yerden yönetin.
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex gap-4"
            >
              <button className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                <Download size={18} />
                Dışa Aktar
              </button>
              <button className="bg-[#00e676] text-black px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2">
                <Plus size={18} />
                Yeni Müşteri
              </button>
            </motion.div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: "Toplam Müşteri", value: "124", icon: <Users size={20} />, trend: "+12" },
              { label: "Aktif Projeler", value: "48", icon: <Briefcase size={20} />, trend: "+5" },
              { label: "Toplam Ciro", value: "₺1.2M", icon: <Wallet size={20} />, trend: "+%18" },
              { label: "Ort. Memnuniyet", value: "4.9/5", icon: <Check size={20} />, trend: "0.0" },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 text-zinc-500 mb-4">
                  {stat.icon}
                  <span className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-[10px] font-bold text-[#00e676]">{stat.trend}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="relative pb-32">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-[0.03]" 
               style={{ backgroundImage: `radial-gradient(${primaryColor} 1px, transparent 1px)`, backgroundSize: '32px 32px' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[#00e676]/5 blur-[120px] rounded-full opacity-50"></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
            {/* Table Controls */}
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Müşteri veya şirket ara..." 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#00e676]/50 transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  <Filter size={16} />
                  Filtrele
                </button>
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  Sırala
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="py-4 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Müşteri & Şirket</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">İletişim</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Durum</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Finansal</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Projeler</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, i) => (
                    <CustomerRow key={i} {...customer} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-6 border-t border-white/5 flex items-center justify-between">
              <div className="text-xs text-zinc-500 font-medium">
                Toplam <span className="text-white">124</span> müşteriden <span className="text-white">1-7</span> arası gösteriliyor
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-colors disabled:opacity-50" disabled>Geri</button>
                <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-colors">İleri</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
