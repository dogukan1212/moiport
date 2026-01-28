'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import api, { SOCKET_URL } from '@/lib/api';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  Target, 
  Loader2,
  Building2,
  Phone,
  Mail,
  Calendar,
  Clock,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { BoardColumn } from './board-column';
import { LeadCard } from './lead-card';
import { LeadDetailModal } from './lead-detail-modal';
import { io, Socket } from "socket.io-client";

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status: string;
  score: number;
  value: number;
  createdAt: string;
  pipelineId?: string;
  stageId?: string;
  activities?: any[];
}

interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
  leads: Lead[];
}

interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

export default function CrmPage() {
  const searchParams = useSearchParams();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('ALL');

  // Stage Management States
  const [isEditStageOpen, setIsEditStageOpen] = useState(false);
  const [isDeleteStageOpen, setIsDeleteStageOpen] = useState(false);
  const [isAddStageOpen, setIsAddStageOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [editingStage, setEditingStage] = useState({ name: '', color: '#3b82f6' });
  const [newStage, setNewStage] = useState({ name: '', color: '#3b82f6' });
  
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchPipelines();
    fetchUsers();

    // Socket connection
    const token = localStorage.getItem("token");
    if (!token) return;

    const s = io('/crm', {
      auth: { token },
      transports: ["websocket", "polling"],
      path: '/api/socket.io',
    });

    s.on("connect", () => {
      console.log("CRM socket connected (Pipeline)");
    });

    // Helper to update pipeline state
    const updatePipelineWithLead = (updatedLead: any, action: 'create' | 'update' | 'move' | 'delete') => {
      setPipelines((prevPipelines) => {
        return prevPipelines.map((pipeline) => {
          // If action is create or move, we might need to add to a stage
          // If update, find and update
          // If delete, remove
          
          if (pipeline.id !== updatedLead.pipelineId && action !== 'delete') return pipeline;

          return {
            ...pipeline,
            stages: pipeline.stages.map((stage) => {
              // Delete or Move (Remove from old stage)
              if (action === 'delete' || (action === 'move' && stage.id !== updatedLead.stageId)) {
                return {
                  ...stage,
                  leads: stage.leads.filter((l) => l.id !== updatedLead.id),
                };
              }

              // Create or Move (Add to new stage)
              if ((action === 'create' || action === 'move') && stage.id === updatedLead.stageId) {
                // Check if already exists to avoid duplicates
                if (stage.leads.some(l => l.id === updatedLead.id)) {
                   return {
                    ...stage,
                    leads: stage.leads.map(l => l.id === updatedLead.id ? updatedLead : l)
                   }
                }
                return {
                  ...stage,
                  leads: [updatedLead, ...stage.leads],
                };
              }

              // Update (Update in place)
              if (action === 'update') {
                return {
                  ...stage,
                  leads: stage.leads.map((l) => (l.id === updatedLead.id ? { ...l, ...updatedLead } : l)),
                };
              }

              return stage;
            }),
          };
        });
      });
    };

    s.on("lead:created", (lead: any) => {
      updatePipelineWithLead(lead, 'create');
      toast.success("Yeni aday eklendi", { description: lead.name });
    });

    s.on("lead:updated", (lead: any) => {
      updatePipelineWithLead(lead, 'update');
      setSelectedLead((prev) => (prev && prev.id === lead.id ? { ...prev, ...lead } : prev));
    });

    s.on("lead:moved", (lead: any) => {
        // lead:moved sends the updated lead with new stageId
        // We need to remove from old stage and add to new stage
        setPipelines(prev => prev.map(p => ({
            ...p,
            stages: p.stages.map(s => {
                // Remove if present
                let newLeads = s.leads.filter(l => l.id !== lead.id);
                // Add if target stage
                if (s.id === lead.stageId) {
                    newLeads = [lead, ...newLeads];
                }
                return { ...s, leads: newLeads };
            })
        })));

        setSelectedLead((prev) => (prev && prev.id === lead.id ? { ...prev, ...lead } : prev));
    });

    s.on("lead:deleted", (data: { id: string }) => {
        setPipelines(prev => prev.map(p => ({
            ...p,
            stages: p.stages.map(s => ({
                ...s,
                leads: s.leads.filter(l => l.id !== data.id)
            }))
        })));
        
        setSelectedLead((prev) => (prev && prev.id === data.id ? null : prev));
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Handle leadId parameter from URL to auto-open lead detail modal
  useEffect(() => {
    const leadId = searchParams.get('leadId');
    if (leadId && pipelines.length > 0) {
      // Always fetch full details to ensure activities and other related data are loaded
      fetchLeadDetails(leadId);
    }
  }, [searchParams, pipelines.length > 0]); // Only re-run when pipelines are loaded or leadId changes

  const fetchPipelines = async () => {
    try {
      const response = await api.get('/crm/pipelines');
      setPipelines(response.data);
      
      // If no pipeline is selected, or the currently selected one is not in the list, pick the first one
      if (response.data.length > 0) {
        if (!selectedPipelineId || !response.data.find((p: any) => p.id === selectedPipelineId)) {
          setSelectedPipelineId(response.data[0].id);
        }
      }
      
      if (selectedLead) {
        fetchLeadDetails(selectedLead.id);
      }
    } catch (error) {
      console.error('Pipelines fetch error:', error);
      toast.error('Pipeline listesi alınamadı.');
    } finally {
      setLoading(false);
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

  const handleAssignLead = async (leadId: string, assigneeId: string) => {
    try {
      const selectedUser = users.find(u => u.id === assigneeId);
      
      await api.patch(`/crm/leads/${leadId}/assignee`, { 
        assigneeId: assigneeId === 'unassigned' ? null : assigneeId 
      });
      toast.success('Atanan kişi güncellendi.');
      
      // Update local state to reflect changes immediately
      setPipelines(prev => prev.map(p => ({
        ...p,
        stages: p.stages.map(s => ({
          ...s,
          leads: s.leads.map(l => l.id === leadId ? { 
            ...l, 
            assigneeId: assigneeId === 'unassigned' ? null : assigneeId,
            assignee: selectedUser || undefined
          } : l)
        }))
      })));
    } catch (error) {
      toast.error('Kişi atanamadı.');
    }
  };

  const fetchLeadDetails = async (leadId: string) => {
    try {
      const response = await api.get(`/crm/leads/${leadId}`);
      console.log('Lead details response:', response.data);
      console.log('Lead activities:', response.data.activities);
      setSelectedLead(response.data);
    } catch (error) {
      console.error('Lead details error:', error);
    }
  };

  const currentPipeline = useMemo(() => 
    pipelines.find(p => p.id === selectedPipelineId),
    [pipelines, selectedPipelineId]
  );

  const filteredPipeline = useMemo(() => {
    if (!currentPipeline) return null;

    const lowerSearch = searchTerm.toLowerCase();
    
    return {
      ...currentPipeline,
      stages: currentPipeline.stages.map(stage => ({
        ...stage,
        leads: (stage.leads || []).filter(lead => {
          const matchesSearch = 
            lead.name.toLowerCase().includes(lowerSearch) ||
            lead.email?.toLowerCase().includes(lowerSearch) ||
            lead.company?.toLowerCase().includes(lowerSearch);
          
          const matchesSource = filterSource === 'ALL' || lead.source === filterSource;
          
          return matchesSearch && matchesSource;
        })
      }))
    };
  }, [currentPipeline, searchTerm, filterSource]);

  const handleAddStage = async () => {
    if (!newStage.name || !selectedPipelineId) return;
    try {
      await api.post('/crm/stages', {
        pipelineId: selectedPipelineId,
        name: newStage.name,
        color: newStage.color
      });
      toast.success('Yeni aşama eklendi.');
      setIsAddStageOpen(false);
      setNewStage({ name: '', color: '#3b82f6' });
      fetchPipelines();
    } catch (error) {
      toast.error('Aşama eklenemedi.');
    }
  };

  const handleEditStage = async () => {
    if (!selectedStage || !editingStage.name) return;
    try {
      await api.patch(`/crm/stages/${selectedStage.id}`, {
        name: editingStage.name,
        color: editingStage.color
      });
      toast.success('Aşama güncellendi.');
      setIsEditStageOpen(false);
      fetchPipelines();
    } catch (error) {
      toast.error('Aşama güncellenemedi.');
    }
  };

  const handleDeleteStage = async () => {
    if (!selectedStage) return;
    try {
      await api.delete(`/crm/stages/${selectedStage.id}`);
      toast.success('Aşama silindi.');
      setIsDeleteStageOpen(false);
      fetchPipelines();
    } catch (error) {
      toast.error('Aşama silinemedi.');
    }
  };

  const handleAddLead = async () => {
    if (!newLead.name || !selectedPipelineId) return;
    
    try {
      const firstStageId = currentPipeline?.stages[0]?.id;
      await api.post('/crm/leads', {
        ...newLead,
        pipelineId: selectedPipelineId,
        stageId: newLead.stageId || firstStageId,
        value: Number(newLead.value)
      });
      toast.success('Yeni aday başarıyla eklendi.');
      setIsAddLeadOpen(false);
      setNewLead({
        name: '', email: '', phone: '', company: '', 
        source: 'WEB_FORM', value: 0, pipelineId: '', stageId: ''
      });
      fetchPipelines();
    } catch (error) {
      toast.error('Aday eklenirken bir hata oluştu.');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const leadId = active.id as string;
    
    const lead = currentPipeline?.stages
      .flatMap(s => s.leads || [])
      .find(l => l.id === leadId);
      
    if (lead) setActiveLead(lead);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveALead = active.data.current?.type === 'Lead';
    const isOverAStage = over.data.current?.type === 'Stage';

    if (!isActiveALead) return;

    // Lead'i başka bir stage'e sürükleme
    if (isActiveALead && isOverAStage) {
      setPipelines((prev) => {
        const newPipelines = [...prev];
        const pipelineIndex = newPipelines.findIndex(p => p.id === selectedPipelineId);
        const pipeline = newPipelines[pipelineIndex];
        
        const activeLead = pipeline.stages
          .flatMap(s => s.leads || [])
          .find(l => l.id === activeId);
          
        if (!activeLead) return prev;

        const sourceStage = pipeline.stages.find(s => (s.leads || []).some(l => l.id === activeId));
        const destStage = pipeline.stages.find(s => s.id === overId);

        if (sourceStage && destStage && sourceStage.id !== destStage.id) {
          sourceStage.leads = (sourceStage.leads || []).filter(l => l.id !== activeId);
          activeLead.stageId = destStage.id;
          if (!destStage.leads) destStage.leads = [];
          destStage.leads.push(activeLead);
        }
        
        return newPipelines;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;
    
    // Find destination stage
    let destStageId = overId;
    if (over.data.current?.type === 'Lead') {
      destStageId = over.data.current.lead.stageId;
    }

    const lead = currentPipeline?.stages
      .flatMap(s => s.leads || [])
      .find(l => l.id === leadId);

    if (lead && lead.stageId !== destStageId) {
      try {
        await api.patch(`/crm/leads/${leadId}/move`, { stageId: destStageId });
        toast.success('Aday taşındı.');
      } catch (error) {
        toast.error('Taşıma işlemi sırasında hata oluştu.');
        fetchPipelines(); // Geri al
      }
    }
  };

  const handleConvertToCustomer = async (leadId: string) => {
    try {
      await api.post(`/crm/leads/${leadId}/convert`);
      toast.success('Aday başarıyla müşteriye dönüştürüldü.');
      setSelectedLead(null);
      fetchPipelines();
    } catch (error) {
      toast.error('Dönüştürme hatası.');
    }
  };

 

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">CRM & Satış Yönetimi</h1>
          <p className="text-slate-500 text-sm dark:text-slate-400">Aday müşterileri ve satış süreçlerini yönetin.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
              <SelectTrigger className="w-[200px] bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                <SelectValue placeholder="Pipeline Seçin" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Link href="/dashboard/crm/pipelines">
              <Button variant="outline" size="icon" className="shrink-0 border-slate-200 dark:border-slate-700 dark:bg-slate-900" title="Pipeline Yönetimi">
                <Settings2 className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 text-white hover:bg-slate-800">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Aday
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Aday Müşteri Ekle</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">İsim / Başlık</Label>
                  <Input 
                    id="name" 
                    value={newLead.name} 
                    onChange={e => setNewLead({...newLead, name: e.target.value})}
                    placeholder="Örn: Ahmet Yılmaz veya ABC Projesi" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input id="email" type="email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input id="phone" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Firma</Label>
                  <Input id="company" value={newLead.company} onChange={e => setNewLead({...newLead, company: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value">Tahmini Değer (TL)</Label>
                  <Input id="value" type="number" value={newLead.value} onChange={e => setNewLead({...newLead, value: Number(e.target.value)})} />
                </div>
              </div>
              <Button onClick={handleAddLead} className="w-full bg-slate-900 text-white">Kaydet</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Aday ara (isim, firma, e-posta...)" 
            className="pl-10 bg-white border-slate-200 rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto scrollbar-hide">
          <Button 
            variant={filterSource === 'ALL' ? 'default' : 'outline'} 
            size="sm" 
            className="rounded-full h-9 px-4 dark:bg-slate-900 dark:border-slate-700"
            onClick={() => setFilterSource('ALL')}
          >
            Hepsi
          </Button>
          <Button 
            variant={filterSource === 'WEB_FORM' ? 'default' : 'outline'} 
            size="sm" 
            className="rounded-full h-9 px-4 dark:bg-slate-900 dark:border-slate-700"
            onClick={() => setFilterSource('WEB_FORM')}
          >
            Web Form
          </Button>
          <Button 
            variant={filterSource === 'WHATSAPP' ? 'default' : 'outline'} 
            size="sm" 
            className="rounded-full h-9 px-4 dark:bg-slate-900 dark:border-slate-700"
            onClick={() => setFilterSource('WHATSAPP')}
          >
            WhatsApp
          </Button>
          <Button 
            variant={filterSource === 'INSTAGRAM' ? 'default' : 'outline'} 
            size="sm" 
            className="rounded-full h-9 px-4 dark:bg-slate-900 dark:border-slate-700"
            onClick={() => setFilterSource('INSTAGRAM')}
          >
            Instagram
          </Button>
        </div>
      </div>

      {pipelines.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[400px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 dark:bg-slate-900/40 dark:border-slate-800">
          <Target className="h-12 w-12 text-slate-300 mb-4 dark:text-slate-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Henüz Pipeline Oluşturulmamış</h3>
          <p className="text-slate-500 mb-6 dark:text-slate-400">Satış süreçlerinizi yönetmek için ilk pipeline'ınızı oluşturun.</p>
          <Link href="/dashboard/crm/pipelines">
            <Button className="bg-slate-900 text-white">
              <Settings2 className="h-4 w-4 mr-2" />
              Pipeline Yönetimine Git
            </Button>
          </Link>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 min-h-[calc(100vh-250px)] scrollbar-hide snap-x snap-mandatory px-4 md:px-0 -mx-4 md:mx-0">
            {filteredPipeline?.stages.map((stage) => (
              <div key={stage.id} className="snap-center first:pl-4 last:pr-4 md:first:pl-0 md:last:pr-0">
                <BoardColumn 
                  stage={stage} 
                  onLeadClick={(lead) => fetchLeadDetails(lead.id)}
                  onEditStage={(s) => {
                    setSelectedStage(s);
                    setEditingStage({ name: s.name, color: s.color });
                    setIsEditStageOpen(true);
                  }}
                  onDeleteStage={(id) => {
                    const s = currentPipeline?.stages.find(st => st.id === id);
                    if (s) {
                      setSelectedStage(s);
                      setIsDeleteStageOpen(true);
                    }
                  }}
                  onAssign={handleAssignLead}
                  users={users}
                />
              </div>
            ))}
            
            {/* Add New Stage Column */}
            <div className="flex-shrink-0 w-[85vw] md:w-80 snap-center pr-4 md:pr-0">
              <Button 
                variant="outline" 
                className="w-full h-[100px] border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-slate-300 text-slate-400 rounded-2xl flex flex-col gap-2 dark:bg-slate-900/40 dark:border-slate-800 dark:hover:bg-slate-900/60 dark:hover:border-slate-700 dark:text-slate-500"
                onClick={() => setIsAddStageOpen(true)}
              >
                <Plus className="h-6 w-6" />
                <span className="font-bold">Yeni Stage Ekle</span>
              </Button>
            </div>
          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.5',
                },
              },
            }),
          }}>
            {activeLead ? <LeadCard lead={activeLead} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Edit Stage Dialog */}
      <Dialog open={isEditStageOpen} onOpenChange={setIsEditStageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stage Düzenle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Stage İsmi</Label>
              <Input 
                value={editingStage.name} 
                onChange={e => setEditingStage({...editingStage, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Renk</Label>
              <div className="flex gap-2">
                {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'].map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${editingStage.color === color ? 'border-slate-900' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditingStage({...editingStage, color})}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditStageOpen(false)}>Vazgeç</Button>
            <Button className="bg-slate-900 text-white" onClick={handleEditStage}>Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Stage Dialog */}
      <Dialog open={isAddStageOpen} onOpenChange={setIsAddStageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Stage Ekle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Stage İsmi</Label>
              <Input 
                placeholder="Örn: Teklif Bekleyenler"
                value={newStage.name} 
                onChange={e => setNewStage({...newStage, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Renk</Label>
              <div className="flex gap-2">
                {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'].map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${newStage.color === color ? 'border-slate-900' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewStage({...newStage, color})}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStageOpen(false)}>Vazgeç</Button>
            <Button className="bg-slate-900 text-white" onClick={handleAddStage}>Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Stage Dialog */}
      <Dialog open={isDeleteStageOpen} onOpenChange={setIsDeleteStageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Stage'i Sil?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-500">
              <span className="font-bold text-slate-900 dark:text-slate-50">{selectedStage?.name}</span> isimli stage'i silmek istediğinize emin misiniz? 
              Bu stage içindeki tüm adaylar da silinecektir.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteStageOpen(false)}>Vazgeç</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleDeleteStage}>Evet, Sil</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Modal */}
      <LeadDetailModal 
        lead={selectedLead} 
        isOpen={!!selectedLead} 
        onClose={() => setSelectedLead(null)}
        onUpdate={() => {
          fetchPipelines();
          if (selectedLead) fetchLeadDetails(selectedLead.id);
        }}
      />
    </div>
  );
}
