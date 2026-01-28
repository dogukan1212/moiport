'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Search, ExternalLink, Edit2, Trash2, X, Save, Calendar, ArrowUpDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  avatar: string | null;
  email: string;
}

interface SocialMediaPlan {
  id: string;
  brandName: string | null;
  customerId: string | null;
  customer?: Customer;
  currentPlanEndDate: string | null;
  newPlanStartDate: string | null;
  briefDeadline: string | null;
  presentationDeadline: string | null;
  briefStatus: string;
  designStatus: string;
  socialMediaManager: string | null;
  socialMediaManagerId: string | null;
  socialMediaManagerUser?: User;
  designer: string | null;
  designerId: string | null;
  designerUser?: User;
  calendarUrl: string | null;
}

const BRIEF_STATUS_COLORS: Record<string, string> = {
  'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Bekliyor': 'bg-red-100 text-red-700 border-red-200',
  'Çalışılıyor': 'bg-orange-100 text-orange-700 border-orange-200',
};

const DESIGN_STATUS_COLORS: Record<string, string> = {
  'Tamamlandı': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Bekliyor': 'bg-red-100 text-red-700 border-red-200',
  'Çalışılıyor': 'bg-orange-100 text-orange-700 border-orange-200',
};

export default function SocialMediaPlansPage() {
  const [plans, setPlans] = useState<SocialMediaPlan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters & Sorting
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState<Partial<SocialMediaPlan>>({
    brandName: '',
    customerId: '',
    currentPlanEndDate: '',
    newPlanStartDate: '',
    briefDeadline: '',
    presentationDeadline: '',
    briefStatus: 'Bekliyor',
    designStatus: 'Bekliyor',
    socialMediaManager: '',
    socialMediaManagerId: '',
    designer: '',
    designerId: '',
    calendarUrl: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, customersRes, usersRes] = await Promise.all([
        api.get('/social-media/plans'),
        api.get('/customers'),
        api.get('/users/list'),
      ]);
      setPlans(plansRes.data);
      setCustomers(customersRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Veriler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickUpdate = async (id: string, field: string, value: any) => {
    // Optimistic Update
    setPlans(prev => prev.map(p => {
        if (p.id !== id) return p;
        
        const updates: any = { [field]: value };

        // Handle relation updates for UI immediately
        if (field === 'socialMediaManagerId') {
            const u = users.find(u => u.id === value);
            updates.socialMediaManagerUser = u;
            updates.socialMediaManager = u?.name || u?.email;
        } else if (field === 'designerId') {
            const u = users.find(u => u.id === value);
            updates.designerUser = u;
            updates.designer = u?.name || u?.email;
        }

        return { ...p, ...updates };
    }));

    try {
        let payload: any = {};
        if (field === 'currentPlanEndDate' || field === 'newPlanStartDate') {
            payload[field] = value ? new Date(value).toISOString() : null;
        } else if (field === 'socialMediaManagerId') {
             const u = users.find(u => u.id === value);
             payload = { socialMediaManagerId: value, socialMediaManager: u?.name || u?.email };
        } else if (field === 'designerId') {
             const u = users.find(u => u.id === value);
             payload = { designerId: value, designer: u?.name || u?.email };
        } else {
            payload[field] = value;
        }

        await api.patch(`/social-media/plans/${id}`, payload);
    } catch (error) {
        console.error('Hızlı güncelleme başarısız:', error);
        fetchData(); // Revert on error
    }
  };

  const handleOpenModal = (plan?: SocialMediaPlan) => {
    if (plan) {
      setEditingId(plan.id);
      setFormData({
        brandName: plan.brandName || '',
        customerId: plan.customerId || '',
        currentPlanEndDate: plan.currentPlanEndDate ? plan.currentPlanEndDate.split('T')[0] : '',
        newPlanStartDate: plan.newPlanStartDate ? plan.newPlanStartDate.split('T')[0] : '',
        briefDeadline: plan.briefDeadline ? plan.briefDeadline.split('T')[0] : '',
        presentationDeadline: plan.presentationDeadline ? plan.presentationDeadline.split('T')[0] : '',
        briefStatus: plan.briefStatus,
        designStatus: plan.designStatus,
        socialMediaManager: plan.socialMediaManager || '',
        socialMediaManagerId: plan.socialMediaManagerId || '',
        designer: plan.designer || '',
        designerId: plan.designerId || '',
        calendarUrl: plan.calendarUrl || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        brandName: '',
        customerId: '',
        currentPlanEndDate: '',
        newPlanStartDate: '',
        briefDeadline: '',
        presentationDeadline: '',
        briefStatus: 'Bekliyor',
        designStatus: 'Bekliyor',
        socialMediaManager: '',
        socialMediaManagerId: '',
        designer: '',
        designerId: '',
        calendarUrl: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        currentPlanEndDate: formData.currentPlanEndDate ? new Date(formData.currentPlanEndDate as string).toISOString() : null,
        newPlanStartDate: formData.newPlanStartDate ? new Date(formData.newPlanStartDate as string).toISOString() : null,
        briefDeadline: formData.briefDeadline ? new Date(formData.briefDeadline as string).toISOString() : null,
        presentationDeadline: formData.presentationDeadline ? new Date(formData.presentationDeadline as string).toISOString() : null,
      };

      if (editingId) {
        await api.patch(`/social-media/plans/${editingId}`, payload);
      } else {
        await api.post('/social-media/plans', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('İşlem başarısız:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu planı silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/social-media/plans/${id}`);
      fetchData();
    } catch (error) {
      console.error('Silme işlemi başarısız:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  };
  
  const formatDateForInput = (dateString: string | null) => {
      if (!dateString) return '';
      return dateString.split('T')[0];
  }

  const getDisplayName = (plan: SocialMediaPlan) => {
    return plan.customer?.name || plan.brandName || 'İsimsiz Plan';
  };

  // Unique Months for Filter
  const uniqueMonths = Array.from(new Set(plans.map(p => {
    if (!p.newPlanStartDate) return null;
    return p.newPlanStartDate.substring(0, 7); // YYYY-MM
  }))).filter(Boolean).sort().reverse() as string[];

  const filteredPlans = plans
    .filter(plan => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = (
        (plan.brandName?.toLowerCase() || '').includes(term) ||
        (plan.customer?.name?.toLowerCase() || '').includes(term) ||
        (plan.socialMediaManager?.toLowerCase() || '').includes(term) ||
        (plan.socialMediaManagerUser?.name?.toLowerCase() || '').includes(term) ||
        (plan.designer?.toLowerCase() || '').includes(term) ||
        (plan.designerUser?.name?.toLowerCase() || '').includes(term)
      );
      
      const matchesMonth = selectedMonth === 'ALL' 
        ? true 
        : (plan.newPlanStartDate?.startsWith(selectedMonth) || plan.currentPlanEndDate?.startsWith(selectedMonth));

      return matchesSearch && matchesMonth;
    })
    .sort((a, b) => {
        const dateA = a.newPlanStartDate ? new Date(a.newPlanStartDate).getTime() : 0;
        const dateB = b.newPlanStartDate ? new Date(b.newPlanStartDate).getTime() : 0;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-[28px] font-normal tracking-[-0.03em] text-slate-900">
            Sosyal Medya Planları
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Markaların aylık sosyal medya planlama ve takip tablosu.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Yeni Plan
        </Button>
      </div>

      <div className="space-y-6 pb-12">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 bg-white px-4 py-3 rounded-md border border-slate-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Marka veya personel ara..."
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-white">
                <Filter className="h-4 w-4 text-slate-400" />
                <select 
                    className="text-sm bg-transparent outline-none cursor-pointer min-w-[120px]"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                >
                    <option value="ALL">Tüm Aylar</option>
                    {uniqueMonths.map(m => {
                        const date = new Date(m + '-01');
                        const label = date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                        return <option key={m} value={m}>{label}</option>
                    })}
                </select>
            </div>

            <Button 
                variant="outline" 
                size="sm"
                className="h-[42px] px-3 gap-2"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
                <ArrowUpDown className="h-4 w-4" />
                {sortOrder === 'asc' ? 'Eskiden Yeniye' : 'Yeniden Eskiye'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="p-4 hover:shadow-md transition-shadow flex flex-col gap-3 border-slate-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-semibold text-base text-slate-900 line-clamp-1" title={getDisplayName(plan)}>
                      {getDisplayName(plan)}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {plan.calendarUrl ? (
                        <a 
                          href={plan.calendarUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium bg-blue-50 px-2 py-0.5 rounded-full"
                        >
                          Takvim <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Takvim yok</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleOpenModal(plan)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(plan.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="text-slate-400 block mb-0.5 text-[10px]">Mevcut Bitiş</span>
                    <input 
                        type="date"
                        className="bg-transparent w-full text-slate-700 font-medium outline-none p-0 h-auto text-xs"
                        value={formatDateForInput(plan.currentPlanEndDate)}
                        onChange={(e) => handleQuickUpdate(plan.id, 'currentPlanEndDate', e.target.value)}
                    />
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="text-slate-400 block mb-0.5 text-[10px]">Yeni Başlangıç</span>
                    <input 
                        type="date"
                        className="bg-transparent w-full text-slate-700 font-medium outline-none p-0 h-auto text-xs"
                        value={formatDateForInput(plan.newPlanStartDate)}
                        onChange={(e) => handleQuickUpdate(plan.id, 'newPlanStartDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Brief</span>
                    <select
                        className={cn(
                            "px-2 py-0.5 rounded-full font-medium border text-[10px] outline-none cursor-pointer appearance-none text-center min-w-[80px]",
                            BRIEF_STATUS_COLORS[plan.briefStatus] || 'bg-slate-100 text-slate-600'
                        )}
                        value={plan.briefStatus}
                        onChange={(e) => handleQuickUpdate(plan.id, 'briefStatus', e.target.value)}
                    >
                        <option value="Bekliyor">Bekliyor</option>
                        <option value="Çalışılıyor">Çalışılıyor</option>
                        <option value="Tamamlandı">Tamamlandı</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Tasarım</span>
                    <select
                        className={cn(
                            "px-2 py-0.5 rounded-full font-medium border text-[10px] outline-none cursor-pointer appearance-none text-center min-w-[80px]",
                            DESIGN_STATUS_COLORS[plan.designStatus] || 'bg-slate-100 text-slate-600'
                        )}
                        value={plan.designStatus}
                        onChange={(e) => handleQuickUpdate(plan.id, 'designStatus', e.target.value)}
                    >
                        <option value="Bekliyor">Bekliyor</option>
                        <option value="Çalışılıyor">Çalışılıyor</option>
                        <option value="Tamamlandı">Tamamlandı</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                      SM
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-slate-400 text-[10px]">Sosyal Medyacı</span>
                      <select 
                        className="w-full bg-transparent text-xs font-medium text-slate-700 outline-none p-0 cursor-pointer truncate"
                        value={plan.socialMediaManagerId || ''}
                        onChange={(e) => handleQuickUpdate(plan.id, 'socialMediaManagerId', e.target.value)}
                      >
                        <option value="">Seçiniz</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name || u.email}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                      T
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-slate-400 text-[10px]">Tasarımcı</span>
                      <select 
                        className="w-full bg-transparent text-xs font-medium text-slate-700 outline-none p-0 cursor-pointer truncate"
                        value={plan.designerId || ''}
                        onChange={(e) => handleQuickUpdate(plan.id, 'designerId', e.target.value)}
                      >
                        <option value="">Seçiniz</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name || u.email}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mt-auto pt-2">
                  <div>Brief: {formatDate(plan.briefDeadline)}</div>
                  <div className="text-right">Sunum: {formatDate(plan.presentationDeadline)}</div>
                </div>
              </Card>
            ))}
            
            {filteredPlans.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                Kayıt bulunamadı.
              </div>
            )}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{editingId ? 'Planı Düzenle' : 'Yeni Plan Oluştur'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Marka / Proje Seçin</label>
                    <div className="flex gap-2">
                        <select
                            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111]"
                            value={formData.customerId || ''}
                            onChange={(e) => {
                                const cid = e.target.value;
                                const c = customers.find(c => c.id === cid);
                                setFormData({ ...formData, customerId: cid, brandName: c ? c.name : formData.brandName });
                            }}
                        >
                            <option value="">-- Müşteri Seçin --</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="veya manuel yazın"
                            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111]"
                            value={formData.brandName || ''}
                            onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                        />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mevcut Plan Bitiş</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111]"
                      value={formData.currentPlanEndDate || ''}
                      onChange={(e) => setFormData({ ...formData, currentPlanEndDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Yeni Plan Başlangıç</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111]"
                      value={formData.newPlanStartDate || ''}
                      onChange={(e) => setFormData({ ...formData, newPlanStartDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">En Geç Brief Günü</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111]"
                      value={formData.briefDeadline || ''}
                      onChange={(e) => setFormData({ ...formData, briefDeadline: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">En Geç Sunum Günü</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111]"
                      value={formData.presentationDeadline || ''}
                      onChange={(e) => setFormData({ ...formData, presentationDeadline: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Brief Durumu</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111]"
                      value={formData.briefStatus}
                      onChange={(e) => setFormData({ ...formData, briefStatus: e.target.value })}
                    >
                      <option value="Bekliyor">Bekliyor</option>
                      <option value="Çalışılıyor">Çalışılıyor</option>
                      <option value="Tamamlandı">Tamamlandı</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tasarım Durumu</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111]"
                      value={formData.designStatus}
                      onChange={(e) => setFormData({ ...formData, designStatus: e.target.value })}
                    >
                      <option value="Bekliyor">Bekliyor</option>
                      <option value="Çalışılıyor">Çalışılıyor</option>
                      <option value="Tamamlandı">Tamamlandı</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sosyal Medyacı</label>
                    <div className="flex gap-2">
                        <select
                            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111]"
                            value={formData.socialMediaManagerId || ''}
                            onChange={(e) => {
                                const uid = e.target.value;
                                const u = users.find(u => u.id === uid);
                                setFormData({ ...formData, socialMediaManagerId: uid, socialMediaManager: u ? (u.name || u.email) : formData.socialMediaManager });
                            }}
                        >
                            <option value="">-- Personel Seçin --</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name || u.email}</option>
                            ))}
                        </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tasarımcı</label>
                    <div className="flex gap-2">
                        <select
                            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111]"
                            value={formData.designerId || ''}
                            onChange={(e) => {
                                const uid = e.target.value;
                                const u = users.find(u => u.id === uid);
                                setFormData({ ...formData, designerId: uid, designer: u ? (u.name || u.email) : formData.designer });
                            }}
                        >
                            <option value="">-- Personel Seçin --</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name || u.email}</option>
                            ))}
                        </select>
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Takvim Linki</label>
                    <input
                      type="url"
                      placeholder="https://docs.google.com/..."
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#111]"
                      value={formData.calendarUrl || ''}
                      onChange={(e) => setFormData({ ...formData, calendarUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
                  <Button type="submit" className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Kaydet
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
