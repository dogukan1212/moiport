'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, ArrowUpRight, ArrowDownRight, Trash2, Edit2, Eye, X, CheckCircle2, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { format, formatDistanceToNow, isPast, isToday, isSameDay, isSameWeek, isSameMonth, isSameYear, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function TransactionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [dateFilter, setDateFilter] = useState<
    'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM'
  >('ALL');
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  
  const [formData, setFormData] = useState({
    id: '',
    type: 'INCOME',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'PAID',
    transactionType: 'STANDARD', // STANDARD, ADVANCE
    userId: '', // For advance
    customerId: '', // For customer related transactions
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === 'CLIENT') {
      router.replace('/dashboard/finance/invoices');
    }
  }, [user, router]);

  useEffect(() => {
    fetchTransactions();
    fetchEmployees();
    fetchCustomers();
    fetchInvoices();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/finance/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/finance');
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/finance/invoices/all');
      setInvoices(response.data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { transactionType, id, amount, date, userId, customerId, ...rest } = formData;
      
      const baseData = {
        ...rest,
        amount: parseFloat(amount),
        date: new Date(date),
      };

      if (transactionType === 'ADVANCE' && !id) {
        await api.post('/finance/advances', {
          ...baseData,
          userId,
        });
      } else {
        const transactionData = {
          ...baseData,
          customerId: customerId || null,
        };

        if (id) {
          await api.patch(`/finance/${id}`, transactionData);
        } else {
          await api.post('/finance', transactionData);
        }
      }

      setIsModalOpen(false);
      fetchTransactions();
      resetForm();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  };

  if (user?.role === 'CLIENT') {
    return null;
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/finance/${id}`);
      fetchTransactions();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleEdit = (t: any) => {
    setFormData({
      id: t.id,
      type: t.type,
      amount: t.amount.toString(),
      category: t.category || '',
      description: t.description || '',
      date: new Date(t.date).toISOString().split('T')[0],
      status: t.status || 'PAID',
      userId: t.userId || '',
      customerId: t.customerId || '',
      transactionType: t.userId ? 'ADVANCE' : 'STANDARD',
    });
    setIsModalOpen(true);
  };

  const handlePreview = (t: any) => {
    setSelectedTransaction(t);
    setIsDetailModalOpen(true);
  };

  const openCustomerPreview = (customerId?: string) => {
    if (!customerId) return;
    const customer = customers.find((c: any) => c.id === customerId);
    if (!customer) return;
    setSelectedCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      type: 'INCOME',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      status: 'PAID',
      transactionType: 'STANDARD',
      userId: '',
      customerId: '',
    });
  };

  const renderCustomerModal = () => {
    if (!isCustomerModalOpen || !selectedCustomer) return null;

    const customerInvoices = invoices.filter(
      (inv: any) => inv.customerId === selectedCustomer.id,
    );
    const customerTransactions = transactions.filter(
      (t: any) => t.customerId === selectedCustomer.id,
    );

    const totalIncome = customerTransactions
      .filter((t: any) => t.type === 'INCOME')
      .reduce((acc: number, t: any) => acc + t.amount, 0);
    const totalExpense = customerTransactions
      .filter((t: any) => t.type === 'EXPENSE')
      .reduce((acc: number, t: any) => acc + t.amount, 0);
    const netPosition = totalIncome - totalExpense;

    return (
      <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-100">
          <div className="p-5 border-b flex items-center justify-between bg-slate-50">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                  {selectedCustomer.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{selectedCustomer.name}</h3>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-600">
                    {selectedCustomer.email && <span>{selectedCustomer.email}</span>}
                    {selectedCustomer.phone && <span>{selectedCustomer.phone}</span>}
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="text-slate-500 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 border-b bg-slate-50/70">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2.5">
                <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wide">
                  Toplam Gelir
                </div>
                <div className="text-base font-semibold text-emerald-800 mt-1">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  }).format(totalIncome)}
                </div>
              </div>
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                <div className="text-[11px] font-medium text-red-700 uppercase tracking-wide">
                  Toplam Gider
                </div>
                <div className="text-base font-semibold text-red-700 mt-1">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  }).format(totalExpense)}
                </div>
              </div>
              <div className="rounded-lg bg-slate-900 text-white px-3 py-2.5">
                <div className="text-[11px] font-medium uppercase tracking-wide opacity-80">
                  Net Pozisyon
                </div>
                <div className="text-base font-semibold mt-1">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  }).format(netPosition)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Son İşlemler
                </h4>
                <span className="text-[11px] text-slate-500">
                  {customerTransactions.length} kayıt
                </span>
              </div>
              <div className="space-y-1">
                {customerTransactions.length === 0 ? (
                  <div className="text-xs text-slate-500">Kayıtlı işlem yok.</div>
                ) : (
                  customerTransactions
                    .slice()
                    .sort(
                      (a: any, b: any) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    )
                    .slice(0, 6)
                    .map((t: any) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between py-1.5 px-2 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-[11px] text-slate-500">
                            {format(new Date(t.date), 'd MMM yyyy', { locale: tr })}
                          </span>
                          <span className="text-xs font-medium text-slate-800">
                            {t.description || t.category}
                          </span>
                        </div>
                        <span
                          className={
                            t.type === 'INCOME'
                              ? 'text-xs font-semibold text-emerald-700'
                              : 'text-xs font-semibold text-red-700'
                          }
                        >
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                          }).format(t.amount)}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Son Faturalar
                </h4>
                <span className="text-[11px] text-slate-500">
                  {customerInvoices.length} kayıt
                </span>
              </div>
              <div className="space-y-1">
                {customerInvoices.length === 0 ? (
                  <div className="text-xs text-slate-500">Kayıtlı fatura yok.</div>
                ) : (
                  customerInvoices
                    .slice()
                    .sort(
                      (a: any, b: any) =>
                        new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime(),
                    )
                    .slice(0, 6)
                    .map((inv: any) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between py-1.5 px-2 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-[11px] text-slate-500">{inv.number}</span>
                          <span className="text-xs text-slate-700">
                            {format(new Date(inv.issueDate), 'd MMM yyyy', { locale: tr })}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-900">
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                          }).format(inv.totalAmount ?? inv.amount)}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const date = new Date(t.date);
    const now = new Date();

    switch (dateFilter) {
      case 'TODAY':
        return isSameDay(date, now);
      case 'WEEK':
        return isSameWeek(date, now, { weekStartsOn: 1 }); // Monday start
      case 'MONTH':
        return isSameMonth(date, now);
      case 'YEAR':
        return isSameYear(date, now);
      case 'CUSTOM':
        return isWithinInterval(date, {
          start: startOfDay(parseISO(customDateRange.start)),
          end: endOfDay(parseISO(customDateRange.end))
        });
      default:
        return true;
    }
  });

  const incomes = filteredTransactions.filter(t => t.type === 'INCOME');
  const expenses = filteredTransactions.filter(t => t.type === 'EXPENSE');

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case 'TODAY': return 'Bugünün';
      case 'WEEK': return 'Bu Haftanın';
      case 'MONTH': return 'Bu Ayın';
      case 'YEAR': return 'Bu Yılın';
      case 'CUSTOM': return 'Seçili Tarih Aralığının';
      default: return 'Toplam';
    }
  };

  const handleStatusToggle = async (t: any) => {
    try {
      const newStatus = t.status === 'PAID' ? 'PENDING' : 'PAID';
      
      // Prepare payload - only send fields that are in Transaction model or handled by update
      // Backend expects: status, date, amount, type, category, description, customerId, etc.
      // userId is NOT in Transaction model, so do NOT send it.
      
      const payload: any = {
        status: newStatus,
        date: t.date, 
        amount: t.amount,
        type: t.type,
        category: t.category,
        description: t.description,
        customerId: t.customerId
      };

      await api.patch(`/finance/${t.id}`, payload);
      fetchTransactions();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const TransactionList = ({ items, type }: { items: any[], type: 'INCOME' | 'EXPENSE' }) => (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
          Kayıt bulunamadı.
        </div>
      ) : (
        items.map((t) => {
          const date = new Date(t.date);
          const isOverdue = t.status === 'PENDING' && isPast(date) && !isToday(date);
          
          return (
            <div key={t.id} className={`bg-white dark:bg-slate-900 p-4 rounded-lg border dark:border-slate-800 hover:shadow-md transition-shadow flex items-center justify-between group ${isOverdue ? 'border-red-200 bg-red-50/30 dark:bg-red-900/10 dark:border-red-900/30' : ''}`}>
              <div className="flex items-center gap-4">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                    t.status === 'PAID' 
                      ? (type === 'INCOME' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50' : 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50')
                      : (isOverdue ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400')
                  }`}
                  onClick={() => handleStatusToggle(t)}
                  title={t.status === 'PAID' ? 'Bekliyor olarak işaretle' : 'Tahsil edildi/Ödendi olarak işaretle'}
                >
                  {t.status === 'PAID' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-slate-900 dark:text-slate-50">{t.description || t.category}</div>
                    {t.description && <div className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded dark:bg-slate-800 dark:text-slate-400">{t.category}</div>}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${
                      t.status === 'PENDING' 
                        ? (isOverdue ? 'bg-red-100 text-red-700 border-red-200 font-medium dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50' : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50')
                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}>
                      {t.status === 'PENDING' ? (
                        <>{isOverdue ? 'Gecikti' : 'Bekliyor'}</>
                      ) : (
                        <>{type === 'INCOME' ? 'Tahsil Edildi' : 'Ödendi'}</>
                      )}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                      {format(date, 'd MMM yyyy', { locale: tr })}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      ({formatDistanceToNow(date, { addSuffix: true, locale: tr })})
                    </span>
                    {t.customer && (
                      <button
                        type="button"
                        className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-xs hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCustomerPreview(t.customerId);
                        }}
                      >
                        {t.customer.name}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t.amount)}
                </div>
                <div className="flex items-center justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handlePreview(t)} className="p-1 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400" title="Önizle">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleEdit(t)} className="p-1 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400" title="Düzenle">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-1 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400" title="Sil">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderModal = () => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">{formData.id ? 'İşlemi Düzenle' : 'Yeni İşlem Ekle'}</h2>
          <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">İşlem Türü</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer group">
                <input 
                  type="radio" 
                  name="transactionType" 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                  checked={formData.transactionType === 'STANDARD'}
                  onChange={() => setFormData({...formData, transactionType: 'STANDARD', type: 'INCOME', category: '', userId: '', customerId: ''})}
                />
                <span className="group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">Standart</span>
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer group">
                <input 
                  type="radio" 
                  name="transactionType" 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                  checked={formData.transactionType === 'ADVANCE'}
                  onChange={() => setFormData({...formData, transactionType: 'ADVANCE', type: 'EXPENSE', category: 'Personel Avansı', status: 'PAID', customerId: ''})}
                />
                <span className="group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">Personel Avansı</span>
              </label>
            </div>
          </div>

          {formData.transactionType === 'STANDARD' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tip</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-slate-100"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="INCOME">Gelir</option>
                  <option value="EXPENSE">Gider</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Durum</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-slate-100"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="PAID">Ödendi / Tahsil Edildi</option>
                  <option value="PENDING">Bekliyor</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personel Seçimi</label>
              <select
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-slate-100"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              >
                <option value="">Personel Seçiniz...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tutar (TL)</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-slate-100"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
            />
          </div>

          {formData.transactionType === 'STANDARD' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</label>
              <select
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-slate-100"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Seçiniz...</option>
                {(formData.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Müşteri (Opsiyonel)</label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-slate-100"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            >
              <option value="">Müşteri Seçiniz...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarih</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-slate-100"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İşlem Adı / Açıklama</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-slate-100"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Örn: Ocak Ayı Ofis Kirası"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold dark:text-slate-400 dark:hover:bg-slate-800">İptal</Button>
            <Button type="submit" className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200">Kaydet</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  const renderDetailModal = () => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
      >
        <div className={`p-6 flex justify-between items-center ${selectedTransaction.type === 'INCOME' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
          <h3 className={`text-xl font-black ${selectedTransaction.type === 'INCOME' ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>
            İşlem Detayı
          </h3>
          <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center mb-4">
            <div className={`text-4xl font-black mb-2 ${selectedTransaction.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(selectedTransaction.amount)}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
              selectedTransaction.status === 'PAID' 
                ? 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' 
                : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50'
            }`}>
              {selectedTransaction.status === 'PAID' ? (selectedTransaction.type === 'INCOME' ? 'Tahsil Edildi' : 'Ödendi') : 'Bekliyor'}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarih</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-50">{format(new Date(selectedTransaction.date), 'd MMMM yyyy', { locale: tr })}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-50">{selectedTransaction.category}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tip</span>
              <span className={`text-sm font-bold ${selectedTransaction.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {selectedTransaction.type === 'INCOME' ? 'Gelir' : 'Gider'}
              </span>
            </div>
            {selectedTransaction.customer && (
              <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Müşteri</span>
                <button
                  type="button"
                  className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                  onClick={() => openCustomerPreview(selectedTransaction.customerId)}
                >
                  {selectedTransaction.customer.name}
                  <Eye className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            
            <div className="pt-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Açıklama</span>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                {selectedTransaction.description || 'Açıklama belirtilmemiş.'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-50 dark:border-slate-800">
            <Button variant="outline" className="rounded-xl font-bold dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => { setIsDetailModalOpen(false); handleEdit(selectedTransaction); }}>
              <Edit2 className="h-4 w-4 mr-2" /> Düzenle
            </Button>
            <Button className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200" onClick={() => setIsDetailModalOpen(false)}>
              Kapat
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Gelir & Gider Hareketleri</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Tüm finansal işlemlerinizi detaylı olarak inceleyin ve yönetin.</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setIsModalOpen(true); }} 
          className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-2 h-11 px-6 shadow-lg shadow-slate-200 dark:shadow-slate-900/40 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Plus className="h-4 w-4" /> Yeni İşlem Ekle
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { 
            label: "Toplam Gelir", 
            value: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(incomes.reduce((acc, t) => acc + t.amount, 0)), 
            icon: <ArrowUpRight size={20} />, 
            color: "emerald",
            subLabel: getDateFilterLabel()
          },
          { 
            label: "Toplam Gider", 
            value: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(expenses.reduce((acc, t) => acc + t.amount, 0)), 
            icon: <ArrowDownRight size={20} />, 
            color: "red",
            subLabel: getDateFilterLabel()
          },
          { 
            label: "Net Fark", 
            value: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(incomes.reduce((acc, t) => acc + t.amount, 0) - expenses.reduce((acc, t) => acc + t.amount, 0)), 
            icon: <Plus size={20} />, 
            color: "blue",
            subLabel: getDateFilterLabel()
          }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-4">
              <div className={cn(
                "p-2 rounded-lg",
                stat.color === "emerald" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                stat.color === "red" ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              )}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{stat.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-50">{stat.value}</div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{stat.subLabel}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Content */}
      <div className="space-y-6">
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="İşlem veya kategori ara..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-slate-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
              {[
                { id: 'ALL', label: 'Tümü' },
                { id: 'TODAY', label: 'Bugün' },
                { id: 'WEEK', label: 'Bu Hafta' },
                { id: 'MONTH', label: 'Bu Ay' },
                { id: 'YEAR', label: 'Bu Yıl' },
                { id: 'CUSTOM', label: 'Özel' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setDateFilter(filter.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    dateFilter === filter.id 
                      ? 'bg-slate-900 text-white shadow-md dark:bg-slate-50 dark:text-slate-900' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {dateFilter === 'CUSTOM' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-end"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Başlangıç</label>
                <input
                  type="date"
                  className="block w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-slate-100"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bitiş</label>
                <input
                  type="date"
                  className="block w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-slate-100"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                />
              </div>
            </motion.div>
          )}
        </Card>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-bold text-sm">Veriler yükleniyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Incomes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" /> Gelirler
                </h2>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  {incomes.length} İŞLEM
                </span>
              </div>
              <TransactionList items={incomes} type="INCOME" />
            </div>

            {/* Expenses */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-200" /> Giderler
                </h2>
                <span className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                  {expenses.length} İŞLEM
                </span>
              </div>
              <TransactionList items={expenses} type="EXPENSE" />
            </div>
          </div>
        )}
      </div>

      {isModalOpen && renderModal()}
      {isDetailModalOpen && selectedTransaction && renderDetailModal()}
      {isCustomerModalOpen && renderCustomerModal()}
    </div>
  );
}
