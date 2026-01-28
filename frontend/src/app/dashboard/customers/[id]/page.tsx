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
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { motion } from 'framer-motion';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
    fetchCustomer();
    fetchTenant();
    fetchServices();
    if (activeTab === 'social') fetchPosts();
    if (activeTab === 'proposals') fetchProposals();
    if (activeTab === 'projects') fetchCustomerProjects();
    if (activeTab === 'portal') fetchPortalUser();
  }, [id, activeTab]);

  useEffect(() => {
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
                        
                        <div className="pt-6 flex justify-end">
                           <Button 
                             onClick={createPortalUser}
                             className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-8 py-6 shadow-xl shadow-slate-200"
                           >
                             <Save className="h-4 w-4 mr-2" />
                             Değişiklikleri Kaydet
                           </Button>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3">
                        <div className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0">
                          <Lock size={18} />
                        </div>
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                          <span className="font-bold">Güvenlik Notu:</span> Şifre değişikliği yapmak için "Şifre Değiştir" alanına yeni şifreyi yazıp kaydedebilirsiniz. Müşteriniz bu panelden sadece sizin izin verdiğiniz verileri görebilir.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={createPortalUser} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest dark:text-slate-500">
                            Ad Soyad / Firma Ünvanı
                          </label>
                          <div className="relative">
                            <Settings className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              required
                              placeholder="Müşteri giriş ismi"
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
                              value={portalForm.name}
                              onChange={(e) => setPortalForm({ ...portalForm, name: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest dark:text-slate-500">
                            E-posta (Giriş Kullanıcı Adı)
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="email"
                              required
                              placeholder="ornek@mail.com"
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
                              value={portalForm.email}
                              onChange={(e) => setPortalForm({ ...portalForm, email: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest dark:text-slate-500">
                          Giriş Şifresi Belirle
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            placeholder="Müşteriniz için güvenli bir şifre girin"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
                            value={portalForm.password}
                            onChange={(e) => setPortalForm({ ...portalForm, password: e.target.value })}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold ml-1 italic dark:text-slate-500">
                          * Bu şifreyi müşterinizle paylaşmayı unutmayın.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest dark:text-slate-500">
                          Erişilebilir Modüller
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {AVAILABLE_MODULES.map((module) => (
                            <label 
                              key={module.id} 
                              className={cn(
                                "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group",
                                selectedModules.includes(module.id)
                                  ? "bg-blue-50/50 border-blue-200 shadow-sm dark:bg-emerald-500/10 dark:border-emerald-400/40 dark:shadow-[0_18px_45px_rgba(0,0,0,0.6)]"
                                  : "bg-white border-slate-100 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:hover:border-slate-500"
                              )}
                            >
                              <span className={cn(
                                "text-sm font-bold transition-colors",
                                selectedModules.includes(module.id) ? "text-blue-900 dark:text-emerald-200" : "text-slate-600 dark:text-slate-300"
                              )}>
                                {module.label}
                              </span>
                              <input
                                type="checkbox"
                                className="h-5 w-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:focus:ring-emerald-500"
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

                      <div className="pt-4">
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl py-6 shadow-xl shadow-blue-100 dark:shadow-none dark:bg-blue-700 dark:hover:bg-blue-600">
                          <Key className="h-5 w-5 mr-2" />
                          Portal Erişimini Şimdi Oluştur
                        </Button>
                      </div>
                    </form>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Kaydedilen İçerikler</h3>
              <Button variant="outline" size="sm" onClick={fetchPosts} className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <Calendar className="h-4 w-4 mr-2" /> Yenile
              </Button>
            </div>

            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : posts.length === 0 ? (
              <Card className="p-12 text-center border-dashed bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-700">
                <Instagram className="h-12 w-12 text-slate-200 mx-auto mb-3 dark:text-slate-700" />
                <p className="text-slate-500 font-medium dark:text-slate-400">Henüz sosyal medya içeriği kaydedilmemiş.</p>
                <p className="text-slate-400 text-sm mt-1 dark:text-slate-500">AI İçerik Merkezi'nden içerik üretip buraya kaydedebilirsiniz.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <Card key={post.id} className="p-0 overflow-hidden border-slate-200 hover:shadow-md transition-shadow dark:border-slate-700 dark:bg-slate-900">
                    <div className="bg-slate-50 border-b p-4 flex justify-between items-center dark:bg-slate-800 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded dark:bg-blue-900/30 dark:text-blue-400">
                          {post.type}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(post.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700"
                          onClick={() => {
                            navigator.clipboard.writeText(post.content);
                            alert('Kopyalandı!');
                          }}
                        >
                          <Copy className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 hover:text-red-600 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      {editingPostId === post.id ? (
                        <div className="space-y-3">
                          <textarea
                            className="w-full p-3 border rounded-md text-sm min-h-[150px] focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                          />
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditingPostId(null)} className="dark:text-slate-400 dark:hover:text-white">
                              <X className="h-4 w-4 mr-1" /> İptal
                            </Button>
                            <Button size="sm" onClick={() => handleUpdatePost(post.id)}>
                              <Check className="h-4 w-4 mr-1" /> Kaydet
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed text-sm dark:text-slate-300">
                            {post.content}
                          </div>
                          <button 
                            onClick={() => {
                              setEditingPostId(post.id);
                              setEditContent(post.content);
                            }}
                            className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 bg-white/80 rounded-md shadow-sm transition-opacity dark:bg-slate-800/80"
                          >
                            <Edit2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-4">
            {financeLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : !financeCustomer ? (
              <Card className="p-6 text-center border-dashed bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-700">
                <p className="text-slate-500 text-sm dark:text-slate-400">
                  Bu müşteri için finansal veri bulunamadı.
                </p>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/50">
                    <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide dark:text-emerald-400">
                      Aylık Getiri
                    </div>
                    <div className="mt-1 text-lg font-bold text-emerald-900 dark:text-emerald-100">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      }).format(financeCustomer.monthlyRevenue || 0)}
                    </div>
                  </Card>
                  <Card className="p-4 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/50">
                    <div className="text-[11px] font-semibold text-blue-800 uppercase tracking-wide dark:text-blue-400">
                      Toplam Ciro
                    </div>
                    <div className="mt-1 text-lg font-bold text-blue-900 dark:text-blue-100">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      }).format(financeCustomer.totalRevenue || 0)}
                    </div>
                  </Card>
                  <Card className="p-4 bg-slate-900 text-white dark:bg-slate-800">
                    <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                      Net Karlılık
                    </div>
                    <div className="mt-1 text-lg font-bold">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      }).format(financeCustomer.profitability || 0)}
                    </div>
                  </Card>
                </div>

                <div className="border rounded-xl bg-slate-50/60 px-4 py-2.5 flex flex-wrap gap-2 text-xs dark:bg-slate-900/60 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setFinanceTab('OVERVIEW')}
                    className={cn(
                      'px-3 py-1.5 rounded-full border font-medium transition-colors',
                      financeTab === 'OVERVIEW'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800',
                    )}
                  >
                    Özet
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinanceTab('CONTACT')}
                    className={cn(
                      'px-3 py-1.5 rounded-full border font-medium transition-colors',
                      financeTab === 'CONTACT'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800',
                    )}
                  >
                    Firma / Yetkili Bilgileri
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinanceTab('INVOICES')}
                    className={cn(
                      'px-3 py-1.5 rounded-full border font-medium transition-colors',
                      financeTab === 'INVOICES'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800',
                    )}
                  >
                    Faturalar
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinanceTab('PAYMENTS')}
                    className={cn(
                      'px-3 py-1.5 rounded-full border font-medium transition-colors',
                      financeTab === 'PAYMENTS'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800',
                    )}
                  >
                    Ödemeler
                  </button>
                </div>

                {financeTab === 'OVERVIEW' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide dark:text-slate-400">
                        Firma Bilgileri
                      </h3>
                      <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 dark:bg-slate-900/50 dark:border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600 dark:text-slate-400">Resmi Ünvan</span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {customer.name}
                          </span>
                        </div>
                        {customer.email && (
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-600 dark:text-slate-400">Genel E-posta</span>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {customer.email}
                            </span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-600 dark:text-slate-400">Genel Telefon</span>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {customer.phone}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600 dark:text-slate-400">Fatura Adresi</span>
                          <span className="text-xs font-medium text-slate-900 text-right max-w-[60%] dark:text-white">
                            {customer.billingAddress || 'Tanımlı değil'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600 dark:text-slate-400">Vergi Dairesi</span>
                          <span className="text-xs font-medium text-slate-900 dark:text-white">
                            {customer.taxOffice || 'Tanımlı değil'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600 dark:text-slate-400">Vergi / T.C. No</span>
                          <span className="text-xs font-medium text-slate-900 dark:text-white">
                            {customer.taxNumber || 'Tanımlı değil'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600 dark:text-slate-400">Web Sitesi</span>
                          <span className="text-xs font-medium text-blue-700 truncate max-w-[60%] dark:text-blue-400">
                            {customer.website || 'Tanımlı değil'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 dark:bg-slate-900/50 dark:border-slate-800">
                        <h4 className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide dark:text-slate-400">
                          Yetkili Bilgileri
                        </h4>
                        {customer.contactName ||
                        customer.contactEmail ||
                        customer.contactPhone ||
                        customer.contactTitle ? (
                          <>
                            {customer.contactName && (
                              <div className="flex justify-between">
                                <span className="text-xs text-slate-600 dark:text-slate-400">Ad Soyad</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {customer.contactName}
                                </span>
                              </div>
                            )}
                            {customer.contactTitle && (
                              <div className="flex justify-between">
                                <span className="text-xs text-slate-600 dark:text-slate-400">Pozisyon</span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                  {customer.contactTitle}
                                </span>
                              </div>
                            )}
                            {customer.contactEmail && (
                              <div className="flex justify-between">
                                <span className="text-xs text-slate-600 dark:text-slate-400">E-posta</span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                  {customer.contactEmail}
                                </span>
                              </div>
                            )}
                            {customer.contactPhone && (
                              <div className="flex justify-between">
                                <span className="text-xs text-slate-600 dark:text-slate-400">Telefon</span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                  {customer.contactPhone}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Bu müşteri için tanımlı yetkili bilgisi bulunmuyor.
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-slate-50 text-[11px] text-slate-600 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
                          {financeCustomerTransactions.length} işlem
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-slate-50 text-[11px] text-slate-600 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
                          {financeCustomerInvoices.length} fatura
                        </span>
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide dark:text-slate-400">
                            Faturalar
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {financeCustomerInvoices.length} kayıt
                          </span>
                        </div>
                        {financeCustomerInvoices.length === 0 ? (
                          <Card className="p-4 border-dashed bg-slate-50/60 text-xs text-slate-500 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-400">
                            Kayıtlı fatura yok.
                          </Card>
                        ) : (
                          <div className="space-y-1">
                            {financeCustomerInvoices
                              .slice()
                              .sort(
                                (a: any, b: any) =>
                                  new Date(b.issueDate).getTime() -
                                  new Date(a.issueDate).getTime(),
                              )
                              .map((inv: any) => (
                                <div
                                  key={inv.id}
                                  className="flex items-center justify-between py-2 px-3 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors dark:bg-slate-900/50 dark:hover:bg-slate-800"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                      {inv.number}
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-500">
                                      {format(new Date(inv.issueDate), 'd MMM yyyy', {
                                        locale: tr,
                                      })}{' '}
                                      -{' '}
                                      {format(new Date(inv.dueDate), 'd MMM yyyy', {
                                        locale: tr,
                                      })}
                                    </span>
                                  </div>
                                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                    {new Intl.NumberFormat('tr-TR', {
                                      style: 'currency',
                                      currency: 'TRY',
                                    }).format(inv.totalAmount ?? inv.amount)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide dark:text-slate-400">
                            Ödeme Hareketleri
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {financeCustomerTransactions.length} kayıt
                          </span>
                        </div>
                        {financeCustomerTransactions.length === 0 ? (
                          <Card className="p-4 border-dashed bg-slate-50/60 text-xs text-slate-500 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-400">
                            Kayıtlı ödeme hareketi yok.
                          </Card>
                        ) : (
                          <div className="space-y-1">
                            {financeCustomerTransactions
                              .slice()
                              .sort(
                                (a: any, b: any) =>
                                  new Date(b.date).getTime() - new Date(a.date).getTime(),
                              )
                              .map((t: any) => (
                                <div
                                  key={t.id}
                                  className="flex items-center justify-between py-1.5 px-2 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors dark:bg-slate-900/50 dark:hover:bg-slate-800"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-500">
                                      {format(new Date(t.date), 'd MMM yyyy', { locale: tr })}
                                    </span>
                                    <span className="text-xs font-medium text-slate-800 dark:text-slate-300">
                                      {t.description || t.category}
                                    </span>
                                  </div>
                                  <span
                                    className={
                                      t.type === 'INCOME'
                                        ? 'text-xs font-semibold text-emerald-700 dark:text-emerald-400'
                                        : 'text-xs font-semibold text-red-700 dark:text-red-400'
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
                  </div>
                )}

                {financeTab === 'CONTACT' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Firma Bilgileri
                      </h3>
                      <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600">Resmi Ünvan</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {customer.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600">Fatura Adresi</span>
                          <span className="text-xs font-medium text-slate-900 text-right max-w-[60%]">
                            {customer.billingAddress || 'Tanımlı değil'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600">Vergi Dairesi</span>
                          <span className="text-xs font-medium text-slate-900">
                            {customer.taxOffice || 'Tanımlı değil'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-slate-600">Vergi / T.C. No</span>
                          <span className="text-xs font-medium text-slate-900">
                            {customer.taxNumber || 'Tanımlı değil'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Yetkili Bilgileri
                      </h3>
                      <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                        {customer.contactName ||
                        customer.contactEmail ||
                        customer.contactPhone ||
                        customer.contactTitle ? (
                          <>
                            {customer.contactName && (
                              <div className="flex justify-between">
                                <span className="text-xs text-slate-600">Ad Soyad</span>
                                <span className="text-sm font-semibold text-slate-900">
                                  {customer.contactName}
                                </span>
                              </div>
                            )}
                            {customer.contactTitle && (
                              <div className="flex justify-between">
                                <span className="text-xs text-slate-600">Pozisyon</span>
                                <span className="text-sm font-medium text-slate-900">
                                  {customer.contactTitle}
                                </span>
                              </div>
                            )}
                            {customer.contactEmail && (
                              <div className="flex justify-between">
                                <span className="text-xs text-slate-600">E-posta</span>
                                <span className="text-sm font-medium text-slate-900">
                                  {customer.contactEmail}
                                </span>
                              </div>
                            )}
                            {customer.contactPhone && (
                              <div className="flex justify-between">
                                <span className="text-xs text-slate-600">Telefon</span>
                                <span className="text-sm font-medium text-slate-900">
                                  {customer.contactPhone}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-xs text-slate-500">
                            Bu müşteri için tanımlı yetkili bilgisi bulunmuyor.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {financeTab === 'INVOICES' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Faturalar
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {financeCustomerInvoices.length} kayıt
                      </span>
                    </div>
                    {financeCustomerInvoices.length === 0 ? (
                      <Card className="p-4 border-dashed bg-slate-50/60 text-xs text-slate-500">
                        Kayıtlı fatura yok.
                      </Card>
                    ) : (
                      <div className="space-y-1">
                        {financeCustomerInvoices
                          .slice()
                          .sort(
                            (a: any, b: any) =>
                              new Date(b.issueDate).getTime() -
                              new Date(a.issueDate).getTime(),
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
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-slate-900">
                                  {new Intl.NumberFormat('tr-TR', {
                                    style: 'currency',
                                    currency: 'TRY',
                                  }).format(inv.totalAmount ?? inv.amount)}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-slate-500 hover:text-slate-800"
                                  onClick={() => openInvoicePreview(inv)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-slate-500 hover:text-slate-800"
                                  onClick={() => downloadInvoicePDF(inv)}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {financeTab === 'PAYMENTS' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Card className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2.5">
                        <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                          Toplam Gelir
                        </div>
                        <div className="text-sm font-bold text-emerald-900 mt-1">
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                          }).format(financeTotalIncome)}
                        </div>
                      </Card>
                      <Card className="rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                        <div className="text-[11px] font-semibold text-red-700 uppercase tracking-wide">
                          Toplam Gider
                        </div>
                        <div className="text-sm font-bold text-red-700 mt-1">
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                          }).format(financeTotalExpense)}
                        </div>
                      </Card>
                      <Card className="rounded-lg bg-slate-900 text-white px-3 py-2.5">
                        <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                          Net Pozisyon
                        </div>
                        <div className="text-sm font-bold mt-1">
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                          }).format(financeNetPosition)}
                        </div>
                      </Card>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                          Ödeme Hareketleri
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {financeCustomerTransactions.length} kayıt
                        </span>
                      </div>
                      {financeCustomerTransactions.length === 0 ? (
                        <Card className="p-4 border-dashed bg-slate-50/60 text-xs text-slate-500">
                          Kayıtlı ödeme hareketi yok.
                        </Card>
                      ) : (
                        <div className="space-y-1">
                          {financeCustomerTransactions
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
              </>
            )}
          </div>
        )}

        {activeTab === 'proposals' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Hazırlanan Teklifler</h3>
              <Button variant="outline" size="sm" onClick={fetchProposals} className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <Calendar className="h-4 w-4 mr-2" /> Yenile
              </Button>
            </div>

            {proposalsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : proposals.length === 0 ? (
              <Card className="p-12 text-center border-dashed bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-700">
                <FileText className="h-12 w-12 text-slate-200 mx-auto mb-3 dark:text-slate-700" />
                <p className="text-slate-500 font-medium dark:text-slate-400">Henüz teklif oluşturulmamış.</p>
                <p className="text-slate-400 text-sm mt-1 dark:text-slate-500">AI Teklif Merkezi'nden bu müşteri için teklif hazırlayabilirsiniz.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {proposals.map((proposal) => (
                  <Card key={proposal.id} className="p-4 border-slate-200 hover:shadow-md transition-shadow dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg dark:bg-indigo-900/30">
                          <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-white">{proposal.title}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-500 flex items-center gap-1 dark:text-slate-400">
                              <Calendar className="h-3 w-3" />
                              {new Date(proposal.createdAt).toLocaleDateString('tr-TR')}
                            </span>
                            <span className={cn(
                              "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                              proposal.status === 'DRAFT' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : 
                              proposal.status === 'APPROVED' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                              proposal.status === 'REJECTED' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                              "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            )}>
                              {proposal.status === 'DRAFT' ? 'Taslak' : 
                               proposal.status === 'APPROVED' ? 'Onaylandı' :
                               proposal.status === 'REJECTED' ? 'Reddedildi' : 'Gönderildi'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className="text-xs border rounded px-2 py-1 bg-white focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-emerald-500"
                          value={proposal.status}
                          disabled={updatingStatus === proposal.id}
                          onChange={(e) => handleUpdateProposalStatus(proposal.id, e.target.value)}
                        >
                          <option value="DRAFT">Taslak</option>
                          <option value="SENT">Gönderildi</option>
                          <option value="APPROVED">Onaylandı</option>
                          <option value="REJECTED">Reddedildi</option>
                        </select>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20"
                          onClick={() => openProposalModal(proposal)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 dark:hover:text-red-400 dark:hover:bg-red-900/20">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="ml-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          onClick={() => openProposalModal(proposal)}
                        >
                          Görüntüle
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Projeler</h3>
              <Button variant="outline" size="sm" onClick={fetchCustomerProjects} className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <Calendar className="h-4 w-4 mr-2" /> Yenile
              </Button>
            </div>

            {customerProjectsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : customerProjects.length === 0 ? (
              <Card className="p-12 text-center border-dashed bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-700">
                <Briefcase className="h-12 w-12 text-slate-200 mx-auto mb-3 dark:text-slate-700" />
                <p className="text-slate-500 font-medium dark:text-slate-400">Henüz proje oluşturulmamış.</p>
                <p className="text-slate-400 text-sm mt-1 dark:text-slate-500">Bu müşteri için yeni bir proje oluşturabilirsiniz.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customerProjects.map((project) => (
                  <Card key={project.id} className="p-4 border-slate-200 hover:shadow-md transition-shadow dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg dark:bg-blue-900/30">
                          <Layout className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-white">{project.name}</h4>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                             {new Date(project.createdAt).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                       <Button 
                          variant="outline" 
                          size="sm" 
                          className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                        >
                          Detay
                        </Button>
                    </div>
                     <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="bg-slate-50 p-2 rounded border text-center dark:bg-slate-800 dark:border-slate-700">
                            <span className="text-xs text-slate-500 block dark:text-slate-400">Bekleyen</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{project.tasksByStatus?.TODO || 0}</span>
                        </div>
                         <div className="bg-blue-50 p-2 rounded border border-blue-100 text-center dark:bg-blue-900/20 dark:border-blue-800">
                            <span className="text-xs text-blue-600 block dark:text-blue-300">Sürüyor</span>
                            <span className="font-bold text-blue-700 dark:text-blue-200">{project.tasksByStatus?.IN_PROGRESS || 0}</span>
                        </div>
                         <div className="bg-emerald-50 p-2 rounded border border-emerald-100 text-center dark:bg-emerald-900/20 dark:border-emerald-800">
                            <span className="text-xs text-emerald-600 block dark:text-emerald-300">Tamamlanan</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-200">{project.tasksByStatus?.DONE || 0}</span>
                        </div>
                     </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isInvoicePreviewOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden border border-slate-200 flex flex-col dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 dark:bg-slate-950/60 dark:border-slate-800">
              <div className="flex items-center gap-3">
                  {tenant?.logoUrl && (
                  <div
                    className="h-10 w-10 rounded-md bg-white border border-slate-200 bg-center bg-contain bg-no-repeat dark:bg-slate-900 dark:border-slate-700"
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
                  onClick={closeInvoicePreview}
                  className="text-slate-500 hover:text-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 text-sm overflow-auto flex-1 bg-slate-50/60 dark:bg-slate-950/40">
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 dark:bg-slate-900 dark:border-slate-700">
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
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">
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
                                  currency: 'TRY',
                                }).format(item.unitPrice)}
                              </td>
                              <td className="py-2 text-right">
                                {new Intl.NumberFormat('tr-TR', {
                                  style: 'currency',
                                  currency: 'TRY',
                                }).format(item.totalPrice)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">
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
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
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

      {/* Proposal Detail Modal */}
      {isProposalModalOpen && selectedProposal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b bg-white flex justify-between items-center dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedProposal.title}</h2>
                  <p className="text-xs text-slate-500">
                    {new Date(selectedProposal.createdAt).toLocaleDateString('tr-TR')} tarihinde oluşturuldu
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="text-sm border rounded-md px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-emerald-500"
                  value={selectedProposal.status}
                  disabled={updatingStatus === selectedProposal.id}
                  onChange={(e) => handleUpdateProposalStatus(selectedProposal.id, e.target.value)}
                >
                  <option value="DRAFT">Taslak</option>
                  <option value="SENT">Gönderildi</option>
                  <option value="APPROVED">Onaylandı</option>
                  <option value="REJECTED">Reddedildi</option>
                </select>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsProposalModalOpen(false)}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 min-h-full dark:bg-slate-900 dark:border-slate-700">
                {isEditing ? (
                  <textarea
                    className="w-full h-[60vh] p-4 border rounded-md font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    placeholder="Teklif içeriğini buraya yazın..."
                  />
                ) : (
                    <div className="p-4 md:p-8">
                      <div className="prose prose-indigo max-w-none prose-sm md:prose-base">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {selectedProposal.content.replace(/\[PAGE_BREAK\]/g, '\n---\n')}
                        </ReactMarkdown>
                      </div>

                      {(() => {
                        let selectedServices = [];
                        try {
                          const metadata = typeof selectedProposal.metadata === 'string' 
                            ? JSON.parse(selectedProposal.metadata) 
                            : selectedProposal.metadata;
                          
                          if (metadata && metadata.selectedServices) {
                            selectedServices = metadata.selectedServices;
                          }
                        } catch (e) {
                          console.error('Metadata parse error:', e);
                        }

                        if (!selectedServices || selectedServices.length === 0) return null;

                        return (
                          <div className="mt-12 pt-8 border-t border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Proje Bütçesi:</h3>
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                              <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-700 font-bold border-b">
                                  <tr>
                                    <th className="px-4 py-3">Hizmet</th>
                                    <th className="px-4 py-3">Adet</th>
                                    <th className="px-4 py-3 text-right">Birim Fiyat</th>
                                    <th className="px-4 py-3 text-right">KDV (%20)</th>
                                    <th className="px-4 py-3 text-right">Toplam</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedServices.map((ss: any, idx: number) => {
                                    const quantity = ss.quantity || 1;
                                    const price = ss.price || 0;
                                    const subtotal = quantity * price;
                                    const kdv = subtotal * 0.2;
                                    const total = subtotal + kdv;
                                    const cycleMap: any = { 'MONTHLY': 'Ay', 'YEARLY': 'Yıl', 'ONCE': 'Adet' };
                                    
                                    return (
                                      <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-4 font-medium text-slate-900">{ss.name || 'Hizmet'}</td>
                                        <td className="px-4 py-4 text-slate-600">{quantity} {cycleMap[ss.billingCycle] || 'Adet'}</td>
                                        <td className="px-4 py-4 text-slate-600 text-right">{price.toLocaleString('tr-TR')} TL</td>
                                        <td className="px-4 py-4 text-slate-600 text-right">{kdv.toLocaleString('tr-TR')} TL</td>
                                        <td className="px-4 py-4 font-bold text-slate-900 text-right">{total.toLocaleString('tr-TR')} TL</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <div className="mt-6 flex justify-end">
                              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900/60">
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.12em]">
                                  GENEL TOPLAM (KDV DAHİL)
                                </span>
                                <span className="text-lg md:text-2xl font-black text-slate-900">
                                  {selectedServices.reduce((acc: number, ss: any) => {
                                    const subtotal = (ss.quantity || 1) * (ss.price || 0);
                                    return acc + subtotal + (subtotal * 0.2);
                                  }, 0).toLocaleString('tr-TR')} TL
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
              </div>
            </div>
            <div className="p-4 border-t bg-white flex justify-between items-center px-6 dark:bg-slate-900 dark:border-slate-800">
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditedContent(selectedProposal.content);
                      }}
                      disabled={savingEdit}
                    >
                      Vazgeç
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 gap-2"
                      onClick={handleUpdateProposal}
                      disabled={savingEdit}
                    >
                      {savingEdit ? 'Kaydediliyor...' : <><Save className="h-4 w-4" /> Kaydet</>}
                    </Button>
                  </>
                ) : (
                  <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => {
                    setEditedContent(selectedProposal.content);
                    setIsEditing(true);
                  }}
                >
                  <Edit3 className="h-4 w-4" /> Düzenle
                </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsProposalModalOpen(false)}>
                  Kapat
                </Button>
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                  onClick={() => handleShare(isEditing ? editedContent : selectedProposal.content)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {copied ? 'Kopyalandı' : 'Paylaş'}
                </Button>
                <Button 
                  className="bg-slate-900 hover:bg-black gap-2"
                  onClick={() => handleExportPDF(selectedProposal)}
                >
                  <FileText className="h-4 w-4" /> PDF İndir
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {isEditCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl dark:bg-slate-900 dark:border dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">Müşteri Düzenle</h2>
              <button onClick={() => setIsEditCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                  Müşteri Adı / Şirket
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={editCustomerForm.name}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                  E-posta
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={editCustomerForm.email}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                  Telefon
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={editCustomerForm.phone}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, phone: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsEditCustomerModalOpen(false)} className="dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800">
                  İptal
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white">
                  Kaydet
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
