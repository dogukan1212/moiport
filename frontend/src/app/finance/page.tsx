"use client";

import Link from "next/link";
import {
  Check,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  DollarSign,
  FileText,
  TrendingUp,
  BarChart3,
  CreditCard,
  Plus,
  Filter,
  MoreHorizontal,
  Download,
  Calendar,
  PieChart,
  MessageCircle,
  Sparkles,
  Clock,
  ShieldCheck,
  Zap,
  Bot,
  ArrowRight,
  Receipt,
  Banknote,
  Building2,
  Users,
  Infinity,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LandingHeader,
  LandingFooter,
  primaryColor,
} from "@/components/landing-layout";

function FinanceStatCard({ label, value, trend, trendUp, icon, color }: { 
  label: string, 
  value: string, 
  trend: string, 
  trendUp: boolean, 
  icon: React.ReactNode,
  color: string 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity" style={{ color }}>
        {icon}
      </div>
      <div className="flex items-center gap-3 text-zinc-500 mb-4">
        <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center" style={{ color }}>
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-2">{value}</div>
      <div className={`flex items-center gap-1 text-[10px] font-bold ${trendUp ? 'text-[#00e676]' : 'text-red-500'}`}>
        {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {trend}
        <span className="text-zinc-600 ml-1">geçen aya göre</span>
      </div>
    </motion.div>
  );
}

function InvoiceRow({ id, customer, amount, date, status }: { id: string, customer: string, amount: string, date: string, status: 'Ödendi' | 'Bekliyor' | 'Gecikmiş' }) {
  return (
    <tr className="group border-b border-white/5 hover:bg-white/[0.01] transition-colors">
      <td className="py-4 px-4">
        <div className="text-sm font-bold text-white group-hover:text-[#00e676] transition-colors">#{id}</div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{date}</div>
      </td>
      <td className="py-4 px-4">
        <div className="text-sm font-medium text-zinc-200">{customer}</div>
      </td>
      <td className="py-4 px-4 text-sm font-bold text-white">{amount}</td>
      <td className="py-4 px-4">
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          status === 'Ödendi' ? 'bg-[#00e676]/10 text-[#00e676]' : 
          status === 'Bekliyor' ? 'bg-orange-500/10 text-orange-500' : 
          'bg-red-500/10 text-red-500'
        }`}>
          <div className={`size-1.5 rounded-full ${
            status === 'Ödendi' ? 'bg-[#00e676]' : 
            status === 'Bekliyor' ? 'bg-orange-500' : 
            'bg-red-500'
          }`} />
          {status}
        </div>
      </td>
      <td className="py-4 px-4 text-right">
        <button className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all">
          <Download size={14} />
        </button>
      </td>
    </tr>
  );
}

export default function Finance() {
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#00e676] selection:text-black overflow-x-hidden">
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
                <Wallet size={14} />
                <span>FİNANSAL YÖNETİM & ANALİTİK</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6"
              >
                Ajansınızın <br /><span className="text-[#00e676]">Nakit Akışını</span> Yönetin
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-zinc-400"
              >
                Gelir-gider dengenizi koruyun, faturalarınızı otomatikleştirin ve AI destekli finansal projeksiyonlarla geleceği bugünden görün.
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex gap-4"
            >
              <button className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors flex items-center gap-2 group">
                <FileText size={18} className="group-hover:text-[#00e676] transition-colors" />
                Raporlar
              </button>
              <button className="bg-[#00e676] text-black px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2">
                <Plus size={18} />
                Yeni Fatura
              </button>
            </motion.div>
          </div>

          {/* Quick Actions & Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <FinanceStatCard label="Aylık Tekrarlayan Gelir" value="₺245,000" trend="+%14.2" trendUp={true} icon={<TrendingUp size={20} />} color="#00e676" />
            <FinanceStatCard label="Net Kar (Bu Ay)" value="₺117,500" trend="+₺22k" trendUp={true} icon={<Zap size={20} />} color="#3b82f6" />
            <FinanceStatCard label="Bekleyen Tahsilat" value="₺42,000" trend="-%5" trendUp={true} icon={<Clock size={20} />} color="#f59e0b" />
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="p-4 md:p-6 rounded-2xl bg-gradient-to-br from-[#00e676]/20 to-transparent border border-[#00e676]/20 flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 text-[#00e676] mb-3">
                <Bot size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">AI Tahminleme</span>
              </div>
              <p className="text-[11px] md:text-xs text-zinc-300 mb-3">
                Gelecek ayki tahmini geliriniz <span className="text-white font-bold">₺280,000</span> civarında olması bekleniyor.
              </p>
              <button className="text-[10px] font-bold text-[#00e676] flex items-center gap-1 hover:underline uppercase tracking-wider">
                Analizi Gör <ArrowRight size={12} />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="relative pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 mb-20">
            {/* Left: Chart & Invoices */}
            <div className="lg:col-span-2 space-y-8">
              {/* Performance Chart */}
              <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/5 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Finansal Performans</h3>
                    <p className="text-xs text-zinc-500 font-medium">Gelir vs Gider karşılaştırmalı analizi</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 rounded-full bg-[#00e676]/10 border border-[#00e676]/20 text-[10px] font-bold text-[#00e676]">Gelir</button>
                    <button className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-500">Gider</button>
                  </div>
                </div>
                
                <div className="h-64 flex items-end gap-3 px-2">
                  {[45, 65, 55, 85, 75, 95].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                      <div className="w-full flex items-end gap-1">
                        <motion.div 
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="flex-1 bg-gradient-to-t from-[#00e676]/10 to-[#00e676] rounded-t-lg group-hover/bar:brightness-110 transition-all relative"
                        >
                        </motion.div>
                        <motion.div 
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h * 0.4}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="flex-1 bg-gradient-to-t from-red-500/10 to-red-500 rounded-t-lg group-hover/bar:brightness-110 transition-all"
                        >
                        </motion.div>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                        {['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoices Table */}
              <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/5 backdrop-blur-sm overflow-hidden relative">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-bold text-white">Bekleyen İşlemler</h3>
                  <button className="text-xs font-bold text-[#00e676] hover:underline uppercase tracking-wider">Tümünü Yönet</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="py-4 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">No / Tarih</th>
                        <th className="py-4 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Müşteri / Detay</th>
                        <th className="py-4 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tutar</th>
                        <th className="py-4 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      <InvoiceRow id="INV-2026-001" customer="TechCorp Solutions" amount="₺45,000" date="23 OCA 2026" status="Ödendi" />
                      <InvoiceRow id="INV-2026-002" customer="Global Logistics" amount="₺12,500" date="21 OCA 2026" status="Bekliyor" />
                      <InvoiceRow id="INV-2026-003" customer="Fresh Eats" amount="₺8,500" date="18 OCA 2026" status="Ödendi" />
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Insights & Bank */}
            <div className="space-y-8">
              {/* Expense Breakdown */}
              <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/5 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-white mb-8">Gider Dağılımı</h3>
                <div className="space-y-6">
                  {[
                    { label: "Personel & Maaş", percent: 65, color: "#3b82f6" },
                    { label: "Yazılım & Araçlar", percent: 20, color: "#a855f7" },
                    { label: "Ofis & Genel", percent: 10, color: "#f59e0b" },
                    { label: "Pazarlama", percent: 5, color: "#00e676" },
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                        <span className="text-zinc-400">{item.label}</span>
                        <span className="text-white">%{item.percent}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.percent}%` }}
                          viewport={{ once: true }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bank Integration Card */}
              <div className="p-8 rounded-[2rem] bg-gradient-to-br from-[#00e676]/10 to-transparent border border-[#00e676]/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 text-[#00e676]/20 group-hover:text-[#00e676]/40 transition-colors">
                  <ShieldCheck size={80} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-[#00e676] mb-6">
                    <Building2 size={20} />
                    <span className="text-xs font-bold uppercase tracking-widest">Banka Entegrasyonu</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-4">Gerçek Zamanlı Takip</h4>
                  <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                    Banka hesaplarınızı MOI Port'a bağlayın, gelen ödemeleri otomatik olarak faturalarla eşleştirin.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-300">Garanti BBVA</div>
                    <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-300">İş Bankası</div>
                    <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-300">Stripe</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* New Section: Smart Invoicing & Agency Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
            >
              <div className="size-14 rounded-2xl bg-[#00e676]/10 flex items-center justify-center text-[#00e676] mb-8 group-hover:scale-110 transition-transform">
                <Receipt size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Akıllı Faturalandırma</h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                Tekrarlayan ödemeler için otomatik fatura oluşturun, müşterilerinize hatırlatıcılar gönderin ve tahsilat sürenizi %40 kısaltın.
              </p>
              <ul className="space-y-3">
                {['Otomatik PDF Oluşturma', 'Ödeme Hatırlatıcıları', 'Çoklu Para Birimi'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                    <Check size={14} className="text-[#00e676]" /> {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
            >
              <div className="size-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-8 group-hover:scale-110 transition-transform">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Maaş & Bordro</h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                Ekibinizin maaşlarını, primlerini ve yan haklarını tek platformdan yönetin. Finansal raporlarınızda personel giderlerini anlık izleyin.
              </p>
              <ul className="space-y-3">
                {['Personel Bazlı Gider', 'Prim Hesaplama', 'Bordro Arşivi'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                    <Check size={14} className="text-blue-500" /> {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
            >
              <div className="size-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-8 group-hover:scale-110 transition-transform">
                <BarChart3 size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Karlılık Analizi</h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                Proje bazlı karlılığınızı ölçün. Hangi müşterinin veya hangi hizmet kaleminin size daha fazla kazandırdığını tek tıkla öğrenin.
              </p>
              <ul className="space-y-3">
                {['Proje Karlılık Oranı', 'Müşteri LTV Analizi', 'Gider Optimizasyonu'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                    <Check size={14} className="text-purple-500" /> {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Detailed Finance Explanations */}
      <section className="py-20 lg:py-40 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* AI Advisor Section */}
          <div className="grid lg:grid-cols-2 gap-20 items-center mb-40">
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-[#3b82f6]/10 blur-[100px] rounded-full"></div>
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="relative bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Bot size={24} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">AI Finansal Analiz</h4>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Mart 2026 Tahmini</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20">AKTİF</div>
                </div>

                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-xs text-zinc-400 font-medium">Tahmini Nakit Akışı</span>
                      <span className="text-lg font-bold text-white">₺312,450</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '85%' }}
                        className="h-full bg-blue-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 text-center">Risk Seviyesi</div>
                      <div className="text-sm font-bold text-green-500 text-center">DÜŞÜK</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 text-center">Büyüme Pot.</div>
                      <div className="text-sm font-bold text-blue-500 text-center">+%18.4</div>
                    </div>
                  </div>

                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-3">
                    <Sparkles size={18} className="text-blue-500 shrink-0" />
                    <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                      "Önümüzdeki ay personel giderlerinizde %5 artış olsa dahi, mevcut abonelik gelirleriniz nakit akışınızı korumak için yeterli."
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
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold mb-6"
              >
                <Zap size={14} />
                <span>AKILLI FİNANSAL ASİSTAN</span>
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">
                Finansal Geleceğinizi <br /><span className="text-blue-500">Yapay Zeka</span> ile Görün
              </h2>
              <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                Karmaşık tablolar arasında kaybolmayın. MOI Port'un yapay zekası verilerinizi anlık analiz eder, riskleri tespit eder ve size büyüme stratejileri sunar.
              </p>
              <div className="space-y-6">
                {[
                  { title: "Nakit Akışı Projeksiyonu", desc: "Geçmiş verilere dayanarak gelecek aylardaki bakiyenizi tahmin edin." },
                  { title: "Gider Optimizasyonu", desc: "Gereksiz abonelikleri ve yüksek maliyetli kalemleri AI ile keşfedin." },
                  { title: "Otomatik Vergi Hatırlatıcı", desc: "Beyanname ve vergi dönemlerini yapay zeka ile önceden planlayın." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="size-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0 mt-1">
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
          </div>

          {/* Automation Flow Section */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e676]/10 text-[#00e676] text-xs font-bold mb-6"
              >
                <Banknote size={14} />
                <span>OTOMATİK TAHSİLAT SİSTEMİ</span>
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">
                Ödemelerinizi <br /><span className="text-[#00e676]">Takip Etmeyi</span> Bırakın
              </h2>
              <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                Müşterilerinizle para konuşmak zorunda kalmayın. Otomatik sistemlerimiz fatura oluşturmadan ödeme hatırlatmasına kadar tüm süreci sizin adınıza yönetir.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <Clock size={18} />, title: "Akıllı Hatırlatıcı", desc: "Vadesi yaklaşan faturalar için nazik hatırlatmalar." },
                  { icon: <CreditCard size={18} />, title: "Online Ödeme", desc: "Kredi kartı ile tek tıkla tahsilat imkanı." },
                  { icon: <ShieldCheck size={18} />, title: "Güvenli İşlem", desc: "Tüm finansal verileriniz uçtan uca şifreli." },
                  { icon: <Zap size={18} />, title: "Anlık Mutabakat", desc: "Ödeme yapıldığı an fatura otomatik kapansın." }
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                    <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-[#00e676] group-hover:bg-[#00e676]/10 transition-all mb-4">
                      {item.icon}
                    </div>
                    <h4 className="text-white font-bold text-sm mb-2">{item.title}</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-[#00e676]/10 blur-[100px] rounded-full"></div>
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="relative space-y-4"
              >
                {/* Workflow Mockup */}
                <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center gap-4 shadow-xl">
                  <div className="size-10 rounded-full bg-[#00e676]/20 flex items-center justify-center text-[#00e676]">
                    <Check size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Aşama 1: Fatura</div>
                    <div className="text-sm font-bold text-white">Fatura Otomatik Oluşturuldu</div>
                  </div>
                  <div className="text-[10px] font-bold text-zinc-600">10:00</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center gap-4 shadow-xl ml-0 md:ml-8">
                  <div className="size-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                    <MessageCircle size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Aşama 2: Bildirim</div>
                    <div className="text-sm font-bold text-white">Müşteriye WhatsApp/Email Gitti</div>
                  </div>
                  <div className="text-[10px] font-bold text-zinc-600">10:05</div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-r from-[#00e676]/10 to-transparent border border-[#00e676]/20 flex items-center gap-4 shadow-xl ml-0 md:ml-16">
                  <div className="size-10 rounded-full bg-[#00e676] flex items-center justify-center text-black">
                    <DollarSign size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-zinc-800 font-bold uppercase tracking-widest mb-1">Aşama 3: Tahsilat</div>
                    <div className="text-sm font-bold text-white">Ödeme Alındı & Kasa Güncellendi</div>
                  </div>
                  <div className="text-[10px] font-bold text-[#00e676]">14:20</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
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
                Finansal kontrolü <br /><span className="text-[#00e676]">ele almaya hazır mısınız?</span>
              </h2>
              <p className="text-lg text-zinc-400 mb-10">
                MOI Port ile ajansınızın mali yapısını modernize edin, nakit akışınızı güvence altına alın.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login" className="bg-[#00e676] text-black px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform">
                  Ücretsiz Başlayın
                </Link>
                <button className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/10 transition-colors">
                  Demo Talebi
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
