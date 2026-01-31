"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  Globe2, 
  TrendingUp, 
  Users, 
  Wallet, 
  PieChart as PieChartIcon, 
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar as CalendarIcon,
  Activity,
  Clock,
  CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from 'recharts';

// Mock data removed
const financialData: any[] = [];
const operationalData: any[] = [];
const kpiData: any[] = [];
const countryPerformance: any[] = [];
const treatmentPerformance: any[] = [];

export default function HealthTourismAnalyticsPage() {
  const [period, setPeriod] = useState("this_month");

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raporlama & Analitik</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Finansal performans, operasyonel verimlilik ve pazar analizleri.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] bg-white">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Dönem Seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Bugün</SelectItem>
              <SelectItem value="this_week">Bu Hafta</SelectItem>
              <SelectItem value="this_month">Bu Ay</SelectItem>
              <SelectItem value="last_month">Geçen Ay</SelectItem>
              <SelectItem value="this_year">Bu Yıl</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="bg-white">
            <Download className="mr-2 h-4 w-4" />
            Dışa Aktar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`rounded-full p-3 ${kpi.color}`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
                {kpi.trend === "up" ? (
                  <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <ArrowUpRight className="h-4 w-4" />
                    {kpi.change}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-sm font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                    <ArrowDownRight className="h-4 w-4" />
                    {kpi.change}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground">{kpi.title}</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold tracking-tight">{kpi.value}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.period}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="financial">Finansal Raporlar</TabsTrigger>
          <TabsTrigger value="operational">Operasyonel</TabsTrigger>
          <TabsTrigger value="marketing">Pazarlama & Lead</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            {/* Country Performance */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ülke Bazlı Performans</CardTitle>
                    <CardDescription>Gelir ve hasta sayısına göre pazar dağılımı</CardDescription>
                  </div>
                  <Globe2 className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {countryPerformance.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-4 w-[40%]">
                        <span className="text-2xl">{item.flag}</span>
                        <div>
                          <p className="text-sm font-medium leading-none">{item.country}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.patients} Hasta</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-[30%]">
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full" 
                            style={{ width: `${(item.revenue / 50000) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-[30%] text-right">
                        <p className="text-sm font-bold">€{item.revenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">Conv: %{item.conversion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Treatment Distribution */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Tedavi Dağılımı</CardTitle>
                <CardDescription>En çok gelir getiren işlemler</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {treatmentPerformance.map((item, index) => (
                    <div key={index} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.count} Operasyon</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">€{item.revenue.toLocaleString()}</p>
                        <div className={`text-xs flex items-center justify-end gap-1 ${item.growth > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.growth > 0 ? '+' : ''}{item.growth}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">53</div>
                      <div className="text-xs text-muted-foreground">Toplam İşlem</div>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">€2,688</div>
                      <div className="text-xs text-muted-foreground">Ort. İşlem Değeri</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Gelir ve Gider Analizi</CardTitle>
              <CardDescription>Son 6 aylık finansal performans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={financialData}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="gelir" stackId="1" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.2} name="Gelir" />
                    <Area type="monotone" dataKey="gider" stackId="1" stroke="#e11d48" fill="#e11d48" fillOpacity={0.2} name="Gider" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operational" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ortalama Kalış</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2 Gün</div>
                <p className="text-xs text-muted-foreground mt-1 text-emerald-600">-0.5 gün geçen aya göre</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Operasyon Başarısı</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">%98.5</div>
                <p className="text-xs text-muted-foreground mt-1 text-emerald-600">+0.2% geçen aya göre</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Doktor Doluluğu</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">%85</div>
                <p className="text-xs text-muted-foreground mt-1 text-amber-600">Kritik seviyeye yakın</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Haftalık Operasyon Yoğunluğu</CardTitle>
              <CardDescription>Randevu ve operasyonların günlere dağılımı</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={operationalData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="randevu" fill="#94a3b8" name="Randevu" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="operasyon" fill="#0ea5e9" name="Operasyon" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Lead Başına Maliyet (CPL)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€12.45</div>
                <p className="text-xs text-muted-foreground mt-1 text-emerald-600">-8% geçen aya göre</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Müşteri Edinme Maliyeti (CAC)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€145.00</div>
                <p className="text-xs text-muted-foreground mt-1 text-rose-600">+2% geçen aya göre</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Reklam Harcaması Getirisi (ROAS)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.8x</div>
                <p className="text-xs text-muted-foreground mt-1 text-emerald-600">Her 1€ harcama için 4.8€ ciro</p>
              </CardContent>
            </Card>
          </div>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Kanal Performansı</CardTitle>
              <CardDescription>Hangi pazarlama kanalı daha verimli?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { channel: "Google Ads", leads: 450, sales: 28, cost: 4200, revenue: 85000 },
                  { channel: "Instagram / FB", leads: 890, sales: 15, cost: 3100, revenue: 32000 },
                  { channel: "Referans", leads: 45, sales: 12, cost: 0, revenue: 48000 },
                  { channel: "Organik / SEO", leads: 120, sales: 8, cost: 1500, revenue: 22000 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                    <div className="w-[20%] font-medium">{item.channel}</div>
                    <div className="w-[20%] text-sm text-muted-foreground">{item.leads} Lead</div>
                    <div className="w-[20%] text-sm text-muted-foreground">{item.sales} Satış (%{Math.round((item.sales/item.leads)*100)})</div>
                    <div className="w-[20%] text-sm text-muted-foreground">Maliyet: €{item.cost}</div>
                    <div className="w-[20%] text-right font-bold">€{item.revenue.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
