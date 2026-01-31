"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  LayoutGrid,
  Wallet,
  MessageCircle,
  FileText,
  Settings,
  LogOut,
  Sparkles,
  BarChart3,
  MessageSquare,
  Calendar,
  UserCog,
  Share2,
  CreditCard,
  ShieldAlert,
  Target,
  Instagram,
  Globe,
  Video,
  Folder,
  GraduationCap,
  Plane,
  Building2,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const sections = [
  {
    label: "Yönetim",
    items: [
      { icon: LayoutDashboard, label: "Genel Bakış", href: "/dashboard" },
      { icon: Globe, label: "Web Siteleri", href: "/dashboard/websites" },
      { icon: Target, label: "CRM Yönetimi", href: "/dashboard/crm" },
      { icon: Users, label: "Leads", href: "/dashboard/crm/leads" },
      { icon: MessageCircle, label: "WhatsApp", href: "/dashboard/whatsapp" },
      { icon: Instagram, label: "Instagram", href: "/dashboard/instagram" },
      { icon: Users, label: "Müşteriler", href: "/dashboard/customers" },
      { icon: Wallet, label: "Finans", href: "/dashboard/finance" },
    ],
  },
  {
    label: "İş Akışı",
    items: [
      { icon: Folder, label: "Dosyalar", href: "/dashboard/storage" },
      { icon: LayoutGrid, label: "Görevler", href: "/dashboard/tasks" },
      { icon: Calendar, label: "Takvim", href: "/dashboard/calendar" },
      { icon: Video, label: "Toplantılar", href: "/dashboard/meetings" },
      { icon: GraduationCap, label: "Eğitimler", href: "/dashboard/tutorials" },
      { icon: BarChart3, label: "Görevler Rapor", href: "/dashboard/task-reports" },
      { icon: Briefcase, label: "Projeler", href: "/dashboard/projects" },
      { icon: MessageSquare, label: "Sohbet", href: "/dashboard/chat" },
      { icon: Share2, label: "Sosyal Medya Planları", href: "/dashboard/social-media-plans" },
    ],
  },
  {
    label: "Oneclick AI",
    items: [
      { icon: FileText, label: "AI Teklifler", href: "/dashboard/ai-proposals" },
      { icon: Sparkles, label: "AI İçerik Aracı", href: "/dashboard/ai-content" },
    ],
  },
  {
    label: "İnsan Kaynakları",
    items: [
      { icon: Users, label: "Ekip Yönetimi", href: "/dashboard/hr/team" },
      { icon: Wallet, label: "Bordro & Maaşlar", href: "/dashboard/hr/payroll" },
      { icon: FileText, label: "Sözleşme & Evrak", href: "/dashboard/hr/contracts" },
      { icon: Calendar, label: "İzinler", href: "/dashboard/hr/leaves" },
    ],
  },
];

const systemSection = {
  label: "Sistem",
  items: [
    { icon: CreditCard, label: "Abonelik", href: "/dashboard/subscriptions" },
    { icon: Settings, label: "Ayarlar", href: "/dashboard/settings" },
    { icon: LayoutGrid, label: "Modüller", href: "/dashboard/settings?tab=modules" },
  ],
};

