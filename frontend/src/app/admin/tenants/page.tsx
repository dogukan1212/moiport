"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Building2, Users, Briefcase } from "lucide-react";
import api from "@/lib/api";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  createdAt: string;
  _count: {
    users: number;
    projects: number;
    customers: number;
  };
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await api.get("/tenants");
      setTenants(res.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          setErrorMessage("Bu sayfayı görüntülemek için SUPER_ADMIN yetkisi gerekiyor.");
        } else {
          setErrorMessage("Ajanslar yüklenemedi. Lütfen tekrar deneyin.");
        }
      } else {
        setErrorMessage("Ajanslar yüklenemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return;

    try {
      setIsDeleting(true);
      await api.delete(`/tenants/${tenantToDelete.id}`);
      setTenants((prev) => prev.filter((t) => t.id !== tenantToDelete.id));
      toast.success("Başarılı", {
        description: "Ajans silindi.",
      });
      setDeleteDialogOpen(false);
      setTenantToDelete(null);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          toast.error("Yetki Hatası", {
            description: "Bu işlem için SUPER_ADMIN yetkisi gerekiyor.",
          });
        } else {
          toast.error("Hata", {
            description: "Ajans silinemedi. Lütfen tekrar deneyin.",
          });
        }
      } else {
        toast.error("Hata", {
          description: "Ajans silinemedi. Lütfen tekrar deneyin.",
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-8 space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Ajanslar</h1>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-slate-700">
          {errorMessage}
        </div>
        <div>
          <Button onClick={fetchTenants} className="bg-indigo-600 hover:bg-indigo-700">
            Tekrar Dene
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setTenantToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajansı Sil</DialogTitle>
            <DialogDescription>
              {tenantToDelete
                ? `"${tenantToDelete.name}" ajansını kalıcı olarak silmek istediğinize emin misiniz?`
                : "Ajansı kalıcı olarak silmek istediğinize emin misiniz?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTenant}
              disabled={!tenantToDelete || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Siliniyor
                </>
              ) : (
                "Sil"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ajanslar</h1>
          <p className="text-slate-500 mt-2">Sisteme kayıtlı tüm ajansları buradan yönetebilirsiniz.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Ajans Ekle
        </Button>
      </div>

      {tenants.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
          Henüz ajans bulunamadı.
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => (
          <Card key={tenant.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">{tenant.name}</CardTitle>
                  <p className="text-xs text-slate-500 font-normal">/{tenant.slug}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                tenant.subscriptionStatus === 'ACTIVE' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {tenant.subscriptionStatus || 'FREE'}
              </span>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                    <Users className="w-3 h-3" />
                    <span className="text-xs">Kullanıcı</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{tenant._count.users}</span>
                </div>
                <div className="text-center border-l border-slate-100">
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                    <Briefcase className="w-3 h-3" />
                    <span className="text-xs">Proje</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{tenant._count.projects}</span>
                </div>
                <div className="text-center border-l border-slate-100">
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                    <Building2 className="w-3 h-3" />
                    <span className="text-xs">Müşteri</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{tenant._count.customers}</span>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Link href={`/admin/tenants/${tenant.id}`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs h-8">
                    Detaylar
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => openDeleteDialog(tenant)}
                >
                  Sil
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
