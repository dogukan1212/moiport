'use client';

import { useEffect, useState, use as reactUse } from 'react';
import api from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, ArrowLeft, Users } from 'lucide-react';

type Detail = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  salary?: number;
  iban?: string;
  startDate?: string;
  isActive?: boolean;
  tckn?: string;
  address?: string;
  birthDate?: string;
  jobTitle?: string;
  department?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
  maritalStatus?: string;
  childrenCount?: number;
  bloodType?: string;
  educationLevel?: string;
  contractType?: string;
  socialSecurityNumber?: string;
  taxNumber?: string;
  weeklyHours?: number;
  probationMonths?: number;
  confidentialityYears?: number;
  nonCompeteMonths?: number;
  penaltyAmount?: number;
  equipmentList?: string;
  benefits?: string;
  performancePeriod?: string;
};

export default function EmployeeDetailClient() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [form, setForm] = useState<Detail | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/finance/employees/${id}/details`);
      const d: Detail = {
        ...res.data.user,
        startDate: res.data.user.startDate ? String(res.data.user.startDate).slice(0, 10) : '',
        birthDate: res.data.user.birthDate ? String(res.data.user.birthDate).slice(0, 10) : '',
      };
      setDetail(d);
      setForm(d);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const set = (key: keyof Detail, value: any) => {
    setForm((f) => ({ ...(f || {}), [key]: value } as Detail));
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const payload: any = {
        email: form.email,
        phone: form.phone,
        address: form.address,
        tckn: form.tckn,
        birthDate: form.birthDate,
        jobTitle: form.jobTitle,
        department: form.department,
        emergencyContactName: form.emergencyContactName,
        emergencyContactPhone: form.emergencyContactPhone,
        bankName: form.bankName,
        bankBranch: form.bankBranch,
        bankAccountNumber: form.bankAccountNumber,
        maritalStatus: form.maritalStatus,
        childrenCount: form.childrenCount,
        bloodType: form.bloodType,
        educationLevel: form.educationLevel,
        contractType: form.contractType,
        socialSecurityNumber: form.socialSecurityNumber,
        taxNumber: form.taxNumber,
        salary: form.salary,
        iban: form.iban,
        startDate: form.startDate,
        weeklyHours: form.weeklyHours,
        probationMonths: form.probationMonths,
        confidentialityYears: form.confidentialityYears,
        nonCompeteMonths: form.nonCompeteMonths,
        penaltyAmount: form.penaltyAmount,
        equipmentList: form.equipmentList,
        benefits: form.benefits,
        performancePeriod: form.performancePeriod,
      };
      if (newPassword.trim()) {
        payload.newPassword = newPassword;
      }
      await api.patch(`/finance/employees/${id}`, payload);
      setNewPassword('');
      await fetchDetail();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (!detail || !form) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => router.push('/dashboard/hr/team')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-slate-900 dark:text-slate-50" />
          <h1 className="text-[28px] font-normal tracking-[-0.03em] text-slate-900 dark:text-slate-50">
            {detail.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/hr/team')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Listeye Dön
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Kaydet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Kişisel Bilgiler</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Ad Soyad</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-slate-50 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={detail.name || ''}
                readOnly
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">E-posta</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.email || ''}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Yeni Şifre</label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Telefon</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.phone || ''}
                onChange={(e) => set('phone', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">TCKN</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.tckn || ''}
                onChange={(e) => set('tckn', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Doğum Tarihi</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.birthDate || ''}
                onChange={(e) => set('birthDate', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Medeni Hali</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.maritalStatus || ''}
                onChange={(e) => set('maritalStatus', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Çocuk Sayısı</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.childrenCount ?? 0}
                onChange={(e) => set('childrenCount', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Kan Grubu</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.bloodType || ''}
                onChange={(e) => set('bloodType', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-600 dark:text-slate-300">Adres</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                rows={3}
                value={form.address || ''}
                onChange={(e) => set('address', e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">İşe Giriş ve Pozisyon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Pozisyon</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.jobTitle || ''}
                onChange={(e) => set('jobTitle', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Departman</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.department || ''}
                onChange={(e) => set('department', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Başlangıç Tarihi</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.startDate || ''}
                onChange={(e) => set('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Sözleşme Türü</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.contractType || ''}
                onChange={(e) => set('contractType', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">SGK Sicil No</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.socialSecurityNumber || ''}
                onChange={(e) => set('socialSecurityNumber', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Vergi Numarası</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.taxNumber || ''}
                onChange={(e) => set('taxNumber', e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Bankacılık</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Banka Adı</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.bankName || ''}
                onChange={(e) => set('bankName', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Şube</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.bankBranch || ''}
                onChange={(e) => set('bankBranch', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Hesap No</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.bankAccountNumber || ''}
                onChange={(e) => set('bankAccountNumber', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">IBAN</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.iban || ''}
                onChange={(e) => set('iban', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Maaş (TL)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.salary ?? 0}
                onChange={(e) => set('salary', Number(e.target.value))}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Acil Durum</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Yakın Adı</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.emergencyContactName || ''}
                onChange={(e) => set('emergencyContactName', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Yakın Telefon</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.emergencyContactPhone || ''}
                onChange={(e) => set('emergencyContactPhone', e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Sözleşme Parametreleri</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Haftalık Çalışma Saat</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.weeklyHours ?? 45}
                onChange={(e) => set('weeklyHours', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Deneme Süresi (Ay)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.probationMonths ?? 2}
                onChange={(e) => set('probationMonths', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Gizlilik Süresi (Yıl)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.confidentialityYears ?? 3}
                onChange={(e) => set('confidentialityYears', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Rekabet Yasağı (Ay)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.nonCompeteMonths ?? 6}
                onChange={(e) => set('nonCompeteMonths', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Cezai Şart Tutarı (TL)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.penaltyAmount ?? 0}
                onChange={(e) => set('penaltyAmount', Number(e.target.value))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-600 dark:text-slate-300">Ekipman Listesi</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                rows={3}
                value={form.equipmentList || ''}
                onChange={(e) => set('equipmentList', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-600 dark:text-slate-300">Yan Haklar</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                rows={3}
                value={form.benefits || ''}
                onChange={(e) => set('benefits', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Performans Periyodu</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.performancePeriod || ''}
                onChange={(e) => set('performancePeriod', e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Eğitim</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Eğitim Durumu</label>
              <input
                className="w-full px-3 py-2 border rounded-md text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                value={form.educationLevel || ''}
                onChange={(e) => set('educationLevel', e.target.value)}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