export function Sidebar({ tenantData, className, onLinkClick }: { tenantData?: any; className?: string; onLinkClick?: () => void }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isHR = user?.role === "HR";
  const isClient = user?.role === "CLIENT";

  const tenantEnabledModules =
    typeof tenantData?.enabledModules === "string" && tenantData.enabledModules.trim().length > 0
      ? new Set(
          tenantData.enabledModules
            .split(",")
            .map((m: string) => m.trim().toUpperCase())
            .filter(Boolean)
        )
      : null;

  const getModuleKeyForHref = (href: string): string | null => {
    if (href.startsWith("/dashboard/crm")) return "CRM";
    if (href === "/dashboard/whatsapp") return "WHATSAPP";
    if (href === "/dashboard/instagram") return "INSTAGRAM";
    if (href === "/dashboard/social-media-plans") return "SOCIAL_MEDIA_PLANS";
    if (href === "/dashboard/projects") return "PROJECTS";
    if (href.startsWith("/dashboard/tasks") || href.startsWith("/dashboard/task-reports")) return "TASKS";
    if (href.startsWith("/dashboard/finance")) return "FINANCE";
    if (href === "/dashboard/chat") return "CHAT";
    if (href.startsWith("/dashboard/storage")) return "STORAGE";
    if (href.startsWith("/dashboard/customers")) return "CUSTOMERS";
    if (href === "/dashboard/health-tourism/patients") return "HEALTH_TOURISM_PATIENTS";
    if (href === "/dashboard/health-tourism/travel") return "HEALTH_TOURISM_TRAVEL";
    if (href === "/dashboard/health-tourism/appointments") return "HEALTH_TOURISM_APPOINTMENTS";
    if (href === "/dashboard/health-tourism/accommodation") return "HEALTH_TOURISM_ACCOMMODATION";
    if (href === "/dashboard/health-tourism/treatment-plans") return "HEALTH_TOURISM_TREATMENT_PLANS";
    if (href === "/dashboard/health-tourism/legal") return "HEALTH_TOURISM_LEGAL";
    if (href === "/dashboard/health-tourism/automations") return "HEALTH_TOURISM_AUTOMATIONS";
    if (href === "/dashboard/health-tourism/analytics") return "HEALTH_TOURISM_ANALYTICS";
    if (href === "/dashboard/health-tourism/patient-portal") return "HEALTH_TOURISM_PATIENT_PORTAL";
    if (href === "/dashboard/dental/patients") return "DENTAL_PATIENTS";
    if (href === "/dashboard/dental/charting") return "DENTAL_CHARTING";
    if (href === "/dashboard/dental/lab-tracking") return "DENTAL_LAB_TRACKING";
    if (href === "/dashboard/dental/imaging") return "DENTAL_IMAGING";
    if (href === "/dashboard/dental/finance") return "DENTAL_FINANCE";
    if (href === "/dashboard/dental/inventory") return "DENTAL_INVENTORY";
    if (href === "/dashboard/dental/patient-portal") return "DENTAL_PATIENT_PORTAL";
    return null;
  };

  const applyModuleFilter = <T extends { href: string }>(items: T[]): T[] => {
    if (!tenantEnabledModules || isSuperAdmin) return items;
    return items.filter((item) => {
      const key = getModuleKeyForHref(item.href);
      if (!key) return true;
      return tenantEnabledModules.has(key);
    });
  };

  const isRestricted = tenantData && ['SUSPENDED', 'TRIAL_ENDED', 'EXPIRED'].includes(tenantData.subscriptionStatus);
  const isWordpressEnabled = tenantData?.wordpressModuleEnabled;

  // Plan-based restrictions
  const currentPlan = tenantData?.subscriptionPlan || 'STARTER';
  
  const planAllowedHrefs = new Set<string>();

  if (isRestricted) {
    planAllowedHrefs.add("/dashboard/subscriptions");
  } else {
    // Base features (STARTER)
    planAllowedHrefs.add("/dashboard");
    planAllowedHrefs.add("/dashboard/tutorials");
    planAllowedHrefs.add("/dashboard/storage");
    if (isWordpressEnabled) {
      planAllowedHrefs.add("/dashboard/websites");
    }
    planAllowedHrefs.add("/dashboard/tasks");
    planAllowedHrefs.add("/dashboard/calendar");
    planAllowedHrefs.add("/dashboard/meetings");
    planAllowedHrefs.add("/dashboard/projects");
    planAllowedHrefs.add("/dashboard/chat");
    planAllowedHrefs.add("/dashboard/task-reports");
    planAllowedHrefs.add("/dashboard/hr/team");
    planAllowedHrefs.add("/dashboard/finance");
    planAllowedHrefs.add("/dashboard/settings");
    planAllowedHrefs.add("/dashboard/settings?tab=modules");
    planAllowedHrefs.add("/dashboard/subscriptions");
    planAllowedHrefs.add("/dashboard/health-tourism");
    planAllowedHrefs.add("/dashboard/health-tourism/patients");
    planAllowedHrefs.add("/dashboard/health-tourism/travel");
    planAllowedHrefs.add("/dashboard/health-tourism/appointments");
    planAllowedHrefs.add("/dashboard/health-tourism/accommodation");
    planAllowedHrefs.add("/dashboard/health-tourism/treatment-plans");
    planAllowedHrefs.add("/dashboard/health-tourism/legal");
    planAllowedHrefs.add("/dashboard/health-tourism/automations");
    planAllowedHrefs.add("/dashboard/health-tourism/analytics");
    planAllowedHrefs.add("/dashboard/health-tourism/patient-portal");
    planAllowedHrefs.add("/dashboard/dental");
    planAllowedHrefs.add("/dashboard/dental/patients");
    planAllowedHrefs.add("/dashboard/dental/charting");
    planAllowedHrefs.add("/dashboard/dental/lab-tracking");
    planAllowedHrefs.add("/dashboard/dental/imaging");
    planAllowedHrefs.add("/dashboard/dental/finance");
    planAllowedHrefs.add("/dashboard/dental/inventory");
    planAllowedHrefs.add("/dashboard/dental/patient-portal");

    // PRO Features
    if (['PRO', 'ENTERPRISE'].includes(currentPlan)) {
        planAllowedHrefs.add("/dashboard/crm");
        planAllowedHrefs.add("/dashboard/crm/leads");
        planAllowedHrefs.add("/dashboard/whatsapp");
        planAllowedHrefs.add("/dashboard/instagram");
        planAllowedHrefs.add("/dashboard/social-media-plans");
        planAllowedHrefs.add("/dashboard/customers");
        planAllowedHrefs.add("/dashboard/hr/payroll");
        planAllowedHrefs.add("/dashboard/hr/contracts");
        planAllowedHrefs.add("/dashboard/hr/leaves");
        planAllowedHrefs.add("/dashboard/ai-content");
        planAllowedHrefs.add("/dashboard/ai-proposals");
    }
  }

  const staffAllowedHrefs = new Set([
    "/dashboard",
    ...(isWordpressEnabled ? ["/dashboard/websites"] : []),
    "/dashboard/storage",
    "/dashboard/tutorials",
    "/dashboard/crm",
    "/dashboard/crm/leads",
    "/dashboard/whatsapp",
    "/dashboard/instagram",
    "/dashboard/tasks",
    "/dashboard/calendar",
    "/dashboard/meetings",
    "/dashboard/task-reports",
    "/dashboard/ai-content",
    "/dashboard/chat",
    "/dashboard/social-media-plans",
    "/dashboard/settings",
    "/dashboard/settings?tab=modules",
    "/dashboard/health-tourism",
    "/dashboard/health-tourism/patients",
    "/dashboard/health-tourism/travel",
    "/dashboard/health-tourism/appointments",
    "/dashboard/health-tourism/accommodation",
    "/dashboard/health-tourism/treatment-plans",
    "/dashboard/health-tourism/legal",
    "/dashboard/health-tourism/automations",
    "/dashboard/health-tourism/analytics",
    "/dashboard/health-tourism/patient-portal",
    "/dashboard/dental",
    "/dashboard/dental/patients",
    "/dashboard/dental/charting",
    "/dashboard/dental/lab-tracking",
    "/dashboard/dental/imaging",
    "/dashboard/dental/finance",
    "/dashboard/dental/inventory",
    "/dashboard/dental/patient-portal",
  ]);
  const hrAllowedHrefs = new Set([
    ...Array.from(staffAllowedHrefs.values()),
    "/dashboard/hr/team",
    "/dashboard/hr/payroll",
    "/dashboard/hr/contracts",
    "/dashboard/hr/leaves",
  ]);
  const clientAllowedHrefs = new Set([
    "/dashboard/settings", // Always allow settings
    "/dashboard/tutorials",
  ]);

  if (isClient && typeof user?.allowedModules === 'string') {
    const modules = user.allowedModules.split(',');
    if (modules.includes('PROJECTS')) clientAllowedHrefs.add("/dashboard/projects");
    if (modules.includes('TASKS')) clientAllowedHrefs.add("/dashboard/tasks");
    if (modules.includes('FINANCE')) clientAllowedHrefs.add("/dashboard/finance");
    if (modules.includes('CRM')) {
        clientAllowedHrefs.add("/dashboard/crm");
        clientAllowedHrefs.add("/dashboard/crm/leads");
    }
    if (modules.includes('CUSTOMERS')) clientAllowedHrefs.add("/dashboard/customers");
    if (modules.includes('WHATSAPP')) clientAllowedHrefs.add("/dashboard/whatsapp");
    if (modules.includes('INSTAGRAM')) clientAllowedHrefs.add("/dashboard/instagram");
    if (modules.includes('SOCIAL_MEDIA_PLANS')) clientAllowedHrefs.add("/dashboard/social-media-plans");
    if (modules.includes('CHAT')) clientAllowedHrefs.add("/dashboard/chat");
    if (modules.includes('STORAGE')) clientAllowedHrefs.add("/dashboard/storage");
    if (modules.includes('CALENDAR')) clientAllowedHrefs.add("/dashboard/calendar");
    if (modules.includes('MEETINGS')) clientAllowedHrefs.add("/dashboard/meetings");
    if (modules.includes('WEBSITES') && isWordpressEnabled) clientAllowedHrefs.add("/dashboard/websites");
    if (modules.includes('AI_PROPOSALS')) clientAllowedHrefs.add("/dashboard/ai-proposals");
    if (modules.includes('AI_CONTENT')) clientAllowedHrefs.add("/dashboard/ai-content");
    
    // Health Tourism Modules
    if (modules.includes('HEALTH_TOURISM_PATIENTS')) clientAllowedHrefs.add("/dashboard/health-tourism/patients");
    if (modules.includes('HEALTH_TOURISM_TRAVEL')) clientAllowedHrefs.add("/dashboard/health-tourism/travel");
    if (modules.includes('HEALTH_TOURISM_APPOINTMENTS')) clientAllowedHrefs.add("/dashboard/health-tourism/appointments");
    if (modules.includes('HEALTH_TOURISM_ACCOMMODATION')) clientAllowedHrefs.add("/dashboard/health-tourism/accommodation");
    if (modules.includes('HEALTH_TOURISM_TREATMENT_PLANS')) clientAllowedHrefs.add("/dashboard/health-tourism/treatment-plans");
    if (modules.includes('HEALTH_TOURISM_LEGAL')) clientAllowedHrefs.add("/dashboard/health-tourism/legal");
    if (modules.includes('HEALTH_TOURISM_AUTOMATIONS')) clientAllowedHrefs.add("/dashboard/health-tourism/automations");
    if (modules.includes('HEALTH_TOURISM_ANALYTICS')) clientAllowedHrefs.add("/dashboard/health-tourism/analytics");
    if (modules.includes('HEALTH_TOURISM_PATIENT_PORTAL')) clientAllowedHrefs.add("/dashboard/health-tourism/patient-portal");

    // Dental Modules
    if (modules.includes('DENTAL_PATIENTS')) clientAllowedHrefs.add("/dashboard/dental/patients");
    if (modules.includes('DENTAL_CHARTING')) clientAllowedHrefs.add("/dashboard/dental/charting");
    if (modules.includes('DENTAL_LAB_TRACKING')) clientAllowedHrefs.add("/dashboard/dental/lab-tracking");
    if (modules.includes('DENTAL_IMAGING')) clientAllowedHrefs.add("/dashboard/dental/imaging");
    if (modules.includes('DENTAL_FINANCE')) clientAllowedHrefs.add("/dashboard/dental/finance");
    if (modules.includes('DENTAL_INVENTORY')) clientAllowedHrefs.add("/dashboard/dental/inventory");
    if (modules.includes('DENTAL_PATIENT_PORTAL')) clientAllowedHrefs.add("/dashboard/dental/patient-portal");
  } else if (isClient) {
    clientAllowedHrefs.add("/dashboard/tasks");
    clientAllowedHrefs.add("/dashboard/storage");
    clientAllowedHrefs.add("/dashboard/chat");
    clientAllowedHrefs.add("/dashboard/projects");
  }
  const filterItemsByRole = <T extends { href: string }>(items: T[]): T[] => {
    // If not super admin, check plan limits first
    let filteredItems = items;
    if (!isSuperAdmin) {
        filteredItems = items.filter(item => planAllowedHrefs.has(item.href));
    }

    if (isAdmin) return applyModuleFilter(filteredItems);
    if (isHR) return applyModuleFilter(filteredItems.filter((item) => hrAllowedHrefs.has(item.href)));
    if (isClient) return items.filter((item) => clientAllowedHrefs.has(item.href));
    return applyModuleFilter(filteredItems.filter((item) => staffAllowedHrefs.has(item.href)));
  };

  const isLinkActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const getSectorSections = () => {
    // Default sections are always the base (Agency view)
    const baseSections = [...sections];

    const hasHealthTourismModules =
      (!!tenantEnabledModules &&
      (tenantEnabledModules.has("HEALTH_TOURISM") ||
        [
          "HEALTH_TOURISM_PATIENTS",
          "HEALTH_TOURISM_TRAVEL",
          "HEALTH_TOURISM_APPOINTMENTS",
          "HEALTH_TOURISM_ACCOMMODATION",
          "HEALTH_TOURISM_TREATMENT_PLANS",
          "HEALTH_TOURISM_LEGAL",
          "HEALTH_TOURISM_AUTOMATIONS",
          "HEALTH_TOURISM_ANALYTICS",
          "HEALTH_TOURISM_PATIENT_PORTAL",
        ].some((key) => tenantEnabledModules.has(key)))) ||
      (isClient && typeof user?.allowedModules === 'string' && user.allowedModules.split(',').some(m => m.includes('HEALTH_TOURISM')));
    
    const hasDentalModules = 
      (!!tenantEnabledModules &&
      (tenantEnabledModules.has("DENTAL_CLINIC") ||
        [
          "DENTAL_PATIENTS",
          "DENTAL_CHARTING",
          "DENTAL_LAB_TRACKING",
          "DENTAL_IMAGING",
          "DENTAL_FINANCE",
          "DENTAL_INVENTORY",
          "DENTAL_PATIENT_PORTAL",
        ].some((key) => tenantEnabledModules.has(key)))) ||
      (isClient && typeof user?.allowedModules === 'string' && user.allowedModules.split(',').some(m => m.includes('DENTAL')));

    if (hasHealthTourismModules) {
      baseSections.push({
        label: "Sağlık Turizmi",
        items: [
          { icon: Users, label: "Hasta Yönetimi", href: "/dashboard/health-tourism/patients" },
          { icon: Plane, label: "Seyahat & Transfer", href: "/dashboard/health-tourism/travel" },
          { icon: Calendar, label: "Muayene Randevuları", href: "/dashboard/health-tourism/appointments" },
          { icon: Building2, label: "Konaklama Yönetimi", href: "/dashboard/health-tourism/accommodation" },
          { icon: ClipboardList, label: "Tedavi Planları", href: "/dashboard/health-tourism/treatment-plans" },
          { icon: FileText, label: "Legal & KVKK", href: "/dashboard/health-tourism/legal" },
          { icon: MessageCircle, label: "Otomasyonlar", href: "/dashboard/health-tourism/automations" },
          { icon: BarChart3, label: "Raporlama & Analitik", href: "/dashboard/health-tourism/analytics" },
          { icon: LayoutDashboard, label: "Hasta Portalı", href: "/dashboard/health-tourism/patient-portal" },
        ],
      });
    }

    if (hasDentalModules) {
      baseSections.push({
        label: "Diş Kliniği",
        items: [
          { icon: Users, label: "Hasta Yönetimi", href: "/dashboard/dental/patients" },
          { icon: LayoutGrid, label: "Diş Şeması", href: "/dashboard/dental/charting" },
          { icon: ClipboardList, label: "Laboratuvar Takibi", href: "/dashboard/dental/lab-tracking" },
          { icon: FileText, label: "Görüntüleme", href: "/dashboard/dental/imaging" },
          { icon: Wallet, label: "Finansman", href: "/dashboard/dental/finance" },
          { icon: Folder, label: "Stok Takibi", href: "/dashboard/dental/inventory" },
          { icon: LayoutDashboard, label: "Hasta Portalı", href: "/dashboard/dental/patient-portal" },
        ],
      });
    }

    return baseSections;
  };

  const activeSections = getSectorSections();

  return (
    <aside className={cn("sidebar flex flex-col h-full w-64 px-7 py-10 border-r border-sidebar-border bg-sidebar text-sidebar-foreground overflow-y-auto", className)}>
      <nav className="flex-1 flex flex-col">
        <div className="space-y-8">
          {activeSections.map((section) => {
            const items = filterItemsByRole(section.items);
            if (items.length === 0) return null;
            return (
              <div key={section.label} className="nav-group">
                <div className="nav-label text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2 px-1">
                  {section.label}
                </div>
                <div className="space-y-1">
                  {items.map((item) => {
                    const active = isLinkActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "nav-item group flex items-center gap-2.5 text-[13px] px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                          active
                            ? "active bg-accent text-accent-foreground font-semibold border-l-2 border-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4 transition-colors",
                            active ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                          )}
                        />
                        <span className="ml-2 truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        

        {filterItemsByRole(systemSection.items).length > 0 && (
          <div className="nav-group mt-auto pt-8">
            <div className="nav-label text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2 px-1">
              {systemSection.label}
            </div>
            <div className="space-y-1">
              {isSuperAdmin && (
                 <Link
                    href="/admin"
                    onClick={onLinkClick}
                    className="nav-item flex items-center gap-2.5 text-[13px] px-2 py-1.5 rounded-md cursor-pointer transition-colors text-primary hover:bg-muted font-semibold"
                  >
                    <ShieldAlert className="h-4 w-4 text-primary" />
                    <span className="ml-2 truncate">SaaS Yönetimi</span>
                  </Link>
              )}
              {filterItemsByRole(systemSection.items).map((item) => {
                const active = isLinkActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onLinkClick}
                    className={cn(
                      "nav-item group flex items-center gap-2.5 text-[13px] px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                      active
                        ? "active bg-accent text-accent-foreground font-semibold border-l-2 border-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        active ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                      )}
                    />
                    <span className="ml-2 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
