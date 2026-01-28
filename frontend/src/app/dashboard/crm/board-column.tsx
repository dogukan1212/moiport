'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { LeadCard } from './lead-card';
import { Button } from '@/components/ui/button';

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
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  assigneeId?: string;
}

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
  leads: Lead[];
}

interface BoardColumnProps {
  stage: Stage;
  onLeadClick?: (lead: Lead) => void;
  onEditStage?: (stage: Stage) => void;
  onDeleteStage?: (stageId: string) => void;
  onAssign?: (leadId: string, assigneeId: string) => void;
  users?: User[];
}

export function BoardColumn({ 
  stage, 
  onLeadClick, 
  onEditStage, 
  onDeleteStage,
  onAssign,
  users = []
}: BoardColumnProps) {
  const { setNodeRef } = useDroppable({
    id: stage.id,
    data: {
      type: 'Stage',
      stage,
    },
  });

  const leadIds = stage.leads?.map(l => l.id) || [];

  return (
    <div className="flex-shrink-0 w-[85vw] md:w-80 flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 dark:text-slate-50 text-sm">
            {stage.name}
          </h3>
          <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            {stage.leads?.length || 0}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-100"
            onClick={() => onEditStage?.(stage)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-slate-400 hover:text-red-600 dark:text-slate-500"
            onClick={() => onDeleteStage?.(stage.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div 
        ref={setNodeRef}
        className="flex-1 bg-slate-50/50 rounded-xl p-2.5 flex flex-col gap-2.5 border border-slate-200/60 min-h-[600px] dark:bg-slate-900/40 dark:border-slate-800"
      >
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {stage.leads?.map((lead) => (
            <LeadCard 
              key={lead.id} 
              lead={lead} 
              onClick={onLeadClick} 
              onAssign={onAssign}
              users={users}
            />
          ))}
        </SortableContext>
        
        {(!stage.leads || stage.leads.length === 0) && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-500 text-sm py-10">
            <p>Bu stage'de henüz lead yok</p>
          </div>
        )}
      </div>
    </div>
  );
}
