import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  LayoutGrid, 
  Wallet, 
  MessageCircle, 
  FileText, 
  Sparkles,
  BarChart3,
  MessageSquare,
  Calendar,
  Share2,
  Folder,
  Globe,
  Target,
  Instagram,
  Video
} from "lucide-react";

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string; // YouTube ID or direct URL
  thumbnailUrl?: string;
  duration?: string;
  category: string;
  icon?: any;
}

export const tutorialCategories = [
  { id: "general", label: "Genel Kullanım" },
  { id: "crm", label: "CRM & Müşteriler" },
  { id: "finance", label: "Finans & Muhasebe" },
  { id: "hr", label: "İnsan Kaynakları" },
  { id: "ai", label: "Yapay Zeka Araçları" },
];

export const tutorials: Tutorial[] = [
  {
    id: "dashboard-overview",
    title: "Genel Bakış Ekranı",
    description: "Dashboard ekranındaki metriklerin ve widgetların kullanımı.",
    videoUrl: "dQw4w9WgXcQ", // Example YouTube ID
    category: "general",
    duration: "2:30",
    icon: LayoutDashboard
  },
  {
    id: "crm-leads",
    title: "Potansiyel Müşteri (Lead) Yönetimi",
    description: "Yeni lead ekleme, kanban görünümü ve durum güncellemeleri.",
    videoUrl: "",
    category: "crm",
    duration: "4:15",
    icon: Users
  },
  {
    id: "ai-proposals",
    title: "AI ile Teklif Hazırlama",
    description: "Yapay zeka kullanarak saniyeler içinde profesyonel teklifler oluşturun.",
    videoUrl: "",
    category: "ai",
    duration: "3:45",
    icon: Sparkles
  },
  {
    id: "finance-invoices",
    title: "Fatura Oluşturma ve Takip",
    description: "Müşterilerinize fatura kesme ve ödeme takibi işlemleri.",
    videoUrl: "",
    category: "finance",
    duration: "5:00",
    icon: Wallet
  }
];
