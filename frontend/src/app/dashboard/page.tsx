"use client";

import { useEffect, useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import type { Task } from "@/app/dashboard/tasks/types";
import { 
  Users, 
  Briefcase, 
  Wallet, 
  Check, 
  Mail, 
  Phone, 
  MoreHorizontal, 
  Search, 
  ExternalLink,
  Plus,
  ArrowUpRight,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  _count?: {
    projects: number;
  };
}

type TaskStats = {
  total: number;
  mine: number;
  mineActive: number;
  mineDueToday: number;
  mineDone: number;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const isStaff = user?.role === "STAFF";

  useEffect(() => {
    let mounted = true;

    // Fetch customers
    setLoadingCustomers(true);
    api.get("/customers")
      .then((res) => {
        if (mounted) setCustomers(Array.isArray(res.data) ? res.data : []);
      })
      .finally(() => {
        if (mounted) setLoadingCustomers(false);
      });

    if (isStaff) {
      setLoadingTasks(true);
      api
        .get("/tasks")
        .then((res) => {
          if (!mounted) return;
          const list = Array.isArray(res.data) ? (res.data as Task[]) : [];
          setTasks(list);
        })
        .finally(() => {
          if (mounted) setLoadingTasks(false);
        });
    } else {
      setLoadingStats(true);
      api
        .get("/dashboard/stats")
        .then((res) => {
          if (!mounted) return;
          setDashboardStats(res.data);
        })
        .finally(() => {
          if (mounted) setLoadingStats(false);
        });
    }

    return () => {
      mounted = false;
    };
  }, [isStaff]);

  const taskStats: TaskStats = useMemo(() => {
    if (!user || !isStaff) {
      return {
        total: 0,
        mine: 0,
        mineActive: 0,
        mineDueToday: 0,
        mineDone: 0,
      };
    }
    const today = new Date();
    const todayYmd = today.toISOString().slice(0, 10);

    const mine = tasks.filter((t) => {
      const members = Array.isArray(t.members) ? t.members : [];
      if (t.assigneeId && t.assigneeId === user.id) return true;
      if (members.includes(user.id)) return true;
      return false;
    });

    const mineActive = mine.filter(
      (t) => t.status !== "DONE" && t.status !== "ARCHIVED"
    );

    const mineDueToday = mineActive.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      if (Number.isNaN(d.getTime())) return false;
      return d.toISOString().slice(0, 10) === todayYmd;
    });

    const mineDone = mine.filter((t) => t.status === "DONE");

    return {
      total: tasks.length,
      mine: mine.length,
      mineActive: mineActive.length,
      mineDueToday: mineDueToday.length,
      mineDone: mineDone.length,
    };
  }, [tasks, user, isStaff]);

  const revenueChartData = useMemo(
    () => {
      if (isStaff) {
        return [
          { month: "Oca", value: 85000 },
          { month: "Şub", value: 92000 },
          { month: "Mar", value: 105000 },
          { month: "Nis", value: 98000 },
          { month: "May", value: 120000 },
          { month: "Haz", value: 142000 },
        ];
      }
      return dashboardStats?.chartData || [];
    },
    [isStaff, dashboardStats]
  );

  const staffCards = [
    {
      label: "Aktif Görevlerim",
      value: loadingTasks ? "..." : String(taskStats.mineActive || 0),
      icon: <Check size={20} />,
      trend: "+2",
    },
    {
      label: "Bugün Son Tarihli",
      value: loadingTasks ? "..." : String(taskStats.mineDueToday || 0),
      icon: <Briefcase size={20} />,
      trend: "0",
    },
    {
      label: "Tamamlanan Görevler",
      value: loadingTasks ? "..." : String(taskStats.mineDone || 0),
      icon: <TrendingUp size={20} />,
      trend: "+5",
    },
    {
      label: "Toplam Görev",
      value: loadingTasks ? "..." : String(taskStats.mine || 0),
      icon: <Users size={20} />,
      trend: "+1",
    },
  ];

  const adminCards = [
    {
      label: "Toplam Gelir (Aylık)",
      value: loadingStats ? "..." : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(dashboardStats?.monthlyRevenue || 0),
      icon: <Wallet size={20} />,
      trend: "+%12",
    },
    {
      label: "Aktif Projeler",
      value: loadingStats ? "..." : String(dashboardStats?.activeProjects || 0),
      icon: <Briefcase size={20} />,
      trend: "+3",
    },
    {
      label: "Bekleyen Görevler",
      value: loadingStats ? "..." : String(dashboardStats?.pendingTasks || 0),
      icon: <Check size={20} />,
      trend: "-2",
    },
    {
      label: "Yeni Müşteriler",
      value: loadingStats ? "..." : String(dashboardStats?.newCustomers || 0),
      icon: <Users size={20} />,
      trend: "+4",
    },
  ];

  const cards = isStaff ? staffCards : adminCards;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground/80 text-[10px] font-bold mb-4 uppercase tracking-widest"
          >
            <TrendingUp size={12} />
            <span>Genel Performans</span>
          </motion.div>
          <h1 className="text-3xl md:text-[36px] font-bold tracking-tight text-foreground">
            Genel Bakış
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isStaff
              ? "Bugünkü görev özetin ve odak alanların burada."
              : "Ajansınızın operasyon ve performans özeti burada."}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            type="button"
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
          >
            Rapor Al
          </button>
          <button
            type="button"
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-colors shadow-md shadow-primary/20"
          >
            <Plus size={14} />
            Yeni Ekle
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all shadow-sm group dark:rounded-3xl dark:bg-gradient-to-b dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900/40 dark:border-slate-800/80 dark:shadow-[0_18px_45px_rgba(0,0,0,0.6)] dark:hover:border-emerald-400/40 dark:hover:shadow-[0_22px_55px_rgba(16,185,129,0.18)]"
          >
            <div className="flex items-center gap-3 text-muted-foreground mb-4">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/90 group-hover:text-primary-foreground transition-colors dark:bg-slate-900/40 dark:border dark:border-slate-700/70 dark:text-slate-400 dark:group-hover:border-emerald-400/40 dark:group-hover:text-emerald-300">
                {card.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/80 dark:text-slate-500">
                {card.label}
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl md:text-3xl font-extrabold text-foreground dark:text-slate-50">
                {card.value}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-primary dark:text-emerald-400/90">
                <ArrowUpRight size={12} />
                <span className="uppercase tracking-wide">{card.trend}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Son Müşteriler</h2>
            <Link href="/dashboard/customers" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              Tümünü Gör <ExternalLink size={12} />
            </Link>
          </div>
          
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/60">
                    <th className="py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Müşteri</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">E-posta</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Telefon</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Proje</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCustomers ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">Müşteriler yükleniyor...</td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">Müşteri bulunamadı.</td>
                    </tr>
                  ) : (
                    customers.slice(0, 5).map((customer) => (
                      <tr key={customer.id} className="border-b border-border/40 hover:bg-muted/60 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                              {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{customer.name}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <Mail size={12} className="text-muted-foreground" />
                            {customer.email || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <Phone size={12} className="text-muted-foreground" />
                            {customer.phone || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
                            <Briefcase size={10} />
                            {customer._count?.projects || 0} Proje
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link href={`/dashboard/customers/${customer.id}`}>
                            <button className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all ml-auto">
                              <MoreHorizontal size={14} />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground">Performans</h2>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-[400px]">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">Aylık Gelir Analizi</p>
            {loadingStats && !isStaff ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Yükleniyor...</div>
            ) : (
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="var(--border)" />
                  <XAxis 
                    dataKey="month" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.25)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--card-foreground)',
                    }}
                    formatter={(value: any) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(Number(value))}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4, stroke: 'var(--card)' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
