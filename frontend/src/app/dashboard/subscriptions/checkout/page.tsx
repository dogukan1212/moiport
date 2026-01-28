"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Plan = {
  code: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  isPopular?: boolean;
  features?: string[];
};

export default function CheckoutPage() {
  const search = useSearchParams();
  const planCode = (search.get("plan") || "").toUpperCase();
  const period = (search.get("period") || "MONTHLY").toUpperCase() as "MONTHLY" | "YEARLY";

  const [plans, setPlans] = useState<Plan[]>([]);
  const [tenant, setTenant] = useState<{ name?: string; email?: string; phone?: string; address?: string } | null>(null);
  const [method, setMethod] = useState<"CARD" | "BANK_TRANSFER">("CARD");
  const [promoCode, setPromoCode] = useState<string>("");
  const [billing, setBilling] = useState<{ type?: "INDIVIDUAL" | "CORPORATE"; name?: string; email?: string; phone?: string; address?: string; taxNumber?: string; taxOffice?: string; contactName?: string; addressLine1?: string; addressLine2?: string; district?: string; city?: string; postalCode?: string; country?: string }>({ type: "INDIVIDUAL", country: "Türkiye" });
  const [errors, setErrors] = useState<{ name?: string; email?: string; taxNumber?: string; phone?: string; addressLine1?: string; city?: string; postalCode?: string; country?: string }>({});
  const [countries, setCountries] = useState<{ name: string; code: string; dial: string }[]>([]);
  const [countryCode, setCountryCode] = useState<string>("TR");
  const [phoneLocal, setPhoneLocal] = useState<string>("");
  const [phoneDial, setPhoneDial] = useState<string>("+90");
  const [provinces, setProvinces] = useState<{ name: string; districts: string[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [plansRes, tenantRes] = await Promise.all([
          api.get("/subscriptions/plans"),
          api.get("/tenants/me"),
        ]);
        setPlans(plansRes.data || []);
        const t = tenantRes.data || {};
        setTenant(t);
        setBilling({
          type: "INDIVIDUAL",
          name: t.name || "",
          email: t.email || "",
          phone: t.phone || "",
          address: t.address || "",
          country: (t.address || "").toLowerCase().includes("turkey") || (t.address || "").toLowerCase().includes("türkiye") ? "Türkiye" : (t.country || "Türkiye"),
        });
        const digitsOnly = String(t.phone || "").replace(/[^\d]/g, "");
        setPhoneLocal(digitsOnly.replace(/^90/, ""));
      } catch (e) {
        console.error("Checkout verileri yüklenemedi", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all?fields=name,idd,cca2");
        const json = await res.json();
        const list = Array.isArray(json)
          ? json
              .map((c: any) => {
                const root = c?.idd?.root || "";
                const suf = Array.isArray(c?.idd?.suffixes) && c.idd.suffixes.length ? c.idd.suffixes[0] : "";
                const dial = root && suf ? `${root}${suf}` : "";
                return { name: c?.name?.common || "", code: c?.cca2 || "", dial };
              })
              .filter((c: any) => c.name && c.code)
              .sort((a: any, b: any) => a.name.localeCompare(b.name))
          : [];
        const listNorm = list.map((c: any) =>
          c.code === "TR" ? { ...c, name: "Türkiye", dial: c.dial || "+90" } : c
        );
        setCountries(listNorm);
        const tr = listNorm.find((c: any) => c.code === "TR" || c.name.toLowerCase() === "türkiye");
        if (tr) {
          setCountryCode("TR");
          setPhoneDial(tr.dial || "+90");
        } else if (listNorm.length) {
          setCountryCode(listNorm[0].code);
          setPhoneDial(listNorm[0].dial || "+");
        }
      } catch (e) {
        setCountries([{ name: "Türkiye", code: "TR", dial: "+90" }]);
        setCountryCode("TR");
        setPhoneDial("+90");
      }
    };
    loadCountries();
  }, []);

  useEffect(() => {
    const loadProvinces = async () => {
      if (countryCode !== "TR") {
        setProvinces([]);
        return;
      }
      try {
        const res = await fetch("https://turkiyeapi.dev/api/v1/provinces");
        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];
        const list = data.map((p: any) => ({
          name: p?.name || "",
          districts: Array.isArray(p?.districts) ? p.districts.map((d: any) => d?.name).filter(Boolean) : [],
        }));
        setProvinces(list);
      } catch (e) {
        setProvinces([]);
      }
    };
    loadProvinces();
  }, [countryCode]);

  const plan = useMemo(() => plans.find(p => p.code === planCode), [plans, planCode]);
  const formatPrice = useMemo(
    () => (value: number) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value),
    []
  );
  const yearlyDiscountRate = 0.2;
  const baseAmount = useMemo(() => {
    if (!plan) return 0;
    if (period === "MONTHLY") return plan.monthlyPrice;
    const base = plan.yearlyPrice || plan.monthlyPrice * 12;
    return Math.round(base * (1 - yearlyDiscountRate));
  }, [plan, period, yearlyDiscountRate]);
  const bankDiscount = useMemo(() => method === "BANK_TRANSFER" ? Math.round(baseAmount * 0.05) : 0, [method, baseAmount]);
  const promoDiscountPreview = useMemo(() => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return 0;
    if (code === "WELCOME10") return Math.round((baseAmount - bankDiscount) * 0.1);
    if (code === "TRIAL50") return Math.round((baseAmount - bankDiscount) * 0.5);
    return 0;
  }, [promoCode, baseAmount, bankDiscount]);
  const totalAmount = useMemo(() => Math.max(0, baseAmount - bankDiscount - promoDiscountPreview), [baseAmount, bankDiscount, promoDiscountPreview]);

 

  const startPayment = async () => {
    const nextErrors: { name?: string; email?: string; taxNumber?: string; phone?: string; addressLine1?: string; city?: string; postalCode?: string; country?: string } = {};
    const n = (billing.name || "").trim();
    const e = (billing.email || "").trim();
    const tn = (billing.taxNumber || "").replace(/\D/g, "");
    const ph = (billing.phone || "").trim();
    const a1 = (billing.addressLine1 || "").trim();
    const ct = (billing.city || "").trim();
    const pc = (billing.postalCode || "").trim();
    const co = (billing.country || "").trim();
    if (!n) nextErrors.name = "Zorunlu";
    if (!e || !e.includes("@")) nextErrors.email = "Geçerli e-posta girin";
    if (!phoneLocal) nextErrors.phone = "Zorunlu";
    if (!a1) nextErrors.addressLine1 = "Zorunlu";
    if (!ct) nextErrors.city = "Zorunlu";
    if (!pc) nextErrors.postalCode = "Zorunlu";
    if (!co) nextErrors.country = "Zorunlu";
    if ((billing.type || "INDIVIDUAL") === "CORPORATE") {
      if (!tn || tn.length !== 10) {
        nextErrors.taxNumber = "Kurumsal için VKN zorunlu ve 10 haneli";
      }
    } else {
      if (tn && tn.length !== 11) {
        nextErrors.taxNumber = "TCKN 11 haneli olmalı";
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      const addressParts = [
        (billing.addressLine1 || "").trim(),
        (billing.addressLine2 || "").trim(),
        (billing.district || "").trim(),
        (billing.city || "").trim(),
        (billing.postalCode || "").trim(),
        (billing.country || "").trim(),
      ].filter(Boolean);
      const addressCombined = addressParts.join(", ");
      const payloadBilling = { ...billing, address: addressCombined || billing.address || "", phone: `${phoneDial}${String(phoneLocal || "").replace(/[^\d]/g, "")}` };
      const res = await api.post("/subscriptions/paytr/init", {
        planCode,
        period,
        method,
        promoCode: promoCode || undefined,
        billing: payloadBilling,
      });
      if (res.data?.token && typeof window !== "undefined") {
        window.location.href = `https://www.paytr.com/odeme/guvenli/${res.data.token}`;
      }
    } catch (e) {
      console.error("Ödeme başlatılamadı", e);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Ödeme</h1>
        <div className="text-slate-500 text-sm">{plan ? plan.name : "Plan"} / {period === "MONTHLY" ? "Aylık" : "Yıllık"}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Fatura Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500">Fatura Türü</label>
                <div className="mt-1 flex gap-2">
                  <Button
                    variant={(billing.type || "INDIVIDUAL") === "INDIVIDUAL" ? "default" : "outline"}
                    onClick={() => setBilling({ ...billing, type: "INDIVIDUAL", taxOffice: undefined })}
                    className="h-9"
                  >
                    Bireysel
                  </Button>
                  <Button
                    variant={(billing.type || "INDIVIDUAL") === "CORPORATE" ? "default" : "outline"}
                    onClick={() => setBilling({ ...billing, type: "CORPORATE", taxOffice: billing.taxOffice || "" })}
                    className="h-9"
                  >
                    Kurumsal
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500">{(billing.type || "INDIVIDUAL") === "CORPORATE" ? "Ünvan" : "Ad Soyad"}</label>
                <Input aria-invalid={!!errors.name} value={billing.name || ""} onChange={(e) => setBilling({ ...billing, name: e.target.value })} />
                {errors.name && <div className="mt-1 text-[11px] text-red-600">{errors.name}</div>}
              </div>
              <div>
                <label className="text-xs text-slate-500">E-posta</label>
                <Input aria-invalid={!!errors.email} value={billing.email || ""} onChange={(e) => setBilling({ ...billing, email: e.target.value })} />
                {errors.email && <div className="mt-1 text-[11px] text-red-600">{errors.email}</div>}
              </div>
              <div>
                <label className="text-xs text-slate-500">Telefon</label>
                <div className="flex items-center gap-2">
                  {countries.length ? (
                    <Select
                      value={phoneDial}
                      onValueChange={(val) => setPhoneDial(val)}
                    >
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="+90" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.filter((c) => !!c.dial).map((c) => (
                          <SelectItem key={c.code} value={c.dial}>{c.dial} {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input className="w-[140px]" value={phoneDial} onChange={(e) => setPhoneDial(e.target.value)} />
                  )}
                  <Input aria-invalid={!!errors.phone} value={phoneLocal} onChange={(e) => setPhoneLocal(e.target.value.replace(/[^\d]/g, ""))} />
                </div>
                {errors.phone && <div className="mt-1 text-[11px] text-red-600">{errors.phone}</div>}
              </div>
              <div>
                <label className="text-xs text-slate-500">{(billing.type || "INDIVIDUAL") === "CORPORATE" ? "Vergi No (VKN)" : "TCKN (opsiyonel)"}</label>
                <Input aria-invalid={!!errors.taxNumber} inputMode="numeric" maxLength={(billing.type || "INDIVIDUAL") === "CORPORATE" ? 10 : 11} value={billing.taxNumber || ""} onChange={(e) => setBilling({ ...billing, taxNumber: e.target.value.replace(/\D/g, "") })} />
                {errors.taxNumber && <div className="mt-1 text-[11px] text-red-600">{errors.taxNumber}</div>}
              </div>
              {(billing.type || "INDIVIDUAL") === "CORPORATE" && (
                <div>
                  <label className="text-xs text-slate-500">Vergi Dairesi (opsiyonel)</label>
                  <Input value={billing.taxOffice || ""} onChange={(e) => setBilling({ ...billing, taxOffice: e.target.value })} />
                </div>
              )}
              {(billing.type || "INDIVIDUAL") === "CORPORATE" && (
                <div>
                  <label className="text-xs text-slate-500">Yetkili Ad Soyad (opsiyonel)</label>
                  <Input value={billing.contactName || ""} onChange={(e) => setBilling({ ...billing, contactName: e.target.value })} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500">Adres Satırı 1</label>
                <Input aria-invalid={!!errors.addressLine1} value={billing.addressLine1 || ""} onChange={(e) => setBilling({ ...billing, addressLine1: e.target.value })} />
                {errors.addressLine1 && <div className="mt-1 text-[11px] text-red-600">{errors.addressLine1}</div>}
              </div>
              <div>
                <label className="text-xs text-slate-500">Adres Satırı 2 (opsiyonel)</label>
                <Input value={billing.addressLine2 || ""} onChange={(e) => setBilling({ ...billing, addressLine2: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-500">Ülke</label>
                {countries.length ? (
                  <Select
                    value={countryCode}
                    onValueChange={(val) => {
                      setCountryCode(val);
                      const c = countries.find((x) => x.code === val);
                      setBilling({ ...billing, country: c?.code === "TR" ? "Türkiye" : (c?.name || billing.country || ""), city: "", district: "" });
                      setPhoneDial(c?.dial || phoneDial);
                    }}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input aria-invalid={!!errors.country} value={billing.country || ""} onChange={(e) => setBilling({ ...billing, country: e.target.value })} />
                )}
                {errors.country && <div className="mt-1 text-[11px] text-red-600">{errors.country}</div>}
              </div>
              <div>
                <label className="text-xs text-slate-500">İl</label>
                {countryCode === "TR" && provinces.length ? (
                  <Select
                    value={billing.city || ""}
                    onValueChange={(val) => {
                      setBilling({ ...billing, city: val, district: "" });
                    }}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((p) => (
                        <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input aria-invalid={!!errors.city} value={billing.city || ""} onChange={(e) => setBilling({ ...billing, city: e.target.value })} />
                )}
                {errors.city && <div className="mt-1 text-[11px] text-red-600">{errors.city}</div>}
              </div>
              <div>
                <label className="text-xs text-slate-500">İlçe</label>
                {countryCode === "TR" && provinces.length && (billing.city || "") ? (
                  <Select
                    value={billing.district || ""}
                    onValueChange={(val) => setBilling({ ...billing, district: val })}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {(provinces.find((p) => p.name === (billing.city || ""))?.districts || []).map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={billing.district || ""} onChange={(e) => setBilling({ ...billing, district: e.target.value })} />
                )}
              </div>
              <div>
                <label className="text-xs text-slate-500">Posta Kodu</label>
                <Input aria-invalid={!!errors.postalCode} inputMode="numeric" maxLength={10} value={billing.postalCode || ""} onChange={(e) => setBilling({ ...billing, postalCode: e.target.value.replace(/\s/g, "") })} />
                {errors.postalCode && <div className="mt-1 text-[11px] text-red-600">{errors.postalCode}</div>}
              </div>
            </div>
 
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Ödeme Özeti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-slate-600 flex justify-between"><span>Plan Tutarı</span><span className="font-semibold">₺{formatPrice(baseAmount)}</span></div>
              <div className="text-sm text-slate-600 flex justify-between"><span>Havale İndirimi</span><span className="font-semibold text-green-700">−₺{formatPrice(bankDiscount)}</span></div>
              <div className="text-sm text-slate-600 flex justify-between"><span>Promosyon</span><span className="font-semibold text-green-700">−₺{formatPrice(promoDiscountPreview)}</span></div>
              <div className="border-t border-slate-200 pt-2 text-sm text-slate-900 flex justify-between"><span>Ödenecek Tutar</span><span className="font-bold">₺{formatPrice(totalAmount)}</span></div>
            </div>
            <div className="space-y-3">
              <div className="text-sm font-medium text-slate-700">Ödeme Yöntemi</div>
              <div className="flex items-center gap-3">
                <Button variant={method === "CARD" ? "default" : "outline"} onClick={() => setMethod("CARD")}>Kredi Kartı</Button>
                <Button variant={method === "BANK_TRANSFER" ? "default" : "outline"} onClick={() => setMethod("BANK_TRANSFER")}>Havale/EFT</Button>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Promosyon Kodu</div>
                <Input placeholder="Örneğin: WELCOME10" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
              </div>
              <Button className="w-full" onClick={startPayment}>Öde</Button>
            </div>
          </CardContent>
        </Card>
      </div>

 
    </div>
  );
}
