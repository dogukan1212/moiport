'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  Plus, 
  Settings2, 
  Trash2, 
  GripVertical, 
  Save,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';

interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
}

interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPipelineId, setEditingPipelineId] = useState<string | null>(null);
  const [newPipelineName, setNewPipelineName] = useState('');

  useEffect(() => {
    fetchPipelines();
  }, []);

  const fetchPipelines = async () => {
    try {
      const response = await api.get('/crm/pipelines');
      setPipelines(response.data);
    } catch (error) {
      toast.error('Pipeline listesi alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePipeline = async () => {
    if (!newPipelineName) return;
    try {
      await api.post('/crm/pipelines', { name: newPipelineName });
      toast.success('Pipeline oluşturuldu.');
      setNewPipelineName('');
      fetchPipelines();
    } catch (error) {
      toast.error('Pipeline oluşturulamadı.');
    }
  };

  const handleDeletePipeline = async (id: string) => {
    if (!confirm('Bu pipeline ve içindeki tüm aşamalar silinecek. Emin misiniz?')) return;
    try {
      await api.delete(`/crm/pipelines/${id}`);
      toast.success('Pipeline silindi.');
      fetchPipelines();
    } catch (error) {
      toast.error('Pipeline silinemedi.');
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
      <div className="flex items-center gap-4">
        <Link href="/dashboard/crm">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Pipeline Yönetimi</h1>
          <p className="text-slate-500 text-sm dark:text-slate-400">Satış süreçlerinizi ve aşamalarınızı özelleştirin.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-lg font-bold mb-4 dark:text-slate-100">Yeni Pipeline Oluştur</h2>
          <div className="flex gap-3">
            <Input 
              placeholder="Pipeline adı (örn: Yurtdışı Satışlar)" 
              value={newPipelineName}
              onChange={(e) => setNewPipelineName(e.target.value)}
            />
            <Button onClick={handleCreatePipeline} className="bg-slate-900 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Oluştur
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold dark:text-slate-100">Mevcut Pipeline'lar</h2>
          {pipelines.map((pipeline) => (
            <div key={pipeline.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/60 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Settings2 className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  <span className="font-bold text-slate-900 dark:text-slate-100">{pipeline.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeletePipeline(pipeline.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {pipeline.stages.map((stage) => (
                    <div 
                      key={stage.id} 
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-300"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      {stage.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
