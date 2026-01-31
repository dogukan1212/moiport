"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { LayoutDashboard, ArrowRight, CheckCircle2, Mail, Lock, User, Building2, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { primaryColor } from "@/components/landing-layout";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    agencyName: "",
    phone: "",
    industry: "AGENCY",
    industrySubType: "",
    acceptTrial: false,
    acceptLegal: false,
    marketingEmails: false,
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"register" | "module_selection" | "email_verify">("register");
  const [selectedModules, setSelectedModules] = useState<string[]>(["CRM", "FINANCE", "TASKS", "STORAGE", "CHAT"]);
  const [emailVerifyToken, setEmailVerifyToken] = useState("");
  const [emailVerifyCode, setEmailVerifyCode] = useState("");
  const { login } = useAuth();

  const toggleModule = (module: string) => {
    if (selectedModules.includes(module)) {
      setSelectedModules(selectedModules.filter((m) => m !== module));
    } else {
      setSelectedModules([...selectedModules, module]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    
    if (!formData.acceptLegal && step === "register") {
      setError(
        "Devam etmek için KVKK Aydınlatma Metni'ni, Gizlilik, Çerez Politikası ve Kullanım Şartları'nı kabul etmelisiniz."
      );
      return;
    }

    // Step 1: Initial Register Form -> Go to Module Selection
    if (step === "register") {
      // Health Tourism Pre-selection Logic
      if (
        formData.industry === "HEALTH" &&
        formData.industrySubType === "HEALTH_TOURISM"
      ) {
        setSelectedModules((prev) => {
          const defaults = ["CRM", "TASKS", "STORAGE", "CHAT", "HEALTH_TOURISM"];
          // Merge unique
          return Array.from(new Set([...prev, ...defaults]));
        });
      }

      // Dental Clinic Pre-selection Logic
      if (
        formData.industry === "HEALTH" &&
        formData.industrySubType === "DENTAL_CLINIC"
      ) {
        setSelectedModules((prev) => {
          const defaults = ["CRM", "TASKS", "STORAGE", "CHAT", "DENTAL_CLINIC"];
          // Merge unique
          return Array.from(new Set([...prev, ...defaults]));
        });
      }
      
      setStep("module_selection");
      return;
    }

    // Step 2: Module Selection -> Submit to Backend
    if (step === "module_selection") {
      try {
        const payload: {
          agencyName: string;
          name: string;
          email: string;
          password: string;
          phone?: string;
          industry?: string;
          industrySubType?: string;
          enabledModules?: string;
        } = {
          agencyName: formData.agencyName,
          name: formData.name,
          email: formData.email,
          password: formData.password,
        };

        const phone = String(formData.phone || "").trim();
        if (phone) payload.phone = phone;

        const industry = String(formData.industry || "").trim();
        if (industry) payload.industry = industry;
        const industrySubType = String(formData.industrySubType || "").trim();
        if (industrySubType) payload.industrySubType = industrySubType;

        if (selectedModules.length > 0) {
          let modulesToSend = [...selectedModules];
          // CRM seçilirse Müşteriler modülünü de ekle
          if (modulesToSend.includes("CRM") && !modulesToSend.includes("CUSTOMERS")) {
            modulesToSend.push("CUSTOMERS");
          }
          // Görevler seçilirse Projeler modülünü de ekle
          if (modulesToSend.includes("TASKS") && !modulesToSend.includes("PROJECTS")) {
            modulesToSend.push("PROJECTS");
          }

          if (modulesToSend.includes("HEALTH_TOURISM")) {
            const healthTourismModules = [
              "HEALTH_TOURISM_PATIENTS",
              "HEALTH_TOURISM_TRAVEL",
              "HEALTH_TOURISM_APPOINTMENTS",
              "HEALTH_TOURISM_ACCOMMODATION",
              "HEALTH_TOURISM_TREATMENT_PLANS",
              "HEALTH_TOURISM_LEGAL",
              "HEALTH_TOURISM_AUTOMATIONS",
              "HEALTH_TOURISM_ANALYTICS",
              "HEALTH_TOURISM_PATIENT_PORTAL",
            ];
            healthTourismModules.forEach((m) => {
              if (!modulesToSend.includes(m)) {
                modulesToSend.push(m);
              }
            });

            // Modül seçildiyse sektör bilgisini de güncelle
            // ARTIK GÜNCELLEMİYORUZ - HEPSİ AJANS ÇATISI ALTINDA
            // payload.industry = "HEALTH";
            // payload.industrySubType = "HEALTH_TOURISM";
          }

          if (modulesToSend.includes("DENTAL_CLINIC")) {
            const dentalModules = [
              "DENTAL_PATIENTS",
              "DENTAL_CHARTING",
              "DENTAL_TREATMENT_PLANS",
              "DENTAL_LAB_TRACKING",
              "DENTAL_IMAGING",
              "DENTAL_INVENTORY",
            ];
            dentalModules.forEach((m) => {
              if (!modulesToSend.includes(m)) {
                modulesToSend.push(m);
              }
            });

            // Modül seçildiyse sektör bilgisini de güncelle
            // ARTIK GÜNCELLEMİYORUZ - HEPSİ AJANS ÇATISI ALTINDA
            // payload.industry = "HEALTH";
            // payload.industrySubType = "DENTAL_CLINIC";
          }
          payload.enabledModules = modulesToSend.join(",");
        }

        const res = await api.post("/auth/register", payload);
        if (res.data?.requiresEmailVerification && res.data?.token) {
          setEmailVerifyToken(String(res.data.token));
          setEmailVerifyCode("");
          setStep("email_verify");
          setMessage(
            "E-postanıza doğrulama kodu gönderdik. Kaydı tamamlamak için kodu girin."
          );
          return;
        }
        login(res.data.access_token, res.data.user);
      } catch (err: any) {
        const data = err?.response?.data;
        const message = data?.message;

        if (Array.isArray(message)) {
          setError(message.join(" • "));
        } else if (message === "Email already in use") {
          setError("Bu e-posta adresi zaten kayıtlı, lütfen giriş yapın.");
        } else {
          setError(message || "Kayıt başarısız");
        }
      }
    }
  };

  const handleModuleToggle = (moduleKey: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleKey) 
        ? prev.filter(m => m !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const res = await api.post("/auth/verify-email", {
        token: emailVerifyToken,
        code: emailVerifyCode.trim(),
      });
      login(res.data.access_token, res.data.user);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Doğrulama başarısız");
    }
  };

  const handleResendEmail = async () => {
    setError("");
    setMessage("");
    try {
      await api.post("/auth/resend-email-verification", { token: emailVerifyToken });
      setMessage("Kod tekrar gönderildi.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Kod tekrar gönderilemedi");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050505] font-sans selection:bg-[#00e676] selection:text-black">
      {/* Sol Taraf - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-24 relative z-10">
        <div className="mb-12">
          <Link href="/" className="flex items-center gap-2 mb-8 w-fit">
            <div
              className="flex size-8 items-center justify-center rounded"
              style={{ backgroundColor: primaryColor }}
            >
              <LayoutDashboard size={20} strokeWidth={2} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              MOI PORT
            </span>
          </Link>
          <h1 className="text-4xl font-extrabold text-white mb-3">Hemen Başlayın</h1>
          <p className="text-zinc-400">Ajansınızı saniyeler içinde kurun ve yönetmeye başlayın.</p>
        </div>

        <form
          onSubmit={step === "email_verify" ? handleVerifyEmail : handleSubmit}
          className="space-y-5 max-w-xl"
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl"
            >
              {error}
            </motion.div>
          )}
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 text-sm text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded-xl"
            >
              {message}
            </motion.div>
          )}

          {step === "register" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Ajans Adı</label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00e676] transition-colors" size={18} />
                    <input
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-12 py-4 text-white placeholder-zinc-600 outline-none focus:border-[#00e676]/50 focus:bg-white/[0.05] transition-all"
                      placeholder="Örn: Mavi Medya Ajansı"
                      value={formData.agencyName}
                      onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Ad Soyad</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00e676] transition-colors" size={18} />
                    <input
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-12 py-4 text-white placeholder-zinc-600 outline-none focus:border-[#00e676]/50 focus:bg-white/[0.05] transition-all"
                      placeholder="Örn: Ahmet Yılmaz"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Sektör</label>
                  <div className="relative group">
                    <select
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-[#00e676]/50 focus:bg-white/[0.05] transition-all"
                      value={
                        formData.industry === "HEALTH" && formData.industrySubType === "HEALTH_TOURISM"
                          ? "HEALTH_TOURISM"
                          : formData.industry === "HEALTH" && formData.industrySubType === "DENTAL_CLINIC"
                          ? "DENTAL_CLINIC"
                          : "AGENCY"
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "HEALTH_TOURISM") {
                          setFormData({
                            ...formData,
                            industry: "HEALTH",
                            industrySubType: "HEALTH_TOURISM",
                          });
                        } else if (v === "DENTAL_CLINIC") {
                          setFormData({
                            ...formData,
                            industry: "HEALTH",
                            industrySubType: "DENTAL_CLINIC",
                          });
                        } else {
                          setFormData({
                            ...formData,
                            industry: "AGENCY",
                            industrySubType: "",
                          });
                        }
                      }}
                    >
                      <option value="AGENCY">Ajans / Dijital Ajans / Reklam</option>
                      <option value="HEALTH_TOURISM">Sağlık Turizmi</option>
                      <option value="DENTAL_CLINIC">Diş Kliniği</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">E-posta</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00e676] transition-colors" size={18} />
                    <input
                      type="email"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-12 py-4 text-white placeholder-zinc-600 outline-none focus:border-[#00e676]/50 focus:bg-white/[0.05] transition-all"
                      placeholder="ahmet@kolayentegrasyon.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Şifre</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00e676] transition-colors" size={18} />
                    <input
                      type="password"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-12 py-4 text-white placeholder-zinc-600 outline-none focus:border-[#00e676]/50 focus:bg-white/[0.05] transition-all"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                    Telefon <span className="font-semibold text-zinc-600 normal-case">(opsiyonel)</span>
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00e676] transition-colors" size={18} />
                    <input
                      type="tel"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-12 py-4 text-white placeholder-zinc-600 outline-none focus:border-[#00e676]/50 focus:bg-white/[0.05] transition-all"
                      placeholder="05XXXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 py-2 px-1">
                <div className="flex h-6 items-center">
                  <input
                    id="trial"
                    name="trial"
                    type="checkbox"
                    checked={formData.acceptTrial}
                    onChange={(e) => setFormData({ ...formData, acceptTrial: e.target.checked })}
                    className="size-5 rounded border-white/10 bg-white/5 text-[#00e676] focus:ring-[#00e676] focus:ring-offset-0 cursor-pointer accent-[#00e676]"
                  />
                </div>
                <div className="text-sm leading-6">
                  <label htmlFor="trial" className="font-medium text-zinc-300 cursor-pointer select-none hover:text-white transition-colors">
                    14 Günlük deneme sürecimi başlat
                  </label>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    Kredi kartı gerekmez. İstediğiniz zaman iptal edebilirsiniz.
                  </p>
                </div>
              </div>

              <div className="space-y-3 px-1 pt-1">
                <div className="flex items-start gap-3">
                  <div className="flex h-5 items-center">
                    <input
                      id="legal-consent"
                      name="legal-consent"
                      type="checkbox"
                      checked={formData.acceptLegal}
                      onChange={(e) => setFormData({ ...formData, acceptLegal: e.target.checked })}
                      className="size-4 rounded border-white/10 bg-white/5 text-[#00e676] focus:ring-[#00e676] focus:ring-offset-0 cursor-pointer accent-[#00e676]"
                    />
                  </div>
                  <label
                    htmlFor="legal-consent"
                    className="text-xs leading-relaxed text-zinc-400 cursor-pointer select-none"
                  >
                    KVKK Aydınlatma Metni&apos;ni,{" "}
                    <Link href="/privacy" className="text-[#00e676] hover:underline">
                      Gizlilik Politikası
                    </Link>
                    ,{" "}
                    <Link href="/cookies" className="text-[#00e676] hover:underline">
                      Çerez Politikası
                    </Link>{" "}
                    ve{" "}
                    <Link href="/terms" className="text-[#00e676] hover:underline">
                      Kullanım Şartları
                    </Link>
                    &apos;nı okudum, kabul ediyorum.
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-5 items-center">
                    <input
                      id="marketing-consent"
                      name="marketing-consent"
                      type="checkbox"
                      checked={formData.marketingEmails}
                      onChange={(e) => setFormData({ ...formData, marketingEmails: e.target.checked })}
                      className="size-4 rounded border-white/10 bg-white/5 text-[#00e676] focus:ring-[#00e676] focus:ring-offset-0 cursor-pointer accent-[#00e676]"
                    />
                  </div>
                  <label
                    htmlFor="marketing-consent"
                    className="text-xs leading-relaxed text-zinc-500 cursor-pointer select-none"
                  >
                    İsteğe bağlı: MOI Port&apos;tan e-posta ile tanıtım, kampanya ve duyurular içeren
                    ticari elektronik ileti almayı kabul ediyorum.
                  </label>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#00e676] hover:bg-[#00c853] text-black font-bold h-14 rounded-xl text-base mt-2 transition-transform active:scale-[0.98]"
              >
                Hesap Oluştur <ArrowRight className="ml-2" size={20} />
              </Button>
            </>
          ) : step === "module_selection" ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Modül Seçimi</h2>
                <p className="text-zinc-400">
                  İhtiyacınız olan modülleri seçerek panelinizi özelleştirin.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: "CRM", label: "CRM & Müşteri Yönetimi", desc: "Müşterilerinizi ve satış süreçlerinizi yönetin." },
                  { id: "FINANCE", label: "Finans Yönetimi", desc: "Gelir/gider takibi ve faturalandırma." },
                  { id: "TASKS", label: "Görev ve Proje Yönetimi", desc: "Ekip içi görev dağılımı ve proje takibi." },
                  { id: "STORAGE", label: "Dosya Depolama", desc: "Belge ve dosyalarınızı güvenle saklayın." },
                  { id: "WHATSAPP", label: "WhatsApp Entegrasyonu", desc: "WhatsApp üzerinden müşterilerinizle iletişim kurun." },
                  { id: "INSTAGRAM", label: "Instagram Entegrasyonu", desc: "Instagram mesajlarınızı panelden yönetin." },
                  { id: "HEALTH_TOURISM", label: "Sağlık Turizmi", desc: "Hasta, seyahat, randevu, konaklama ve tedavi modülleri." },
                  { id: "DENTAL_CLINIC", label: "Diş Kliniği", desc: "Diş şeması, tedavi planları, laboratuvar ve stok takibi." },
                ].map((module) => (
                  <div
                    key={module.id}
                    onClick={() => toggleModule(module.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedModules.includes(module.id)
                        ? "bg-[#00e676]/10 border-[#00e676] ring-1 ring-[#00e676]"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-semibold ${selectedModules.includes(module.id) ? "text-[#00e676]" : "text-white"}`}>
                          {module.label}
                        </div>
                        <div className="text-sm text-zinc-400 mt-1">{module.desc}</div>
                      </div>
                      <div
                        className={`size-6 rounded-full border flex items-center justify-center transition-colors ${
                          selectedModules.includes(module.id)
                            ? "bg-[#00e676] border-[#00e676]"
                            : "border-zinc-600"
                        }`}
                      >
                        {selectedModules.includes(module.id) && <CheckCircle2 size={14} className="text-black" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep("register")}
                  className="w-1/3 h-14 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-semibold"
                >
                  Geri
                </button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-[#00e676] hover:bg-[#00c853] text-black font-bold h-14 rounded-xl text-base transition-transform active:scale-[0.98]"
                >
                  Tamamla ve Giriş Yap <ArrowRight className="ml-2" size={20} />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="text-white font-extrabold text-2xl">E-posta Doğrulama</div>
                <div className="text-zinc-400 text-sm">
                  E-postanıza gelen 6 haneli doğrulama kodunu girin.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Doğrulama Kodu</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00e676] transition-colors" size={18} />
                  <input
                    inputMode="numeric"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-12 py-4 text-white placeholder-zinc-600 outline-none focus:border-[#00e676]/50 focus:bg-white/[0.05] transition-all"
                    placeholder="123456"
                    value={emailVerifyCode}
                    onChange={(e) => setEmailVerifyCode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#00e676] hover:bg-[#00c853] text-black font-bold h-14 rounded-xl text-base mt-2 transition-transform active:scale-[0.98]"
              >
                Doğrula <ArrowRight className="ml-2" size={20} />
              </Button>

              <button
                type="button"
                onClick={handleResendEmail}
                className="w-full text-center text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Kodu tekrar gönder
              </button>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  setStep("register");
                }}
                className="w-full text-center text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Geri
              </button>
            </>
          )}

          <p className="text-center text-zinc-500 text-sm mt-6">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="text-[#00e676] hover:underline font-bold">
              Giriş Yapın
            </Link>
          </p>
        </form>
      </div>

      {/* Sağ Taraf - Görsel & Avantajlar */}
      <div className="hidden lg:flex w-1/2 bg-zinc-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00e676]/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-extrabold text-white mb-8 leading-tight">
            Ajans Yönetiminde <br />
            <span className="text-[#00e676]">Yeni Bir Çağ</span>
          </h2>
          
          <div className="space-y-6">
            {[
              "Sınırsız proje ve görev yönetimi",
              "AI destekli içerik ve teklif oluşturucu",
              "Müşteri paneli ile şeffaf süreçler",
              "Detaylı finans ve performans raporları"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-zinc-300">
                <div className="size-8 rounded-full bg-[#00e676]/10 flex items-center justify-center text-[#00e676]">
                  <CheckCircle2 size={18} />
                </div>
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`size-10 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400`}>
                    U{i}
                  </div>
                ))}
              </div>
              <div className="text-sm text-zinc-400">
                <span className="text-white font-bold">2.000+</span> ajans kullanıyor
              </div>
            </div>
            <p className="text-zinc-500 text-xs italic">
              "MOI Port sayesinde iş süreçlerimizi %40 hızlandırdık. Kesinlikle tavsiye ederim."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
