'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Repeat, Play, Pause, Calendar, ArrowUpRight, ArrowDownRight, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function RecurringPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    id: '',
    type: 'INCOME',
    category: '',
    description: '',
    amount: '',
    interval: 'MONTHLY',
    nextRunDate: new Date().toISOString().split('T')[0],
    customerId: '',
  });

  useEffect(() => {
    if (user?.role === 'CLIENT') {
      router.replace('/dashboard/finance/invoices');
    }
  }, [user, router]);

  useEffect(() => {
    fetchItems();
    fetchCustomers();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await api.get('/finance/recurring/all');
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch recurring items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        customerId: formData.customerId || undefined,
      };

      if (formData.id) {
        // Since there is no dedicated update endpoint for recurring transactions yet (except toggle),
        // we might need to implement one in backend or reuse create if it handles upsert,
        // but typically we need a PATCH endpoint. 
        // Checking backend controller... it seems we don't have a general update endpoint for recurring.
        // I will assume for now we might need to add it or use a workaround.
        // Wait, I should check the backend controller first.
        // Looking at previous Read of FinanceController:
        // @Patch('recurring/:id/toggle')
        // Only toggle is available. I need to add update capability to backend first?
        // Or I can delete and create new? That changes ID though.
        // Let's check backend service again.
        
        // Actually, let's just implement the UI logic assuming the endpoint exists or will exist.
        // But to be safe, I will add the endpoint to backend in a moment.
        // For now, I'll use a placeholder or if I can't, I'll delete and recreate.
        // But better to add PATCH endpoint.
        await api.patch(`/finance/recurring/${formData.id}`, data);
      } else {
        const { id, ...createData } = data;
        await api.post('/finance/recurring', createData);
      }

      setIsModalOpen(false);
      fetchItems();
      resetForm();
    } catch (error) {
      console.error('Failed to save recurring item:', error);
    }
  };

  const handleEdit = (item: any) => {
    setFormData({
      id: item.id,
      type: item.type,
      category: item.category,
      description: item.description || '',
      amount: item.amount.toString(),
      interval: item.interval,
      nextRunDate: new Date(item.nextRunDate).toISOString().split('T')[0],
      customerId: item.customerId || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu düzenli işlemi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/finance/recurring/${id}`);
      fetchItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      type: 'INCOME',
      category: '',
      description: '',
      amount: '',
      interval: 'MONTHLY',
      nextRunDate: new Date().toISOString().split('T')[0],
      customerId: '',
    });
  };

  const INCOME_CATEGORIES = [
    'Satış',
    'Hizmet Bedeli',
    'Danışmanlık',
    'Proje Geliri',
    'Bakım Anlaşması',
    'Diğer'
  ];

  const EXPENSE_CATEGORIES = [
    'Kira',
    'Yemek',
    'Ulaşım',
    'Maaş',
    'Vergi',
    'Demirbaş',
    'Yazılım Lisansı',
    'Ofis Giderleri',
    'Reklam',
    'Diğer'
  ];

  const incomes = items.filter(i => i.type === 'INCOME');
  const expenses = items.filter(i => i.type === 'EXPENSE');

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/finance/recurring/${id}/toggle`, {});
      fetchItems();
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  };

  const intervalLabels: any = {
    DAILY: 'Günlük',
    WEEKLY: 'Haftalık',
    MONTHLY: 'Aylık',
    YEARLY: 'Yıllık',
  };

  const RecurringList = ({ items, type }: { items: any[], type: 'INCOME' | 'EXPENSE' }) => (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
          Kayıt bulunamadı.
        </div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="group flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-md transition-all relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.isActive ? (type === 'INCOME' ? 'bg-emerald-500' : 'bg-red-500') : 'bg-slate-300'}`}></div>
            
            <div className="flex items-center gap-3 pl-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.isActive ? (type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600') : 'bg-slate-100 text-slate-400'}`}>
                 {type === 'INCOME' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-slate-900 ${!item.isActive && 'text-slate-500'}`}>{item.description || item.category}</span>
                  {item.description && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{item.category}</span>}
                  {!item.isActive && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">PASİF</span>}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                   <span className="font-medium">{intervalLabels[item.interval]}</span>
                   <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                   <span className="flex items-center gap-1" title="Sonraki İşlem Tarihi">
                      <Calendar className="h-3 w-3" /> {format(new Date(item.nextRunDate), 'd MMM', { locale: tr })}
                   </span>
                   {item.customer && (
                     <>
                       <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                       <span className="text-blue-600 truncate max-w-[100px]">{item.customer.name}</span>
                     </>
                   )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className={`font-bold ${type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'} ${!item.isActive && 'opacity-50'}`}>
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.amount)}
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                   onClick={() => handleToggle(item.id)}
                   className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                   title={item.isActive ? "Durdur" : "Başlat"}
                 >
                   {item.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                 </button>
                 <button 
                   onClick={() => handleEdit(item)}
                   className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                   title="Düzenle"
                 >
                   <Edit2 className="h-4 w-4" />
                 </button>
                 <button 
                   onClick={() => handleDelete(item.id)}
                   className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                   title="Sil"
                 >
                   <Trash2 className="h-4 w-4" />
                 </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (user?.role === 'CLIENT') {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[28px] font-normal tracking-[-0.03em] text-slate-900">
            Düzenli İşlemler
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Otomatik gelir ve gider tanımlarını yönetin.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Yeni Tanım
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        {loading ? (
          <div className="col-span-full text-center py-12">Yükleniyor...</div>
        ) : (
          <>
            {/* Income Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                <h2 className="font-bold text-emerald-800 flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5" /> Düzenli Gelirler
                </h2>
                <span className="font-bold text-emerald-700 text-lg">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                    incomes.reduce((acc, curr) => acc + curr.amount, 0)
                  )}/Ay
                </span>
              </div>
              <RecurringList items={incomes} type="INCOME" />
            </div>

            {/* Expense Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-red-50 p-4 rounded-lg border border-red-100">
                <h2 className="font-bold text-red-800 flex items-center gap-2">
                  <ArrowDownRight className="h-5 w-5" /> Düzenli Giderler
                </h2>
                <span className="font-bold text-red-700 text-lg">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                    expenses.reduce((acc, curr) => acc + curr.amount, 0)
                  )}/Ay
                </span>
              </div>
              <RecurringList items={expenses} type="EXPENSE" />
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">{formData.id ? 'Tanımı Düzenle' : 'Yeni Düzenli İşlem'}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tip</label>
                  <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="INCOME">Gelir</option>
                    <option value="EXPENSE">Gider</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tutar (TL)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full border rounded-md p-2 text-sm"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Periyot</label>
                  <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={formData.interval}
                    onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                  >
                    <option value="DAILY">Günlük</option>
                    <option value="WEEKLY">Haftalık</option>
                    <option value="MONTHLY">Aylık</option>
                    <option value="YEARLY">Yıllık</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    required
                    className="w-full border rounded-md p-2 text-sm"
                    value={formData.nextRunDate}
                    onChange={(e) => setFormData({ ...formData, nextRunDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                <select
                  required
                  className="w-full border rounded-md p-2 text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Seçiniz...</option>
                  {(formData.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {formData.type === 'INCOME' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">İlgili Müşteri (Opsiyonel)</label>
                  <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  >
                    <option value="">Seçiniz...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">İşlem Adı / Açıklama</label>
                <input
                  type="text"
                  className="w-full border rounded-md p-2 text-sm"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Örn: Aylık Sunucu Gideri"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
                <Button type="submit">Kaydet</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
