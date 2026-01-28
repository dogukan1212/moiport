'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  MoreVertical, 
  Mail, 
  Phone, 
  Facebook, 
  User, 
  Calendar,
  Loader2,
  ChevronDown,
  Building2,
  Globe,
  Trash2,
  CheckCircle2,
  X,
  Target,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LeadDetailModal } from '../lead-detail-modal';
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from '@/lib/api';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  source: string;
  status: string;
  pipelineId: string;
  stageId: string;
  value?: number;
  score?: number;
  createdAt: string;
  updatedAt: string;
  activities?: any[];
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  [key: string]: any;
}

interface Pipeline {
  id: string;
  name: string;
  stages: { id: string; name: string; color: string; order: number }[];
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tümü');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingStageLeadId, setEditingStageLeadId] = useState<string | null>(null);
  const [updatingStageLeadId, setUpdatingStageLeadId] = useState<string | null>(null);
  const [editingAssigneeLeadId, setEditingAssigneeLeadId] = useState<string | null>(null);
  const [updatingAssigneeLeadId, setUpdatingAssigneeLeadId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Dialog states
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    source: 'all',
    dateRange: 'anytime',
    minValue: 0
  });
  
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'WEB_FORM',
    value: 0,
    pipelineId: '',
    stageId: ''
  });

  useEffect(() => {
    fetchInitialData();
    fetchUsers();

    // Socket connection
    const token = localStorage.getItem("token");
    if (!token) return;

    const s = io(SOCKET_URL + '/crm', {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      console.log("CRM socket connected (LeadsPage)");
    });

    s.on("lead:created", (lead: any) => {
      setLeads((prev) => [lead, ...prev]);
      toast.success("Yeni aday eklendi", { description: lead.name });
    });

    s.on("lead:updated", (lead: any) => {
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, ...lead } : l)));
      if (selectedLead?.id === lead.id) {
        setSelectedLead((prev) => (prev ? { ...prev, ...lead } : null));
      }
    });

    s.on("lead:moved", (lead: any) => {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id
            ? {
                ...l,
                stageId: lead.stageId,
                stage: lead.stage,
              }
            : l,
        ),
      );
      if (selectedLead?.id === lead.id) {
        setSelectedLead((prev) =>
          prev
            ? {
                ...prev,
                stageId: lead.stageId,
                stage: lead.stage,
              }
            : null,
        );
      }
    });

    s.on("lead:deleted", (data: { id: string }) => {
      setLeads((prev) => prev.filter((l) => l.id !== data.id));
      if (selectedLead?.id === data.id) {
        setSelectedLead(null);
      }
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [leadsRes, pipelinesRes] = await Promise.all([
        api.get('/crm/leads'),
        api.get('/crm/pipelines')
      ]);
      setLeads(leadsRes.data);
      setPipelines(pipelinesRes.data);
      
      if (pipelinesRes.data.length > 0) {
        setNewLead(prev => ({
          ...prev,
          pipelineId: pipelinesRes.data[0].id,
          stageId: pipelinesRes.data[0].stages[0]?.id || ''
        }));
      }
    } catch (error) {
      console.error('Data fetch error:', error);
      toast.error('Veriler alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const response = await api.get('/crm/leads');
      setLeads(response.data);
      
      if (selectedLead) {
        fetchLeadDetails(selectedLead.id);
      }
    } catch (error) {
      console.error('Leads fetch error:', error);
      toast.error('Lead listesi alınamadı.');
    }
  };

  const fetchPipelines = async () => {
    try {
      const response = await api.get('/crm/pipelines');
      setPipelines(response.data);
    } catch (error) {
      toast.error('Pipelines yüklenemedi');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/list');
      setUsers(response.data);
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
    }
  };

  const fetchLeadDetails = async (leadId: string) => {
    try {
      const response = await api.get(`/crm/leads/${leadId}`);
      setSelectedLead(response.data);
    } catch (error) {
      console.error('Lead details error:', error);
    }
  };

  const handleConvertToCustomer = async (leadId: string) => {
    try {
      await api.post(`/crm/leads/${leadId}/convert`);
      toast.success('Aday başarıyla müşteriye dönüştürüldü.');
      setSelectedLead(null);
      fetchLeads();
    } catch (error) {
      toast.error('Dönüştürme hatası.');
    }
  };

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.pipelineId || !newLead.stageId) {
      toast.error('Lütfen gerekli alanları doldurun.');
      return;
    }
    
    try {
      await api.post('/crm/leads', {
        ...newLead,
        value: Number(newLead.value)
      });
      toast.success('Yeni aday başarıyla eklendi.');
      setIsAddLeadOpen(false);
      setNewLead({
        name: '', email: '', phone: '', company: '', 
        source: 'WEB_FORM', value: 0, 
        pipelineId: pipelines[0]?.id || '', 
        stageId: pipelines[0]?.stages[0]?.id || ''
      });
      fetchLeads();
    } catch (error) {
      toast.error('Aday eklenirken bir hata oluştu.');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Bu lead\'i silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/crm/leads/${id}`);
      toast.success('Lead silindi.');
      fetchLeads();
    } catch (error) {
      toast.error('Lead silinemedi.');
    }
  };

  const handleChangeLeadStage = async (leadId: string, stageId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const pipeline = pipelines.find((p) => p.id === (lead as any).pipelineId);
    const stage =
      pipeline?.stages?.find((s: any) => s.id === stageId) ||
      (lead as any).stage;

    if (!stage) {
      setEditingStageLeadId(null);
      return;
    }

    try {
      setUpdatingStageLeadId(leadId);
      await api.patch(`/crm/leads/${leadId}/move`, { stageId });

      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                stageId,
                stage: {
                  ...(l as any).stage,
                  id: stage.id,
                  name: stage.name,
                  color: stage.color,
                },
              }
            : l,
        ),
      );

      toast.success('Aşama güncellendi.');
    } catch (error) {
      toast.error('Aşama güncellenemedi.');
    } finally {
      setUpdatingStageLeadId(null);
      setEditingStageLeadId(null);
    }
  };

  const handleAssignLead = async (leadId: string, assigneeId: string) => {
    try {
      const selectedUser = users.find(u => u.id === assigneeId);
      setUpdatingAssigneeLeadId(leadId);
      
      await api.patch(`/crm/leads/${leadId}/assignee`, { 
        assigneeId: assigneeId === 'unassigned' ? null : assigneeId 
      });
      
      setEditingAssigneeLeadId(null);
      toast.success('Atanan kişi güncellendi.');

      // Update local state to reflect changes immediately
      setLeads(prev => prev.map(l => l.id === leadId ? {
        ...l,
        assigneeId: assigneeId === 'unassigned' ? null : assigneeId,
        assignee: selectedUser || undefined
      } : l));
    } catch (error) {
      toast.error('Kişi atanamadı.');
    } finally {
      setUpdatingAssigneeLeadId(null);
    }
  };

  const handleImportLeads = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.info(`${file.name} dosyası işleniyor... (Bu özellik demo aşamasındadır)`);
      // Burada gerçek bir CSV/Excel işleme mantığı eklenebilir
      setTimeout(() => {
        setIsImportOpen(false);
        toast.success('İçe aktarma başarılı (Simüle edildi)');
      }, 2000);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search filter
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm) ||
        lead.company?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Quick filter (Stage)
      if (activeFilter !== 'Tümü') {
        if (activeFilter === 'Atanmamış') {
          if (lead.stage) return false;
        } else if (lead.stage?.name !== activeFilter) {
          return false;
        }
      }

      // Advanced filters
      if (filters.source !== 'all' && lead.source !== filters.source) return false;
      if (filters.minValue > 0 && (lead.value ?? 0) < filters.minValue) return false;
      
      if (filters.dateRange !== 'anytime') {
        const leadDate = new Date(lead.createdAt);
        const now = new Date();
        if (filters.dateRange === 'today') {
          if (leadDate.toDateString() !== now.toDateString()) return false;
        } else if (filters.dateRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (leadDate < weekAgo) return false;
        } else if (filters.dateRange === 'month') {
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          if (leadDate < monthAgo) return false;
        }
      }

      return true;
    });
  }, [leads, searchTerm, activeFilter, filters]);

  const quickFilters = useMemo(() => {
    const usedStageNames = new Set(
      leads
        .map((lead) => lead.stage?.name)
        .filter((name): name is string => !!name),
    );
    const stages = pipelines.flatMap((p) =>
      (p.stages || [])
        .filter((s) => usedStageNames.has(s.name))
        .map((s) => s.name),
    );
    const uniqueStages = Array.from(new Set(stages));
    return ['Tümü', ...uniqueStages, 'Atanmamış'];
  }, [pipelines, leads]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const selectedPipeline = pipelines.find(p => p.id === newLead.pipelineId);

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Lead Yönetimi</h1>
          <p className="text-slate-500 text-sm dark:text-slate-400">Müşteri adaylarınızı yönetin ve takip edin</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                <Upload className="h-4 w-4 mr-2" />
                İçe Aktar
              </Button>
            </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Lead'leri İçe Aktar</DialogTitle>
                </DialogHeader>
                <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 gap-4 dark:border-slate-700 dark:bg-slate-900/40">
                  <Upload className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                  <div className="text-center">
                    <p className="font-medium text-slate-900 dark:text-slate-100">CSV veya Excel dosyası yükleyin</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Maksimum dosya boyutu: 10MB</p>
                </div>
                <Input 
                  type="file" 
                  accept=".csv,.xlsx,.xls" 
                  className="hidden" 
                  id="file-upload"
                  onChange={handleImportLeads}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Dosya Seç
                </Button>
              </div>
                <div className="text-[12px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 dark:text-slate-400 dark:bg-slate-900/40 dark:border-slate-700">
                <strong>İpucu:</strong> Dosyanızda 'Ad Soyad', 'E-posta' ve 'Telefon' sütunlarının bulunduğundan emin olun.
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-lg h-9">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Yeni Aday Müşteri Ekle</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">İsim / Başlık</Label>
                    <Input 
                      id="name" 
                      value={newLead.name} 
                      onChange={e => setNewLead({...newLead, name: e.target.value})}
                      placeholder="Örn: Ahmet Yılmaz" 
                      className="h-9 rounded-md"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={newLead.email} 
                      onChange={e => setNewLead({...newLead, email: e.target.value})} 
                      placeholder="ornek@mail.com"
                      className="h-9 rounded-md"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input 
                      id="phone" 
                      value={newLead.phone} 
                      onChange={e => setNewLead({...newLead, phone: e.target.value})} 
                      placeholder="05xx xxx xx xx"
                      className="h-9 rounded-md"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company">Firma</Label>
                    <Input 
                      id="company" 
                      value={newLead.company} 
                      onChange={e => setNewLead({...newLead, company: e.target.value})} 
                      placeholder="Firma Adı"
                      className="h-9 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Pipeline</Label>
                    <Select 
                      value={newLead.pipelineId} 
                      onValueChange={val => {
                        const pipe = pipelines.find(p => p.id === val);
                        setNewLead({
                          ...newLead, 
                          pipelineId: val, 
                          stageId: pipe?.stages[0]?.id || ''
                        });
                      }}
                    >
                      <SelectTrigger className="h-9 rounded-md">
                        <SelectValue placeholder="Pipeline Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {pipelines.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Aşama (Stage)</Label>
                    <Select 
                      value={newLead.stageId} 
                      onValueChange={val => setNewLead({...newLead, stageId: val})}
                      disabled={!newLead.pipelineId}
                    >
                      <SelectTrigger className="h-9 rounded-md">
                        <SelectValue placeholder="Aşama Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedPipeline?.stages.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Kaynak</Label>
                    <Select 
                      value={newLead.source} 
                      onValueChange={val => setNewLead({...newLead, source: val})}
                    >
                      <SelectTrigger className="h-9 rounded-md">
                        <SelectValue placeholder="Kaynak Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WEB_FORM">Web Form</SelectItem>
                        <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                        <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                        <SelectItem value="FACEBOOK">Facebook</SelectItem>
                        <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                        <SelectItem value="OTHER">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="value">Tahmini Değer (TL)</Label>
                    <Input 
                      id="value" 
                      type="number" 
                      value={newLead.value} 
                      onChange={e => setNewLead({...newLead, value: Number(e.target.value)})} 
                      className="h-9 rounded-md"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddLeadOpen(false)} className="h-9 rounded-lg">Vazgeç</Button>
                <Button onClick={handleAddLead} className="bg-slate-900 text-white hover:bg-slate-800 h-9 rounded-lg">Lead Oluştur</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Main Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Lead ara (İsim, firma, e-posta...)" 
            className="pl-12 h-12 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-slate-200 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 bg-white gap-2 text-slate-600 font-medium dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
              <Filter className="h-5 w-5" />
              Filtreler
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gelişmiş Filtreleme</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Kaynak</Label>
                <Select 
                  value={filters.source} 
                  onValueChange={val => setFilters({...filters, source: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Hepsi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Hepsi</SelectItem>
                    <SelectItem value="WEB_FORM">Web Form</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                    <SelectItem value="FACEBOOK">Facebook</SelectItem>
                    <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Tarih Aralığı</Label>
                <Select 
                  value={filters.dateRange} 
                  onValueChange={val => setFilters({...filters, dateRange: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm Zamanlar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anytime">Tüm Zamanlar</SelectItem>
                    <SelectItem value="today">Bugün</SelectItem>
                    <SelectItem value="week">Bu Hafta</SelectItem>
                    <SelectItem value="month">Bu Ay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Minimum Değer (TL)</Label>
                <Input 
                  type="number" 
                  placeholder="0 TL" 
                  value={filters.minValue}
                  onChange={e => setFilters({...filters, minValue: Number(e.target.value)})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilters({ source: 'all', dateRange: 'anytime', minValue: 0 });
                  setIsFilterOpen(false);
                }}
                className="h-9 rounded-lg"
              >
                Sıfırla
              </Button>
              <Button onClick={() => setIsFilterOpen(false)} className="bg-slate-900 text-white hover:bg-slate-800 h-9 rounded-lg">Uygula</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <span className="text-sm text-slate-400 mr-2 shrink-0 dark:text-slate-500">Hızlı Filtreler:</span>
        {quickFilters.map((filter) => {
          const isActive = activeFilter === filter;
          
          return (
            <Button
              key={filter}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              className={`rounded-full px-5 h-8 font-bold transition-all ${
                isActive 
                  ? 'bg-slate-900 text-white hover:bg-slate-800 border-transparent dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-50' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </Button>
          );
        })}
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => (
          <div 
            key={lead.id} 
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-400 transition-all group relative cursor-pointer flex flex-col gap-4 dark:bg-slate-900/70 dark:border-slate-800 dark:hover:border-emerald-400/40 dark:shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
            onClick={() => fetchLeadDetails(lead.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-slate-900 text-base leading-tight dark:text-slate-50">
                  {lead.name}
                </h3>
                {lead.company && (
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 dark:text-slate-400">
                    <Building2 className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                    {lead.company}
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-400 hover:text-red-600 h-7 w-7 dark:text-slate-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLead(lead.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

          <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-[12px] dark:text-slate-400">
                <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                <span className="truncate">{lead.email || 'E-posta adresi yok'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-[12px] dark:text-slate-400">
                <Phone className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                <span>{lead.phone || 'Telefon numarası yok'}</span>
              </div>
            </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                <div className="flex items-center gap-2">
                {editingStageLeadId === lead.id ? (
                  <Select
                    value={(lead as any).stageId || (lead as any).stage?.id || ''}
                    onValueChange={(val) => handleChangeLeadStage(lead.id, val)}
                    disabled={updatingStageLeadId === lead.id}
                  >
                    <SelectTrigger
                      className="h-7 rounded-md px-2 py-0 text-[10px] font-bold border-slate-300 bg-slate-50 min-w-[120px] dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SelectValue placeholder="Aşama Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {(pipelines.find(p => p.id === (lead as any).pipelineId)?.stages || []).map((stage: any) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingStageLeadId(lead.id);
                    }}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight border border-slate-200 hover:bg-slate-100 transition bg-slate-50 dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          (() => {
                            const pipeline = pipelines.find(
                              (p) => p.id === (lead as any).pipelineId,
                            );
                            const stage = pipeline?.stages?.find(
                              (s: any) =>
                                s.id ===
                                ((lead as any).stageId ||
                                  (lead as any).stage?.id),
                            );
                            return (
                              stage?.color ||
                              (lead as any).stage?.color ||
                              '#94a3b8'
                            );
                          })(),
                      }}
                    />
                    <span className="text-slate-700">
                      {lead.stage?.name || 'Aşama Yok'}
                    </span>
                  </button>
                )}
                {(lead.value ?? 0) > 0 && (
                  <span className="text-slate-900 text-[10px] font-bold dark:text-slate-100">
                    ₺{(lead.value ?? 0).toLocaleString('tr-TR')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editingAssigneeLeadId === lead.id ? (
                  <Select
                    defaultValue={lead.assigneeId || 'unassigned'}
                    onValueChange={(val) => handleAssignLead(lead.id, val)}
                    disabled={updatingAssigneeLeadId === lead.id}
                  >
                    <SelectTrigger
                      className="h-7 rounded-md px-2 py-0 text-[10px] font-bold border-slate-300 bg-slate-50 min-w-[120px] dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <User className="h-3 w-3 mr-1 text-slate-400 dark:text-slate-500" />
                      <SelectValue placeholder="Kişi Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Atanmamış</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : lead.assignee ? (
                  <div 
                    className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition" 
                    title={`Atanan: ${lead.assignee.name} - Değiştirmek için tıklayın`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAssigneeLeadId(lead.id);
                    }}
                  >
                    <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-[8px] text-white font-bold overflow-hidden border border-white shadow-sm">
                      {lead.assignee.avatar ? (
                        <img src={lead.assignee.avatar} alt={lead.assignee.name} className="w-full h-full object-cover" />
                      ) : (
                        lead.assignee.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAssigneeLeadId(lead.id);
                    }}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight border border-slate-200 hover:bg-slate-100 transition bg-slate-50 text-slate-400 dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <User className="h-3 w-3" />
                    Atanmamış
                  </button>
                )}
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium dark:text-slate-500">
                  <Calendar className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                  {new Date(lead.createdAt).toLocaleDateString('tr-TR')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 dark:bg-slate-900/40 dark:border-slate-800">
          <User className="h-10 w-10 text-slate-300 mb-4 dark:text-slate-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Lead Bulunamadı</h3>
          <p className="text-slate-500 text-sm dark:text-slate-400">Arama kriterlerinize uygun sonuç bulunamadı.</p>
        </div>
      )}

      <LeadDetailModal 
        lead={selectedLead} 
        isOpen={!!selectedLead} 
        onClose={() => setSelectedLead(null)}
        onUpdate={() => {
          fetchLeads();
          if (selectedLead) fetchLeadDetails(selectedLead.id);
        }}
      />
    </div>
  );
}
