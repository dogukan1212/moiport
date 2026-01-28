import React, { useState } from 'react';
import { Task, Column } from '../types';
import { 
  format, 
  addDays, 
  startOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isToday 
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TimelineViewProps {
  tasks: Task[];
  columns: Column[];
  onTaskClick: (task: Task) => void;
}

export function TimelineView({ tasks, columns, onTaskClick }: TimelineViewProps) {
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const daysToShow = 14; // Show 2 weeks
  
  const days = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, daysToShow - 1)
  });

  const handlePrev = () => setStartDate(addDays(startDate, -7));
  const handleNext = () => setStartDate(addDays(startDate, 7));

  // Group tasks by assignee or status? Let's group by Status for now as "Lanes"
  const lanes = columns.filter(c => !c.archived);

  return (
    <div className="bg-card rounded-lg border border-border flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Zaman Çizelgesi</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            {format(startDate, 'd MMM', { locale: tr })} - {format(addDays(startDate, daysToShow - 1), 'd MMM', { locale: tr })}
          </span>
          <button
            onClick={handleNext}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="min-w-[1000px]">
          {/* Header Days */}
          <div className="flex border-b border-border bg-muted sticky top-0 z-10">
            <div className="w-48 flex-shrink-0 p-3 font-medium text-muted-foreground text-sm border-r border-border bg-card sticky left-0 z-20">
              Liste
            </div>
            {days.map(day => (
              <div 
                key={day.toISOString()} 
                className={`flex-1 min-w-[60px] p-2 text-center border-r border-border text-xs ${
                  isToday(day) ? 'bg-blue-500/10 text-blue-500 font-bold' : 'text-muted-foreground'
                }`}
              >
                <div>{format(day, 'EEE', { locale: tr })}</div>
                <div>{format(day, 'd')}</div>
              </div>
            ))}
          </div>

          {/* Lanes */}
          {lanes.map(column => {
            const columnTasks = tasks.filter(t => t.status === column.id);
            return (
              <div key={column.id} className="flex border-b border-border/40 group">
                <div className="w-48 flex-shrink-0 p-3 text-sm font-medium text-foreground border-r border-border bg-card sticky left-0 z-10 group-hover:bg-muted">
                  {column.title}
                  <span className="ml-2 text-xs text-muted-foreground font-normal">({columnTasks.length})</span>
                </div>
                <div className="flex-1 flex relative">
                  {/* Grid Lines */}
                  {days.map(day => (
                    <div 
                      key={day.toISOString()} 
                      className={`flex-1 min-w-[60px] border-r border-border/40 ${
                        isToday(day) ? 'bg-blue-500/10' : ''
                      }`} 
                    />
                  ))}
                  
                  {/* Tasks Overlay */}
                  <div className="absolute inset-0 py-2 space-y-1">
                    {columnTasks.map(task => {
                      if (!task.dueDate) return null;
                      const taskDate = new Date(task.dueDate);
                      const dayIndex = days.findIndex(d => isSameDay(d, taskDate));
                      
                      if (dayIndex === -1) return null; // Task is out of view
                      
                      return (
                        <div
                          key={task.id}
                          onClick={() => onTaskClick(task)}
                          className="absolute h-6 rounded px-2 text-xs flex items-center bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer hover:bg-blue-200 whitespace-nowrap overflow-hidden z-0"
                          style={{
                            left: `${(dayIndex * (100 / daysToShow))}%`,
                            width: `${100 / daysToShow}%`,
                            top: 4 // Stack them? Simple overlay for now.
                          }}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
