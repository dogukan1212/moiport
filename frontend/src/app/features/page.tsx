"use client";

import { useState } from "react";
import { LandingHeader, LandingFooter, primaryColor } from "@/components/landing-layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Target,
  Users,
  Wallet,
  Briefcase,
  MessageSquare,
  Sparkles,
  FileText,
  Layers,
  Zap,
  Shield,
  BarChart3,
  Bot,
  MessageCircle,
  Instagram,
  CheckCircle2,
  ArrowRight,
  Clock,
  PenTool,
  FileJson,
  Receipt,
  CreditCard,
  Calendar,
  LayoutTemplate,
  Activity
} from "lucide-react";
import Link from "next/link";

export default function Features() {
  const [activeTab, setActiveTab] = useState<'agency' | 'team' | 'customer' | 'integrations'>('agency');

  const allFeatures = {
    agency: [
      {
        id: "crm",
        title: "360° CRM & Satış Yönetimi",
        description: "Müşterilerinizi uçtan uca yönetin. Sürükle-bırak pipeline ile satış sürecinizi görselleştirin ve hiçbir fırsatı kaçırmayın.",
        icon: <Target size={32} />,
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        border: "border-blue-400/20",
        items: [
          "Kanban tabanlı satış hunisi",
          "Lead scoring (Potansiyel puanlama)",
          "Aktivite ve etkileşim tarihçesi",
          "Müşteri kaynak analizi"
        ]
      },
      {
        id: "social-ops",
        title: "Sosyal Medya Operasyonu",
        description: "İçerik üretim sürecini profesyonelce yönetin. Brief'ten tasarıma, onaydan paylaşıma kadar tüm aşamalar kontrol altında.",
        icon: <Instagram size={32} />,
        color: "text-purple-400",
        bg: "bg-purple-400/10",
        border: "border-purple-400/20",
        items: [
          "Brief ve Tasarım durum takibi",
          "Görsel planlama takvimi",
          "Tasarımcı ve SM Uzmanı atama",
          "Revize ve onay döngüleri"
        ]
      },
      {
        id: "omnichannel",
        title: "Omnichannel İletişim (WhatsApp & Instagram)",
        description: "Tüm iletişim kanallarını tek panelde toplayın. WhatsApp Business ve Instagram DM/Yorumlarını ekiplerinizle birlikte yönetin.",
        icon: <MessageSquare size={32} />,
        color: "text-green-400",
        bg: "bg-green-400/10",
        border: "border-green-400/20",
        items: [
          "WhatsApp & Instagram tek panelde",
          "Departman bazlı sohbet yönlendirme",
          "Otomatik karşılama mesajları",
          "Müşteri geçmişine hızlı erişim"
        ]
      },
      {
        id: "projects",
        title: "Proje & Görev Yönetimi",
        description: "Karmaşık projeleri yönetilebilir parçalara bölün. Gelişmiş görünümlerle ekibinizin ne üzerinde çalıştığını anlık görün.",
        icon: <Briefcase size={32} />,
        color: "text-pink-400",
        bg: "bg-pink-400/10",
        border: "border-pink-400/20",
        items: [
          "Board, Liste, Takvim ve Timeline görünümleri",
          "Alt görevler ve checklistler",
          "Dosya ve medya paylaşımı",
          "Sürükle-bırak görev dağıtımı"
        ]
      },
      {
        id: "finance",
        title: "Finans & Ön Muhasebe",
        description: "Ajansınızın finansal sağlığını koruyun. Faturaları, giderleri ve nakit akışını tek ekrandan izleyin.",
        icon: <Wallet size={32} />,
        color: "text-amber-400",
        bg: "bg-amber-400/10",
        border: "border-amber-400/20",
        items: [
          "Gelir/Gider takibi ve kategorilendirme",
          "Profesyonel e-fatura/arşiv oluşturma",
          "Cari hesap takibi",
          "Finansal raporlar ve grafikler"
        ]
      },
      {
        id: "ai-suite",
        title: "AI Stüdyo & Akıllı Teklif",
        description: "Yapay zeka ile içerik üretin ve saniyeler içinde profesyonel teklifler hazırlayın. Rakiplerinizden bir adım önde olun.",
        icon: <Sparkles size={32} />,
        color: "text-indigo-400",
        bg: "bg-indigo-400/10",
        border: "border-indigo-400/20",
        items: [
          "AI destekli blog ve sosyal medya içeriği",
          "Sektör ve rakip analizi",
          "PDF Teklif oluşturucu (Sürükle-bırak)",
          "Teklif durum takibi (Görüldü/Onay)"
        ]
      }
    ],
    integrations: [
      {
        id: "parasut",
        title: "Paraşüt Entegrasyonu",
        description: "Finansal süreçlerinizi Paraşüt ile senkronize edin. Faturalarınız ve cari hesaplarınız otomatik olarak güncellenir.",
        icon: <Receipt size={32} />,
        color: "text-orange-400",
        bg: "bg-orange-400/10",
        border: "border-orange-400/20",
        items: [
          "Otomatik fatura oluşturma",
          "Cari hesap eşitleme",
          "Tahsilat takibi",
          "Gider yönetimi"
        ]
      },
      {
        id: "google-calendar",
        title: "Google Calendar",
        description: "Toplantılarınızı ve etkinliklerinizi Google Takvim ile senkronize edin. Çakışmaları önleyin, her zaman organize kalın.",
        icon: <Calendar size={32} />,
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        border: "border-blue-400/20",
        items: [
          "İki yönlü senkronizasyon",
          "Otomatik toplantı linki (Meet)",
          "Etkinlik hatırlatmaları",
          "Müsaitlik durumu paylaşımı"
        ]
      },
      {
        id: "paytr",
        title: "PayTR Sanal POS",
        description: "Müşterilerinizden kredi kartı ile güvenli online ödeme alın. Tahsilat süreçlerinizi hızlandırın.",
        icon: <CreditCard size={32} />,
        color: "text-green-400",
        bg: "bg-green-400/10",
        border: "border-green-400/20",
        items: [
          "Güvenli ödeme altyapısı",
          "Tekrarlı ödeme (Abonelik)",
          "Taksitli satış imkanı",
          "Anlık işlem raporları"
        ]
      },
      {
        id: "trello",
        title: "Trello Entegrasyonu",
        description: "Mevcut Trello panolarınızı içe aktarın veya projelerinizi Trello ile senkronize çalıştırın.",
        icon: <LayoutTemplate size={32} />,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        items: [
          "Pano ve kart eşitleme",
          "Listeler arası taşıma",
          "Etiket ve üye senkronizasyonu",
          "Ek dosya ve yorumlar"
        ]
      },
      {
        id: "netgsm-vatansms",
        title: "Netgsm & VatanSMS",
        description: "SMS bildirimleri ile müşterilerinizi ve ekibinizi bilgilendirin. Otomatik hatırlatmalar kurun.",
        icon: <MessageCircle size={32} />,
        color: "text-purple-400",
        bg: "bg-purple-400/10",
        border: "border-purple-400/20",
        items: [
          "Başlıklı SMS gönderimi",
          "Otomatik randevu hatırlatma",
          "Ödeme günü bildirimleri",
          "Toplu SMS kampanyaları"
        ]
      }
    ],
    team: [
      {
        id: "team-tasks",
        title: "Gelişmiş Görev Paneli",
        description: "Size atanan işleri farklı görünümlerle yönetin. İş yükünüzü planlayın ve deadline'ları kaçırmayın.",
        icon: <Layers size={32} />,
        color: "text-purple-400",
        bg: "bg-purple-400/10",
        border: "border-purple-400/20",
        items: [
          "Kanban, Liste ve Takvim modları",
          "Görev içi dosya ve yorumlaşma",
          "Aciliyet ve öncelik etiketleri",
          "Kişiselleştirilebilir dashboard"
        ]
      },
      {
        id: "team-crm",
        title: "Satış & CRM Erişimi",
        description: "Satış ekibi için özel CRM arayüzü. Kendi lead'lerinizi takip edin, notlar alın ve satış hunisini yönetin.",
        icon: <Target size={32} />,
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        border: "border-blue-400/20",
        items: [
          "Lead listesi ve filtreleme",
          "Arama ve toplantı notları",
          "Hızlı aksiyon butonları",
          "Müşteri kartı görüntüleme"
        ]
      },
      {
        id: "team-collab",
        title: "Ekip İçi İletişim",
        description: "Projeler üzerinde tartışın, dosya paylaşın. E-posta trafiğinde kaybolmadan anlık iletişim kurun.",
        icon: <MessageCircle size={32} />,
        color: "text-green-400",
        bg: "bg-green-400/10",
        border: "border-green-400/20",
        items: [
          "Proje ve görev bazlı sohbet",
          "Medya ve doküman paylaşımı",
          "@Etiketleme ve bildirimler",
          "Online durum takibi"
        ]
      },
      {
        id: "team-performance",
        title: "Performans & İK",
        description: "Kendi performansınızı izleyin, izin taleplerinizi yönetin ve maaş bordrolarınıza erişin.",
        icon: <Activity size={32} />,
        color: "text-rose-400",
        bg: "bg-rose-400/10",
        border: "border-rose-400/20",
        items: [
          "Görev tamamlama istatistikleri",
          "Zaman takibi ve efor girişi",
          "Online izin yönetimi",
          "Bordro görüntüleme"
        ]
      }
    ],
    customer: [
      {
        id: "cust-leads",
        title: "Lead (Fırsat) Yönetimi",
        description: "Ajansınızın size kazandırdığı potansiyel müşterileri görün. Satış ekibinizle birlikte lead'leri yönetin ve dönüştürün.",
        icon: <Users size={32} />,
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        border: "border-blue-400/20",
        items: [
          "Gelen lead'leri görüntüleme",
          "Durum güncelleme (Arandı, Satıldı vb.)",
          "Müşteri notları ekleme",
          "Satış hunisi takibi"
        ]
      },
      {
        id: "cust-tasks",
        title: "Görev ve İş Takibi",
        description: "Ajansla ortak yürüttüğünüz işleri takip edin. Size atanan görevleri (örn: İçerik Onayı, Materyal Gönderimi) tamamlayın.",
        icon: <CheckCircle2 size={32} />,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        border: "border-emerald-400/20",
        items: [
          "Yapılacaklar listesi (TODO)",
          "Tamamlanan işler arşivi",
          "Dosya yükleme ve onaylama",
          "Süreç şeffaflığı"
        ]
      },
      {
        id: "cust-social",
        title: "Sosyal Medya Onay Paneli",
        description: "Markanız için hazırlanan içerikleri takvim üzerinde görün. Revize verin veya tek tıkla onaylayın.",
        icon: <Instagram size={32} />,
        color: "text-purple-400",
        bg: "bg-purple-400/10",
        border: "border-purple-400/20",
        items: [
          "Görsel içerik takvimi",
          "Tasarım ve metin önizleme",
          "Revize notları bırakma",
          "Onaylanan içerikler"
        ]
      },
      {
        id: "cust-finance",
        title: "Cari & Finans",
        description: "Ajansla olan finansal geçmişinizi görüntüleyin. Faturalarınızı indirin ve ödemelerinizi takip edin.",
        icon: <Wallet size={32} />,
        color: "text-amber-400",
        bg: "bg-amber-400/10",
        border: "border-amber-400/20",
        items: [
          "E-Fatura görüntüleme ve indirme",
          "Cari hesap ekstresi",
          "Ödeme planı ve vadesi gelenler",
          "Bakiye takibi"
        ]
      }
    ]
  };

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#00e676] selection:text-black">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[#00e676]/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e676]/10 text-[#00e676] text-xs font-bold mb-6"
          >
            <LayoutDashboard size={14} />
            <span>TÜM ÖZELLİKLER</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6"
          >
            İşinizi Büyütmek İçin <br />
            <span className="text-[#00e676]">İhtiyacınız Olan Her Şey</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10"
          >
            MOI Port, ajansınızın tüm operasyonel süreçlerini tek bir çatı altında toplayarak verimliliğinizi maksimize eder. Karmaşık araç yığınından kurtulun.
          </motion.p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pb-32 relative z-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          
          {/* Tabs */}
          <div className="flex justify-center mb-16 mt-12">
            <div className="bg-white/5 p-1 rounded-full inline-flex border border-white/10 flex-wrap justify-center">
              {(['agency', 'team', 'customer', 'integrations'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                    activeTab === tab 
                      ? 'bg-zinc-800 text-white shadow-sm' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab === 'agency' && 'Ajans Yönetimi'}
                  {tab === 'team' && 'Ekip İş Birliği'}
                  {tab === 'customer' && 'Müşteri Paneli'}
                  {tab === 'integrations' && 'Entegrasyonlar'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="wait">
              {allFeatures[activeTab].map((feature, index) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group relative overflow-hidden`}
                >
                  <div className={`absolute top-0 right-0 p-20 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none ${feature.color}`}>
                    {feature.icon}
                  </div>
                  
                  <div className={`size-14 rounded-2xl ${feature.bg} ${feature.border} border flex items-center justify-center ${feature.color} mb-6 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-8 md:h-20">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-3">
                    {feature.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-xs font-medium text-zinc-300">
                        <CheckCircle2 size={16} className={`shrink-0 ${feature.color}`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-white/10 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00e676]/10 blur-[120px] rounded-full pointer-events-none"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
                Hemen Başlayın, Farkı Görün
              </h2>
              <p className="text-lg text-zinc-400 mb-10">
                14 günlük ücretsiz deneme süresi ile MOI Port'un tüm özelliklerini risk almadan keşfedin. Kredi kartı gerekmez.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/register" 
                  className="bg-[#00e676] text-black px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2"
                >
                  Ücretsiz Deneyin <ArrowRight size={18} />
                </Link>
                <Link 
                  href="/contact" 
                  className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  Satış Ekibiyle Görüşün
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
