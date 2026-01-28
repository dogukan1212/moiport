'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { 
  FileText, 
  Sparkles, 
  Loader2, 
  Download, 
  Copy, 
  Check, 
  Send,
  User,
  Target,
  Briefcase,
  DollarSign,
  Clock,
  Layers,
  Search,
  Save,
  Plus,
  Trash2,
  Globe,
  ChevronDown,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { exportToPDF } from '@/lib/pdf-helper';

export default function AIProposalsPage() {
  const [formData, setFormData] = useState({
    clientName: '',
    sector: '',
    customerWebsite: '',
    projectScope: '',
    goals: '',
    timeline: '',
    deepSearch: false,
    customerId: '',
    aiModel: 'gemini-1.5-flash',
    selectedServices: [] as { serviceId: string, price: number, billingCycle: string, quantity: number }[],
    processInfo: "İşlemlere onay verildikten sonra, reklam stratejileri ve içerikler 20 iş günü içerisinde hazırlanarak paylaşımlara başlanacaktır.\nWhatsapp ile şirketinize özel bir takım oluşturulacaktır.",
    teamMembers: [
      "Sosyal Medya Yöneticisi",
      "Reklam Yöneticisi",
      "Grafik Tasarımcı",
      "Web Geliştirici",
      "Metin Yazarı",
      "Müşteri Temsilcisi"
    ]
  });
  
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [recentProposals, setRecentProposals] = useState<any[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [newService, setNewService] = useState({ name: '', description: '', basePrice: '', billingCycle: 'MONTHLY' });
  const searchParams = useSearchParams();
  const initializedFromUrlRef = useRef(false);

  const modelLabelMap: Record<string, string> = {
    "gemini-1.5-flash": "Gemini 1.5 Flash",
    "gemini-1.5-pro": "Gemini 1.5 Pro",
    "gemini-2.0-flash-exp": "Gemini 2.0 Flash",
    "gemini-3-flash-preview": "Gemini 3 Flash Preview",
    "gemini-pro": "Gemini Pro"
  };

  const statusLabelMap: Record<string, string> = {
    DRAFT: 'Taslak',
    SENT: 'Gönderildi',
    ACCEPTED: 'Kabul Edildi',
    REJECTED: 'Reddedildi'
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
      case 'SENT':
        return 'bg-sky-500/10 text-sky-700 dark:text-sky-300';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-700 dark:text-red-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchServices();
    fetchTenant();
  }, []);

  useEffect(() => {
    if (initializedFromUrlRef.current) return;

    const proposalId = searchParams.get('proposalId');
    const customerIdFromQuery = searchParams.get('customerId');

    if (!proposalId && !customerIdFromQuery) return;

    initializedFromUrlRef.current = true;

    const initFromExistingProposal = async () => {
      if (customerIdFromQuery) {
        setFormData(prev => ({
          ...prev,
          customerId: customerIdFromQuery
        }));
      }

      if (!proposalId) return;

      try {
        const response = await api.get(`/proposals/${proposalId}`);
        const p = response.data;

        let selectedServicesFromMetadata: any[] = [];
        try {
          const metadata = typeof p.metadata === 'string'
            ? JSON.parse(p.metadata)
            : p.metadata;

          if (metadata && Array.isArray(metadata.selectedServices)) {
            selectedServicesFromMetadata = metadata.selectedServices;
          }
        } catch (e) {
          console.error('Proposal metadata parse error:', e);
        }

        setProposal(p.content || '');

        setFormData(prev => ({
          ...prev,
          clientName: p.customer?.name || prev.clientName,
          customerId: customerIdFromQuery || p.customerId || prev.customerId,
          selectedServices: selectedServicesFromMetadata.length > 0
            ? selectedServicesFromMetadata.map((ss: any) => ({
                serviceId: ss.serviceId,
                price: typeof ss.price === 'number' ? ss.price : Number(ss.price) || 0,
                billingCycle: ss.billingCycle || 'MONTHLY',
                quantity: ss.quantity || 1,
                name: ss.name
              }))
            : prev.selectedServices
        }));
      } catch (error) {
        console.error('Teklif detayları yüklenemedi:', error);
      }
    };

    initFromExistingProposal();
  }, [searchParams]);

  useEffect(() => {
    if (!formData.customerId) {
      setRecentProposals([]);
      return;
    }

    const fetchRecentProposals = async () => {
      setRecentLoading(true);
      try {
        const response = await api.get('/proposals', {
          params: { customerId: formData.customerId }
        });
        const data = Array.isArray(response.data) ? response.data : [];
        setRecentProposals(data.slice(0, 5));
      } catch (error) {
        console.error('Son teklifler yüklenemedi:', error);
        setRecentProposals([]);
      } finally {
        setRecentLoading(false);
      }
    };

    fetchRecentProposals();
  }, [formData.customerId]);

  useEffect(() => {
    if (!formData.customerId) return;
    if (formData.clientName) return;

    const customer = customers.find(c => c.id === formData.customerId);
    if (!customer) return;

    setFormData(prev => ({
      ...prev,
      clientName: customer.name
    }));
  }, [formData.customerId, formData.clientName, customers]);

  const fetchTenant = async () => {
    try {
      const response = await api.get('/tenants/me');
      setTenant(response.data);
    } catch (error) {
      console.error('Tenant bilgileri yüklenemedi:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Müşteriler yüklenemedi:', error);
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

  const handleAddService = async () => {
    if (!newService.name) return;
    try {
      const response = await api.post('/services', {
        ...newService,
        basePrice: newService.basePrice ? parseFloat(newService.basePrice) : undefined
      });
      setServices([...services, response.data]);
      setNewService({ name: '', description: '', basePrice: '', billingCycle: 'MONTHLY' });
      setShowServiceForm(false);
    } catch (error) {
      alert('Hizmet eklenemedi.');
    }
  };

  const toggleService = (service: any) => {
    setFormData(prev => {
      const isSelected = prev.selectedServices.find(s => s.serviceId === service.id);
      if (isSelected) {
        return {
          ...prev,
          selectedServices: prev.selectedServices.filter(s => s.serviceId !== service.id)
        };
      } else {
        return {
          ...prev,
          selectedServices: [
            ...prev.selectedServices,
            { 
              serviceId: service.id, 
              price: service.basePrice || 0, 
              billingCycle: service.billingCycle || 'MONTHLY',
              quantity: 1
            }
          ]
        };
      }
    });
  };

  const updateSelectedService = (serviceId: string, updates: any) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.map(s => 
        s.serviceId === serviceId ? { ...s, ...updates } : s
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProposal('');
    
    const selectedServicesData = formData.selectedServices.map(ss => {
      const service = services.find(s => s.id === ss.serviceId);
      return {
        ...service,
        basePrice: ss.price,
        billingCycle: ss.billingCycle,
        quantity: ss.quantity
      };
    });
    
    try {
      const response = await api.post('/ai/generate-proposal', {
        ...formData,
        selectedServices: selectedServicesData
      });
      
      const teamList = formData.teamMembers.map((m, i) => `${i + 1}. ${m}`).join('\n');
      const proposalSuffix = `\n\n[PAGE_BREAK]\n\n# Proje Süreci ve Ekip\n\n${formData.processInfo}\n\n${teamList}`;
      
      setProposal(response.data.proposal + proposalSuffix);
    } catch (error: any) {
      console.error('Teklif hatası:', error);
      alert('Teklif oluşturulamadı: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.customerId) {
      alert('Lütfen teklifi kaydetmek için bir müşteri seçin.');
      return;
    }
    if (!proposal) return;

    setSaving(true);
    try {
      await api.post('/proposals', {
        title: `${formData.clientName} - Teklif`,
        content: proposal,
        customerId: formData.customerId,
        status: 'DRAFT',
        metadata: JSON.stringify({
          selectedServices: formData.selectedServices.map(ss => ({
            ...ss,
            name: services.find(s => s.id === ss.serviceId)?.name || 'Hizmet'
          }))
        })
      });
      alert('Teklif başarıyla kaydedildi.');
    } catch (error: any) {
      alert('Kaydedilemedi: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    await exportToPDF({
      proposal,
      clientName: formData.clientName,
      tenant,
      services,
      selectedServices: formData.selectedServices
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openProposalFromList = (proposal: any) => {
    const params = new URLSearchParams();
    if (proposal.id) {
      params.set('proposalId', proposal.id);
    }
    if (proposal.customerId) {
      params.set('customerId', proposal.customerId);
    }
    const query = params.toString();
    const href = `/dashboard/ai-proposals${query ? `?${query}` : ''}`;
    if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  };

  const totalBudget = formData.selectedServices.reduce((acc, ss) => {
    const subtotal = (ss.quantity || 1) * (ss.price || 0);
    return acc + subtotal + subtotal * 0.2;
  }, 0);

  const selectedServiceCount = formData.selectedServices.length;
  const recurringServicesCount = formData.selectedServices.filter(
    (ss) => ss.billingCycle === 'MONTHLY' || ss.billingCycle === 'YEARLY'
  ).length;
  const activeModelLabel = modelLabelMap[formData.aiModel] || formData.aiModel;

  return (
    <div className="relative h-full flex flex-col -m-4 p-4 bg-slate-50/60 dark:bg-transparent">
      <div className="pointer-events-none absolute inset-0 -z-10 hidden dark:block">
        <div className="absolute inset-0 bg-[#050505]" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-emerald-500/15 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
      </div>

      <div className="flex justify-between items-end mb-8 relative z-10">
        <div>
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.18em] bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 mb-3">
            <Sparkles className="h-3 w-3" />
            MOI PORT AI
          </p>
          <h1 className="text-[28px] font-normal tracking-[-0.03em] text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <FileText className="h-6 w-6 text-slate-900 dark:text-emerald-400" />
            <span>AI Teklifler</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-300 text-sm mt-2">
            Teklif formunu doldurun, üstte teklif özetini ve sağ tarafta canlı taslağı takip edin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 relative z-10">
        <Card className="p-4 bg-white/90 border-slate-200/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-700">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.16em] mb-1">
            Toplam Bütçe (KDV Dahil)
          </p>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {totalBudget > 0 ? `${totalBudget.toLocaleString('tr-TR')} TL` : '—'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Seçilen hizmetlere göre otomatik hesaplanır.
          </p>
        </Card>
        <Card className="p-4 bg-white/90 border-slate-200/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-700">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.16em] mb-1">
            Hizmet Dağılımı
          </p>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {selectedServiceCount || '0'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {recurringServicesCount > 0
              ? `${recurringServicesCount} düzenli, ${Math.max(selectedServiceCount - recurringServicesCount, 0)} tek seferlik kalem`
              : 'Seçili hizmet kalemi'}
          </p>
        </Card>
        <Card className="p-4 bg-white/90 border-slate-200/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-700">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.16em] mb-1">
            Aktif AI Modeli
          </p>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {activeModelLabel}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Formdaki model seçimine göre içerik kalitesi ve hızı değişir.
          </p>
        </Card>
        <Card className="p-4 bg-white/90 border-slate-200/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-700">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.16em] mb-1">
            Derin Pazar Araştırması
          </p>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {formData.deepSearch ? 'Açık' : 'Kapalı'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Web’de sektörel veri ve rakip analizi {formData.deepSearch ? 'kullanılıyor.' : 'kullanılmıyor.'}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 relative z-10">
        <Card className="p-4 bg-white/90 border-slate-200/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-50 mb-1">
                Müşteri Analizi
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Müşteri web sitesi ve sektörü üzerinden teklif içeriği otomatik özelleştirilir.
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white/90 border-slate-200/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 p-2">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-50 mb-1">
                Dinamik Fiyatlandırma
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Hizmet, adet ve süreye göre bütçe tablosu ve genel toplam saniyeler içinde oluşur.
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white/90 border-slate-200/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 p-2">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-50 mb-1">
                Pazar İstihbaratı
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Derin arama açıkken rakip ve sektör verileri AI modeline ek bağlam sağlar.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 relative z-10">
        {/* Form Column */}
        <div className="lg:col-span-5">
          <Card className="p-6 border border-slate-200 rounded-xl bg-white/95 shadow-sm dark:bg-slate-900/80 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-900 dark:text-slate-50">
              <Layers className="h-5 w-5 text-[#111] dark:text-emerald-400" />
              Teklif Detayları
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Müşteri / Marka Adı</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Örn: Global Lojistik"
                      className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-[#111] bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-50"
                      value={formData.clientName}
                      onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Web Sitesi</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="url"
                      placeholder="https://example.com"
                      className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-[#111] bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-50"
                      value={formData.customerWebsite}
                      onChange={(e) => setFormData({...formData, customerWebsite: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Sektör</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Örn: E-ticaret, Sağlık"
                    className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-[#111] bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-50"
                    value={formData.sector}
                    onChange={(e) => setFormData({...formData, sector: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  AI Model Seçimi
                </label>
                <select
                  className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-[#111] bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-50"
                  value={formData.aiModel}
                  onChange={(e) => setFormData({...formData, aiModel: e.target.value})}
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Hızlı)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Zeki)</option>
                  <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Yeni/Deneysel)</option>
                  <option value="gemini-3-flash-preview">Gemini 3 Flash Preview (En Yeni/Ücretsiz)</option>
                  <option value="gemini-pro">Gemini Pro (Klasik)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Hizmetler</label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[#111] dark:text-slate-100 hover:text-[#333] p-0"
                    onClick={() => setShowServiceForm(!showServiceForm)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Hizmet Ekle
                  </Button>
                </div>

                {showServiceForm && (
                  <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 space-y-3 mb-3">
                    <input
                      type="text"
                      placeholder="Hizmet Adı"
                      className="w-full px-3 py-1.5 border rounded text-sm bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-50"
                      value={newService.name}
                      onChange={(e) => setNewService({...newService, name: e.target.value})}
                    />
                    <textarea
                      placeholder="Hizmet Açıklaması"
                      className="w-full px-3 py-1.5 border rounded text-sm h-20 bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-50"
                      value={newService.description}
                      onChange={(e) => setNewService({...newService, description: e.target.value})}
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Fiyat (TL)"
                        className="flex-1 px-3 py-1.5 border rounded text-sm bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-50"
                        value={newService.basePrice}
                        onChange={(e) => setNewService({...newService, basePrice: e.target.value})}
                      />
                      <select
                        className="flex-1 px-3 py-1.5 border rounded text-sm bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-50"
                        value={newService.billingCycle}
                        onChange={(e) => setNewService({...newService, billingCycle: e.target.value})}
                      >
                        <option value="MONTHLY">Aylık</option>
                        <option value="YEARLY">Yıllık</option>
                        <option value="ONCE">Tek Seferlik</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" className="flex-1" onClick={handleAddService}>Ekle</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowServiceForm(false)}>İptal</Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2">
                  {services.length === 0 && !showServiceForm && (
                    <p className="text-[10px] text-slate-400 text-center py-4">Henüz hizmet tanımlanmamış.</p>
                  )}
                  {services.map(service => {
                    const selectedService = formData.selectedServices.find(s => s.serviceId === service.id);
                    const isSelected = !!selectedService;

                    return (
                      <div key={service.id} className="space-y-2">
                        <div 
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between group",
                            isSelected 
                              ? "bg-slate-200 border-slate-300 text-slate-900 dark:bg-emerald-500/10 dark:border-emerald-500/40 dark:text-slate-50" 
                              : "bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900/60 dark:border-slate-700 dark:hover:border-slate-500"
                          )}
                          onClick={() => toggleService(service)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                              isSelected
                                ? "bg-white border-white dark:bg-emerald-500 dark:border-emerald-500"
                                : "bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-600"
                            )}>
                              {isSelected && <Check className="h-3 w-3 text-slate-900 dark:text-slate-950" />}
                            </div>
                            <div>
                              <p className={cn("text-xs font-semibold", isSelected ? "text-white" : "text-slate-900 dark:text-slate-100")}>{service.name}</p>
                              {service.description && (
                                <p className={cn("text-[10px] line-clamp-1", isSelected ? "text-slate-300" : "text-slate-500 dark:text-slate-400")}>{service.description}</p>
                              )}
                            </div>
                          </div>
                          <button 
                            type="button"
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Hizmeti silmek istediğinize emin misiniz?')) {
                                api.delete(`/services/${service.id}`).then(() => fetchServices());
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        
                        {isSelected && (
                          <div className="ml-7 p-2 bg-[#fafafa] dark:bg-slate-900/70 rounded-md border border-[#e6e6e6] dark:border-slate-700 grid grid-cols-12 gap-2 animate-in fade-in slide-in-from-top-1">
                            <div className="relative col-span-5">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">TL</span>
                              <input 
                                type="number" 
                                className="w-full pl-7 pr-2 py-1 text-xs border rounded bg-white dark:bg-slate-900/70 dark:border-slate-700 dark:text-slate-50"
                                placeholder="Fiyat"
                                value={selectedService.price}
                                onChange={(e) => updateSelectedService(service.id, { price: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <div className="relative col-span-3">
                              <input 
                                type="number" 
                                className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-900/70 dark:border-slate-700 dark:text-slate-50"
                                placeholder="Adet"
                                min="1"
                                value={selectedService.quantity}
                                onChange={(e) => updateSelectedService(service.id, { quantity: parseInt(e.target.value) || 1 })}
                              />
                            </div>
                            <select 
                              className="col-span-4 px-2 py-1 text-xs border rounded bg-white dark:bg-slate-900/70 dark:border-slate-700 dark:text-slate-50"
                              value={selectedService.billingCycle}
                              onChange={(e) => updateSelectedService(service.id, { billingCycle: e.target.value })}
                            >
                              <option value="MONTHLY">Aylık</option>
                              <option value="YEARLY">Yıllık</option>
                              <option value="ONCE">Tek Seferlik</option>
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Özel Notlar / Kapsam (Opsiyonel)</label>
                <textarea
                  placeholder="Seçilen hizmetler dışında eklemek istediğiniz notlar..."
                  className="w-full px-4 py-2 border rounded-md text-sm min-h-[60px] focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-50"
                  value={formData.projectScope}
                  onChange={(e) => setFormData({...formData, projectScope: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Hedefler (Opsiyonel)</label>
                <div className="relative">
                  <Target className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <textarea
                    placeholder="Müşterinin ana hedefleri neler? (Örn: %20 satış artışı, marka bilinirliği...)"
                    className="w-full pl-10 pr-4 py-2 border rounded-md text-sm min-h-[80px] focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-50"
                    value={formData.goals}
                    onChange={(e) => setFormData({...formData, goals: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Süre (Opsiyonel)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Örn: 6 Ay"
                      className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-50"
                      value={formData.timeline}
                      onChange={(e) => setFormData({...formData, timeline: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg bg-slate-50/50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-500" />
                  Süreç ve Ekip Bilgileri
                </h4>
                
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Süreç Açıklaması</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md text-xs min-h-[80px] focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900/70 dark:border-slate-700 dark:text-slate-50"
                    value={formData.processInfo}
                    onChange={(e) => setFormData({...formData, processInfo: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Ekip Üyeleri</label>
                  <div className="space-y-2">
                    {formData.teamMembers.map((member, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 px-3 py-1 border rounded text-xs focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900/70 dark:border-slate-700 dark:text-slate-50"
                          value={member}
                          onChange={(e) => {
                            const newTeam = [...formData.teamMembers];
                            newTeam[idx] = e.target.value;
                            setFormData({...formData, teamMembers: newTeam});
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                          onClick={() => {
                            const newTeam = formData.teamMembers.filter((_, i) => i !== idx);
                            setFormData({...formData, teamMembers: newTeam});
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-8 text-xs border-dashed"
                      onClick={() => setFormData({...formData, teamMembers: [...formData.teamMembers, ""]})}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Ekip Üyesi Ekle
                    </Button>
                  </div>
                </div>
              </div>

              <div 
                className={cn(
                  "p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors",
                  formData.deepSearch
                    ? "bg-slate-200 border-slate-300 text-slate-900 dark:bg-emerald-500/10 dark:border-emerald-500/40 dark:text-slate-50"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900/60 dark:border-slate-700 dark:hover:bg-slate-900"
                )}
                onClick={() => setFormData({...formData, deepSearch: !formData.deepSearch})}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    formData.deepSearch
                      ? "bg-white text-slate-700 dark:bg-emerald-500 dark:text-slate-950"
                      : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                  )}>
                    <Search className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={cn("text-xs font-semibold", formData.deepSearch ? "text-slate-900 dark:text-slate-50" : "text-slate-900 dark:text-slate-100")}>Derin Pazar Araştırması</p>
                    <p className={cn("text-[10px]", formData.deepSearch ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-400")}>Web'de sektörel veri ve rakip analizi yapar.</p>
                  </div>
                </div>
                <div className={cn(
                  "w-10 h-5 rounded-full relative transition-colors",
                  formData.deepSearch
                    ? "bg-slate-300 dark:bg-emerald-500"
                    : "bg-slate-300 dark:bg-slate-700"
                )}>
                  <div className={cn(
                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                    formData.deepSearch ? "right-1" : "left-1"
                  )} />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Teklif Hazırlanıyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Profesyonel Teklif Oluştur
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-7">
          <Card className="h-full min-h-[600px] flex flex-col bg-white/95 border border-slate-200 rounded-xl overflow-hidden dark:bg-slate-950/80 dark:border-slate-700">
            <div className="p-4 border-b bg-slate-900 text-slate-50 flex flex-wrap gap-4 justify-between items-center sticky top-0 z-10 border-slate-800">
              <h3 className="font-semibold flex items-center gap-2 text-sm tracking-[0.16em] uppercase">
                <FileText className="h-4 w-4" />
                Teklif Önizleme
              </h3>
              
              {proposal && (
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="relative">
                    <select
                      className="appearance-none bg-slate-900/80 border border-slate-700 text-xs rounded-md pl-3 pr-8 py-2 focus:ring-2 focus:ring-indigo-500"
                      value={formData.customerId}
                      onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                    >
                      <option value="">Müşteri Seçin</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className={isEditing ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "border-slate-600 text-slate-50 hover:bg-slate-800"}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isEditing ? 'Önizlemeye Dön' : 'Düzenle'}
                  </Button>

                  <div className="h-6 w-px bg-slate-200 mx-1" />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving || !formData.customerId}
                    className="border-emerald-500 text-emerald-100 hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Kaydet
                  </Button>
                  
                  <div className="h-6 w-px bg-slate-200 mx-1" />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="border-slate-600 text-slate-50 hover:bg-slate-800"
                  >
                    {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? 'Kopyalandı' : 'Kopyala'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPDF}
                    className="border-red-400 text-red-100 hover:bg-red-500/10"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF İndir
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto bg-slate-50/60 dark:bg-transparent">
              {!proposal && !loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-4">
                  <div className="p-4 bg-white rounded-full shadow-sm dark:bg-slate-900">
                    <Send className="h-8 w-8 text-slate-300 dark:text-slate-500" />
                  </div>
                  <p className="text-sm">Sol taraftaki bilgileri doldurup teklifinizi oluşturun.</p>
                </div>
              ) : loading ? (
                <div className="space-y-4">
                  <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                  <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                  <div className="pt-8 space-y-4">
                    <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden dark:bg-slate-900 dark:border-slate-700">
                  {isEditing ? (
                    <textarea
                      className="w-full h-[600px] p-8 font-mono text-sm border-none focus:ring-0 resize-none bg-transparent text-slate-900 dark:text-slate-100"
                      value={proposal}
                      onChange={(e) => setProposal(e.target.value)}
                      placeholder="Teklif içeriğini burada düzenleyebilirsiniz..."
                    />
                  ) : (
                    <div className="p-8">
                      <div className="prose prose-indigo max-w-none font-sans text-slate-800 dark:text-slate-100 leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {proposal.replace(/\[PAGE_BREAK\]/g, '\n---\n')}
                        </ReactMarkdown>
                      </div>

                      {formData.selectedServices.length > 0 && (
                        <div className="mt-12 pt-8 border-t border-slate-100">
                          <h3 className="text-xl font-bold text-slate-900 mb-6">Proje Bütçesi:</h3>
                          <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-sm text-left">
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
                                {formData.selectedServices.map((ss, idx) => {
                                  const service = services.find(s => s.id === ss.serviceId);
                                  const serviceName = service?.name || 'Hizmet';
                                  const quantity = ss.quantity || 1;
                                  const price = ss.price || 0;
                                  const subtotal = quantity * price;
                                  const kdv = subtotal * 0.2;
                                  const total = subtotal + kdv;
                                  const cycleMap: any = { 'MONTHLY': 'Ay', 'YEARLY': 'Yıl', 'ONCE': 'Adet' };
                                  
                                  return (
                                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                      <td className="px-4 py-4 font-medium text-slate-900">{serviceName}</td>
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
                            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
                              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.12em]">
                                GENEL TOPLAM (KDV DAHİL)
                              </span>
                              <span className="text-lg md:text-2xl font-black text-slate-900">
                                {formData.selectedServices.reduce((acc, ss) => {
                                  const subtotal = (ss.quantity || 1) * (ss.price || 0);
                                  return acc + subtotal + (subtotal * 0.2);
                                }, 0).toLocaleString('tr-TR')} TL
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="relative z-10 mt-4 pb-10">
        <Card className="border border-slate-200 bg-white/95 dark:bg-slate-900/80 dark:border-slate-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 pt-6">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.18em] mb-1">
                Son Teklifler
              </p>
              <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-900 dark:text-emerald-400" />
                Son Kaydedilen Teklifler
              </h2>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
                {formData.customerId
                  ? 'Seçili müşteri için son oluşturduğunuz tekliflerin özeti.'
                  : 'Bir müşteri seçtiğinizde, onun için oluşturduğunuz son teklifler burada listelenir.'}
              </p>
            </div>
            {formData.customerId && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium dark:bg-slate-800 dark:text-slate-200">
                <User className="h-3 w-3" />
                <span className="truncate max-w-[180px]">
                  {customers.find(c => c.id === formData.customerId)?.name || 'Seçili Müşteri'}
                </span>
                <span className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
                <span>{recentProposals.length} kayıt</span>
              </div>
            )}
          </div>

          <div className="px-6 pb-6 pt-4">
            {!formData.customerId ? (
              <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Önce üst kısımdan bir müşteri seçin veya teklifi kaydedin; son teklifler burada görüntülenecek.
              </div>
            ) : recentLoading ? (
              <div className="py-6 space-y-3">
                <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                <div className="h-10 w-full bg-slate-100 dark:bg-slate-800/80 animate-pulse rounded" />
                <div className="h-10 w-full bg-slate-100 dark:bg-slate-800/80 animate-pulse rounded" />
                <div className="h-10 w-full bg-slate-100 dark:bg-slate-800/80 animate-pulse rounded" />
              </div>
            ) : recentProposals.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Bu müşteri için henüz kaydedilmiş teklif bulunmuyor.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 mt-2">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Teklif</th>
                      <th className="px-4 py-3">Durum</th>
                      <th className="px-4 py-3">Tarih</th>
                      <th className="px-4 py-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProposals.map((p: any) => (
                      <tr
                        key={p.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-900/70 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-50 line-clamp-1">
                              {p.title || 'Başlıksız Teklif'}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {p.customer?.name || customers.find(c => c.id === p.customerId)?.name || 'Müşteri'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-[0.12em] uppercase ${getStatusClasses(
                              p.status || 'DRAFT'
                            )}`}
                          >
                            {statusLabelMap[p.status] || p.status || 'Taslak'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('tr-TR') : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                            onClick={() => openProposalFromList(p)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            Aç
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
