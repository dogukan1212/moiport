"use client";

import { LandingHeader, LandingFooter } from "@/components/landing-layout";
import { motion } from "framer-motion";
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
  Activity,
  CreditCard,
  Settings,
  Calendar,
  Search,
  UserPlus,
  Receipt,
  Building2,
  FileCheck,
  Megaphone,
  Globe,
  Landmark,
  LayoutTemplate,
  Cloud,
  LineChart
} from "lucide-react";
import Link from "next/link";

export default function ModulesPage() {
  const categories = [
    {
      title: "Satış & CRM",
      description: "Müşteri ilişkilerini ve satış süreçlerini yönetin.",
      icon: <Target className="text-blue-400" size={24} />,
      color: "blue",
      modules: [
        {
          name: "CRM Board",
          desc: "Sürükle-bırak satış hunisi (pipeline) yönetimi.",
          icon: <Target size={20} />
        },
        {
          name: "Lead Yönetimi",
          desc: "Potansiyel müşterileri takip edin ve puanlayın.",
          icon: <UserPlus size={20} />
        },
        {
          name: "Müşteriler",
          desc: "Detaylı müşteri veritabanı ve geçmişi.",
          icon: <Users size={20} />
        },
        {
          name: "Akıllı Teklifler",
          desc: "AI destekli profesyonel teklif oluşturma.",
          icon: <FileJson size={20} />
        }
      ]
    },
    {
      title: "Operasyon & Proje",
      description: "Projeleri, görevleri ve süreçleri planlayın.",
      icon: <Briefcase className="text-purple-400" size={24} />,
      color: "purple",
      modules: [
        {
          name: "Projeler",
          desc: "Tüm projelerinizi tek ekrandan yönetin.",
          icon: <Briefcase size={20} />
        },
        {
          name: "Görevler",
          desc: "Gelişmiş görev atama ve takip sistemi.",
          icon: <CheckCircle2 size={20} />
        },
        {
          name: "Sosyal Medya",
          desc: "İçerik planlama, onay ve paylaşım takvimi.",
          icon: <Megaphone size={20} />
        },
        {
          name: "Raporlar",
          desc: "Detaylı iş ve performans raporları.",
          icon: <BarChart3 size={20} />
        }
      ]
    },
    {
      title: "İletişim & Etkileşim",
      description: "Tüm kanallardan kesintisiz iletişim kurun.",
      icon: <MessageSquare className="text-green-400" size={24} />,
      color: "green",
      modules: [
        {
          name: "Ekip Sohbeti",
          desc: "Proje bazlı dahili haberleşme sistemi.",
          icon: <MessageCircle size={20} />
        },
        {
          name: "WhatsApp",
          desc: "WhatsApp Business entegrasyonu.",
          icon: <MessageSquare size={20} />
        },
        {
          name: "Instagram",
          desc: "DM ve yorum yönetimi otomasyonu.",
          icon: <Instagram size={20} />
        },
        {
          name: "Toplantılar",
          desc: "Takvim entegrasyonlu toplantı yönetimi.",
          icon: <Calendar size={20} />
        }
      ]
    },
    {
      title: "Finans & Muhasebe",
      description: "Gelir, gider ve nakit akışını kontrol edin.",
      icon: <Wallet className="text-amber-400" size={24} />,
      color: "amber",
      modules: [
        {
          name: "Finans Paneli",
          desc: "Anlık finansal durum özeti.",
          icon: <BarChart3 size={20} />
        },
        {
          name: "Faturalar",
          desc: "E-fatura oluşturma ve takibi.",
          icon: <Receipt size={20} />
        },
        {
          name: "Gelir/Gider",
          desc: "Detaylı işlem kayıtları ve kategoriler.",
          icon: <Activity size={20} />
        },
        {
          name: "Ödemeler",
          desc: "Düzenli ödeme ve tahsilat takibi.",
          icon: <CreditCard size={20} />
        }
      ]
    },
    {
      title: "İK & Ekip",
      description: "Çalışan verimliliğini ve memnuniyetini artırın.",
      icon: <Users className="text-cyan-400" size={24} />,
      color: "cyan",
      modules: [
        {
          name: "Ekip Yönetimi",
          desc: "Personel kartları ve yetkilendirme.",
          icon: <Users size={20} />
        },
        {
          name: "Bordro & Maaş",
          desc: "Maaş hesaplama ve bordro takibi.",
          icon: <Wallet size={20} />
        },
        {
          name: "İzinler",
          desc: "Online izin talep ve onay süreci.",
          icon: <Calendar size={20} />
        },
        {
          name: "Sözleşmeler",
          desc: "Personel sözleşme ve evrak yönetimi.",
          icon: <FileCheck size={20} />
        }
      ]
    },
    {
      title: "Yapay Zeka (AI)",
      description: "İş süreçlerinizi yapay zeka ile hızlandırın.",
      icon: <Sparkles className="text-indigo-400" size={24} />,
      color: "indigo",
      modules: [
        {
          name: "İçerik Stüdyosu",
          desc: "Blog ve sosyal medya içerik üretimi.",
          icon: <PenTool size={20} />
        },
        {
          name: "Teklif Robotu",
          desc: "Saniyeler içinde kişiye özel teklifler.",
          icon: <Bot size={20} />
        },
        {
          name: "Analiz",
          desc: "Sektör ve rakip analizi asistanı.",
          icon: <Search size={20} />
        },
        {
          name: "Özetleme",
          desc: "Toplantı ve metin özetleme aracı.",
          icon: <FileText size={20} />
        }
      ]
    },
    {
      title: "Entegrasyonlar & Ekosistem",
      description: "Sistemi favori araçlarınızla güçlendirin.",
      icon: <Globe className="text-orange-400" size={24} />,
      color: "orange",
      modules: [
        {
          name: "Banka Entegrasyonu",
          desc: "Hesap hareketlerini otomatik işleyin.",
          icon: <Landmark size={20} />
        },
        {
          name: "WordPress & CMS",
          desc: "AI içeriklerini tek tıkla sitenizde yayınlayın.",
          icon: <LayoutTemplate size={20} />
        },
        {
          name: "Reklam Merkezi",
          desc: "Google & Meta reklam performans takibi.",
          icon: <LineChart size={20} />
        },
        {
          name: "Bulut Depolama",
          desc: "Drive & Dropbox dosya senkronizasyonu.",
          icon: <Cloud size={20} />
        }
      ]
    }
  ];

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
            <Layers size={14} />
            <span>TÜM MODÜLLER</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6"
          >
            Sistemdeki <span className="text-[#00e676]">Tüm Modüller</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10"
          >
            MOI Port, işletmenizin ihtiyacı olan tüm araçları tek bir çatı altında toplar. İşte sistemde yer alan modüllerin tam listesi.
          </motion.p>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="pb-32 relative z-10 pt-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`size-12 rounded-xl bg-${category.color}-500/10 flex items-center justify-center border border-${category.color}-500/20`}>
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{category.title}</h3>
                    <p className="text-xs text-zinc-500">{category.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {category.modules.map((module, mIndex) => (
                    <div key={mIndex} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                      <div className={`mt-1 text-${category.color}-400`}>
                        {module.icon}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-zinc-200">{module.name}</div>
                        <div className="text-xs text-zinc-500 leading-relaxed mt-0.5">{module.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Tüm Bu Modüllere Tek Üyelikle Erişin</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/register" 
              className="bg-[#00e676] text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
            >
              Hemen Başlayın
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
