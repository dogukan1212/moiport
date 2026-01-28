import React from 'react';
import { Task, Column } from '../types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, CheckSquare, Clock, Users } from 'lucide-react';

interface TableViewProps {
  tasks: Task[];
  columns: Column[];
  onTaskClick: (task: Task) => void;
}

export function TableView({ tasks, columns, onTaskClick }: TableViewProps) {
  const getStatusTitle = (statusId: string) => {
    return columns.find((c) => c.id === statusId)?.title || statusId;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-slate-100 text-slate-700',
      MEDIUM: 'bg-blue-100 text-blue-700',
      HIGH: 'bg-orange-100 text-orange-700',
      URGENT: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      LOW: 'Düşük',
      MEDIUM: 'Orta',
      HIGH: 'Yüksek',
      URGENT: 'Acil',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority] || colors.MEDIUM}`}>
        {labels[priority] || priority}
      </span>
    );
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
            <tr>
              <th className="px-4 py-3">Görev</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Öncelik</th>
              <th className="px-4 py-3">Bitiş Tarihi</th>
              <th className="px-4 py-3">Üyeler</th>
              <th className="px-4 py-3 text-right">İlerleme</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {tasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="hover:bg-muted cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {task.coverColor && (
                      <div className="w-2 h-8 rounded-sm" style={{ backgroundColor: task.coverColor }} />
                    )}
                    {task.title}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="px-2 py-1 bg-muted rounded text-xs text-foreground">
                    {getStatusTitle(task.status)}
                  </span>
                </td>
                <td className="px-4 py-3">{getPriorityBadge(task.priority)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {task.dueDate ? (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {format(new Date(task.dueDate), 'd MMM yyyy', { locale: tr })}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex -space-x-2">
                    {task.members && task.members.length > 0 ? (
                      task.members.map((m: any, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[10px]"
                          title={m}
                        >
                          <Users className="w-3 h-3 text-slate-500" />
                        </div>
                      ))
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  {task.checklistTotal ? (
                    <div className="flex items-center justify-end gap-1.5 text-muted-foreground">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>
                        {task.checklistCompleted}/{task.checklistTotal}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Görev bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
