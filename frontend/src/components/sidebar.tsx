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
      { icon: LayoutGrid, label: "Görevler", href: "/dashboard/tasks" },
      { icon: Calendar, label: "Takvim", href: "/dashboard/calendar" },
      { icon: Video, label: "Toplantılar", href: "/dashboard/meetings" },
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
  ],
};

export function Sidebar({ tenantData }: { tenantData?: any }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isHR = user?.role === "HR";
  const isClient = user?.role === "CLIENT";

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
    planAllowedHrefs.add("/dashboard/subscriptions");

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
    if (modules.includes('WHATSAPP')) clientAllowedHrefs.add("/dashboard/whatsapp");
    if (modules.includes('INSTAGRAM')) clientAllowedHrefs.add("/dashboard/instagram");
    if (modules.includes('SOCIAL_MEDIA_PLANS')) clientAllowedHrefs.add("/dashboard/social-media-plans");
    if (modules.includes('CHAT')) clientAllowedHrefs.add("/dashboard/chat");
  } else if (isClient) {
    clientAllowedHrefs.add("/dashboard/tasks");
    clientAllowedHrefs.add("/dashboard/chat");
    clientAllowedHrefs.add("/dashboard/projects");
  }
  const filterItemsByRole = <T extends { href: string }>(items: T[]): T[] => {
    // If not super admin, check plan limits first
    let filteredItems = items;
    if (!isSuperAdmin) {
        filteredItems = items.filter(item => planAllowedHrefs.has(item.href));
    }

    if (isAdmin) return filteredItems;
    if (isHR) return filteredItems.filter((item) => hrAllowedHrefs.has(item.href));
    if (isClient) return items.filter((item) => clientAllowedHrefs.has(item.href)); // Client bypasses plan check? Or should adhere? Assuming client sees what admin allows.
    return filteredItems.filter((item) => staffAllowedHrefs.has(item.href));
  };

  const isLinkActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="sidebar flex flex-col h-full w-64 px-7 py-10 border-r border-sidebar-border bg-sidebar text-sidebar-foreground overflow-y-auto">
      <nav className="flex-1 flex flex-col">
        <div className="space-y-8">
          {sections.map((section) => {
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
