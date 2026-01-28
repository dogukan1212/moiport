"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Check, CreditCard, Download, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

type Plan = {
  id: string;
  code: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  isPopular?: boolean;
  features?: string[];
  price: string;
  period: string;
};

export default function SubscriptionsPage() {
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<{ planCode?: string; endsAt?: string; status?: string; maxUsers?: number; maxStorage?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [payToken, setPayToken] = useState<string | null>(null);
  const [iframeOpen, setIframeOpen] = useState(false);
  const router = useRouter();
  const [tenant, setTenant] = useState<any>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const planSectionRef = useRef<HTMLDivElement>(null);
  const [specialOpen, setSpecialOpen] = useState(false);
  const [specialSubmitting, setSpecialSubmitting] = useState(false);
  const [specialPipeline, setSpecialPipeline] = useState<{ pipelineId: string; stageId: string } | null>(null);
  const [specialForm, setSpecialForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const searchParams = useSearchParams();

  useEffect(() => {
    const load = async () => {
      try {
        const [plansRes, meRes, tenantRes] = await Promise.all([
          api.get("/subscriptions/plans"),
          api.get("/subscriptions/me"),
          api.get("/tenants/me"),
        ]);
        setPlans(plansRes.data || []);
        const me = meRes.data || {};
        setCurrent({
          planCode: me.subscriptionPlan || undefined,
          endsAt: me.subscriptionEndsAt || undefined,
          status: me.subscriptionStatus || undefined,
          maxUsers: me.maxUsers,
          maxStorage: me.maxStorage,
        });
        setTenant(tenantRes.data || null);
      } catch (e) {
        console.error("Abonelik verileri yüklenemedi", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const currentPlan = useMemo(() => plans.find(p => p.code === current?.planCode), [plans, current]);
  const effectiveStatus = useMemo(() => {
    const queryReason = (searchParams.get("reason") || "").trim().toUpperCase();
    if (queryReason) return queryReason;
    const tenantStatus = (tenant?.subscriptionStatus as string | undefined) || "";
    const subscriptionStatus = (current?.status as string | undefined) || "";
    const combined = (tenantStatus || subscriptionStatus).trim().toUpperCase();
    return combined || undefined;
  }, [tenant, current, searchParams]);
  const endsAtStr = useMemo(() => current?.endsAt ? new Date(current.endsAt).toLocaleDateString("tr-TR") : "—", [current]);
  const formatPrice = useMemo(
    () => (value: number) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value),
    []
  );
  const yearlyDiscountRate = 0.2;
  const customerPanelByPlan: Record<string, string[]> = {
    PRO: [
      "Müşteri paneli erişimi",
      "CRM ve müşteri kartları",
      "Görev ve iş akışı takibi",
      "Proje planı ve takvim görünümü",
      "Dosya paylaşımı ve teslim listesi",
      "Onay ve revizyon akışı",
      "20 kullanıcı",
      "5 müşteri",
    ],
    ENTERPRISE: [
      "Müşteri paneli erişimi",
      "CRM ve müşteri kartları",
      "Görev ve iş akışı takibi",
      "Proje planı ve takvim görünümü",
      "Dosya paylaşımı ve teslim listesi",
      "Onay ve revizyon akışı",
      "Sınırsız kullanıcı",
      "Sınırsız müşteri",
      "Özel roller ve yetkiler",
      "Gelişmiş raporlama",
    ],
  };
  const getYearlyPrice = (plan: Plan) => {
    const base = plan.yearlyPrice ?? plan.monthlyPrice * 12;
    return Math.round(base * (1 - yearlyDiscountRate));
  };
  const getCustomerPanelFeatures = (plan: Plan) => customerPanelByPlan[plan.code] || [];
  const hasCustomerPanel = (plan: Plan) => getCustomerPanelFeatures(plan).length > 0;

  const loadSpecialPipeline = async () => {
    if (specialPipeline) return specialPipeline;
    const res = await api.get("/crm/pipelines");
    const pipeline = Array.isArray(res.data) ? res.data[0] : null;
    const stage = pipeline?.stages?.[0];
    if (!pipeline?.id || !stage?.id) {
      throw new Error("Pipeline bulunamadı");
    }
    const next = { pipelineId: pipeline.id, stageId: stage.id };
    setSpecialPipeline(next);
    return next;
  };

  const handleSpecialSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = {
      name: specialForm.name.trim(),
      email: specialForm.email.trim(),
      phone: specialForm.phone.trim(),
      company: specialForm.company.trim(),
      message: specialForm.message.trim(),
    };
    if (!trimmed.name || !trimmed.phone) {
      toast.error("Ad ve telefon zorunlu");
      return;
    }
    setSpecialSubmitting(true);
    try {
      const { pipelineId, stageId } = await loadSpecialPipeline();
      const leadRes = await api.post("/crm/leads", {
        name: trimmed.name,
        email: trimmed.email || undefined,
        phone: trimmed.phone,
        company: trimmed.company || undefined,
        source: "WEB_FORM",
        pipelineId,
        stageId,
      });
      if (trimmed.message && leadRes?.data?.id) {
        await api.post(`/crm/leads/${leadRes.data.id}/activities`, {
          type: "NOTE",
          content: trimmed.message,
        });
      }
      toast.success("Talebiniz alındı, kısa sürede iletişime geçeceğiz.");
      setSpecialForm({ name: "", email: "", phone: "", company: "", message: "" });
      setSpecialOpen(false);
    } catch (e) {
      toast.error("Talep gönderilemedi.");
    } finally {
      setSpecialSubmitting(false);
    }
  };

  const goCheckout = (planCode: string) => {
    const params = new URLSearchParams({ plan: planCode, period: billingCycle });
    router.push(`/dashboard/subscriptions/checkout?${params.toString()}`);
  };
  const goCheckoutForCurrent = () => {
    const planCode = current?.planCode || plans[0]?.code;
    if (!planCode) return;
    goCheckout(planCode);
  };
  const scrollToPlans = () => {
    setManageOpen(false);
    setTimeout(() => {
      planSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  return (
    <div className="p-6 space-y-8 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
      {effectiveStatus === 'SUSPENDED' && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-full">
            <Zap className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-red-500 font-bold">Hesabınız Askıya Alındı</h3>
            <p className="text-red-400 text-sm">Hizmetlerinize devam etmek için lütfen ödeme yapın veya destek ekibi ile iletişime geçin.</p>
          </div>
        </div>
      )}
      {effectiveStatus === 'TRIAL_ENDED' && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-lg flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-full">
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-indigo-500 font-bold">Deneme Süreniz Sona Erdi</h3>
            <p className="text-indigo-400 text-sm">MOI Port'u kullanmaya devam etmek için lütfen size uygun bir plan seçin.</p>
          </div>
        </div>
      )}
      {effectiveStatus === 'EXPIRED' && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-full">
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-amber-500 font-bold">Abonelik Süreniz Doldu</h3>
            <p className="text-amber-400 text-sm">Kesintisiz hizmet için lütfen aboneliğinizi yenileyin.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Abonelik ve Faturalandırma</h1>
        <p className="text-slate-500 dark:text-slate-300">
          Planınızı yönetin, faturalarınızı görüntüleyin ve ödeme yöntemlerinizi düzenleyin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-slate-200 shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Aktif Plan
              {current?.status === 'TRIAL' && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 ml-auto">
                  Deneme Süreci
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {currentPlan ? (
                <>
                  Şu anda{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-50">{currentPlan.name}</span>{" "}
                  kullanıyorsunuz.
                </>
              ) : (
                <>Paket seçilmedi. Deneme süresindesiniz.</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Yenilenme/Bitiş Tarihi</p>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-50">{endsAtStr}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Durum</p>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {current?.status || "—"}
                </p>
              </div>
              <Button
                variant="outline"
                className="text-slate-600 border-slate-300 hover:bg-white hover:text-indigo-600 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-800"
                onClick={() => setManageOpen(true)}
              >
                Planı Yönet
              </Button>
            </div>

            {current?.maxUsers ? (
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Kullanıcı Limiti ({current?.maxUsers})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: "50%" }}></div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Ödeme Yöntemi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {current?.status === 'TRIAL' ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 border border-dashed border-slate-200 rounded-lg dark:border-slate-800">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Deneme Sürecindesiniz</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 px-4">
                    Şu anda herhangi bir ödeme yöntemi tanımlamanıza gerek yoktur.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg dark:border-slate-700 opacity-50">
                <div className="w-10 h-6 bg-slate-200 rounded flex items-center justify-center text-slate-500 text-[10px] font-bold dark:bg-slate-800">
                  N/A
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Kayıtlı Kart Yok</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">—</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-9 text-sm dark:text-indigo-400 dark:hover:bg-indigo-500/10"
              onClick={goCheckoutForCurrent}
            >
              {current?.status === 'TRIAL' ? 'Kart Ekle' : 'Kartı Güncelle'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold dark:text-slate-50">Kullanım Limitleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tenant ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Kullanıcılar</span>
                  <span className={`${(() => {
                    const limit = tenant?.maxUsers || current?.maxUsers || 0;
                    const count = tenant?._count?.users || 0;
                    const percent = limit > 0 ? Math.min((count / limit) * 100, 100) : 0;
                    return percent > 90 ? "text-red-600" : "text-slate-900";
                  })()}`}>
                    {(tenant?._count?.users || 0)}/{tenant?.maxUsers || current?.maxUsers || 0}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`${(() => {
                      const limit = tenant?.maxUsers || current?.maxUsers || 0;
                      const count = tenant?._count?.users || 0;
                      const percent = limit > 0 ? Math.min((count / limit) * 100, 100) : 0;
                      return percent > 90 ? "bg-red-500" : "bg-indigo-600";
                    })()} h-2 rounded-full transition-all duration-500`}
                    style={{
                      width: `${(() => {
                        const limit = tenant?.maxUsers || current?.maxUsers || 0;
                        const count = tenant?._count?.users || 0;
                        return limit > 0 ? Math.min((count / limit) * 100, 100) : 0;
                      })()}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Depolama</span>
                  <span className={`${(() => {
                    const limitMB = tenant?.maxStorage || current?.maxStorage || 0;
                    const usageMB = (tenant?.storageUsage || 0) / (1024 * 1024);
                    const percent = limitMB > 0 ? Math.min((usageMB / limitMB) * 100, 100) : 0;
                    return percent > 90 ? "text-red-600" : "text-slate-900";
                  })()}`}>
                    {(((tenant?.storageUsage || 0) / (1024 * 1024))).toFixed(1)}/{tenant?.maxStorage || current?.maxStorage || 0} MB
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`${(() => {
                      const limitMB = tenant?.maxStorage || current?.maxStorage || 0;
                      const usageMB = (tenant?.storageUsage || 0) / (1024 * 1024);
                      const percent = limitMB > 0 ? Math.min((usageMB / limitMB) * 100, 100) : 0;
                      return percent > 90 ? "bg-red-500" : "bg-indigo-600";
                    })()} h-2 rounded-full transition-all duration-500`}
                    style={{
                      width: `${(() => {
                        const limitMB = tenant?.maxStorage || current?.maxStorage || 0;
                        const usageMB = (tenant?.storageUsage || 0) / (1024 * 1024);
                        return limitMB > 0 ? Math.min((usageMB / limitMB) * 100, 100) : 0;
                      })()}%`,
                    }}
                  />
                </div>
              </div>

              {(() => {
                const userLimit = tenant?.maxUsers || current?.maxUsers || 0;
                const userCount = tenant?._count?.users || 0;
                const userPercent = userLimit > 0 ? Math.min((userCount / userLimit) * 100, 100) : 0;
                const storageLimitMB = tenant?.maxStorage || current?.maxStorage || 0;
                const storageUsageMB = (tenant?.storageUsage || 0) / (1024 * 1024);
                const storagePercent = storageLimitMB > 0 ? Math.min((storageUsageMB / storageLimitMB) * 100, 100) : 0;
                if (userPercent > 90 || storagePercent > 90) {
                  return (
                    <Link href="/dashboard/subscriptions" className="flex items-center gap-1.5 text-[12px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                      <Sparkles size={14} />
                      Paketi Yükselt
                    </Link>
                  );
                }
                return null;
              })()}
            </>
          ) : (
            <div className="text-sm text-slate-500 dark:text-slate-400">Ajans kullanım verileri yükleniyor…</div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6" ref={planSectionRef}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Plan Seçenekleri</h2>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg dark:bg-slate-800">
            <button
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                billingCycle === "MONTHLY"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-50"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              Aylık
            </button>
            <button
              onClick={() => setBillingCycle("YEARLY")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                billingCycle === "YEARLY"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-50"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              Yıllık <span className="text-[10px] text-green-600 font-bold ml-1">-%20</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.code === current?.planCode;
            return (
              <Card
                key={plan.code}
                className={`relative border flex flex-col ${
                  plan.isPopular 
                    ? "border-indigo-600 shadow-md ring-1 ring-indigo-600 dark:border-indigo-500 dark:ring-indigo-500"
                    : "border-slate-200 shadow-sm hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    En Popüler
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-50">{plan.name}</CardTitle>
                  <CardDescription className="text-sm text-slate-500 dark:text-slate-400 mt-2 h-10">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                      {billingCycle === "MONTHLY" 
                        ? `₺${formatPrice(plan.monthlyPrice)}` 
                        : `₺${formatPrice(getYearlyPrice(plan))}`
                      }
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                      {billingCycle === "MONTHLY" ? "/aylık" : "/yıllık"}
                    </span>
                  </div>
                  <Tabs defaultValue="agency" className="w-full">
                    <TabsList className={`grid w-full mb-4 ${hasCustomerPanel(plan) ? "grid-cols-2" : "grid-cols-1"}`}>
                      <TabsTrigger value="agency">Ajans</TabsTrigger>
                      {hasCustomerPanel(plan) ? <TabsTrigger value="customer">Müşteri Paneli</TabsTrigger> : null}
                    </TabsList>
                    <TabsContent value="agency" className="mt-0">
                      <ul className="space-y-3">
                        {(plan.features || []).map((feature, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    {hasCustomerPanel(plan) ? (
                      <TabsContent value="customer" className="mt-0">
                        <ul className="space-y-3">
                          {getCustomerPanelFeatures(plan).map((feature, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                              <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </TabsContent>
                    ) : null}
                  </Tabs>
                </CardContent>
                <CardFooter>
                  <Button
                    className={`w-full ${
                      isCurrent
                        ? "bg-slate-100 text-slate-400 cursor-default hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-800"
                        : plan.isPopular
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
                    }`}
                    disabled={isCurrent}
                    onClick={() => goCheckout(plan.code)}
                  >
                    {isCurrent ? "Mevcut Plan" : "Planı Seç"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">Özel Çözümler</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              İhtiyacınıza göre özel entegrasyon ve süreç tasarlayalım.
            </div>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setSpecialOpen(true)}>
            Özel Çözüm Talebi
          </Button>
        </CardContent>
      </Card>

      <Dialog open={iframeOpen} onOpenChange={setIframeOpen}>
        <DialogContent className="max-w-3xl dark:bg-slate-900 dark:text-slate-50">
          <DialogHeader>
            <DialogTitle>Ödeme</DialogTitle>
          </DialogHeader>
          {payToken ? (
            <iframe
              title="PayTR"
              src={`https://www.paytr.com/odeme/guvenli/${payToken}`}
              className="w-full h-[600px] border rounded"
            />
          ) : null}
        </DialogContent>
      </Dialog>
      
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-lg dark:bg-slate-900 dark:text-slate-50">
          <DialogHeader>
            <DialogTitle>Planı Yönet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">Mevcut Plan</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {currentPlan?.name || "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">Durum</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {current?.status || "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">Yenilenme/Bitiş</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{endsAtStr}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">Faturalandırma</p>
                <div className="flex items-center bg-white border border-slate-200 rounded-md overflow-hidden dark:bg-slate-900 dark:border-slate-700">
                  <button
                    onClick={() => setBillingCycle("MONTHLY")}
                    className={`px-3 py-1.5 text-xs font-medium transition ${
                      billingCycle === "MONTHLY"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    Aylık
                  </button>
                  <button
                    onClick={() => setBillingCycle("YEARLY")}
                    className={`px-3 py-1.5 text-xs font-medium transition ${
                      billingCycle === "YEARLY"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    Yıllık
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button className="w-full" onClick={scrollToPlans}>
                Paket Değiştir
              </Button>
              <Button variant="outline" className="w-full" onClick={goCheckoutForCurrent}>
                Ödeme Yöntemini Güncelle
              </Button>
              <Link href="/dashboard/finance/invoices" className="w-full">
                <Button
                  variant="ghost"
                  className="w-full text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 dark:text-slate-200 dark:hover:text-indigo-300 dark:hover:bg-indigo-500/10"
                >
                  Fatura Geçmişi
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={specialOpen} onOpenChange={setSpecialOpen}>
        <DialogContent className="max-w-lg dark:bg-slate-900 dark:text-slate-50">
          <DialogHeader>
            <DialogTitle>Özel Çözüm Talebi</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSpecialSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className="text-xs text-slate-500 mb-1">Ad Soyad</div>
                <Input value={specialForm.name} onChange={(e) => setSpecialForm((prev) => ({ ...prev, name: e.target.value }))} required />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">E-posta</div>
                <Input type="email" value={specialForm.email} onChange={(e) => setSpecialForm((prev) => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Telefon</div>
                <Input value={specialForm.phone} onChange={(e) => setSpecialForm((prev) => ({ ...prev, phone: e.target.value }))} required />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Ajans / Şirket</div>
                <Input value={specialForm.company} onChange={(e) => setSpecialForm((prev) => ({ ...prev, company: e.target.value }))} />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">İhtiyaç Özeti</div>
                <textarea
                  className="w-full min-h-[110px] border border-slate-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={specialForm.message}
                  onChange={(e) => setSpecialForm((prev) => ({ ...prev, message: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setSpecialOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit" disabled={specialSubmitting}>
                {specialSubmitting ? "Gönderiliyor..." : "Talep Gönder"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
