"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, UserCog, Settings as SettingsIcon, HelpCircle, Menu, X } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { NotificationsPopover } from "@/components/notifications-popover";
import api from "@/lib/api";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [tenantData, setTenantData] = useState<any>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for trial notification
    if (typeof window !== 'undefined') {
        const showTrial = localStorage.getItem('showTrialNotification');
        if (showTrial === 'true') {
            setTimeout(() => {
                toast.success("14 günlük deneme süreciniz başladı!", {
                    description: "Profesyonel paketin keyfini çıkarın.",
                    duration: 5000,
                });
            }, 1000);
            localStorage.removeItem('showTrialNotification');
        }
    }
  }, []);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || user.role === 'SUPER_ADMIN') {
        setIsCheckingStatus(false);
        return;
      }
      try {
        const res = await api.get('/tenants/me');
        const data = res.data;
        console.log('Tenant Data Layout:', data);

        let finalStatus = data.subscriptionStatus;
        if (finalStatus !== 'SUSPENDED' && data.subscriptionEndsAt) {
          const now = new Date();
          const endsAt = new Date(data.subscriptionEndsAt);
          if (now > endsAt) {
            finalStatus = finalStatus === 'TRIAL' ? 'TRIAL_ENDED' : 'EXPIRED';
          }
        }

        const nextTenant = { ...data, subscriptionStatus: finalStatus };
        setTenantData(nextTenant);

        const restrictedStatuses = ['SUSPENDED', 'TRIAL_ENDED', 'EXPIRED'];
        console.log('Is Restricted:', restrictedStatuses.includes(finalStatus), finalStatus);

        if (restrictedStatuses.includes(finalStatus)) {
             if (!pathname.startsWith('/dashboard/subscriptions/checkout')) {
                  router.push(`/dashboard/subscriptions?reason=${finalStatus}`);
             }
        }
      } catch (error: any) {
        console.error('Abonelik durumu kontrol edilemedi:', error);
        const msg = error?.response?.data?.message || '';
        const statusCode = error?.response?.status;
        let reason: string | null = null;

        if (statusCode === 403) {
          if (msg.includes('askıya') || msg.includes('suspended')) {
            reason = 'SUSPENDED';
          } else if (
            msg.includes('Deneme süreniz sona ermiştir') ||
            msg.includes('TRIAL_ENDED')
          ) {
            reason = 'TRIAL_ENDED';
          } else if (
            msg.includes('Abonelik süreniz dolmuştur') ||
            msg.includes('EXPIRED')
          ) {
            reason = 'EXPIRED';
          }
        }

        if (reason) {
          if (!pathname.startsWith('/dashboard/subscriptions/checkout')) {
            router.push(`/dashboard/subscriptions?reason=${reason}`);
          }
        }
      } finally {
        setIsCheckingStatus(false);
      }
    };

    if (!loading && user) {
      checkSubscription();
    }
  }, [user, loading, pathname]); // Added pathname dependency to re-check on navigation

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.push("/login");
      return;
    }
    const role = user.role;
    
    // Plan based protection
    if (tenantData && role !== 'SUPER_ADMIN') {
        const restrictedStatuses = ['SUSPENDED', 'TRIAL_ENDED', 'EXPIRED'];
        if (restrictedStatuses.includes(tenantData.subscriptionStatus)) {
             if (!pathname.startsWith('/dashboard/subscriptions/checkout')) {
                  router.push(`/dashboard/subscriptions?reason=${tenantData.subscriptionStatus}`);
                  return;
             }
        }

        const plan = tenantData.subscriptionPlan || 'STARTER';
        const isProOrEnterprise = ['PRO', 'ENTERPRISE'].includes(plan);
        const isEnterprise = plan === 'ENTERPRISE';

        // Protected routes for STARTER
        if (!isProOrEnterprise) {
            const protectedPrefixes = [
                '/dashboard/crm',
                '/dashboard/whatsapp',
                '/dashboard/instagram',
                '/dashboard/social-media-plans',
                '/dashboard/customers',
                '/dashboard/hr/payroll',
                '/dashboard/hr/contracts',
                '/dashboard/hr/leaves',
                '/dashboard/ai-content',
                '/dashboard/ai-proposals',
            ];
            if (protectedPrefixes.some(prefix => pathname.startsWith(prefix))) {
                router.push('/dashboard/subscriptions'); // Redirect to upgrade page
                return;
            }
        }
    }

    if (role === "SUPER_ADMIN") {
      if (!pathname.startsWith("/admin")) {
        router.push("/admin");
      }
      return;
    }
    if (role === "STAFF") {
      const isAllowed =
        pathname === "/dashboard" ||
        pathname.startsWith("/dashboard/tasks") ||
        pathname.startsWith("/dashboard/task-reports") ||
        pathname.startsWith("/dashboard/ai-content") ||
        pathname.startsWith("/dashboard/chat") ||
        pathname.startsWith("/dashboard/social-media-plans") ||
        pathname.startsWith("/dashboard/profile");
      if (!isAllowed) {
        router.push("/dashboard");
      }
    } else if (role === "HR") {
      const isAllowed =
        pathname === "/dashboard" ||
        pathname.startsWith("/dashboard/tasks") ||
        pathname.startsWith("/dashboard/task-reports") ||
        pathname.startsWith("/dashboard/ai-content") ||
        pathname.startsWith("/dashboard/hr") ||
        pathname.startsWith("/dashboard/profile");
      if (!isAllowed) {
        router.push("/dashboard/hr/team");
      }
    }
  }, [user, loading, router, pathname]);

  const headerContext = useMemo(() => {
    if (!pathname.startsWith("/dashboard")) {
      return "Panel";
    }
    const parts = pathname.replace("/dashboard", "").split("/").filter(Boolean);
    if (parts.length === 0) {
      return "Dashboard";
    }
    const map: Record<string, string> = {
      customers: "Müşteriler",
      tasks: "Görevler",
      "task-reports": "Görev Raporları",
      projects: "Projeler",
      finance: "Finans",
      "ai-proposals": "AI Teklifler",
      "ai-content": "AI İçerik",
      hr: "İnsan Kaynakları",
      settings: "Ayarlar",
    };
    const key = parts[0] as keyof typeof map;
    return map[key] || "Dashboard";
  }, [pathname]);

  if (loading || !user || isCheckingStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (tenantData?.subscriptionStatus === 'CANCELED') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <div className="bg-card p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6 border border-border">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Aboneliğiniz İptal Edildi
            </h1>
            <p className="text-muted-foreground">
              Ajansınızın aboneliği iptal edilmiştir. Sisteme erişiminiz kısıtlanmıştır.
            </p>
          </div>
          <div className="pt-4 border-t border-border flex flex-col gap-3">
            <button
              onClick={logout}
              className="w-full py-3 bg-card text-foreground border border-border rounded-xl font-semibold hover:bg-muted transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 hidden dark:block">
        <div className="absolute inset-0 bg-[#050505]" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1600px] h-[900px] bg-[#00e676]/8 blur-[140px] rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
      </div>
      {tenantData?.subscriptionStatus === 'PAST_DUE' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between relative z-30">
          <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
            <AlertTriangle size={16} />
            <span>Ödemeniz gecikmiştir. Hizmet kesintisi yaşamamak için lütfen faturanızı kontrol edin.</span>
          </div>
          <Link 
            href="/dashboard/subscriptions"
            className="text-xs font-bold text-amber-900 hover:underline"
          >
            Ödeme Yap
          </Link>
        </div>
      )}
      <header className="h-[65px] border-b border-border bg-card flex items-center justify-between px-4 md:px-6 relative z-40">
        <div className="flex items-center gap-3 md:gap-5">
          <button 
            className="md:hidden p-1 -ml-1 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <LayoutDashboard className="h-6 w-6 text-primary hidden md:block" />
          <div className="flex items-center gap-2 md:gap-3 text-sm font-semibold truncate max-w-[200px] md:max-w-none">
            <span className="text-foreground truncate">{tenantData?.name || "Ajansınız"}</span>
            <span className="text-muted-foreground text-lg hidden md:inline">/</span>
            <span className="text-muted-foreground truncate">{headerContext}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NotificationsPopover />
          <ThemeToggle />
          
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 hover:bg-muted p-1 rounded-full transition-colors focus:outline-none"
            >
              <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold overflow-hidden border border-border">
                {user.avatar ? (
                  <img 
                    src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:3001${user.avatar}`} 
                    alt="avatar" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  (user.name || user.email || "?")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() || "")
                    .join("")
                )}
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-lg shadow-xl border border-border py-2 z-50">
                <div className="px-4 py-2 border-b border-border/40">
                  <p className="text-sm font-semibold text-foreground truncate">{user.name || "Kullanıcı"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                
                <div className="py-1">
                  <Link 
                    href="/dashboard/profile" 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <UserCog size={16} />
                    Profilim
                  </Link>
                  <Link 
                    href="/dashboard/settings" 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <SettingsIcon size={16} />
                    Ayarlar
                  </Link>
                </div>

                <div className="border-t border-border/40 pt-1 mt-1">
                  <button 
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut size={16} />
                    Çıkış Yap
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar tenantData={tenantData} className="hidden md:flex" />

        {mobileMenuOpen && (
            <div className="absolute inset-0 z-50 md:hidden flex">
                <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
                <div className="relative z-50 h-full w-64 bg-sidebar border-r border-sidebar-border shadow-2xl animate-in slide-in-from-left duration-200 flex flex-col">
                     <div className="flex items-center justify-between p-4 border-b border-sidebar-border shrink-0">
                        <span className="font-semibold text-lg">Menu</span>
                        <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-muted rounded-md">
                            <X className="h-5 w-5" />
                        </button>
                     </div>
                     <Sidebar 
                        tenantData={tenantData} 
                        className="border-none w-full flex-1 py-4" 
                        onLinkClick={() => setMobileMenuOpen(false)} 
                     />
                </div>
            </div>
        )}

        <main className={`flex-1 ${pathname.startsWith('/dashboard/chat') ? 'overflow-hidden' : 'overflow-y-auto px-4 md:px-[60px]'}`}>
          {pathname.startsWith('/dashboard/chat') ? (
             children
          ) : (
             <div className="pt-[50px] pb-[80px]">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}
