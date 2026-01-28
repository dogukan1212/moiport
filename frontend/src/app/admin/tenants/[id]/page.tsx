"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Building2, Users, Briefcase, Calendar, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import api from "@/lib/api";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionEndsAt: string | null;
  createdAt: string;
  maxUsers: number;
  maxStorage: number;
  payrollCalculationStartDay: number | null;
  payrollCalculationEndDay: number | null;
  payrollPaymentDay: number | null;
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }[];
  _count: {
    users: number;
    projects: number;
    customers: number;
  };
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    subscriptionPlan: "",
    subscriptionStatus: "",
    maxUsers: 5,
    maxStorage: 1024,
    subscriptionEndsAt: "",
    payrollCalculationStartDay: 1,
    payrollCalculationEndDay: 30,
    payrollPaymentDay: 15
  });
  const [userFormData, setUserFormData] = useState({
    email: "",
    name: "",
    role: "ADMIN",
    password: ""
  });

  useEffect(() => {
    fetchTenantDetail();
  }, []);

  const fetchTenantDetail = async () => {
    try {
      const res = await api.get(`/tenants/${params.id}/admin`);
      setTenant(res.data);
      setFormData({
        subscriptionPlan: res.data.subscriptionPlan,
        subscriptionStatus: res.data.subscriptionStatus,
        maxUsers: res.data.maxUsers,
        maxStorage: res.data.maxStorage || 1024,
        subscriptionEndsAt: res.data.subscriptionEndsAt ? res.data.subscriptionEndsAt.split('T')[0] : "",
        payrollCalculationStartDay: res.data.payrollCalculationStartDay || 1,
        payrollCalculationEndDay: res.data.payrollCalculationEndDay || 30,
        payrollPaymentDay: res.data.payrollPaymentDay || 15
      });
    } catch (error) {
      console.error("Ajans detayı yüklenirken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubscription = async () => {
    try {
      await api.patch(`/tenants/${params.id}/subscription`, {
        ...formData,
        subscriptionEndsAt: formData.subscriptionEndsAt || null
      });
      toast.success("Başarılı", {
        description: "Abonelik bilgileri güncellendi.",
      });
      setIsEditModalOpen(false);
      fetchTenantDetail();
    } catch (error) {
      toast.error("Hata", {
        description: "Abonelik bilgileri güncellenemedi.",
      });
    }
  };

  const handleAddUser = async () => {
    try {
      await api.post(`/tenants/${params.id}/users`, userFormData);
      toast.success("Başarılı", {
        description: "Yeni kullanıcı eklendi.",
      });
      setIsUserModalOpen(false);
      setUserFormData({ email: "", name: "", role: "ADMIN", password: "" });
      fetchTenantDetail();
    } catch (error) {
      toast.error("Hata", {
        description: "Kullanıcı eklenemedi.",
      });
    }
  };

  const handleToggleStatus = async () => {
    if (!tenant) return;
    const newStatus = tenant.subscriptionStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/tenants/${params.id}/subscription`, {
        subscriptionStatus: newStatus
      });
      toast.success("Başarılı", {
        description: `Ajans durumu ${newStatus === 'ACTIVE' ? 'Aktif' : 'Askıda'} olarak değiştirildi.`,
      });
      fetchTenantDetail();
    } catch (error) {
      toast.error("Hata", {
        description: "Durum değiştirilemedi.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900">Ajans Bulunamadı</h2>
        <Button onClick={() => router.back()} className="mt-4">Geri Dön</Button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4 pl-0 hover:bg-transparent hover:text-indigo-600">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Ajanslara Dön
      </Button>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{tenant.name}</h1>
            <div className="flex items-center gap-3 text-slate-500 mt-1">
              <span>/{tenant.slug}</span>
              <span>•</span>
              <span>{format(new Date(tenant.createdAt), "d MMMM yyyy", { locale: tr })}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className={tenant.subscriptionStatus === 'ACTIVE' ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
            onClick={handleToggleStatus}
          >
            {tenant.subscriptionStatus === 'ACTIVE' ? 'Ajansı Askıya Al' : 'Ajansı Aktif Et'}
          </Button>
          
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogTrigger asChild>
              <Button>Düzenle</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Abonelik Bilgilerini Düzenle</DialogTitle>
                <DialogDescription>
                  Ajansın paket, durum ve limit bilgilerini güncelleyin.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="plan">Paket</Label>
                  <Select 
                    value={formData.subscriptionPlan} 
                    onValueChange={(value) => setFormData({...formData, subscriptionPlan: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Paket Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STARTER">Başlangıç (Starter)</SelectItem>
                      <SelectItem value="PRO">Profesyonel (Pro)</SelectItem>
                      <SelectItem value="ENTERPRISE">Kurumsal (Enterprise)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Durum</Label>
                  <Select 
                    value={formData.subscriptionStatus} 
                    onValueChange={(value) => setFormData({...formData, subscriptionStatus: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Durum Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Aktif</SelectItem>
                      <SelectItem value="SUSPENDED">Askıda</SelectItem>
                      <SelectItem value="PAST_DUE">Ödeme Gecikmiş</SelectItem>
                      <SelectItem value="CANCELED">İptal Edilmiş</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxUsers">Maksimum Kullanıcı</Label>
                  <Input 
                    id="maxUsers" 
                    type="number" 
                    value={formData.maxUsers} 
                    onChange={(e) => setFormData({...formData, maxUsers: parseInt(e.target.value)})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxStorage">Maksimum Depolama (MB)</Label>
                  <Input 
                    id="maxStorage" 
                    type="number" 
                    value={formData.maxStorage} 
                    onChange={(e) => setFormData({...formData, maxStorage: parseInt(e.target.value)})}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="payrollStart">Maaş Başlangıç</Label>
                    <Input 
                      id="payrollStart" 
                      type="number" 
                      value={formData.payrollCalculationStartDay} 
                      onChange={(e) => setFormData({...formData, payrollCalculationStartDay: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="payrollEnd">Maaş Bitiş</Label>
                    <Input 
                      id="payrollEnd" 
                      type="number" 
                      value={formData.payrollCalculationEndDay} 
                      onChange={(e) => setFormData({...formData, payrollCalculationEndDay: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="payrollPayment">Ödeme Günü</Label>
                    <Input 
                      id="payrollPayment" 
                      type="number" 
                      value={formData.payrollPaymentDay} 
                      onChange={(e) => setFormData({...formData, payrollPaymentDay: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endsAt">Bitiş Tarihi</Label>
                  <Input 
                    id="endsAt" 
                    type="date" 
                    value={formData.subscriptionEndsAt} 
                    onChange={(e) => setFormData({...formData, subscriptionEndsAt: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleUpdateSubscription}>Kaydet</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* İstatistikler */}
        <Card className="md:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Genel Bakış</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-6">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Toplam Kullanıcı</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{tenant._count.users}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Briefcase className="w-4 h-4" />
                <span className="text-sm font-medium">Aktif Proje</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{tenant._count.projects}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Building2 className="w-4 h-4" />
                <span className="text-sm font-medium">Müşteri Sayısı</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{tenant._count.customers}</div>
            </div>
          </CardContent>
        </Card>

        {/* Abonelik Bilgisi */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Abonelik Durumu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Plan</span>
              <span className="font-semibold text-slate-900">{tenant.subscriptionPlan}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Durum</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${
                tenant.subscriptionStatus === 'ACTIVE' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {tenant.subscriptionStatus}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Bitiş Tarihi</span>
              <span className="text-sm font-medium text-slate-900">
                {tenant.subscriptionEndsAt 
                  ? format(new Date(tenant.subscriptionEndsAt), "d MMM yyyy", { locale: tr })
                  : "Süresiz"}
              </span>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Kullanıcı Kotası</span>
                <span className="font-medium text-slate-900">{tenant._count.users} / {tenant.maxUsers}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all" 
                  style={{ width: `${Math.min((tenant._count.users / tenant.maxUsers) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sistem Ayarları */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Sistem ve Maaş Ayarları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Maksimum Depolama</span>
              <span className="font-medium text-slate-900">{tenant.maxStorage} MB</span>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-400 uppercase mb-3">Maaş Dönemi</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase">Dönem Aralığı</div>
                  <div className="text-sm font-medium">{tenant.payrollCalculationStartDay} - {tenant.payrollCalculationEndDay}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase">Ödeme Günü</div>
                  <div className="text-sm font-medium">{tenant.payrollPaymentDay}. Gün</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kullanıcı Listesi */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ajans Yöneticileri ve Personelleri</CardTitle>
          <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Kullanıcı Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                <DialogDescription>
                  Bu ajans için yeni bir yönetici veya personel hesabı oluşturun.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="userName">Ad Soyad</Label>
                  <Input 
                    id="userName" 
                    value={userFormData.name} 
                    onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="userEmail">Email</Label>
                  <Input 
                    id="userEmail" 
                    type="email" 
                    value={userFormData.email} 
                    onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="userRole">Rol</Label>
                  <Select 
                    value={userFormData.role} 
                    onValueChange={(value) => setUserFormData({...userFormData, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rol Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Yönetici (Admin)</SelectItem>
                      <SelectItem value="STAFF">Personel (Staff)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="userPassword">Şifre (Boş bırakılırsa 123456 olur)</Label>
                  <Input 
                    id="userPassword" 
                    type="password" 
                    value={userFormData.password} 
                    onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddUser}>Oluştur</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Ad Soyad</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Kayıt Tarihi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenant.users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{user.name || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {format(new Date(user.createdAt), "d MMM yyyy", { locale: tr })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
