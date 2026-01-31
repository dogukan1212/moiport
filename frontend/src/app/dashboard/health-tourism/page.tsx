"use client";

import { motion } from "framer-motion";
import { Users, Plane, Calendar, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";

export default function HealthTourismDashboard() {
  const stats = [
    {
      label: "Aktif Hastalar",
      value: "24",
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Bugün Gelecekler",
      value: "3",
      change: "Bekleniyor",
      trend: "neutral",
      icon: Plane,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      label: "Operasyonlar",
      value: "5",
      change: "Bugün",
      trend: "up",
      icon: Activity,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: "Randevular",
      value: "12",
      change: "Bu hafta",
      trend: "up",
      icon: Calendar,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sağlık Turizmi Paneli</h1>
        <p className="text-muted-foreground mt-2">
          Operasyonlarınızı ve hasta süreçlerinizi buradan takip edebilirsiniz.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {stat.trend === "up" ? (
                <div className="flex items-center text-emerald-500 text-xs font-medium bg-emerald-500/10 px-2 py-1 rounded-full">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  {stat.change}
                </div>
              ) : (
                <div className="flex items-center text-zinc-500 text-xs font-medium bg-zinc-500/10 px-2 py-1 rounded-full">
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                  {stat.change}
                </div>
              )}
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold">{stat.value}</h3>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
                {stat.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Yaklaşan Operasyonlar</h3>
            <Link href="/dashboard/health-tourism/treatment-plans" className="text-sm text-primary hover:underline">
              Tümünü Gör
            </Link>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50 hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    AH
                  </div>
                  <div>
                    <p className="font-medium">Ahmet Hakan</p>
                    <p className="text-sm text-muted-foreground">Saç Ekimi - Sapphire FUE</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">Bugün, 14:00</p>
                  <p className="text-sm text-muted-foreground">Dr. Yılmaz</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-3 rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Transferler</h3>
            <Link href="/dashboard/health-tourism/travel" className="text-sm text-primary hover:underline">
              Takvim
            </Link>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="flex items-center gap-4 relative pl-6 pb-4 last:pb-0 border-l border-border/50">
                <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-background" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Havalimanı Karşılama</p>
                    <span className="text-xs text-muted-foreground">10:30</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">John Doe - TK1984</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
