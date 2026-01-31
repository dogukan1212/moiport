"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface TenantData {
  id: string;
  name: string;
  subscriptionStatus: string;
  subscriptionPlan: string;
  subscriptionEndsAt: string;
  enabledModules: string;
  industry?: string;
  industrySubType?: string;
  wordpressModuleEnabled?: boolean;
  [key: string]: any;
}

interface TenantContextType {
  tenantData: TenantData | null;
  loading: boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenant = useCallback(async () => {
    if (!user || user.role === 'SUPER_ADMIN') {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/tenants/me');
      const data = res.data;
      
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
    } catch (error) {
      console.error('Tenant fetch failed:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchTenant();
    }
  }, [authLoading, fetchTenant]);

  const refreshTenant = async () => {
    // Don't set loading true here to avoid flickering the whole dashboard
    // just update the data in background
    await fetchTenant();
  };

  return (
    <TenantContext.Provider value={{ tenantData, loading, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};
