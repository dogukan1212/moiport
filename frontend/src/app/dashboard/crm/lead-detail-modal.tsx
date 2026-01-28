'use client';

import { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  User, 
  Calendar,
  Building2,
  Globe,
  Clock,
  Plus,
  ExternalLink,
  Facebook,
  Pencil,
  Trash2,
  MoreVertical,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status: string;
  score?: number;
  value?: number;
  createdAt: string;
  pipelineId?: string;
  stageId?: string;
  stage?: {
    id: string;
    name: string;
  };
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  pipeline?: {
    id: string;
    stages?: {
      id: string;
      name: string;
      color?: string;
    }[];
  };
  activities?: any[];
}

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

function extractAverageNumericValue(value: string): number {
  if (!value) return 0;
  const matches = value.match(/\d[\d\.]*/g);
  if (!matches) return 0;
  const numbers = matches
    .map((m) => parseInt(m.replace(/\./g, ''), 10))
    .filter((n) => !isNaN(n) && isFinite(n));
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, n) => acc + n, 0);
  return Math.round(sum / numbers.length);
}

export function LeadDetailModal({ lead, isOpen, onClose, onUpdate }: LeadDetailModalProps) {
  const [activityNote, setActivityNote] = useState('');
  const [activityType, setActivityType] = useState('NOTE');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderNote, setReminderNote] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    value: 0,
    source: '',
  });

  useEffect(() => {
    if (lead) {
      setEditForm({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        value: lead.value || 0,
        source: lead.source || '',
      });
    }
  }, [lead]);

  const handleUpdateLead = async () => {
    if (!lead) return;
    try {
      await api.patch(`/crm/leads/${lead.id}`, editForm);
      toast.success('Aday bilgileri güncellendi.');
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      toast.error('Güncelleme hatası.');
    }
  };

  const handleDeleteLead = async () => {
    if (!lead) return;
    if (!confirm('Bu adayı silmek istediğinize emin misiniz?')) return;
    
    try {
      await api.delete(`/crm/leads/${lead.id}`);
      toast.success('Aday silindi.');
      onClose();
      onUpdate?.();
    } catch (error) {
      toast.error('Silme hatası.');
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setFetchingUsers(true);
        const response = await api.get('/users/list');
        setUsers(response.data);
      } catch (error) {
        console.error('Kullanıcılar yüklenemedi:', error);
      } finally {
        setFetchingUsers(false);
      }
    };
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const facebookFormActivity = lead?.activities?.find((a: any) => {
    if (a.type !== 'NOTE' || typeof a.content !== 'string') return false;
    return a.content.trim().startsWith('Facebook Form Verileri:');
  });

  let parsedFacebookFields: { label: string; value: string }[] = [];
  if (facebookFormActivity) {
    const body = facebookFormActivity.content
      .replace('Facebook Form Verileri:', '')
      .trim();

    const lines = body.split('\n').map((l: string) => l.trim());
    const pairs: { label: string; value: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.startsWith('Eşleşen Ek Alanlar:')) continue;

      const parts = line.split(':');
      const rawKey = parts[0]?.trim();
      let rawValue = parts.slice(1).join(':').trim();

      if (!rawValue && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (nextLine && !nextLine.includes(':')) {
          rawValue = nextLine.trim();
          i += 1;
        }
      }

      if (!rawKey || !rawValue) continue;

      const key = rawKey.replace(/_/g, ' ').trim();
      const label = key.charAt(0).toUpperCase() + key.slice(1);

      pairs.push({ label, value: rawValue });
    }

    parsedFacebookFields = pairs;
  }

  let facebookBudgetValue = 0;
  if (parsedFacebookFields.length > 0) {
    const budgetField =
      parsedFacebookFields.find((field) => {
        const label = field.label.toLowerCase();
        return label.includes('bütçe') || label.includes('budget');
      }) ||
      parsedFacebookFields.find(
        (field) =>
          field.value.includes('₺') ||
          field.value.toLowerCase().includes('tl'),
      );

    if (budgetField) {
      facebookBudgetValue = extractAverageNumericValue(budgetField.value);
    }
  }

  const estimatedValue =
    lead?.value && lead.value > 0 ? lead.value : facebookBudgetValue;

  const [updatingStage, setUpdatingStage] = useState(false);
  const [updatingAssignee, setUpdatingAssignee] = useState(false);

  const handleChangeStage = async (stageId: string) => {
    if (!lead || !stageId) return;
    try {
      setUpdatingStage(true);
      await api.patch(`/crm/leads/${lead.id}/move`, { stageId });
      toast.success('Aşama güncellendi.');
      onUpdate?.();
    } catch (error) {
      toast.error('Aşama güncellenemedi.');
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleAssignLead = async (assigneeId: string) => {
    if (!lead) return;
    try {
      setUpdatingAssignee(true);
      await api.patch(`/crm/leads/${lead.id}/assignee`, { 
        assigneeId: assigneeId === 'unassigned' ? null : assigneeId 
      });
      toast.success('Atanan kişi güncellendi.');
      onUpdate?.();
    } catch (error) {
      toast.error('Kişi atanamadı.');
    } finally {
      setUpdatingAssignee(false);
    }
  };

  const handleMarkLost = async () => {
    if (!lead) return;

    const stages = (lead.pipeline as any)?.stages as
      | { id: string; name: string; color?: string }[]
      | undefined;

    if (!stages || stages.length === 0) {
      toast.error('Kaybedildi aşaması bulunamadı.');
      return;
    }

    const explicitLostStage = stages.find((s) => {
      const name = s.name.toLowerCase();
      return (
        name.includes('kaybedildi') ||
        name.includes('kayıp') ||
        name.includes('lost')
      );
    });

    const targetStage = explicitLostStage || stages[stages.length - 1];

    await handleChangeStage(targetStage.id);
  };

  const handleConvertToCustomer = async (leadId: string) => {
    try {
      await api.post(`/crm/leads/${leadId}/convert`);
      toast.success('Aday başarıyla müşteriye dönüştürüldü.');
      onClose();
      onUpdate?.();
    } catch (error) {
      toast.error('Dönüştürme hatası.');
    }
  };

  const handleAddActivity = async () => {
    if (!lead || !activityNote) return;
    try {
      await api.post(`/crm/leads/${lead.id}/activities`, {
        type: activityType,
        content: activityNote
      });
      toast.success('Aktivite eklendi.');
      setActivityNote('');
      onUpdate?.();
    } catch (error) {
      toast.error('Aktivite eklenemedi.');
    }
  };

  const handleAddReminder = async () => {
    if (!lead || !reminderDate || !reminderNote) return;
    try {
      const reminderDateTime = new Date(`${reminderDate}T${reminderTime || '09:00'}`);
      await api.post(`/crm/leads/${lead.id}/activities`, {
        type: 'REMINDER',
        content: reminderNote,
        reminderDate: reminderDateTime.toISOString()
      });
      toast.success('Hatırlatma eklendi.');
      setReminderNote('');
      setReminderDate('');
      setReminderTime('');
      onUpdate?.();
    } catch (error) {
      toast.error('Hatırlatma eklenemedi.');
    }
  };

  if (!lead) return null;

  const tabs = [
    { id: 'genel', label: 'Genel' },
    { id: 'notlar', label: 'Notlar' },
    { id: 'hatirlatma', label: 'Hatırlatma' },
    { id: 'ek-alanlar', label: 'Ek Alanlar' },
  ];

  if (parsedFacebookFields.length > 0) {
    tabs.splice(1, 0, { id: 'facebook', label: 'Facebook' });
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[950px] w-[95vw] p-0 overflow-hidden border border-slate-200 shadow-xl rounded-xl bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col h-[85vh] max-h-[850px]">
          {/* Header Section */}
          <div className="p-8 pb-6 bg-white border-b border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Select
                    defaultValue={lead.stageId}
                    onValueChange={handleChangeStage}
                    disabled={updatingStage}
                  >
                    <SelectTrigger className="h-7 min-w-[140px] rounded-full px-3 py-0 bg-slate-900/5 border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-200">
                      <SelectValue placeholder={lead.stage?.name || 'Potansiyel'} />
                    </SelectTrigger>
                    <SelectContent>
                      {(lead.pipeline as any)?.stages?.map((stage: any) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="px-2.5 py-0.5 rounded bg-white text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                    ID: #{lead.id.slice(-4)}
                  </span>
                </div>

                {isEditing ? (
                  <div className="space-y-2 max-w-md">
                    <Input 
                      value={editForm.name} 
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="text-lg font-bold h-10"
                      placeholder="Aday Adı"
                    />
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <Input 
                        value={editForm.company} 
                        onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                        className="h-8 text-sm"
                        placeholder="Firma Adı"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">{lead.name}</DialogTitle>
                    <p className="text-slate-500 text-sm flex items-center gap-2 dark:text-slate-400">
                      <Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      {lead.company || 'Bireysel Müşteri'}
                    </p>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="h-9 w-9 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={handleUpdateLead}
                      className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Kaydet
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      className="rounded-lg h-9 px-4 border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800"
                      onClick={() => window.open(`tel:${lead.phone}`, '_self')}
                    >
                      <Phone className="h-3.5 w-3.5 mr-2 text-slate-600 dark:text-slate-300" />
                      <span className="font-bold text-xs text-slate-700 dark:text-slate-100">Ara</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="rounded-lg h-9 px-4 border-slate-200 bg-white text-slate-900 hover:bg-slate-50 shadow-sm transition-all dark:bg-emerald-500/10 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                      onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/\s+/g, '')}`, '_blank')}
                    >
                      <span className="font-bold text-xs text-slate-700 dark:text-emerald-200">WhatsApp</span>
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 w-9 p-0 rounded-lg">
                          <MoreVertical className="h-4 w-4 text-slate-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleConvertToCustomer(lead.id)}>
                          <User className="h-4 w-4 mr-2" />
                          Müşteriye Dönüştür
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleDeleteLead}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>
          </div>

          <Tabs defaultValue="genel" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 bg-white border-b border-slate-100 dark:bg-slate-900 dark:border-slate-800">
              <TabsList className="h-12 bg-transparent p-0 gap-8">
                {tabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.id}
                    value={tab.id} 
                    className="h-12 rounded-none border-b-2 border-transparent bg-transparent hover:bg-transparent hover:text-slate-900 hover:border-slate-200 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 text-sm font-bold text-slate-400 data-[state=active]:text-slate-900 transition-all shadow-none dark:text-slate-500 dark:hover:text-slate-100 dark:hover:border-slate-700 dark:data-[state=active]:border-emerald-400 dark:data-[state=active]:text-slate-50"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-900">
              <TabsContent value="genel" className="mt-0 outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Left Side: Contact Info */}
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 dark:text-slate-100 dark:border-slate-800">İletişim Bilgileri</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 group">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:text-slate-900 transition-colors dark:bg-slate-900/60 dark:text-slate-400 dark:group-hover:text-slate-50">
                            <Mail className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">E-posta</p>
                            {isEditing ? (
                              <Input 
                                value={editForm.email} 
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="h-8 mt-1"
                              />
                            ) : (
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{lead.email || '—'}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:text-slate-900 transition-colors dark:bg-slate-900/60 dark:text-slate-400 dark:group-hover:text-slate-50">
                            <Phone className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Telefon</p>
                            {isEditing ? (
                              <Input 
                                value={editForm.phone} 
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                className="h-8 mt-1"
                              />
                            ) : (
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{lead.phone || '—'}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:text-slate-900 transition-colors dark:bg-slate-900/60 dark:text-slate-400 dark:group-hover:text-slate-50">
                            <ExternalLink className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Kaynak</p>
                            {isEditing ? (
                              <Select 
                                value={editForm.source} 
                                onValueChange={(val) => setEditForm({ ...editForm, source: val })}
                              >
                                <SelectTrigger className="h-8 mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="WEB_FORM">Web Form</SelectItem>
                                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                                  <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                                  <SelectItem value="PHONE">Telefon</SelectItem>
                                  <SelectItem value="OTHER">Diğer</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{lead.source || '—'}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 dark:text-slate-100 dark:border-slate-800">Aksiyonlar</h4>
                      <div className="flex gap-3">
                        <Button 
                          className="flex-1 bg-slate-900 text-white hover:bg-slate-800 rounded-lg h-9 font-medium shadow-none"
                          onClick={() => handleConvertToCustomer(lead.id)}
                        >
                          Müşteriye Dönüştür
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 rounded-lg h-9 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                          onClick={handleMarkLost}
                        >
                          Kaybedildi
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Additional Details */}
                  <div className="space-y-8">
                    <div className="space-y-4 h-full">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 dark:text-slate-100 dark:border-slate-800">Satış Detayları</h4>
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Tahmini Değer</p>
                          {isEditing ? (
                            <Input 
                              type="number"
                              value={editForm.value} 
                              onChange={(e) => setEditForm({ ...editForm, value: Number(e.target.value) })}
                              className="text-2xl font-light h-12"
                            />
                          ) : (
                            <p className="text-4xl font-light text-slate-900 tracking-tight dark:text-slate-100">
                              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(estimatedValue || 0)}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-2">Atanan Kişi</p>
                            <Select
                              defaultValue={lead.assigneeId || 'unassigned'}
                              onValueChange={handleAssignLead}
                              disabled={updatingAssignee || fetchingUsers}
                            >
                              <SelectTrigger className="h-9 min-w-[180px] rounded-full px-3 py-0 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2 dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-100">
                                <User className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                                <SelectValue
                                  placeholder="Kişi Seçin"
                                />
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
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-2">Lead Skoru</p>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{lead.score || 0}</span>
                              <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden max-w-[100px] dark:bg-slate-800">
                                <div 
                                  className="h-full bg-slate-900 rounded-full dark:bg-emerald-500" 
                                  style={{ width: `${(lead.score || 0) * 10}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-2">Mevcut Aşama</p>
                          <Select
                            defaultValue={lead.stageId}
                            onValueChange={handleChangeStage}
                            disabled={updatingStage}
                          >
                            <SelectTrigger className="h-9 min-w-[180px] rounded-full px-3 py-0 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2 dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-100">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    (lead.stage as any)?.color || '#94a3b8',
                                }}
                              />
                              <SelectValue
                                placeholder={lead.stage?.name || 'Aşama Seçin'}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {(lead.pipeline as any)?.stages?.map(
                                (stage: any) => (
                                  <SelectItem key={stage.id} value={stage.id}>
                                    {stage.name}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </TabsContent>

            <TabsContent value="facebook" className="mt-0 outline-none">
              {parsedFacebookFields.length > 0 ? (
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 dark:text-slate-100 dark:border-slate-800">
                    Facebook Form Detayı
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parsedFacebookFields.map((field) => (
                      <div
                        key={field.label}
                        className="flex flex-col rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60"
                      >
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight mb-1 dark:text-slate-400">
                          {field.label}
                        </span>
                        <span className="text-sm font-medium text-slate-900 break-words dark:text-slate-100">
                          {field.value || '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 bg-slate-50 dark:bg-slate-900/40">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 dark:bg-slate-900/60">
                    <Facebook className="h-6 w-6 text-slate-200 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-400 font-bold text-sm dark:text-slate-400">
                    Bu lead için Facebook form verisi bulunamadı.
                    </p>
                  </div>
                )}
              </TabsContent>

            <TabsContent value="notlar" className="mt-0 outline-none">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[500px] dark:bg-slate-900 dark:border-slate-800">
                <div className="p-4 border-b border-slate-100 bg-slate-50 dark:bg-slate-900/60 dark:border-slate-800">
                  <div className="flex gap-3">
                    <Select value={activityType} onValueChange={setActivityType}>
                      <SelectTrigger className="w-[140px] rounded-lg border-slate-200 bg-white h-9 font-semibold text-xs dark:bg-slate-900 dark:border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NOTE">Not Ekle</SelectItem>
                          <SelectItem value="CALL">Arama Kaydı</SelectItem>
                          <SelectItem value="EMAIL">E-posta</SelectItem>
                          <SelectItem value="MEETING">Toplantı</SelectItem>
                        </SelectContent>
                      </Select>
                    <div className="relative flex-1">
                      <Input 
                        placeholder="Notunuzu buraya yazın..." 
                        className="rounded-lg border-slate-200 h-9 pl-4 pr-12 bg-white text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                          value={activityNote}
                          onChange={e => setActivityNote(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddActivity()}
                        />
                        <Button 
                          onClick={handleAddActivity} 
                          size="icon" 
                          className="absolute right-1 top-0.5 w-8 h-8 bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-all active:scale-90"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-slate-50/50 dark:bg-slate-900/60">
                  {lead.activities && lead.activities.length > 0 ? (
                    <div className="relative space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200 dark:before:bg-slate-700">
                        {lead.activities.map((activity: any) => {
                          const isFacebookFormNote =
                            activity.type === 'NOTE' &&
                            typeof activity.content === 'string' &&
                            activity.content
                              .trim()
                              .startsWith('Facebook Form Verileri:');
                          if (isFacebookFormNote && parsedFacebookFields.length > 0)
                            return null;
                        return (
                          <div key={activity.id} className="relative pl-10 group">
                            <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center z-10 shadow-sm dark:bg-slate-900 dark:border-slate-700">
                              {activity.type === 'NOTE' && <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />}
                              {activity.type === 'CALL' && <Phone className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />}
                              {activity.type === 'EMAIL' && <Mail className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />}
                              {activity.type === 'MEETING' && <Calendar className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />}
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all dark:bg-slate-900 dark:border-slate-700">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest dark:text-slate-400">{activity.type}</span>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                  {new Date(activity.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-sm text-slate-900 leading-relaxed font-medium dark:text-slate-100">{activity.content}</p>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12 bg-slate-50 dark:bg-slate-900/60">
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 dark:bg-slate-900/60">
                        <Plus className="h-6 w-6 text-slate-200 dark:text-slate-600" />
                      </div>
                      <p className="text-slate-400 font-bold text-sm dark:text-slate-400">Henüz bir aktivite kaydedilmemiş.</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

            <TabsContent value="hatirlatma" className="mt-0 outline-none">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[500px] dark:bg-slate-900 dark:border-slate-800">
                <div className="p-4 border-b border-slate-100 bg-slate-50 dark:bg-slate-900/60 dark:border-slate-800">
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <Input 
                          type="date"
                          className="w-[150px] rounded-lg border-slate-200 bg-white h-9 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                          value={reminderDate}
                          onChange={e => setReminderDate(e.target.value)}
                        />
                        <Input 
                          type="time"
                          className="w-[100px] rounded-lg border-slate-200 bg-white h-9 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                          value={reminderTime}
                          onChange={e => setReminderTime(e.target.value)}
                        />
                        <div className="relative flex-1">
                          <Input 
                            placeholder="Hatırlatma notu..." 
                            className="rounded-lg border-slate-200 h-9 pl-4 pr-12 bg-white text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                            value={reminderNote}
                            onChange={e => setReminderNote(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddReminder()}
                          />
                          <Button 
                            onClick={handleAddReminder} 
                            size="icon" 
                            className="absolute right-1 top-0.5 w-8 h-8 bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-all active:scale-90"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-slate-50/50 dark:bg-slate-900/60">
                    {(() => {
                      console.log('Lead activities debug:', {
                        hasActivities: !!lead.activities,
                        activitiesCount: lead.activities?.length,
                        activities: lead.activities,
                        reminderActivities: lead.activities?.filter((a: any) => a.type === 'REMINDER'),
                        reminderActivitiesCount: lead.activities?.filter((a: any) => a.type === 'REMINDER').length
                      });
                      return lead.activities && lead.activities.filter((a: any) => a.type === 'REMINDER').length > 0;
                    })() ? (
                      <div className="relative space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200 dark:before:bg-slate-700">
                        {lead.activities?.filter((a: any) => a.type === 'REMINDER').map((activity: any) => (
                          <div key={activity.id} className="relative pl-10 group">
                            <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center z-10 shadow-sm dark:bg-slate-900 dark:border-slate-700">
                              <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all dark:bg-slate-900 dark:border-slate-700">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest dark:text-slate-400">
                                  {activity.reminderDate ? new Date(activity.reminderDate).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Tarih Yok'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                  {activity.isReminderSent ? 'Bildirim Gönderildi' : 'Bekliyor'}
                                </span>
                              </div>
                              <p className="text-sm text-slate-900 leading-relaxed font-medium dark:text-slate-100">{activity.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-12 bg-slate-50 dark:bg-slate-900/60">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 dark:bg-slate-900/60">
                          <Calendar className="h-6 w-6 text-slate-200 dark:text-slate-600" />
                        </div>
                        <p className="text-slate-400 font-bold text-sm dark:text-slate-400">Henüz bir hatırlatma oluşturulmamış.</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

            <TabsContent value="ek-alanlar" className="mt-0 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 dark:text-slate-400">Oluşturulma Tarihi</p>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-100">
                        {lead ? new Date(lead.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                  </div>
                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 dark:text-slate-400">Son İşlem</p>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-100">Az önce</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="p-6 bg-white border-t border-slate-100 flex justify-end dark:bg-slate-900 dark:border-slate-800">
            <Button 
              variant="ghost" 
              onClick={() => onClose()}
              className="rounded-lg h-10 px-8 font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
              Kapat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
