"use client";

import Link from "next/link";
import {
  Settings,
  Bell,
  Lock,
  User,
  Globe,
  Palette,
  Mail,
  Smartphone,
  CreditCard,
  LogOut,
  Save,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { LandingHeader, LandingFooter, primaryColor } from "@/components/landing-layout";

function MenuLink({ icon, title, desc, href = "#" }: { icon: React.ReactNode, title: string, desc: string, href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-all group cursor-pointer border border-transparent hover:border-white/5">
      <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-[#00e676] group-hover:bg-[#00e676]/10 transition-colors">
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{title}</div>
        <p className="text-[11px] text-zinc-500 font-medium">{desc}</p>
      </div>
    </Link>
  );
}

function SettingsSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-2">{title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function ToggleSetting({ label, desc, enabled = false }: { label: string, desc: string, enabled?: boolean }) {
  const [isOn, setIsOn] = useState(enabled);
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
      <div>
        <div className="text-sm font-bold text-zinc-200">{label}</div>
        <div className="text-xs text-zinc-500">{desc}</div>
      </div>
      <button 
        onClick={() => setIsOn(!isOn)}
        className={`w-12 h-6 rounded-full transition-colors relative ${isOn ? 'bg-[#00e676]' : 'bg-zinc-800'}`}
      >
        <div className={`size-4 bg-white rounded-full absolute top-1 transition-all ${isOn ? 'left-7' : 'left-1'}`}></div>
      </button>
    </div>
  );
}

function InputSetting({ label, value, type = "text" }: { label: string, value: string, type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
      <input 
        type={type} 
        defaultValue={value}
        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#00e676]/50 transition-all"
      />
    </div>
  );
}

export default function SettingsPage() {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#00e676] selection:text-black">
      <LandingHeader />

      <main className="pt-32 pb-20 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h1 className="text-2xl font-bold text-white mb-6 px-4">Ayarlar</h1>
            {[
              { id: 'general', label: 'Genel', icon: <Settings size={18} /> },
              { id: 'profile', label: 'Profil', icon: <User size={18} /> },
              { id: 'notifications', label: 'Bildirimler', icon: <Bell size={18} /> },
              { id: 'security', label: 'Güvenlik', icon: <Lock size={18} /> },
              { id: 'billing', label: 'Ödeme & Paket', icon: <CreditCard size={18} /> },
              { id: 'integrations', label: 'Entegrasyonlar', icon: <Globe size={18} /> },
              { id: 'appearance', label: 'Görünüm', icon: <Palette size={18} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            
            <div className="pt-8 mt-8 border-t border-white/5">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-400/10 transition-all">
                <LogOut size={18} />
                Çıkış Yap
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 bg-white/[0.01] border border-white/5 rounded-3xl p-8 lg:p-12">
            {activeTab === 'general' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <SettingsSection title="Ajans Bilgileri">
                  <div className="grid md:grid-cols-2 gap-6">
                    <InputSetting label="Ajans Adı" value="Creative Minds" />
                    <InputSetting label="Web Sitesi" value="https://creativeminds.com" />
                    <InputSetting label="İletişim E-posta" value="hello@creativeminds.com" />
                    <InputSetting label="Telefon" value="+90 212 555 0000" />
                  </div>
                </SettingsSection>
                <SettingsSection title="Bölgesel Ayarlar">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Dil</label>
                      <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#00e676]/50 transition-all appearance-none">
                        <option>Türkçe</option>
                        <option>English</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Para Birimi</label>
                      <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#00e676]/50 transition-all appearance-none">
                        <option>TRY (₺)</option>
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                      </select>
                    </div>
                  </div>
                </SettingsSection>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <SettingsSection title="E-posta Bildirimleri">
                  <ToggleSetting label="Yeni Lead Bildirimi" desc="Yeni bir potansiyel müşteri geldiğinde e-posta al." enabled={true} />
                  <ToggleSetting label="Fatura Hatırlatıcıları" desc="Ödenmemiş faturalar için haftalık özet al." enabled={true} />
                  <ToggleSetting label="Haftalık Rapor" desc="Her Pazartesi performans raporu al." />
                </SettingsSection>
                <SettingsSection title="Mobil Bildirimler">
                  <ToggleSetting label="WhatsApp Mesajları" desc="Gelen WhatsApp mesajları için anlık bildirim." enabled={true} />
                  <ToggleSetting label="Görev Atamaları" desc="Sana yeni bir görev atandığında bildir." enabled={true} />
                </SettingsSection>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex items-center gap-6 mb-8">
                  <div className="size-24 rounded-full bg-zinc-800 flex items-center justify-center text-3xl font-bold text-zinc-500 border-2 border-dashed border-zinc-700">
                    JD
                  </div>
                  <div>
                    <button className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-all mb-2">Fotoğraf Yükle</button>
                    <p className="text-xs text-zinc-500">JPG, PNG veya GIF. Max 2MB.</p>
                  </div>
                </div>
                <SettingsSection title="Kişisel Bilgiler">
                  <div className="grid md:grid-cols-2 gap-6">
                    <InputSetting label="Ad Soyad" value="John Doe" />
                    <InputSetting label="Ünvan" value="Senior Manager" />
                    <InputSetting label="E-posta" value="john@creativeminds.com" />
                    <InputSetting label="Telefon" value="+90 555 123 4567" />
                  </div>
                </SettingsSection>
              </motion.div>
            )}

            {/* Save Button */}
            <div className="pt-8 mt-8 border-t border-white/5 flex justify-end">
              <button className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-black transition hover:scale-105 active:scale-95" style={{ backgroundColor: primaryColor }}>
                <Save size={18} />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
