'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { LayoutDashboard, Receipt, Repeat, Users, FileText, Briefcase } from 'lucide-react';

const tabs = [
  { name: 'Genel Bakış', href: '/dashboard/finance', icon: LayoutDashboard, exact: true },
  { name: 'Gelir/Gider', href: '/dashboard/finance/transactions', icon: Receipt },
  { name: 'Düzenli İşlemler', href: '/dashboard/finance/recurring', icon: Repeat },
  { name: 'Müşteriler', href: '/dashboard/finance/customers', icon: Briefcase },
  { name: 'Faturalar', href: '/dashboard/finance/invoices', icon: FileText },
  { name: 'Personel & Maaş', href: '/dashboard/finance/payroll', icon: Users },
];

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const filteredTabs =
    user?.role === 'CLIENT'
      ? tabs.filter(
          (t) =>
            t.href === '/dashboard/finance' ||
            t.href === '/dashboard/finance/invoices',
        )
      : tabs;

  return (
    <div className="space-y-6">
      <div className="border-b border-border">
        <div className="flex overflow-x-auto gap-6">
          {filteredTabs.map((tab) => {
            const isActive = tab.exact 
              ? pathname === tab.href 
              : pathname.startsWith(tab.href);
            
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="min-h-[500px]">
        {children}
      </div>
    </div>
  );
}
