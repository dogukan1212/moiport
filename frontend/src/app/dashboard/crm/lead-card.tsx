'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Building2, Mail, Phone, MoreVertical, User as UserIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

interface LeadCardProps {
  lead: Lead;
  onClick?: (lead: Lead) => void;
  onAssign?: (leadId: string, assigneeId: string) => void;
  users?: User[];
}

export function LeadCard({ lead, onClick, onAssign, users = [] }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: 'Lead',
      lead,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formattedDate = new Date(lead.createdAt).toLocaleDateString('tr-TR');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(lead)}
      className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-400 transition-all cursor-pointer group flex flex-col gap-3 shadow-sm dark:bg-slate-900/70 dark:border-slate-800 dark:hover:border-emerald-400/40 dark:shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
    >
      <div className="flex flex-col gap-1">
        <h4 className="font-bold text-slate-900 dark:text-slate-50">
          {lead.name}
        </h4>
        {lead.email && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{lead.email}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-tight border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            Yeni
          </span>
          {onAssign && users.length > 0 ? (
            <div 
              onClick={(e) => e.stopPropagation()} 
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Select
                defaultValue={lead.assigneeId || 'unassigned'}
                onValueChange={(val) => onAssign(lead.id, val)}
              >
                <SelectTrigger className="h-7 w-auto min-w-[32px] border border-slate-200 bg-slate-50/50 px-2 hover:bg-slate-100 rounded-full focus:ring-0 shadow-none transition-all gap-2 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-900">
                  {lead.assignee ? (
                    <div className="flex items-center gap-1.5 max-w-[120px]">
                      <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-[8px] text-white font-bold overflow-hidden border border-white shadow-sm shrink-0">
                        {lead.assignee.avatar ? (
                          <img src={lead.assignee.avatar} alt={lead.assignee.name} className="w-full h-full object-cover" />
                        ) : (
                          lead.assignee.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">{lead.assignee.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-200 border-dashed shrink-0 dark:bg-transparent dark:border-slate-700">
                        <UserIcon className="h-3 w-3" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight dark:text-slate-400">Atama Yap</span>
                    </div>
                  )}
                </SelectTrigger>
                <SelectContent onClick={(e) => e.stopPropagation()}>
                  <SelectItem value="unassigned" className="text-xs font-medium">Atanmamış</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id} className="text-xs font-medium">
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : lead.assignee ? (
            <div className="flex items-center gap-1.5" title={`Atanan: ${lead.assignee.name}`}>
              <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-[8px] text-white font-bold overflow-hidden border border-white shadow-sm">
                {lead.assignee.avatar ? (
                  <img src={lead.assignee.avatar} alt={lead.assignee.name} className="w-full h-full object-cover" />
                ) : (
                  lead.assignee.name.charAt(0).toUpperCase()
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-200 border-dashed shrink-0 dark:bg-transparent dark:border-slate-700">
                <UserIcon className="h-3 w-3" />
              </div>
            </div>
          )}
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          {formattedDate}
        </span>
      </div>
    </div>
  );
}
