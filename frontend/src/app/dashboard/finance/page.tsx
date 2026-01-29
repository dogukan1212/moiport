'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  FileText, 
  Repeat, 
  Database, 
  Clock, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Plus,
  ArrowLeftRight,
  Calendar,
  Users,
  Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function FinanceDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const { user } = useAuth();
  const isClient = user?.role === 'CLIENT';
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string>('');
  const [question, setQuestion] = useState<string>('');

  useEffect(() => {
    fetchStats();
    fetchTransactions();
    fetchInvoices();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/finance/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/finance');
      setTransactions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/finance/invoices/all');
      setInvoices(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    }
  };

  const callFinanceInsights = async () => {
    try {
      setAiLoading(true);
      setAiInsights('');
      const response = await api.post('/ai/finance/insights', {
        aiModel: 'gemini-1.5-flash',
        context: { user },
      });
      setAiInsights(String(response.data?.insights || ''));
    } catch (error) {
      console.error('AI insights error:', error);
      setAiInsights('Analiz oluşturulamadı. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setAiLoading(false);
    }
  };

  const askFinanceAI = async () => {
    if (!question.trim()) return;
    try {
      setAiLoading(true);
      setAiAnswer('');
      const response = await api.post('/ai/finance/qa', {
        question,
        aiModel: 'gemini-1.5-flash',
        context: { user },
      });
      setAiAnswer(String(response.data?.answer || ''));
    } catch (error) {
      console.error('AI QA error:', error);
      setAiAnswer('Yanıt üretilemedi. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSeedData = async () => {
    if (!confirm('Bu işlem mevcut hesabınıza örnek finansal veriler, personeller ve müşteriler ekleyecektir. Devam etmek istiyor musunuz?')) return;
    
    try {
      setLoading(true);
      await api.post('/finance/seed-data');
      alert('Demo verileri başarıyla yüklendi.');
      fetchStats();
      fetchTransactions();
      fetchInvoices();
    } catch (error) {
      console.error('Seed error:', error);
      alert('Demo verileri yüklenirken bir hata oluştu.');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const chartData = [
    { name: 'Gelir', amount: stats?.totalIncome || 0, color: '#10b981' },
    { name: 'Gider', amount: stats?.totalExpense || 0, color: '#ef4444' },
    { name: 'Bekleyen Alacak', amount: stats?.receivables || 0, color: '#22c55e' },
    { name: 'Düzenli Gelir', amount: stats?.monthlyRecurringRevenue || 0, color: '#16a34a' },
  ];

  const expenseTotals = transactions
    .filter((t) => t.type === 'EXPENSE' && t.status === 'PAID')
    .reduce((acc: Record<string, number>, curr: any) => {
      const key = String(curr.category || 'Diğer');
      acc[key] = (acc[key] || 0) + Number(curr.amount || 0);
      return acc;
    }, {});

  const totalExpensePaid = Object.values(expenseTotals).reduce((a, b) => a + b, 0);
  const expensePalette = ['#22c55e', '#a855f7', '#f59e0b', '#00e676', '#ef4444', '#14b8a6', '#16a34a'];
  const expenseBreakdown = Object.entries(expenseTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([label, amount], i) => ({
      label,
      percent: totalExpensePaid > 0 ? Math.round((amount / totalExpensePaid) * 100) : 0,
      color: expensePalette[i % expensePalette.length],
    }))
    .slice(0, 4);

  const pendingInvoices = invoices.filter((inv: any) => ['SENT', 'OVERDUE'].includes(inv.status));
  const toStatusText = (s: string) => (s === 'OVERDUE' ? 'Gecikmiş' : s === 'SENT' ? 'Bekliyor' : 'Ödendi');
  const toStatusClasses = (s: string) =>
    s === 'OVERDUE'
      ? 'bg-red-500/10 text-red-500'
      : s === 'SENT'
        ? 'bg-amber-500/10 text-amber-600'
        : 'bg-emerald-500/10 text-emerald-600';

  const formatDateTR = (value: string | Date) =>
    new Date(value).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const startOfWeek = new Date();
  const day = startOfWeek.getDay();
  const diffToMonday = (day + 6) % 7;
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const sumTx = (type: 'INCOME' | 'EXPENSE', start: Date, end: Date) =>
    transactions
      .filter(
        (t: any) =>
          t?.type === type &&
          t?.status === 'PAID' &&
          new Date(t?.date).getTime() >= start.getTime() &&
          new Date(t?.date).getTime() <= end.getTime()
      )
      .reduce((acc: number, curr: any) => acc + Number(curr?.amount || 0), 0);

  const dayIncome = sumTx('INCOME', startOfDay, endOfDay);
  const dayExpense = sumTx('EXPENSE', startOfDay, endOfDay);
  const weekIncome = sumTx('INCOME', startOfWeek, endOfWeek);
  const weekExpense = sumTx('EXPENSE', startOfWeek, endOfWeek);
  const monthIncome = sumTx('INCOME', startOfMonth, endOfMonth);
  const monthExpense = sumTx('EXPENSE', startOfMonth, endOfMonth);

  const notifScope =
    dayIncome + dayExpense > 0
      ? { label: 'Bugün', income: dayIncome, expense: dayExpense }
      : weekIncome + weekExpense > 0
        ? { label: 'Bu Hafta', income: weekIncome, expense: weekExpense }
        : { label: 'Bu Ay', income: monthIncome, expense: monthExpense };
  const notifNet = (notifScope.income || 0) - (notifScope.expense || 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Finans Merkezi</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">İşletmenizin finansal durumunu ve nakit akışını takip edin.</p>
        </div>
        {!isClient && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSeedData}
              className="rounded-xl border-slate-200 dark:border-slate-700 dark:text-slate-200 font-bold text-xs gap-2 h-11 px-5"
            >
              <Database className="h-4 w-4" /> Demo Verileri Yükle
            </Button>
            <Link href="/dashboard/finance/transactions">
              <Button className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-2 h-11 px-6 shadow-lg shadow-slate-200 dark:shadow-slate-900/40 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200">
                <Plus className="h-4 w-4" /> Yeni İşlem
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isClient ? (
          <>
            {[
              { 
                label: "Mevcut Bakiye", 
                value: formatCurrency(stats?.balance || 0), 
                icon: <Wallet size={20} />, 
                color: "slate-900",
                bg: "bg-slate-900",
                text: "text-white",
                trend: "Güncel Durum"
              },
              { 
                label: "Bekleyen Alacaklar", 
                value: formatCurrency(stats?.receivables || 0), 
                icon: <Clock size={20} />,
                color: "emerald",
                bg: "bg-white",
                text: "text-slate-900 dark:text-slate-50",
                trend: "Tahsilat Bekleyen"
              }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "p-6 rounded-2xl border transition-all shadow-sm group",
                  stat.bg === 'bg-slate-900'
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600"
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    stat.bg === 'bg-slate-900'
                      ? "bg-white/10 text-white"
                      : `bg-${stat.color}-50 text-${stat.color}-600 dark:bg-slate-800 dark:text-slate-100`
                  )}>
                    {stat.icon}
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    stat.text === 'text-white' ? "text-slate-400" : "text-slate-400"
                  )}>{stat.label}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div className={cn("text-2xl font-black", stat.text)}>{stat.value}</div>
                  <div className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-full",
                    stat.bg === 'bg-slate-900'
                      ? "bg-white/10 text-white"
                      : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
                  )}>
                    {stat.trend}
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        ) : (
          <>
            {[
              { 
                label: "Toplam Gelir", 
                value: formatCurrency(stats?.totalIncome || 0), 
                icon: <TrendingUp size={20} />, 
                color: "emerald",
                trend: "+%12.5",
                trendColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300"
              },
              { 
                label: "Toplam Gider", 
                value: formatCurrency(stats?.totalExpense || 0), 
                icon: <TrendingDown size={20} />, 
                color: "red",
                trend: "-%2.4",
                trendColor: "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300"
              },
              { 
                label: "Net Pozisyon", 
                value: formatCurrency(stats?.balance || 0), 
                icon: <Wallet size={20} />, 
                color: "emerald",
                trend: "Sağlıklı",
                trendColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300"
              },
              { 
                label: "Bekleyen Tahsilat", 
                value: formatCurrency(stats?.receivables || 0), 
                icon: <Clock size={20} />, 
                color: "amber",
                trend: "5 Fatura",
                trendColor: "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300"
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600 transition-all shadow-sm group"
              >
                <div className="flex items-center gap-3 text-slate-500 mb-4">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors group-hover:bg-slate-900 group-hover:text-white",
                    `bg-${stat.color}-50 text-${stat.color}-600 dark:bg-slate-800 dark:text-slate-100`
                  )}>
                    {stat.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">{stat.label}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-50">{stat.value}</div>
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
                    stat.trendColor
                  )}>
                    {stat.trend}
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Nakit Akışı Analizi</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Gelir ve gider dağılımınızın görsel özeti.</p>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30 px-3 py-1 rounded-full uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Gelir
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-900/30 px-3 py-1 rounded-full uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Gider
              </span>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  tickFormatter={(value) => `₺${value / 1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Tutar']}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          </Card>

          <Card className="p-8 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Bekleyen İşlemler</h3>
              <Link href="/dashboard/finance/invoices" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">Tümünü Yönet</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">No / Tarih</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Müşteri / Detay</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Tutar</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Durum</th>
                    <th className="py-4 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvoices.length === 0 ? (
                    <tr>
                      <td className="py-6 px-4 text-sm text-slate-500 dark:text-slate-400" colSpan={5}>Bekleyen fatura bulunmuyor.</td>
                    </tr>
                  ) : (
                    pendingInvoices.map((inv: any) => (
                      <tr key={inv.id} className="group border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <td className="py-4 px-4">
                          <div className="text-sm font-bold text-slate-900 dark:text-slate-50 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">#{inv.number || inv.id.slice(0, 6)}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">{formatDateTR(inv.issueDate)}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{inv.customer?.name || 'Müşteri'}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">{inv.items?.[0]?.description || 'Fatura'}</div>
                        </td>
                        <td className="py-4 px-4 text-sm font-bold text-slate-900 dark:text-slate-50">{formatCurrency(inv.totalAmount || 0)}</td>
                        <td className="py-4 px-4">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${toStatusClasses(inv.status)}`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                            {toStatusText(inv.status)}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link
                            href={`/dashboard/finance/invoices`}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-50 transition-all px-3 py-2"
                          >
                            <Download size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest mb-6">{notifScope.label} • Finans Bildirimleri</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm text-emerald-600 dark:text-emerald-400">
                    <ArrowUpRight size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Gelir</span>
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-slate-50">{formatCurrency(notifScope.income || 0)}</div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm text-red-600 dark:text-red-400">
                    <ArrowDownRight size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Gider</span>
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-slate-50">{formatCurrency(notifScope.expense || 0)}</div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 text-white shadow-sm">
                    <Wallet size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Net</span>
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-slate-50">{formatCurrency(notifNet)}</div>
              </div>
            </div>
          </Card>
          <Card className="p-6 border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest mb-6">Nakit Özeti</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400">
                    <Clock size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Bekleyen Alacak</span>
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-slate-50">{formatCurrency(stats?.receivables || 0)}</div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400">
                    <TrendingUp size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Düzenli Gelir (MRR)</span>
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-slate-50">{formatCurrency(stats?.monthlyRecurringRevenue || 0)}</div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 text-white shadow-sm">
                    <Wallet size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Net Pozisyon</span>
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-slate-50">{formatCurrency(stats?.balance || 0)}</div>
              </div>
            </div>
          </Card>
          <Card className="p-6 border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest mb-6">Gider Dağılımı</h3>
            <div className="space-y-6">
              {expenseBreakdown.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">Gider verisi bulunmuyor.</div>
              ) : (
                expenseBreakdown.map((item, i) => (
                  <div key={`${item.label}-${i}`} className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                      <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                      <span className="text-slate-900 dark:text-slate-50">%{item.percent}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
          <Card className="p-6 border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest mb-6">Hızlı Erişim</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Yeni Fatura Oluştur", icon: <FileText size={16} />, href: "/dashboard/finance/invoices", color: "blue" },
                { label: "Ödeme Kaydı Ekle", icon: <Plus size={16} />, href: "/dashboard/finance/transactions", color: "emerald" },
                { label: "Düzenli Gider Tanımla", icon: <Repeat size={16} />, href: "/dashboard/finance/recurring", color: "purple" },
                { label: "Müşteri Bakiyeleri", icon: <Users size={16} />, href: "/dashboard/finance/customers", color: "amber" },
              ].map((action, i) => (
                <Link key={i} href={action.href}>
                  <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md transition-all group text-left">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-colors",
                          `text-${action.color}-600 dark:text-${action.color}-400`
                        )}
                      >
                        {action.icon}
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{action.label}</span>
                    </div>
                    <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-100 group-hover:translate-x-1 transition-all" />
                  </button>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest">MOI Port AI • Finans Asistanı</h3>
              <div className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                Gemini
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 mb-4">
              <button
                onClick={callFinanceInsights}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-colors text-emerald-600 dark:text-emerald-400">
                    <Wallet size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Nakit Akışı Özeti</span>
                </div>
                <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-100 group-hover:translate-x-1 transition-all" />
              </button>
              <button
                onClick={() => {
                  setQuestion('Gecikmiş faturalar için tahsilat planı önerir misin?');
                  void askFinanceAI();
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-colors text-amber-600 dark:text-amber-400">
                    <Clock size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Gecikmiş Faturalar Analizi</span>
                </div>
                <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-100 group-hover:translate-x-1 transition-all" />
              </button>
              <button
                onClick={() => {
                  setQuestion('Bu ay vadesi olan bekleyen alacak toplamım nedir?');
                  void askFinanceAI();
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-colors text-blue-600 dark:text-blue-400">
                    <FileText size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Bu Ay Bekleyen Alacak</span>
                </div>
                <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-100 group-hover:translate-x-1 transition-all" />
              </button>
              <button
                onClick={() => {
                  setQuestion('Bugünkü gelir ve gider tutarlarını özetler misin?');
                  void askFinanceAI();
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-colors text-emerald-600 dark:text-emerald-400">
                    <ArrowLeftRight size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Bugün Gelir/Gider Özeti</span>
                </div>
                <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-100 group-hover:translate-x-1 transition-all" />
              </button>
              <button
                onClick={() => {
                  setQuestion('Kaç müşterimiz var ve artış trendi nasıl?');
                  void askFinanceAI();
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-colors text-purple-600 dark:text-purple-400">
                    <Users size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Müşteri Sayısı ve Trend</span>
                </div>
                <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-100 group-hover:translate-x-1 transition-all" />
              </button>
              <button
                onClick={() => {
                  setQuestion('MRR ve sabit giderler karşılaştırması nedir?');
                  void askFinanceAI();
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-colors text-indigo-600 dark:text-indigo-400">
                    <TrendingUp size={16} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">MRR vs Sabit Gider</span>
                </div>
                <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-100 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Finans sorunu yazın (ör. Bu ayki kar nedir?)"
                className="h-11"
              />
              <button
                onClick={askFinanceAI}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-2 h-11 px-5 inline-flex items-center justify-center"
              >
                {aiLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
            {(aiInsights || aiAnswer) && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                {aiInsights || aiAnswer}
              </div>
            )}
          </Card>

          <Card className="p-6 border-slate-200 shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Finansal Durum Notu</h3>
              <p className="text-sm font-medium leading-relaxed opacity-90">
                Bu ayki gelirleriniz geçen aya göre %12 artış gösterdi. Bekleyen 5 adet faturanın tahsilatı ile nakit akışınız daha da güçlenecektir.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-400">
                Detaylı raporu incele <ArrowRight size={12} />
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <TrendingUp size={120} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
