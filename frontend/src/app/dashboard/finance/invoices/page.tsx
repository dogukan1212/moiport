'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Download, Trash, Plus, X, MessageSquare, Loader2, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import jsPDF from 'jspdf';
import { renderTurkishText } from '@/lib/pdf-helper';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function InvoicesPage() {
  const { user } = useAuth();
  const isClient = user?.role === 'CLIENT';
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [tenant, setTenant] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isRemindConfirmOpen, setIsRemindConfirmOpen] = useState(false);
  const [remindTargetInvoice, setRemindTargetInvoice] = useState<any | null>(null);
  const [isRemindSending, setIsRemindSending] = useState(false);
  const [payLinkLoadingId, setPayLinkLoadingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    customerId: '',
    number: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
    taxRate: 20,
    currency: 'TRY',
    notes: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
  });

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchTenant();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/finance/invoices/all');
      setInvoices(response.data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
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

  const fetchTenant = async () => {
    try {
      const response = await api.get('/tenants/me');
      setTenant(response.data);
    } catch (error) {
      console.error('Tenant bilgileri yüklenemedi:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        items: formData.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.quantity) * Number(item.unitPrice),
        })),
      };

      if (editingInvoice) {
        await api.patch(`/finance/invoices/${editingInvoice.id}`, payload);
      } else {
        await api.post('/finance/invoices', payload);
      }

      setIsModalOpen(false);
      setEditingInvoice(null);
      fetchInvoices();
    } catch (error) {
      console.error('Failed to save invoice:', error);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems: any = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleNewInvoiceClick = () => {
    setEditingInvoice(null);
    setFormData({
      customerId: '',
      number: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(new Date().setDate(new Date().getDate() + 15))
        .toISOString()
        .split('T')[0],
      taxRate: 20,
      currency: 'TRY',
      notes: '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
    });
    setIsModalOpen(true);
  };

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    setFormData({
      customerId: invoice.customerId,
      number: invoice.number,
      issueDate: new Date(invoice.issueDate).toISOString().split('T')[0],
      dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
      taxRate: invoice.taxRate,
      currency: invoice.currency || 'TRY',
      notes: invoice.notes || '',
      items:
        invoice.items && invoice.items.length > 0
          ? invoice.items.map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            }))
          : [{ description: '', quantity: 1, unitPrice: 0 }],
    });
    setIsModalOpen(true);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Bu faturayı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await api.delete(`/finance/invoices/${id}`);
      fetchInvoices();
    } catch (error) {
      console.error('Fatura silinemedi:', error);
    }
  };

  const openRemindConfirm = (invoice: any) => {
    if (!invoice?.id) return;
    setRemindTargetInvoice(invoice);
    setIsRemindConfirmOpen(true);
  };

  const handleRemindInvoiceSms = async (invoice: any) => {
    if (!invoice?.id) return;
    try {
      setIsRemindSending(true);
      await api.post(`/finance/invoices/${invoice.id}/remind`, { forceSms: true });
      toast.success('Ödeme linki SMS olarak gönderildi.');
    } catch (error) {
      const message =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        'Ödeme linki SMS olarak gönderilemedi.';
      toast.error(message);
    } finally {
      setIsRemindSending(false);
    }
  };

  const handleCreatePaymentLink = async (invoice: any) => {
    if (!invoice?.id) return;
    try {
      setPayLinkLoadingId(invoice.id);
      const res = await api.post(`/finance/invoices/${invoice.id}/payment-link`);
      const url = res?.data?.url;
      if (!url) {
        toast.error('Ödeme linki oluşturulamadı.');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      const message =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        'Ödeme linki oluşturulamadı.';
      toast.error(message);
    } finally {
      setPayLinkLoadingId(null);
    }
  };

  const handleOpenPaymentLink = async (invoice: any) => {
    if (!invoice?.id) return;
    try {
      setPayLinkLoadingId(invoice.id);
      const res = await api.get(`/finance/invoices/${invoice.id}/payment-link`);
      const url = res?.data?.url;
      if (!url) {
        toast.error('Bu fatura için ödeme linki bulunamadı.');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      const message =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        'Ödeme linki alınamadı.';
      toast.error(message);
    } finally {
      setPayLinkLoadingId(null);
    }
  };

  const openPreview = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setSelectedInvoice(null);
  };

  const formatCurrency = (amount: number, currencyCode?: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currencyCode || 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = {
    total: invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
    paid: invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
    pending: invoices.filter(inv => inv.status === 'SENT' || inv.status === 'DRAFT').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
    count: invoices.length
  };

  const renderModal = () => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-slate-100 my-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900">
            {editingInvoice ? 'Faturayı Düzenle' : 'Yeni Fatura Oluştur'}
          </h2>
          <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Fatura No</label>
              <input
                type="text"
                required
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Müşteri</label>
              <select
                required
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              >
                <option value="">Müşteri Seçin...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Para Birimi</label>
              <select
                required
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="TRY">TRY - Türk Lirası</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Fatura Tarihi</label>
              <input
                type="date"
                required
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Son Ödeme Tarihi</label>
              <input
                type="date"
                required
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Hizmet Kalemleri</label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="rounded-lg h-8 text-xs border-dashed">
                + Kalem Ekle
              </Button>
            </div>
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={index} 
                  className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl relative group"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Hizmet/Ürün Açıklaması"
                      className="w-full bg-transparent border-none p-0 text-sm focus:ring-0"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      placeholder="Adet"
                      className="w-full bg-transparent border-none p-0 text-sm text-center focus:ring-0"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      placeholder="Birim Fiyat"
                      className="w-full bg-transparent border-none p-0 text-sm text-right focus:ring-0 font-mono"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                      required
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeItem(index)}
                    className="p-1 hover:bg-red-50 text-red-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2 opacity-60">
              <span className="text-xs font-bold uppercase tracking-widest">Ara Toplam</span>
              <span className="font-mono">
                {formatCurrency(formData.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unitPrice)), 0), formData.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-4 opacity-60">
              <span className="text-xs font-bold uppercase tracking-widest">KDV (%{formData.taxRate})</span>
              <span className="font-mono">
                {formatCurrency(formData.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unitPrice)), 0) * (formData.taxRate/100), formData.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-sm font-black uppercase tracking-widest">Genel Toplam</span>
              <span className="text-2xl font-black font-mono">
                {formatCurrency(
                  formData.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unitPrice)), 0) * (1 + formData.taxRate/100),
                  formData.currency
                )}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 h-12 rounded-xl text-slate-500"
            >
              Vazgeç
            </Button>
            <Button 
              type="submit"
              className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
            >
              {editingInvoice ? 'Değişiklikleri Kaydet' : 'Faturayı Oluştur'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  const renderPreviewModal = () => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
      >
          <div className="flex items-center justify-between px-8 py-6 border-b bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-2">
              {tenant?.logoUrl ? (
                <img src={tenant.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="font-black text-blue-600">A</span>
              )}
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base leading-none mb-1">
                {selectedInvoice?.number}
              </h3>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Fatura Önizleme</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold border tracking-wide uppercase",
              selectedInvoice?.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              selectedInvoice?.status === 'SENT' ? 'bg-blue-50 text-blue-700 border-blue-100' :
              'bg-slate-50 text-slate-600 border-slate-200'
            )}>
              {selectedInvoice?.status === 'DRAFT' ? 'Taslak' : 
               selectedInvoice?.status === 'SENT' ? 'Gönderildi' : 
               selectedInvoice?.status === 'PAID' ? 'Ödendi' : selectedInvoice?.status}
            </span>
            <button onClick={closePreview} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-8 text-sm overflow-auto flex-1 bg-slate-50/30">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-10">
            <div className="flex flex-col md:flex-row justify-between gap-10">
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Fatura Tarihleri</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500 w-16">Oluşturma:</span>
                      <span className="text-sm font-bold text-slate-900">
                        {selectedInvoice && format(new Date(selectedInvoice.issueDate), 'd MMMM yyyy', { locale: tr })}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500 w-16">Vade:</span>
                      <span className="text-sm font-bold text-slate-900">
                        {selectedInvoice && format(new Date(selectedInvoice.dueDate), 'd MMMM yyyy', { locale: tr })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
                <div className="grid grid-cols-2 gap-12">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Düzenleyen</h4>
                    <p className="text-sm font-black text-slate-900">{tenant?.name || 'Ajans'}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Müşteri</h4>
                    <p className="text-sm font-black text-slate-900">{selectedInvoice?.customer?.name || '-'}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{selectedInvoice?.customer?.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hizmet Detayları</h4>
                <div className="overflow-hidden rounded-2xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <th className="px-6 py-4 text-left font-bold text-xs uppercase tracking-wider">Açıklama</th>
                      <th className="px-6 py-4 text-center font-bold text-xs uppercase tracking-wider w-24">Adet</th>
                      <th className="px-6 py-4 text-right font-bold text-xs uppercase tracking-wider w-40">Birim Fiyat</th>
                      <th className="px-6 py-4 text-right font-bold text-xs uppercase tracking-wider w-40">Toplam</th>
                    </tr>
                  </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedInvoice?.items?.map((item: any) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 text-slate-700 font-medium">{item.description}</td>
                            <td className="px-6 py-4 text-center text-slate-500 font-mono">{item.quantity}</td>
                            <td className="px-6 py-4 text-right text-slate-500 font-mono">{formatCurrency(item.unitPrice, selectedInvoice?.currency)}</td>
                            <td className="px-6 py-4 text-right text-slate-900 font-black font-mono">{formatCurrency(item.totalPrice, selectedInvoice?.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-3">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Ara Toplam</span>
                    <span className="font-mono">{formatCurrency((selectedInvoice?.totalAmount || 0) - (selectedInvoice?.taxAmount || 0), selectedInvoice?.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-wider">KDV (%{selectedInvoice?.taxRate})</span>
                    <span className="font-mono">{formatCurrency(selectedInvoice?.taxAmount || 0, selectedInvoice?.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="text-sm font-black uppercase tracking-widest text-slate-900">Genel Toplam</span>
                    <span className="text-2xl font-black text-blue-600 font-mono">
                      {formatCurrency(selectedInvoice?.totalAmount || 0, selectedInvoice?.currency)}
                    </span>
                  </div>
                </div>
              </div>

            {selectedInvoice?.notes && (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Notlar</h5>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{selectedInvoice.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-6 border-t bg-slate-50/50 flex justify-end gap-3">
          <Button variant="ghost" onClick={closePreview} className="rounded-xl text-slate-500">Kapat</Button>
          <Button 
            onClick={() => downloadPDF(selectedInvoice)}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 gap-2"
          >
            <Download className="h-4 w-4" /> PDF İndir
          </Button>
        </div>
      </motion.div>
    </div>
  );

  const downloadPDF = async (invoice: any) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;

    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: invoice?.currency || 'TRY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value || 0);

    const addTurkishText = (
      text: string,
      x: number,
      y: number,
      options?: {
        align?: 'left' | 'right';
        fontSize?: number;
        fontWeight?: string;
        color?: string;
        forceWidthMm?: number;
      },
    ) => {
      const { align = 'left', fontSize = 10, fontWeight = 'normal', color = '#0f172a', forceWidthMm } =
        options || {};
      const img = renderTurkishText(text, fontSize, fontWeight, color, forceWidthMm);
      if (!img) return;
      const imgX = align === 'right' ? x - img.width : x;
      const imgY = y - img.height / 2;
      doc.addImage(img.data, 'PNG', imgX, imgY, img.width, img.height);
    };

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('FATURA', marginX, 20);

    if (tenant?.logoUrl) {
      try {
        const response = await fetch(tenant.logoUrl);
        if (response.ok) {
          const blob = await response.blob();
          const imgData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          doc.addImage(imgData, 'PNG', pageWidth - marginX - 30, 10, 30, 30);
        }
      } catch {
      }
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const metaRightX = pageWidth - marginX;
    doc.text(`Fatura No: ${invoice.number}`, metaRightX, 20, { align: 'right' });
    doc.text(
      `Tarih: ${format(new Date(invoice.issueDate), 'd.MM.yyyy')}`,
      metaRightX,
      25,
      { align: 'right' },
    );
    doc.text(
      `Vade: ${format(new Date(invoice.dueDate), 'd.MM.yyyy')}`,
      metaRightX,
      30,
      { align: 'right' },
    );
    const statusText =
      invoice.status === 'DRAFT'
        ? 'Taslak'
        : invoice.status === 'SENT'
        ? 'Gönderildi'
        : invoice.status === 'PAID'
        ? 'Ödendi'
        : invoice.status || '-';
    addTurkishText(`Durum: ${statusText}`, metaRightX, 35, {
      align: 'right',
      fontSize: 10,
      fontWeight: 'normal',
      color: '#0f172a',
    });

    const boxTop = 40;
    const boxHeight = 30;
    const boxWidth = (pageWidth - marginX * 2 - 6) / 2;

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, boxTop, boxWidth, boxHeight, 2, 2, 'FD');
    doc.roundedRect(marginX + boxWidth + 6, boxTop, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    addTurkishText('DÜZENLEYEN', marginX + 3, boxTop + 6, {
      fontSize: 9,
      fontWeight: 'bold',
      color: '#0f172a',
    });
    addTurkishText('Müşteri', marginX + boxWidth + 9, boxTop + 6, {
      fontSize: 9,
      fontWeight: 'bold',
      color: '#0f172a',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    addTurkishText(tenant?.name || 'Ajans', marginX + 3, boxTop + 13, {
      fontSize: 10,
      fontWeight: 'normal',
      color: '#0f172a',
    });

    const customerName = invoice.customer?.name || '-';
    addTurkishText(customerName, marginX + boxWidth + 9, boxTop + 13, {
      fontSize: 10,
      fontWeight: 'normal',
      color: '#1e293b',
    });

    const customerEmail = invoice.customer?.email || '-';
    const customerPhone = invoice.customer?.phone || '-';

    doc.setFontSize(9);
    doc.text(customerEmail, marginX + boxWidth + 9, boxTop + 20);
    doc.text(customerPhone, marginX + boxWidth + 9, boxTop + 26);

    const contentY = boxTop + boxHeight + 10;

    const tableWidth = pageWidth - marginX * 2;
    const colQtyWidth = 20;
    const colUnitWidth = 30;
    const colTotalWidth = 30;
    const colDescWidth = tableWidth - colQtyWidth - colUnitWidth - colTotalWidth;

    const xDesc = marginX;
    const xQty = xDesc + colDescWidth;
    const xUnit = xQty + colQtyWidth;
    const xTotal = xUnit + colUnitWidth;

    let tableY = contentY;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(marginX, tableY, tableWidth, 8, 'FD');

    addTurkishText('Açıklama', xDesc + 2, tableY + 4, {
      fontSize: 9,
      fontWeight: 'bold',
      color: '#334155',
    });
    addTurkishText('Miktar', xQty + 2, tableY + 4, {
      fontSize: 9,
      fontWeight: 'bold',
      color: '#334155',
    });
    addTurkishText('Birim Fiyat', xUnit + 2, tableY + 4, {
      fontSize: 9,
      fontWeight: 'bold',
      color: '#334155',
    });
    addTurkishText('Toplam', xTotal + 2, tableY + 4, {
      fontSize: 9,
      fontWeight: 'bold',
      color: '#334155',
    });

    tableY += 10;

    if (invoice.items && Array.isArray(invoice.items)) {
      invoice.items.forEach((item: any) => {
        doc.setDrawColor(241, 245, 249);
        doc.line(marginX, tableY, marginX + tableWidth, tableY);

        const desc = item.description || '';

        addTurkishText(desc, xDesc + 2, tableY + 4, {
          fontSize: 9,
          fontWeight: 'normal',
          color: '#1e293b',
        });

        addTurkishText(String(item.quantity), xQty + colQtyWidth - 2, tableY + 4, {
          align: 'right',
          fontSize: 9,
          fontWeight: 'normal',
          color: '#475569',
        });

        addTurkishText(formatCurrency(item.unitPrice), xUnit + colUnitWidth - 2, tableY + 4, {
          align: 'right',
          fontSize: 9,
          fontWeight: 'normal',
          color: '#475569',
        });

        addTurkishText(formatCurrency(item.totalPrice), xTotal + colTotalWidth - 2, tableY + 4, {
          align: 'right',
          fontSize: 9,
          fontWeight: 'bold',
          color: '#0f172a',
        });

        tableY += 8;
      });
    }

    const tableFinalY = tableY + 8;

    const summaryBoxWidth = 70;
    const summaryBoxX = pageWidth - marginX - summaryBoxWidth;
    const summaryBoxY = tableFinalY;
    const summaryBoxHeight = 26;

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(summaryBoxX, summaryBoxY, summaryBoxWidth, summaryBoxHeight, 2, 2, 'FD');

    const subTotal = (invoice.totalAmount || 0) - (invoice.taxAmount || 0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Ara Toplam', summaryBoxX + 4, summaryBoxY + 7);
    doc.text(formatCurrency(subTotal), summaryBoxX + summaryBoxWidth - 4, summaryBoxY + 7, {
      align: 'right',
    });

    doc.text(`KDV %${invoice.taxRate ?? 0}`, summaryBoxX + 4, summaryBoxY + 13);
    doc.text(
      formatCurrency(invoice.taxAmount || 0),
      summaryBoxX + summaryBoxWidth - 4,
      summaryBoxY + 13,
      { align: 'right' },
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('GENEL TOPLAM', summaryBoxX + 4, summaryBoxY + 21);
    doc.text(
      formatCurrency(invoice.totalAmount || 0),
      summaryBoxX + summaryBoxWidth - 4,
      summaryBoxY + 21,
      { align: 'right' },
    );

    if (invoice.notes) {
      const notesY = summaryBoxY + summaryBoxHeight + 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('NOTLAR', marginX, notesY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - marginX * 2);
      let noteLineY = notesY + 5;
      splitNotes.forEach((line: string) => {
        addTurkishText(line, marginX, noteLineY, {
          fontSize: 9,
          fontWeight: 'normal',
          color: '#0f172a',
        });
        noteLineY += 4;
      });
    }

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    addTurkishText(
      'Bu belge ajans yönetim sisteminizden otomatik olarak oluşturulmuştur.',
      marginX,
      287,
      {
        fontSize: 8,
        fontWeight: 'normal',
        color: '#94a3b8',
      },
    );

    doc.save(`${invoice.number}.pdf`);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[28px] font-normal tracking-[-0.03em] text-slate-900 dark:text-slate-50">
            Faturalar
          </h1>
          <p className="text-slate-500 text-sm mt-2 dark:text-slate-400">
            Müşteri faturalarını oluşturun, yönetin ve PDF olarak dışa aktarın.
          </p>
        </div>
        {!isClient && (
          <Button onClick={handleNewInvoiceClick} className="gap-2">
            <Plus className="h-4 w-4" /> Yeni Fatura
          </Button>
        )}
      </div>

      <Card className="pb-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Fatura No</th>
                <th className="px-4 py-3">Müşteri</th>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Vade</th>
                <th className="px-4 py-3 text-right">Tutar</th>
                <th className="px-4 py-3 text-center">Durum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 dark:text-slate-400">
                    Yükleniyor...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 dark:text-slate-400">
                    Fatura bulunamadı.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">
                      {inv.number}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {inv.customer?.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {format(new Date(inv.issueDate), 'd MMM yyyy', { locale: tr })}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {format(new Date(inv.dueDate), 'd MMM yyyy', { locale: tr })}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-50">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: inv?.currency || 'TRY' }).format(inv.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : inv.status === 'SENT'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {inv.status === 'DRAFT' ? 'Taslak' : inv.status === 'SENT' ? 'Gönderildi' : inv.status === 'PAID' ? 'Ödendi' : inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openPreview(inv)}>
                          <Eye className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                        </Button>
                        {!isClient && (
                          <Button variant="ghost" size="icon" onClick={() => handleEditInvoice(inv)}>
                            <Edit className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => downloadPDF(inv)}>
                          <Download className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                        </Button>
                        {inv.status !== 'PAID' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={payLinkLoadingId === inv.id}
                            onClick={() =>
                              isClient
                                ? handleOpenPaymentLink(inv)
                                : handleCreatePaymentLink(inv)
                            }
                            title={isClient ? 'Öde' : 'Ödeme Linki Oluştur'}
                          >
                            {payLinkLoadingId === inv.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-slate-500 dark:text-slate-300" />
                            ) : (
                              <CreditCard className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                            )}
                          </Button>
                        )}
                        {!isClient && inv.status !== 'PAID' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openRemindConfirm(inv)}
                            title="Ödeme Linki SMS"
                          >
                            <MessageSquare className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                          </Button>
                        )}
                        {!isClient && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteInvoice(inv.id)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog
        open={isRemindConfirmOpen}
        onOpenChange={(open) => {
          if (isRemindSending) return;
          setIsRemindConfirmOpen(open);
          if (!open) setRemindTargetInvoice(null);
        }}
      >
        <DialogContent showCloseButton={!isRemindSending}>
          <DialogHeader>
            <DialogTitle>Ödeme Linki SMS</DialogTitle>
            <DialogDescription>
              {remindTargetInvoice
                ? `#${remindTargetInvoice.number} (${remindTargetInvoice.customer?.name ?? '-'}) için ödeme linki SMS’i gönderilsin mi?`
                : 'Ödeme linki SMS’i gönderilsin mi?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={isRemindSending}
              onClick={() => {
                setIsRemindConfirmOpen(false);
                setRemindTargetInvoice(null);
              }}
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              disabled={isRemindSending || !remindTargetInvoice?.id}
              onClick={async () => {
                if (!remindTargetInvoice) return;
                await handleRemindInvoiceSms(remindTargetInvoice);
                setIsRemindConfirmOpen(false);
                setRemindTargetInvoice(null);
              }}
            >
              {isRemindSending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl my-8 border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
            <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-50">
              {editingInvoice ? 'Faturayı Düzenle' : 'Yeni Fatura Oluştur'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                    Fatura No
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border rounded-md p-2 text-sm bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                            value={formData.number}
                            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                          />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                    Müşteri
                  </label>
                  <select
                    required
                    className="w-full border rounded-md p-2 text-sm bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                            value={formData.customerId}
                            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                          >
                            <option value="">Seçiniz...</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                    Para Birimi
                  </label>
                  <select
                    required
                    className="w-full border rounded-md p-2 text-sm bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          >
                            <option value="TRY">TRY - Türk Lirası</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                          </select>
                        </div>
                      </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                    Fatura Tarihi
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full border rounded-md p-2 text-sm bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                    Son Ödeme Tarihi
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full border rounded-md p-2 text-sm bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">
                  Hizmet Kalemleri
                </label>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Açıklama"
                          className="w-full border rounded-md p-2 text-sm bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          required
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          placeholder="Adet"
                          className="w-full border rounded-md p-2 text-sm bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          required
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          placeholder="Birim Fiyat"
                          className="w-full border rounded-md p-2 text-sm bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                          required
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <div className="text-red-500">x</div>
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    + Kalem Ekle
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-right">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    KDV (%{formData.taxRate})
                  </p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-50">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: formData.currency || 'TRY',
                    }).format(
                      formData.items.reduce(
                        (acc, item) => acc + (Number(item.quantity) * Number(item.unitPrice)),
                        0,
                      ) *
                        (1 + formData.taxRate / 100),
                    )}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  İptal
                </Button>
                <Button type="submit">
                  {editingInvoice ? 'Değişiklikleri Kaydet' : 'Faturayı Oluştur'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPreviewOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden border border-slate-200 flex flex-col dark:bg-slate-900 dark:border-slate-700">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center gap-3">
                {tenant?.logoUrl && (
                  <div
                    className="h-10 w-10 rounded-md bg-white border border-slate-200 bg-center bg-contain bg-no-repeat"
                    style={{ backgroundImage: `url(${tenant.logoUrl})` }}
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
                  onClick={closePreview}
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
                        Tarih{' '}
                        <strong className="text-slate-800">
                          {format(new Date(selectedInvoice.issueDate), 'd MMM yyyy', {
                            locale: tr,
                          })}
                        </strong>
                      </span>
                      <span>
                        Vade{' '}
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
                      <p className="text-slate-800 text-sm">
                        {selectedInvoice.customer?.name || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Hizmet Kalemleri
                      </h5>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="text-slate-500 border-b">
                          <tr>
                            <th className="py-2 text-left">Açıklama</th>
                            <th className="py-2 text-right w-20">Miktar</th>
                            <th className="py-2 text-right w-32">Birim Fiyat</th>
                            <th className="py-2 text-right w-32">Toplam</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedInvoice.items.map((item: any) => (
                            <tr key={item.id}>
                              <td className="py-2 pr-4">{item.description}</td>
                              <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right">
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: selectedInvoice?.currency || 'TRY',
                          }).format(item.unitPrice)}
                        </td>
                        <td className="py-2 text-right">
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: selectedInvoice?.currency || 'TRY',
                          }).format(item.totalPrice)}
                        </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

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
                          currency: selectedInvoice?.currency || 'TRY',
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
                          currency: selectedInvoice?.currency || 'TRY',
                        }).format(selectedInvoice.taxAmount || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Genel Toplam</span>
                      <span className="font-bold text-slate-900 text-lg">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: selectedInvoice?.currency || 'TRY',
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
