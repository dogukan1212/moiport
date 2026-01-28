'use client';

import { useState, useEffect, use } from 'react';
import api from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  Mail,
  Phone,
  Instagram,
  Layout,
  FileText,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Copy,
  Loader2,
  MoreVertical,
  Calendar,
  Share2,
  ExternalLink,
  ChevronDown,
  Edit3,
  Save,
  Eye,
  Download,
  Shield,
  Key,
  Lock,
  TrendingUp,
  Wallet,
  Briefcase,
  MessageSquare,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { exportToPDF, renderTurkishText } from '@/lib/pdf-helper';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { motion } from 'framer-motion';

export default function CustomerDetailClient() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('social');
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [financeCustomer, setFinanceCustomer] = useState<any>(null);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [financeInvoices, setFinanceInvoices] = useState<any[]>([]);
  const [financeTab, setFinanceTab] = useState<'OVERVIEW' | 'CONTACT' | 'INVOICES' | 'PAYMENTS'>(
    'OVERVIEW',
  );
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  
  // Projects State
  const [customerProjects, setCustomerProjects] = useState<any[]>([]);
  const [customerProjectsLoading, setCustomerProjectsLoading] = useState(false);

  // Portal State
  const [portalUser, setPortalUser] = useState<any>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalForm, setPortalForm] = useState({ name: '', email: '', password: '' });
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const AVAILABLE_MODULES = [
    { id: 'CRM', label: 'CRM & Müşteri Adayları (Leads)' },
    { id: 'WHATSAPP', label: 'WhatsApp Entegrasyonu' },
    { id: 'INSTAGRAM', label: 'Instagram Entegrasyonu' },
    { id: 'FINANCE', label: 'Finans (Faturalar & Ödemeler)' },
    { id: 'PROJECTS', label: 'Projeler' },
    { id: 'TASKS', label: 'Görevler' },
    { id: 'CHAT', label: 'Sohbet' },
    { id: 'STORAGE', label: 'Dosyalar (Drive)' },
    { id: 'SOCIAL_MEDIA_PLANS', label: 'Sosyal Medya Planları' },
  ];

  // Edit Customer State
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [editCustomerForm, setEditCustomerForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    if (!id) return;
    fetchCustomer();
    fetchTenant();
    fetchServices();
    if (activeTab === 'social') fetchPosts();
    if (activeTab === 'proposals') fetchProposals();
    if (activeTab === 'projects') fetchCustomerProjects();
    if (activeTab === 'portal') fetchPortalUser();
  }, [id, activeTab]);

  useEffect(() => {
    if (!id) return;
    fetchFinanceStats();
    fetchFinanceInvoices();
  }, [id]);

  const financeCustomerTransactions = financeCustomer?.transactions || [];

  const financeCustomerInvoices = financeCustomer
    ? financeInvoices.filter((inv: any) => inv.customerId === financeCustomer.id)
    : [];

  const financeTotalIncome = financeCustomerTransactions
    .filter((t: any) => t.type === 'INCOME')
    .reduce((acc: number, t: any) => acc + t.amount, 0);

  const financeTotalExpense = financeCustomerTransactions
    .filter((t: any) => t.type === 'EXPENSE')
    .reduce((acc: number, t: any) => acc + t.amount, 0);

  const financeNetPosition = financeTotalIncome - financeTotalExpense;

  const fetchTenant = async () => {
    try {
      const response = await api.get('/tenants/me');
      setTenant(response.data);
    } catch (error) {
      console.error('Tenant bilgileri yüklenemedi:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      console.error('Hizmetler yüklenemedi:', error);
    }
  };

  const fetchFinanceStats = async () => {
    setFinanceLoading(true);
    try {
      const response = await api.get('/finance/customers/stats');
      const data = Array.isArray(response.data) ? response.data : [];
      const found = data.find((c: any) => c.id === id);
      setFinanceCustomer(found || null);
    } catch (error) {
      console.error('Müşteri finans bilgileri yüklenemedi:', error);
      setFinanceCustomer(null);
    } finally {
      setFinanceLoading(false);
    }
  };

  const fetchFinanceInvoices = async () => {
    try {
      const response = await api.get('/finance/invoices/all');
      setFinanceInvoices(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Faturalar yüklenemedi:', error);
    }
  };

  const fetchPortalUser = async () => {
    setPortalLoading(true);
    try {
      const response = await api.get(`/customers/${id}/portal-user`);
      setPortalUser(response.data);
      if (response.data) {
        if (response.data.allowedModules) {
          setSelectedModules(response.data.allowedModules.split(','));
        } else {
          // If user exists but no modules set (legacy), select defaults
          setSelectedModules(['PROJECTS', 'TASKS', 'CHAT', 'FINANCE']);
        }
      } else {
        // If no user exists, select defaults for new user form
        setSelectedModules(['PROJECTS', 'TASKS', 'CHAT', 'FINANCE']);
      }
      
      if (!response.data && customer) {
        setPortalForm(prev => ({
          ...prev,
          email: customer.email || '',
          name: customer.name || '',
        }));
      }
    } catch (error) {
      console.error('Portal kullanıcısı yüklenemedi:', error);
    } finally {
      setPortalLoading(false);
    }
  };

  const createPortalUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Eğer düzenleme modundaysak (portalUser varsa), form verilerini ondan alalım
    // Yoksa portalForm state'ini kullanalım
    const payload = portalUser ? {
        email: portalUser.email,
        name: portalUser.name,
        password: portalForm.password || '', // Şifre girilmişse güncellenir
        allowedModules: selectedModules
    } : {
        ...portalForm,
        allowedModules: selectedModules
    };

    try {
      const response = await api.post(`/customers/${id}/portal-user`, payload);
      // Update local state immediately with response
      setPortalUser(response.data);
      if (response.data?.allowedModules) {
        setSelectedModules(response.data.allowedModules.split(','));
      }
      setPortalForm(prev => ({ ...prev, password: '' })); // Şifreyi temizle
      alert('Portal erişimi başarıyla oluşturuldu/güncellendi.');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Portal kullanıcısı oluşturulamadı.');
    }
  };

  const removePortalUser = async () => {
    if (!confirm('Bu müşterinin portal erişimini kaldırmak istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/customers/${id}/portal-user`);
      setPortalUser(null);
      alert('Portal erişimi kaldırıldı.');
    } catch (error: any) {
      alert('Erişim kaldırılamadı.');
    }
  };

  const handleExportPDF = async (proposal: any) => {
    let selectedServices = [];
    try {
      const metadata = typeof proposal.metadata === 'string' 
        ? JSON.parse(proposal.metadata) 
        : proposal.metadata;
      
      if (metadata && metadata.selectedServices) {
        selectedServices = metadata.selectedServices;
      }
    } catch (e) {
      console.error('Metadata parse error:', e);
    }

    await exportToPDF({
      proposal: proposal.content,
      clientName: customer.name,
      tenant,
      services,
      selectedServices
    });
  };

  const openInvoicePreview = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsInvoicePreviewOpen(true);
  };

  const closeInvoicePreview = () => {
    setIsInvoicePreviewOpen(false);
    setSelectedInvoice(null);
  };

  const downloadInvoicePDF = async (invoice: any) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;

    const formatCurrency = (value: number) =>
      `${new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value || 0)} TL`;

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

  const handleUpdateProposal = async () => {
    if (!selectedProposal) return;
    setSavingEdit(true);
    try {
      const response = await api.patch(`/proposals/${selectedProposal.id}`, {
        content: editedContent
      });
      setSelectedProposal(response.data);
      setProposals(prev => prev.map(p => p.id === selectedProposal.id ? response.data : p));
      setIsEditing(false);
    } catch (error) {
      console.error('Teklif güncellenemedi:', error);
      alert('Teklif güncellenirken bir hata oluştu.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleShare = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchCustomer = async () => {
    try {
      const response = await api.get(`/customers/${id}`);
      setCustomer(response.data);
      setEditCustomerForm({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
      });
    } catch (error) {
      console.error('Müşteri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const response = await api.get(`/social-media?customerId=${id}`);
      setPosts(response.data);
    } catch (error) {
      console.error('İçerikler yüklenemedi:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchProposals = async () => {
    setProposalsLoading(true);
    try {
      const response = await api.get(`/proposals?customerId=${id}`);
      const data = Array.isArray(response.data) ? response.data : [];
      const filtered = data.filter((p: any) => p.customerId === id);
      setProposals(filtered);
    } catch (error) {
      console.error('Teklifler yüklenemedi:', error);
    } finally {
      setProposalsLoading(false);
    }
  };

  const fetchCustomerProjects = async () => {
    setCustomerProjectsLoading(true);
    try {
      const response = await api.get(`/projects?customerId=${id}`);
      setCustomerProjects(response.data);
    } catch (error) {
      console.error('Projeler yüklenemedi:', error);
    } finally {
      setCustomerProjectsLoading(false);
    }
  };

  const handleUpdateProposalStatus = async (proposalId: string, status: string) => {
    setUpdatingStatus(proposalId);
    try {
      await api.patch(`/proposals/${proposalId}`, { status });
      fetchProposals();
      if (selectedProposal?.id === proposalId) {
        setSelectedProposal({ ...selectedProposal, status });
      }
    } catch (error) {
      alert('Durum güncellenemedi.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleUpdatePost = async (postId: string) => {
    try {
      await api.patch(`/social-media/${postId}`, { content: editContent });
      setEditingPostId(null);
      fetchPosts();
    } catch (error) {
      alert('Güncelleme başarısız.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Bu içeriği silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/social-media/${postId}`);
      fetchPosts();
    } catch (error) {
      alert('Silme işlemi başarısız.');
    }
  };

  const openProposalModal = (proposal: any) => {
    router.push(`/dashboard/ai-proposals?proposalId=${proposal.id}&customerId=${id}`);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/customers/${id}`, editCustomerForm);
      await fetchCustomer();
      setIsEditCustomerModalOpen(false);
      alert('Müşteri bilgileri güncellendi.');
    } catch (error) {
      console.error('Müşteri güncellenemedi:', error);
      alert('Güncelleme sırasında bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!customer) {
    return <div className="text-center py-12">Müşteri bulunamadı.</div>;
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.history.back()}
              className="rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 size-11 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-200" />
            </Button>
          </motion.div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[32px] font-bold tracking-tight text-slate-900 dark:text-white">{customer.name}</h1>
              <div className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider dark:bg-emerald-900/30 dark:text-emerald-400">
                Müşteri Detayı
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium dark:text-slate-400">
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-2 hover:text-emerald-600 transition-colors">
                  <div className="size-6 rounded-lg bg-slate-100 flex items-center justify-center dark:bg-slate-800">
                    <Mail className="h-3 w-3" />
                  </div>
                  {customer.email}
                </a>
              )}
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="flex items-center gap-2 hover:text-emerald-600 transition-colors">
                  <div className="size-6 rounded-lg bg-slate-100 flex items-center justify-center dark:bg-slate-800">
                    <Phone className="h-3 w-3" />
                  </div>
                  {customer.phone}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {customer.phone && (
            <Button 
              variant="outline"
              className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-bold text-xs gap-2 h-11 px-5 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
              onClick={() => window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}`, '_blank')}
            >
              <MessageSquare className="h-4 w-4" /> WhatsApp
            </Button>
          )}
          <Button 
            variant="outline" 
            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs gap-2 h-11 px-5 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setIsEditCustomerModalOpen(true)}
          >
            <Edit2 className="h-4 w-4" /> Düzenle
          </Button>
          <Button className="rounded-xl bg-[#00e676] hover:bg-[#00e676]/90 text-black font-bold text-xs gap-2 h-11 px-6 shadow-lg shadow-emerald-200">
            <Plus className="h-4 w-4" /> Yeni Proje
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { 
            label: "Toplam Proje", 
            value: customer._count?.projects || 0, 
            icon: <Briefcase size={20} />, 
            trend: "+1",
            color: "emerald"
          },
          { 
            label: "Teklif Sayısı", 
            value: proposals.length, 
            icon: <FileText size={20} />, 
            trend: "+2",
            color: "purple"
          },
          { 
            label: "Net Finans", 
            value: `₺${financeNetPosition.toLocaleString('tr-TR')}`, 
            icon: <Wallet size={20} />, 
            trend: financeNetPosition >= 0 ? "+%12" : "-%5",
            color: financeNetPosition >= 0 ? "emerald" : "red"
          },
          { 
            label: "İçerik Sayısı", 
            value: posts.length, 
            icon: <Instagram size={20} />, 
            trend: "+4",
            color: "pink"
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm group dark:bg-slate-900 dark:border-slate-800 dark:hover:border-emerald-400/40 dark:shadow-[0_18px_45px_rgba(0,0,0,0.6)]"
          >
              <div className="flex items-center gap-3 text-slate-500 mb-4 dark:text-slate-400">
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                `bg-${stat.color}-50 text-${stat.color}-600 group-hover:bg-slate-900 group-hover:text-white dark:bg-${stat.color}-900/20 dark:text-${stat.color}-400 dark:group-hover:bg-slate-800 dark:group-hover:text-${stat.color}-300`
              )}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{stat.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
                stat.color === 'red' 
                  ? "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400" 
                  : "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400"
              )}>
                <ArrowUpRight size={10} />
                {stat.trend}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100/50 rounded-2xl w-fit border border-slate-200/60 dark:bg-slate-900/60 dark:border-slate-700/70">
        {[
          { id: 'social', label: 'Sosyal Medya', icon: <Instagram size={14} /> },
          { id: 'proposals', label: 'Teklifler', icon: <FileText size={14} /> },
          { id: 'finance', label: 'Finans', icon: <Wallet size={14} /> },
          { id: 'projects', label: 'Projeler', icon: <Briefcase size={14} /> },
          { id: 'portal', label: 'Portal Erişimi', icon: <Shield size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all',
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:shadow-[0_18px_45px_rgba(0,0,0,0.6)]'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/70',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'portal' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card className="p-6 h-full border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-20 w-20 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner dark:bg-blue-900/20 dark:text-blue-400">
                      <Shield className="h-10 w-10" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Müşteri Portalı</h3>
                      <p className="text-sm text-slate-500 mt-2 leading-relaxed dark:text-slate-400">
                        Müşterinize özel bir panel erişimi sağlayarak projelerini, faturalarını ve içeriklerini
                        kendilerinin takip etmesini sağlayabilirsiniz.
                      </p>
                    </div>
                    {!portalLoading && portalUser && (
                      <div className="w-full pt-4">
                        <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          Erişim Aktif
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full mt-4 text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs dark:hover:bg-red-900/20"
                          onClick={removePortalUser}
                        >
                          Erişimi Tamamen Kaldır
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card className="p-8 border-slate-200 shadow-sm h-full dark:bg-slate-900 dark:border-slate-800">
                  {portalLoading ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <p className="text-sm text-slate-500 font-medium">Portal bilgileri yükleniyor...</p>
                    </div>
                  ) : portalUser ? (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest dark:text-slate-500">Kullanıcı Adı / Ad Soyad</label>
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-900/50 dark:border-slate-700">
                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                              <Settings className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{portalUser.name}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest dark:text-slate-500">Giriş E-posta Adresi</label>
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-900/50 dark:border-slate-700">
                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                              <Mail className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{portalUser.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest dark:text-slate-500">Şifre Değiştir</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Yeni şifre belirlemek için buraya yazın (Değiştirmek istemiyorsanız boş bırakın)"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
                            value={portalForm.password}
                            onChange={(e) => setPortalForm({ ...portalForm, password: e.target.value })}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold ml-1 italic">
                          * Şifreyi güncellemek için yeni bir şifre girip "Değişiklikleri Kaydet" butonuna basın.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Erişilebilir Modüller & Yetkiler</label>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            {selectedModules.length} Modül Aktif
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {AVAILABLE_MODULES.map((module) => (
                            <label 
                              key={module.id} 
                              className={cn(
                                "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group",
                                selectedModules.includes(module.id)
                                  ? "bg-blue-50/50 border-blue-200 shadow-sm dark:bg-emerald-500/10 dark:border-emerald-400/40 dark:shadow-[0_18px_45px_rgba(0,0,0,0.6)]"
                                  : "bg-white border-slate-100 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:hover:border-slate-500"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                                  selectedModules.includes(module.id)
                                    ? "bg-white text-blue-600 shadow-sm dark:bg-emerald-500/20 dark:text-emerald-300"
                                    : "bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-400"
                                )}>
                                  {module.id === 'CRM' && <Layout size={16} />}
                                  {module.id === 'FINANCE' && <Wallet size={16} />}
                                  {module.id === 'PROJECTS' && <Briefcase size={16} />}
                                  {module.id === 'SOCIAL_MEDIA_PLANS' && <Instagram size={16} />}
                                  {(!['CRM', 'FINANCE', 'PROJECTS', 'SOCIAL_MEDIA_PLANS'].includes(module.id)) && <Check size={16} />}
                                </div>
                                <span className={cn(
                                  "text-sm font-bold transition-colors",
                                  selectedModules.includes(module.id)
                                    ? "text-blue-900 dark:text-emerald-200"
                                    : "text-slate-600 dark:text-slate-300"
                                )}>
                                  {module.label}
                                </span>
                              </div>
                              <input
                                type="checkbox"
                                className="h-5 w-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500 transition-all"
                                checked={selectedModules.includes(module.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedModules([...selectedModules, module.id]);
                                  } else {
                                    setSelectedModules(selectedModules.filter(id => id !== module.id));
                                  }
                                }}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button onClick={createPortalUser} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                          Değişiklikleri Kaydet
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                      <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                        <Shield className="h-10 w-10 text-slate-300" />
                      </div>
                      <div className="max-w-md space-y-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Portal Erişimi Aktif Değil</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Bu müşteriye henüz portal erişimi verilmemiş. Erişim vermek için aşağıdaki formu doldurun.
                        </p>
                      </div>
                      
                      <div className="w-full max-w-md space-y-4 text-left p-6 bg-slate-50 rounded-2xl border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
                         <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kullanıcı Adı</label>
                          <input
                            type="text"
                            placeholder="Ad Soyad"
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            value={portalForm.name}
                            onChange={(e) => setPortalForm({ ...portalForm, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-posta</label>
                          <input
                            type="email"
                            placeholder="ornek@sirket.com"
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            value={portalForm.email}
                            onChange={(e) => setPortalForm({ ...portalForm, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Şifre</label>
                          <input
                            type="text"
                            placeholder="Şifre belirleyin"
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            value={portalForm.password}
                            onChange={(e) => setPortalForm({ ...portalForm, password: e.target.value })}
                          />
                        </div>
                        <div className="pt-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Varsayılan Modüller</label>
                           <div className="flex flex-wrap gap-2">
                              {['PROJECTS', 'TASKS', 'CHAT', 'FINANCE'].map(mid => (
                                <Badge key={mid} variant="secondary" className="text-[10px]">{AVAILABLE_MODULES.find(m => m.id === mid)?.label}</Badge>
                              ))}
                           </div>
                        </div>
                        <Button onClick={createPortalUser} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                          Portal Erişimi Oluştur
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* ... Other modals (Edit Customer, Proposal etc.) ... */}
      {/* Edit Customer Modal */}
      <Dialog open={isEditCustomerModalOpen} onOpenChange={setIsEditCustomerModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Müşteri Düzenle</DialogTitle>
            <DialogDescription>Müşteri bilgilerini güncelleyin.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCustomer} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Firma Adı</label>
              <input
                className="w-full px-3 py-2 border rounded-md"
                value={editCustomerForm.name}
                onChange={(e) => setEditCustomerForm({...editCustomerForm, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">E-posta</label>
              <input
                className="w-full px-3 py-2 border rounded-md"
                value={editCustomerForm.email}
                onChange={(e) => setEditCustomerForm({...editCustomerForm, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefon</label>
              <input
                className="w-full px-3 py-2 border rounded-md"
                value={editCustomerForm.phone}
                onChange={(e) => setEditCustomerForm({...editCustomerForm, phone: e.target.value})}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit">Güncelle</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
