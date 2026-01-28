'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { TrendingUp, Users, Calendar, ArrowUpRight, CheckCircle2, Clock, CalendarDays, X } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function FinanceCustomersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<
    'CUSTOMER' | 'CONTACT' | 'INVOICES' | 'PAYMENTS'
  >('CUSTOMER');
  const [tenant, setTenant] = useState<any | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'CLIENT') {
      router.replace('/dashboard/finance/invoices');
    }
  }, [user, router]);

  useEffect(() => {
    fetchStats();
    fetchInvoices();
    fetchTenant();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/finance/customers/stats');
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customer stats:', error);
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

  const fetchTenant = async () => {
    try {
      const response = await api.get('/tenants/me');
      setTenant(response.data);
    } catch (error) {
      console.error('Tenant bilgileri yüklenemedi:', error);
    }
  };

  const openPreview = (customer: any) => {
    setSelectedCustomer(customer);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  const totalMonthlyRevenue = customers.reduce((acc, c) => acc + c.monthlyRevenue, 0);
  const totalLifetimeRevenue = customers.reduce((acc, c) => acc + c.totalRevenue, 0);
  const totalProfitability = customers.reduce((acc, c) => acc + (c.profitability || 0), 0);

  const customerInvoices = selectedCustomer
    ? invoices.filter((inv: any) => inv.customerId === selectedCustomer.id)
    : [];

  const customerTransactions = selectedCustomer?.transactions || [];

  const totalIncome = customerTransactions
    .filter((t: any) => t.type === 'INCOME')
    .reduce((acc: number, t: any) => acc + t.amount, 0);

  const totalExpense = customerTransactions
    .filter((t: any) => t.type === 'EXPENSE')
    .reduce((acc: number, t: any) => acc + t.amount, 0);

  const netPosition = totalIncome - totalExpense;

  if (user?.role === 'CLIENT') {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[28px] font-normal tracking-[-0.03em] text-slate-900">
            Müşteri Finansalları
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Marka bazlı gelir ve karlılık analizi.
          </p>
        </div>
      </div>

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 bg-emerald-50 border-emerald-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                  Toplam Aylık Düzenli Gelir
                </p>
                <h3 className="text-xl font-bold text-emerald-900 mt-1">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  }).format(totalMonthlyRevenue)}
                </h3>
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-blue-50 border-blue-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                  Toplam Ömür Boyu Ciro
                </p>
                <h3 className="text-xl font-bold text-blue-900 mt-1">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  }).format(totalLifetimeRevenue)}
                </h3>
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-slate-900 border-slate-900">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-800 text-slate-100 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                  Net Karlılık (Aylık)
                </p>
                <h3 className="text-xl font-bold text-white mt-1">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  }).format(totalProfitability)}
                </h3>
                <p className="text-[11px] text-slate-300 mt-1">
                  {customers.length} aktif müşteri
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Yükleniyor...</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
          Kayıt bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {customers.map((c) => (
             <Card key={c.id} className="flex flex-col hover:shadow-lg transition-shadow border-slate-200 overflow-hidden">
                <div className="p-5 border-b bg-slate-50/50">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-sm">
                         {c.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                         <h3 className="font-bold text-slate-900">{c.name}</h3>
                         <p className="text-xs text-slate-500">{c.email || 'E-posta yok'}</p>
                      </div>
                   </div>
                </div>

                <div className="p-5 space-y-6 flex-1">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <span className="text-xs text-slate-500 block mb-1">Aylık Getiri</span>
                         <span className="font-bold text-emerald-600 text-lg">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(c.monthlyRevenue)}
                         </span>
                      </div>
                      <div>
                         <span className="text-xs text-slate-500 block mb-1">Toplam Ciro</span>
                         <span className="font-bold text-slate-900 text-lg">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(c.totalRevenue)}
                         </span>
                      </div>
                   </div>

                   {/* Recurring Status */}
                   {c.recurringStatus && c.recurringStatus.length > 0 && (
                     <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3 flex items-center gap-1">
                           <CalendarDays className="h-3 w-3" /> Ödeme Takvimi
                        </h4>
                        <div className="space-y-2">
                           {c.recurringStatus.map((r: any) => (
                              <div key={r.id} className="p-2 bg-slate-50 rounded border border-slate-100">
                                 <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-slate-700">{r.category}</span>
                                    <span className="text-xs font-bold text-slate-600">
                                       {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(r.amount)}
                                    </span>
                                 </div>
                                 <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Her ayın <strong className="text-slate-700">{r.day}.</strong> günü</span>
                                    {r.isPaid ? (
                                       <span className="flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                                          <CheckCircle2 className="h-3 w-3" /> Ödendi
                                       </span>
                                    ) : (
                                       <span className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                                          <Clock className="h-3 w-3" /> Bekliyor ({format(new Date(r.nextDate), 'd MMM', { locale: tr })})
                                       </span>
                                    )}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                   )}

                   <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3 flex items-center gap-1">
                         <Calendar className="h-3 w-3" /> Son Ödemeler
                      </h4>
                      <div className="space-y-2">
                         {c.transactions && c.transactions.length > 0 ? (
                            c.transactions
                               .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                               .slice(0, 3)
                               .map((t: any) => (
                                  <div key={t.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors">
                                     <span className="text-slate-600">
                                        {format(new Date(t.date), 'd MMM yyyy', { locale: tr })}
                                     </span>
                                     <span className="font-medium text-slate-900">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t.amount)}
                                     </span>
                                  </div>
                               ))
                         ) : (
                            <div className="text-xs text-slate-400 italic py-2">Henüz ödeme yok.</div>
                         )}
                      </div>
                   </div>

                   <button
                     type="button"
                     className="mt-4 w-full text-sm font-medium text-blue-600 border border-blue-100 rounded-md py-2 hover:bg-blue-50 transition-colors"
                     onClick={() => openPreview(c)}
                   >
                     Müşteri Önizleme
                   </button>
                </div>
             </Card>
          ))}
        </div>
      )}

      {isPreviewOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-5 border-b flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
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
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                    selectedCustomer.monthlyRevenue && selectedCustomer.monthlyRevenue > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {selectedCustomer.monthlyRevenue && selectedCustomer.monthlyRevenue > 0
                    ? 'Aktif Müşteri'
                    : 'Pasif Müşteri'}
                </span>
                <button
                  type="button"
                  onClick={closePreview}
                  className="text-slate-500 hover:text-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-6 pt-3 pb-2 border-b bg-slate-50">
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('CUSTOMER')}
                  className={`px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    activePreviewTab === 'CUSTOMER'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Müşteri Bilgileri
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('CONTACT')}
                  className={`px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    activePreviewTab === 'CONTACT'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Yetkili Bilgileri
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('INVOICES')}
                  className={`px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    activePreviewTab === 'INVOICES'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Faturalar
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('PAYMENTS')}
                  className={`px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    activePreviewTab === 'PAYMENTS'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Ödemeler
                </button>
              </div>
            </div>

            <div className="p-6 text-sm overflow-auto flex-1">
              {activePreviewTab === 'CUSTOMER' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Firma Bilgileri
                    </h4>
                    <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-600">Resmi Ünvan</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {selectedCustomer.name}
                        </span>
                      </div>
                      {selectedCustomer.email && (
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600">Genel E-posta</span>
                          <span className="text-sm font-medium text-slate-900">
                            {selectedCustomer.email}
                          </span>
                        </div>
                      )}
                      {selectedCustomer.phone && (
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600">Genel Telefon</span>
                          <span className="text-sm font-medium text-slate-900">
                            {selectedCustomer.phone}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-600">Fatura Adresi</span>
                        <span className="text-xs font-medium text-slate-900 text-right max-w-[60%]">
                          {selectedCustomer.billingAddress || 'Tanımlı değil'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-600">Web Sitesi</span>
                        <span className="text-xs font-medium text-blue-700 truncate max-w-[60%]">
                          {selectedCustomer.website || 'Tanımlı değil'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                        <h5 className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                          Resmi Fatura Bilgileri
                        </h5>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600">Vergi Dairesi</span>
                          <span className="text-xs font-medium text-slate-900">
                            {selectedCustomer.taxOffice || 'Tanımlı değil'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600">Vergi / T.C. No</span>
                          <span className="text-xs font-medium text-slate-900">
                            {selectedCustomer.taxNumber || 'Tanımlı değil'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                        <h5 className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                          Dijital / Sosyal Medya
                        </h5>
                        {selectedCustomer.website && (
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-600">Website</span>
                            <span className="text-xs font-medium text-blue-700 truncate max-w-[60%]">
                              {selectedCustomer.website}
                            </span>
                          </div>
                        )}
                        {selectedCustomer.instagram && (
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-600">Instagram</span>
                            <span className="text-xs font-medium text-slate-900">
                              {selectedCustomer.instagram}
                            </span>
                          </div>
                        )}
                        {selectedCustomer.twitter && (
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-600">Twitter / X</span>
                            <span className="text-xs font-medium text-slate-900">
                              {selectedCustomer.twitter}
                            </span>
                          </div>
                        )}
                        {selectedCustomer.linkedin && (
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-600">LinkedIn</span>
                            <span className="text-xs font-medium text-slate-900">
                              {selectedCustomer.linkedin}
                            </span>
                          </div>
                        )}
                        {selectedCustomer.tiktok && (
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-600">TikTok</span>
                            <span className="text-xs font-medium text-slate-900">
                              {selectedCustomer.tiktok}
                            </span>
                          </div>
                        )}
                        {!selectedCustomer.website &&
                          !selectedCustomer.instagram &&
                          !selectedCustomer.twitter &&
                          !selectedCustomer.linkedin &&
                          !selectedCustomer.tiktok && (
                            <div className="text-xs text-slate-500">
                              Bu müşteri için kayıtlı sosyal medya hesabı yok.
                            </div>
                          )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-slate-50 text-[11px] text-slate-600 border border-slate-200">
                          {customerTransactions.length} işlem
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-slate-50 text-[11px] text-slate-600 border border-slate-200">
                          {customerInvoices.length} fatura
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2.5">
                      <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                        Aylık Getiri
                      </div>
                      <div className="text-sm font-bold text-emerald-900 mt-1">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        }).format(selectedCustomer.monthlyRevenue || 0)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5">
                      <div className="text-[11px] font-semibold text-blue-800 uppercase tracking-wide">
                        Toplam Ciro
                      </div>
                      <div className="text-sm font-bold text-blue-900 mt-1">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        }).format(selectedCustomer.totalRevenue || 0)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900 text-white px-3 py-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                        Net Karlılık
                      </div>
                      <div className="text-sm font-bold mt-1">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        }).format(selectedCustomer.profitability || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'CONTACT' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Yetkili Bilgileri
                  </h4>
                  {selectedCustomer.contactName ||
                  selectedCustomer.contactEmail ||
                  selectedCustomer.contactPhone ||
                  selectedCustomer.contactTitle ? (
                    <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                      {selectedCustomer.contactName && (
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600">Ad Soyad</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {selectedCustomer.contactName}
                          </span>
                        </div>
                      )}
                      {selectedCustomer.contactTitle && (
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600">Pozisyon</span>
                          <span className="text-sm font-medium text-slate-900">
                            {selectedCustomer.contactTitle}
                          </span>
                        </div>
                      )}
                      {selectedCustomer.contactEmail && (
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600">E-posta</span>
                          <span className="text-sm font-medium text-slate-900">
                            {selectedCustomer.contactEmail}
                          </span>
                        </div>
                      )}
                      {selectedCustomer.contactPhone && (
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600">Telefon</span>
                          <span className="text-sm font-medium text-slate-900">
                            {selectedCustomer.contactPhone}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-6 text-xs text-slate-500">
                      Bu müşteri için tanımlı yetkili bilgisi bulunmuyor.
                    </div>
                  )}
                </div>
              )}

              {activePreviewTab === 'INVOICES' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Faturalar
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {customerInvoices.length} kayıt
                    </span>
                  </div>
                  {customerInvoices.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-6 text-xs text-slate-500">
                      Kayıtlı fatura yok.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {customerInvoices
                        .slice()
                        .sort(
                          (a: any, b: any) =>
                            new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime(),
                        )
                        .map((inv: any) => (
                          <div
                            key={inv.id}
                            className="flex items-center justify-between py-2 px-3 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex flex-col">
                              <span className="text-[11px] font-medium text-slate-600">
                                {inv.number}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {format(new Date(inv.issueDate), 'd MMM yyyy', {
                                  locale: tr,
                                })}{' '}
                                -{' '}
                                {format(new Date(inv.dueDate), 'd MMM yyyy', {
                                  locale: tr,
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-semibold text-slate-900">
                                {new Intl.NumberFormat('tr-TR', {
                                  style: 'currency',
                                  currency: 'TRY',
                                }).format(inv.totalAmount ?? inv.amount)}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  className="text-[11px] px-2 py-1 rounded-full bg-slate-900 text-white hover:bg-slate-800"
                                  onClick={() => {
                                    setSelectedInvoice(inv);
                                    setIsInvoicePreviewOpen(true);
                                  }}
                                >
                                  Önizle
                                </button>
                                <button
                                  type="button"
                                  className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                                  onClick={() => {
                                    window.location.href = '/dashboard/finance/invoices';
                                  }}
                                >
                                  Düzenle
                                </button>
                                <button
                                  type="button"
                                  className="text-[11px] px-2 py-1 rounded-full bg-red-50 text-red-700 hover:bg-red-100"
                                  onClick={async () => {
                                    if (!confirm('Bu faturayı silmek istediğinize emin misiniz?')) {
                                      return;
                                    }
                                    try {
                                      await api.delete(`/finance/invoices/${inv.id}`);
                                      fetchInvoices();
                                    } catch (error) {
                                      console.error('Fatura silinemedi:', error);
                                    }
                                  }}
                                >
                                  Sil
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {activePreviewTab === 'PAYMENTS' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2.5">
                      <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                        Toplam Gelir
                      </div>
                      <div className="text-sm font-bold text-emerald-900 mt-1">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        }).format(totalIncome)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                      <div className="text-[11px] font-semibold text-red-700 uppercase tracking-wide">
                        Toplam Gider
                      </div>
                      <div className="text-sm font-bold text-red-700 mt-1">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        }).format(totalExpense)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900 text-white px-3 py-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                        Net Pozisyon
                      </div>
                      <div className="text-sm font-bold mt-1">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        }).format(netPosition)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Ödeme Hareketleri
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {customerTransactions.length} kayıt
                      </span>
                    </div>
                    {customerTransactions.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-6 text-xs text-slate-500">
                        Kayıtlı ödeme hareketi yok.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {customerTransactions
                          .slice()
                          .sort(
                            (a: any, b: any) =>
                              new Date(b.date).getTime() - new Date(a.date).getTime(),
                          )
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
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isInvoicePreviewOpen && selectedInvoice && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <div className="flex items-center gap-3">
                {tenant?.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tenant.logoUrl}
                    alt={tenant.name}
                    className="h-10 w-10 rounded-md object-contain bg-white border border-slate-200"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    {tenant?.name || 'Ajans'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Fatura Önizleme</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                    selectedInvoice.status === 'PAID'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : selectedInvoice.status === 'SENT'
                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {selectedInvoice.status === 'DRAFT'
                    ? 'Taslak'
                    : selectedInvoice.status === 'SENT'
                    ? 'Gönderildi'
                    : selectedInvoice.status === 'PAID'
                    ? 'Ödendi'
                    : selectedInvoice.status}
                </span>
                <button
                  type="button"
                  onClick={() => setIsInvoicePreviewOpen(false)}
                  className="text-slate-500 hover:text-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 text-sm overflow-auto flex-1 bg-slate-50/60">
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
                <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-slate-100 pb-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Fatura Bilgileri
                    </h4>
                    <div className="text-sm text-slate-800 font-semibold">
                      FATURA #{selectedInvoice.number}
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-slate-600">
                      <span>
                        Tarih:{' '}
                        <strong className="text-slate-800">
                          {format(new Date(selectedInvoice.issueDate), 'd MMM yyyy', {
                            locale: tr,
                          })}
                        </strong>
                      </span>
                      <span>
                        Vade:{' '}
                        <strong className="text-slate-800">
                          {format(new Date(selectedInvoice.dueDate), 'd MMM yyyy', {
                            locale: tr,
                          })}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <h5 className="font-semibold text-slate-700 uppercase tracking-wide">
                        Düzenleyen
                      </h5>
                      <p className="text-slate-800 text-sm">{tenant?.name || 'Ajans'}</p>
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-semibold text-slate-700 uppercase tracking-wide">
                        Müşteri
                      </h5>
                      <p className="text-slate-800 text-sm">{selectedCustomer.name}</p>
                      {selectedCustomer.billingAddress && (
                        <p className="text-[11px] text-slate-600">
                          {selectedCustomer.billingAddress}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Özet
                    </h5>
                    <span className="text-[11px] text-slate-500">
                      KDV Dahil Genel Toplam
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Ara Toplam</span>
                      <span className="font-semibold text-slate-900">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        }).format(
                          (selectedInvoice.totalAmount || 0) -
                            (selectedInvoice.taxAmount || 0),
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">
                        KDV %{selectedInvoice.taxRate ?? 0}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        }).format(selectedInvoice.taxAmount || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Genel Toplam</span>
                      <span className="font-bold text-slate-900 text-lg">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                        }).format(selectedInvoice.totalAmount || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-600">
                    <h5 className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-1">
                      Notlar
                    </h5>
                    <p>{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
