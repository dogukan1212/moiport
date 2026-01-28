import React, { useState } from 'react';
import { Task, Column } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek,
  isToday
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  columns?: Column[];
  onTaskClick: (task: Task) => void;
}

export function CalendarView({ tasks, columns = [], onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const allowedStatusIds = new Set(columns.map((c) => c.id));

  const getTasksForDay = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      if (allowedStatusIds.size > 0 && !allowedStatusIds.has(task.status)) return false;
      return isSameDay(new Date(task.dueDate), date);
    });
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="bg-card rounded-lg border border-border flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: tr })}
          </h2>
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={prevMonth}
              className="p-1 rounded-md transition-colors hover:bg-background"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-colors"
            >
              Bugün
            </button>
            <button
              onClick={nextMonth}
              className="p-1 rounded-md transition-colors hover:bg-background"
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-7 border-b border-border bg-muted">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
          <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
        {days.map((day, idx) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isDayToday = isToday(day);
          
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[120px] border-b border-r border-border/40 p-2 transition-colors hover:bg-muted/50 ${
                !isCurrentMonth ? 'bg-muted/40' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`text-sm w-7 h-7 flex items-center justify-center rounded-full ${
                    isDayToday
                      ? 'bg-blue-600 text-white font-bold'
                      : isCurrentMonth
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="space-y-1">
                {dayTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="w-full text-left px-2 py-1 rounded text-xs bg-card border border-border shadow-sm truncate hover:border-primary transition-colors"
                    style={task.coverColor ? { borderLeftColor: task.coverColor, borderLeftWidth: 3 } : {}}
                  >
                    {task.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
