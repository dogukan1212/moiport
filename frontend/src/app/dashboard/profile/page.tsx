"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import api, { getBaseURL } from "@/lib/api";
import { Camera, Save, Lock, User, Briefcase, CreditCard, HeartPulse, Shield, ChevronRight } from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("personal"); // personal, contract, finance, security
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    tckn: "",
    birthDate: "",
    bankName: "",
    bankBranch: "",
    bankAccountNumber: "",
    iban: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    maritalStatus: "",
    childrenCount: "",
    bloodType: "",
    educationLevel: "",
  });

  const [passData, setPassData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      api.get("/users/me").then((res) => {
        const data = res.data;
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          tckn: data.tckn || "",
          birthDate: data.birthDate ? data.birthDate.split("T")[0] : "",
          bankName: data.bankName || "",
          bankBranch: data.bankBranch || "",
          bankAccountNumber: data.bankAccountNumber || "",
          iban: data.iban || "",
          emergencyContactName: data.emergencyContactName || "",
          emergencyContactPhone: data.emergencyContactPhone || "",
          maritalStatus: data.maritalStatus || "",
          childrenCount: data.childrenCount || "",
          bloodType: data.bloodType || "",
          educationLevel: data.educationLevel || "",
        });
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.patch("/users/me", formData);
      updateUser(res.data);
      // Optional: Add a toast notification here
      // toast.success("Profil başarıyla güncellendi");
    } catch (error) {
      console.error(error);
      // toast.error("Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUser({ avatar: res.data.avatar });
    } catch (error) {
      console.error(error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      alert("Yeni şifreler eşleşmiyor!");
      return;
    }
    try {
      await api.post("/users/me/password", {
        oldPassword: passData.oldPassword,
        newPassword: passData.newPassword,
      });
      alert("Şifre değiştirildi!");
      setPassData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      alert("Şifre değiştirilemedi. Mevcut şifrenizi kontrol edin.");
    }
  };

  const getAvatarUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${getBaseURL()}${path}`;
  };

  // Modern Input Component
  const InputGroup = ({ label, value, onChange, type = "text", disabled = false, placeholder = "" }: any) => (
    <div className="group">
      <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1 transition-colors group-focus-within:text-foreground">
        {label}
      </label>
      <input
        type={type}
        className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header Area */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light text-foreground tracking-tight">Profilim</h1>
          <p className="text-muted-foreground mt-2 text-sm">Kişisel bilgilerinizi ve tercihlerinizi buradan yönetin.</p>
        </div>
        <button 
          onClick={handleUpdateProfile}
          disabled={loading}
          className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Değişiklikleri Kaydet
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Sidebar - Sticky Identity Card */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="sticky top-8">
            <div className="bg-card rounded-3xl p-6 border border-border shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-slate-50/60 to-slate-100/40 dark:from-zinc-900 dark:to-zinc-800 z-0"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div 
                  className="w-28 h-28 rounded-full bg-background p-1 shadow-sm mb-4 cursor-pointer relative"
                  onClick={handleAvatarClick}
                >
                  <div className="w-full h-full rounded-full overflow-hidden relative group-avatar">
                    {user?.avatar ? (
                      <img
                        src={getAvatarUrl(user.avatar) || ""}
                        alt="Profile"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-3xl font-medium">
                        {user?.name?.[0] || "U"}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                      <Camera className="text-white w-6 h-6" />
                    </div>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />

                <h2 className="text-xl font-semibold text-foreground">{formData.name || user?.name}</h2>
                <p className="text-sm text-muted-foreground mb-4">{user?.role === 'ADMIN' ? 'Yönetici' : 'Personel'}</p>
                
                <div className="w-full border-t border-border pt-4 mt-2 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <span className="block text-xs text-muted-foreground mb-1">Katılım</span>
                    <span className="block text-sm font-medium text-foreground">2026</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground mb-1">Durum</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                      Aktif
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Menu for Sections (Mobile/Desktop) */}
            <nav className="mt-6 space-y-1">
              {[
                { id: "personal", label: "Kişisel Bilgiler", icon: User },
                { id: "contract", label: "Sözleşme & Detaylar", icon: Briefcase },
                { id: "finance", label: "Banka & Finans", icon: CreditCard },
                { id: "security", label: "Güvenlik", icon: Shield },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${
                    activeSection === item.id
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md shadow-slate-900/10"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      size={18}
                      className={
                        activeSection === item.id
                          ? "text-slate-300 dark:text-slate-700"
                          : "text-muted-foreground"
                      }
                    />
                    {item.label}
                  </div>
                  {activeSection === item.id && <ChevronRight size={14} className="text-slate-400" />}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Right Content Area - Form Sections */}
        <div className="col-span-12 lg:col-span-8 space-y-8 pb-12">
          
          {/* Section: Personal */}
          {activeSection === "personal" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Temel Bilgiler</h3>
                    <p className="text-xs text-muted-foreground">Kimlik ve iletişim bilgilerinizi güncelleyin.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup
                    label="Ad Soyad"
                    value={formData.name}
                    onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <InputGroup
                    label="E-posta Adresi"
                    value={formData.email}
                    disabled
                    type="email"
                  />
                  <InputGroup
                    label="Telefon Numarası"
                    value={formData.phone}
                    onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="05XX XXX XX XX"
                  />
                  <InputGroup
                    label="Doğum Tarihi"
                    value={formData.birthDate}
                    onChange={(e: any) => setFormData({ ...formData, birthDate: e.target.value })}
                    type="date"
                  />
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">Adres</label>
                    <textarea
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none resize-none"
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-50">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-lg">
                      <HeartPulse size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Acil Durum</h3>
                      <p className="text-xs text-muted-foreground">Acil durumlarda ulaşılacak kişi.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup
                      label="Kişi Adı"
                      value={formData.emergencyContactName}
                      onChange={(e: any) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    />
                    <InputGroup
                      label="Telefon Numarası"
                      value={formData.emergencyContactPhone}
                      onChange={(e: any) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Contract Details */}
          {activeSection === "contract" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 rounded-lg">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Sözleşme Detayları</h3>
                    <p className="text-xs text-muted-foreground">İK süreçleri için gerekli ek bilgiler.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup
                    label="Medeni Durum"
                    value={formData.maritalStatus}
                    onChange={(e: any) => setFormData({ ...formData, maritalStatus: e.target.value })}
                    placeholder="Evli / Bekar"
                  />
                  <InputGroup
                    label="Çocuk Sayısı"
                    value={formData.childrenCount}
                    onChange={(e: any) => setFormData({ ...formData, childrenCount: e.target.value })}
                    type="number"
                  />
                  <InputGroup
                    label="Kan Grubu"
                    value={formData.bloodType}
                    onChange={(e: any) => setFormData({ ...formData, bloodType: e.target.value })}
                    placeholder="Örn: A Rh+"
                  />
                  <InputGroup
                    label="Eğitim Durumu"
                    value={formData.educationLevel}
                    onChange={(e: any) => setFormData({ ...formData, educationLevel: e.target.value })}
                    placeholder="Örn: Lisans"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Finance */}
          {activeSection === "finance" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Banka Bilgileri</h3>
                    <p className="text-xs text-muted-foreground">Maaş ödemeleri için kullanılacak hesap.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup
                    label="Banka Adı"
                    value={formData.bankName}
                    onChange={(e: any) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                  <InputGroup
                    label="Şube Adı/Kodu"
                    value={formData.bankBranch}
                    onChange={(e: any) => setFormData({ ...formData, bankBranch: e.target.value })}
                  />
                  <div className="md:col-span-2">
                    <InputGroup
                      label="Hesap Numarası"
                      value={formData.bankAccountNumber}
                      onChange={(e: any) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <InputGroup
                      label="IBAN"
                      value={formData.iban}
                      onChange={(e: any) => setFormData({ ...formData, iban: e.target.value })}
                      placeholder="TR..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Security */}
          {activeSection === "security" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Güvenlik</h3>
                    <p className="text-xs text-muted-foreground">Şifrenizi buradan değiştirebilirsiniz.</p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                  <InputGroup
                    label="Mevcut Şifre"
                    value={passData.oldPassword}
                    onChange={(e: any) => setPassData({ ...passData, oldPassword: e.target.value })}
                    type="password"
                  />
                  <div className="space-y-6 pt-4 border-t border-slate-50">
                    <InputGroup
                      label="Yeni Şifre"
                      value={passData.newPassword}
                      onChange={(e: any) => setPassData({ ...passData, newPassword: e.target.value })}
                      type="password"
                    />
                    <InputGroup
                      label="Yeni Şifre (Tekrar)"
                      value={passData.confirmPassword}
                      onChange={(e: any) => setPassData({ ...passData, confirmPassword: e.target.value })}
                      type="password"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-card border border-border text-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                    >
                      Şifreyi Güncelle
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
