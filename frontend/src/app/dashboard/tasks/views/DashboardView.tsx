import React from 'react';
import { Task, Column } from '../types';
import { PieChart, CheckCircle2, AlertCircle, Clock, BarChart3 } from 'lucide-react';

interface DashboardViewProps {
  tasks: Task[];
  columns: Column[];
}

export function DashboardView({ tasks, columns }: DashboardViewProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => {
    // Assuming the last column is "Done" or checking status logic. 
    // For now, let's assume if it's in a column named "Tamamlandı" or similar.
    // Or we can just rely on columns.
    const col = columns.find(c => c.id === t.status);
    return col?.title.toLowerCase().includes('tamam') || col?.title.toLowerCase().includes('done');
  }).length;

  const urgentTasks = tasks.filter(t => t.priority === 'URGENT').length;
  const highTasks = tasks.filter(t => t.priority === 'HIGH').length;
  
  const tasksByStatus = columns.map(col => ({
    name: col.title,
    count: tasks.filter(t => t.status === col.id).length,
    id: col.id
  })).filter(c => c.count > 0);

  const tasksByAssignee = tasks.reduce((acc, task) => {
    const name = task.assignee?.name || (task.members && task.members.length > 0 ? 'Atanmış' : 'Atanmamış');
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    // Simple check, assumes task is not done if not in "Tamamlandı" column logic above.
    // But let's just check date < now.
    return new Date(t.dueDate) < new Date() && !columns.find(c => c.id === t.status)?.title.toLowerCase().includes('tamam');
  }).length;

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-primary" />
        Gösterge Panosu
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted-foreground text-sm font-medium">Toplam Görev</h3>
            <div className="p-2 bg-accent rounded-lg">
              <PieChart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">{totalTasks}</div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted-foreground text-sm font-medium">Tamamlanan</h3>
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">{completedTasks}</div>
          <div className="mt-1 text-xs text-green-600 font-medium">
            {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% Başarı
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted-foreground text-sm font-medium">Gecikmiş</h3>
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">{overdueTasks}</div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted-foreground text-sm font-medium">Acil & Yüksek</h3>
            <div className="p-2 bg-orange-50 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">{urgentTasks + highTasks}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Duruma Göre Görevler</h3>
          <div className="space-y-4">
            {tasksByStatus.map((item) => (
              <div key={item.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium text-foreground">{item.count}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${(item.count / totalTasks) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Öncelik Dağılımı</h3>
          <div className="flex items-center justify-center h-64">
             <div className="flex gap-4 items-end h-40 w-full px-8 justify-around">
                <div className="w-16 bg-muted rounded-t-lg relative group flex flex-col justify-end" style={{ height: `${(tasks.filter(t=>t.priority==='LOW').length / totalTasks) * 100}%` }}>
                  <div className="text-center text-xs text-muted-foreground mt-2 absolute -bottom-6 w-full">Düşük</div>
                </div>
                <div className="w-16 bg-blue-200 rounded-t-lg relative flex flex-col justify-end" style={{ height: `${(tasks.filter(t=>t.priority==='MEDIUM').length / totalTasks) * 100}%` }}>
                  <div className="text-center text-xs text-muted-foreground mt-2 absolute -bottom-6 w-full">Orta</div>
                </div>
                <div className="w-16 bg-orange-200 rounded-t-lg relative flex flex-col justify-end" style={{ height: `${(tasks.filter(t=>t.priority==='HIGH').length / totalTasks) * 100}%` }}>
                   <div className="text-center text-xs text-muted-foreground mt-2 absolute -bottom-6 w-full">Yüksek</div>
                </div>
                <div className="w-16 bg-red-200 rounded-t-lg relative flex flex-col justify-end" style={{ height: `${(tasks.filter(t=>t.priority==='URGENT').length / totalTasks) * 100}%` }}>
                   <div className="text-center text-xs text-muted-foreground mt-2 absolute -bottom-6 w-full">Acil</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
