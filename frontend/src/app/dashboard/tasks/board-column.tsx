import { useEffect, useMemo, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MoreVertical, Plus, X, Eye } from 'lucide-react';
import { SortableTaskCard } from './task-card';
import type { ColumnOption, TaskContextAction } from './task-card';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface ChecklistGroup {
  id: string;
  title: string;
  items: ChecklistItem[];
}

type TaskChecklist = ChecklistItem[] | ChecklistGroup[];

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  order: number;
  mirrorGroupId?: string;
  projectId?: string;
  assigneeId?: string;
  assignee?: {
    name: string;
  };
  labels?: string[];
  checklist?: TaskChecklist;
  checklistTotal?: number;
  checklistCompleted?: number;
  members?: string[];
  memberCount?: number;
  dueDate?: string;
  coverColor?: string;
  attachments?: Attachment[];
  attachmentCount?: number;
}

interface Column {
  id: string;
  title: string;
  archived?: boolean;
}

interface BoardColumnProps {
  column: Column;
  columns: ColumnOption[];
  tasks: Task[];
  onAddTask: (title: string, columnId: string) => Promise<void>;
  onUpdateTitle: (columnId: string, newTitle: string) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onEditTask: (task: Task) => void;
  onTaskContextAction: (task: Task, action: TaskContextAction) => void;
  onArchiveColumn: (columnId: string) => void | Promise<void>;
  onDeleteColumn: (columnId: string) => void | Promise<void>;
  onTrackTime?: (task: Task, action: 'start' | 'pause' | 'resume' | 'stop') => void;
  onToggleWatchColumn?: (columnId: string) => void;
  isWatching?: boolean;
  currentUserId?: string;
}

export function BoardColumn({ 
  column, 
  columns,
  tasks, 
  onAddTask, 
  onUpdateTitle,
  onToggleStatus,
  onEditTask,
  onTaskContextAction,
  onArchiveColumn,
  onDeleteColumn,
  onTrackTime,
  onToggleWatchColumn,
  isWatching = false,
  currentUserId,
}: BoardColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (newTaskTitle.trim()) {
        await onAddTask(newTaskTitle, column.id);
        setNewTaskTitle('');
        setIsAdding(false);
      }
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTaskTitle('');
    }
  };

  const handleBlur = async () => {
    if (newTaskTitle.trim()) {
      await onAddTask(newTaskTitle, column.id);
      setNewTaskTitle('');
    }
    setIsAdding(false);
  };

  return (
    <div className="kanban-col flex-shrink-0 w-80 min-w-[300px] flex flex-col gap-3">
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto min-h-[160px] flex flex-col"
      >
        <div className="kanban-head flex items-center justify-between px-2 pb-2 mb-1 sticky top-0 bg-card z-10 border-b border-border">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              value={column.title}
              onChange={(e) => onUpdateTitle(column.id, e.target.value)}
              className="font-semibold text-[11px] tracking-[0.16em] text-muted-foreground bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 w-full min-w-0 uppercase"
            />
            <span className="text-[11px] text-muted-foreground flex-shrink-0">
              {tasks.length}
            </span>
          </div>
          <div className="relative flex-shrink-0 ml-2" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(prev => !prev)}
              className="text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-lg shadow-xl border border-border z-20 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onToggleWatchColumn?.(column.id);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md flex items-center gap-2"
                >
                  <Eye className={`w-4 h-4 ${isWatching ? 'text-foreground' : 'text-muted-foreground'}`} />
                  <span>{isWatching ? 'Takibi Bırak' : 'Listeyi Takip Et'}</span>
                </button>
                <div className="my-1 border-t border-border/40" />
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onArchiveColumn(column.id);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
                >
                  Arşivle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDeleteColumn(column.id);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                >
                  Sil
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 pt-3 flex flex-col flex-1">
          <SortableContext
            id={column.id}
            items={useMemo(() => tasks.map((t) => `${t.id}::${column.id}`), [tasks, column.id])}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 flex-1">
              {tasks.map((task) => (
              <SortableTaskCard
                key={`${task.id}::${column.id}`}
                sortableId={`${task.id}::${column.id}`}
                task={task}
                onToggleStatus={onToggleStatus}
                onEdit={onEditTask}
                columns={columns}
                onContextAction={onTaskContextAction}
                onTrackTime={onTrackTime}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </SortableContext>

          {isAdding ? (
            <div className="mt-2 bg-card p-3 rounded-xl shadow-sm border border-border">
              <input
                autoFocus
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder="Görev adı girin..."
                className="w-full text-sm outline-none placeholder:text-muted-foreground text-foreground"
              />
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-2 text-muted-foreground text-sm hover:bg-muted rounded-md transition-colors flex items-center gap-2 px-2 justify-start mt-2 flex-shrink-0"
            >
              <Plus className="h-4 w-4" /> Kart ekle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
