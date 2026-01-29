'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
import {
  User,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  StopCircle,
  AlignLeft,
  Circle,
  Pencil,
  CheckSquare,
  Users,
  Paperclip,
  ExternalLink,
  Tags,
  Users2,
  Image as ImageIcon,
  Calendar,
  ArrowRight,
  Copy,
  Link as LinkIcon,
  Layers,
  Archive,
  ChevronRight,
} from 'lucide-react';

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

interface Activity {
  id: string;
  text: string;
  action?: 
    | 'completed' 
    | 'uncompleted'
    | 'work:start'
    | 'work:pause'
    | 'work:resume'
    | 'work:stop'
    | 'work:enable'
    | 'work:disable';
  userId?: string;
  user: string;
  initials: string;
  color: string;
  date: string;
  type: 'activity';
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
  dueDate?: string;
  coverColor?: string;
  assignee?: {
    name: string;
  };
  labels?: string[];
  checklist?: TaskChecklist;
  checklistTotal?: number;
  checklistCompleted?: number;
  members?: string[];
  memberCount?: number;
  attachments?: Attachment[];
  attachmentCount?: number;
  activities?: Activity[];
}

export type ColumnOption = { id: string; title: string };

export type TaskContextAction =
  | { type: 'open' }
  | { type: 'edit_labels' }
  | { type: 'edit_members' }
  | { type: 'edit_dates' }
  | { type: 'edit_cover' }
  | { type: 'move'; toColumnId: string }
  | { type: 'copy' }
  | { type: 'copy_link' }
  | { type: 'mirror'; toColumnId: string }
  | { type: 'archive' }
  | { type: 'toggle_time_tracking' };

interface SortableTaskCardProps {
  task: Task;
  onToggleStatus?: (id: string, currentStatus: string) => void;
  onEdit?: (task: Task) => void;
  columns?: ColumnOption[];
  onContextAction?: (task: Task, action: TaskContextAction) => void;
  onTrackTime?: (task: Task, action: 'start' | 'pause' | 'resume' | 'stop') => void;
  currentUserId?: string;
  sortableId?: string;
  isOverlay?: boolean;
}

export function SortableTaskCard({
  task,
  onToggleStatus,
  onEdit,
  columns = [],
  onContextAction,
  onTrackTime,
  currentUserId,
  sortableId,
  isOverlay,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId || task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formattedDate = task.dueDate 
    ? new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    : null;

  const isImportant = task.priority === 'HIGH' || task.priority === 'URGENT';
  const isCompleted = (() => {
    const list = task.activities || [];
    let last: Activity | null = null;
    for (const a of list) {
      if (a?.type !== 'activity') continue;
      if (a.action !== 'completed' && a.action !== 'uncompleted') continue;
      if (!last) {
        last = a;
        continue;
      }
      if (Date.parse(a.date) > Date.parse(last.date)) last = a;
    }
    return last?.action === 'completed';
  })();

  const isOverdue = (() => {
    if (!task.dueDate) return false;
    const t = Date.parse(task.dueDate);
    if (Number.isNaN(t)) return false;
    return t < Date.now();
  })();

  const [mounted, setMounted] = useState(false);
  const [menu, setMenu] = useState<{ open: boolean; x: number; y: number }>({ open: false, x: 0, y: 0 });
  const [activeSubmenu, setActiveSubmenu] = useState<'move' | 'mirror' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeMenu = () => {
    setMenu((prev) => ({ ...prev, open: false }));
    setActiveSubmenu(null);
  };

  useEffect(() => {
    if (!menu.open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };

    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      if (submenuRef.current && submenuRef.current.contains(e.target as Node)) return;
      closeMenu();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onMouseDown, true);
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onMouseDown, true);
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, [menu.open]);

  const menuPosition = useMemo(() => {
    if (!mounted) return { x: 0, y: 0, width: 220, height: 360 };
    const width = 220;
    const height = 360;
    const x = Math.max(8, Math.min(menu.x, window.innerWidth - width - 8));
    const y = Math.max(8, Math.min(menu.y, window.innerHeight - height - 8));
    return { x, y, width, height };
  }, [menu.x, menu.y, menu.open, mounted]);

  const submenuPosition = useMemo(() => {
    if (!mounted) return { x: 0, y: 0, width: 220 };
    const width = 220;
    const xRight = menuPosition.x + menuPosition.width + 8;
    const xLeft = menuPosition.x - width - 8;
    const x = xRight + width <= window.innerWidth ? xRight : Math.max(8, xLeft);
    return { x, y: menuPosition.y, width };
  }, [menuPosition.x, menuPosition.y, menuPosition.width, menu.open, mounted]);

  const fire = (action: TaskContextAction) => {
    if (onContextAction) onContextAction(task, action);
    else if (action.type === 'open') onEdit?.(task);
    closeMenu();
  };

  const checklistStats = (() => {
    const raw = task.checklist;
    if (Array.isArray(raw) && raw.length > 0) {
      const first: any = raw[0];
      if (first && typeof first === 'object' && Array.isArray(first.items)) {
        const groups = raw as ChecklistGroup[];
        const total = groups.reduce((acc, g) => acc + (g.items?.length || 0), 0);
        const completed = groups.reduce((acc, g) => acc + (g.items?.filter(i => i.completed).length || 0), 0);
        return { total, completed };
      }

      const items = raw as ChecklistItem[];
      return { total: items.length, completed: items.filter(i => i.completed).length };
    }

    if (typeof task.checklistTotal === 'number' && typeof task.checklistCompleted === 'number') {
      return { total: task.checklistTotal, completed: task.checklistCompleted };
    }

    return { total: 0, completed: 0 };
  })();

  const checklistTotal = checklistStats.total;
  const checklistCompleted = checklistStats.completed;
  const attachmentCount = task.attachments?.length || task.attachmentCount || 0;

  const workStats = useMemo(() => {
    const list = (task.activities || []).slice().sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    const totals = new Map<string, number>();
    const running = new Map<string, number | null>();
    for (const a of list) {
      const uid = a.userId || 'unknown';
      if (!totals.has(uid)) totals.set(uid, 0);
      if (!running.has(uid)) running.set(uid, null);
      const ts = Date.parse(a.date);
      const act = a.action || '';
      if (act === 'work:start' || act === 'work:resume') {
        if (running.get(uid) == null) running.set(uid, ts);
      } else if (act === 'work:pause' || act === 'work:stop') {
        const startTs = running.get(uid);
        if (typeof startTs === 'number' && Number.isFinite(startTs) && ts > startTs) {
          totals.set(uid, (totals.get(uid) || 0) + Math.floor((ts - startTs) / 1000));
        }
        running.set(uid, null);
      }
    }
    // If still running, include time up to now for display only
    const now = Date.now() + tick * 0;
    for (const [uid, startTs] of running.entries()) {
      if (typeof startTs === 'number' && Number.isFinite(startTs)) {
        totals.set(uid, (totals.get(uid) || 0) + Math.floor((now - startTs) / 1000));
      }
    }
    const myUid = currentUserId || 'unknown';
    const mySeconds = totals.get(myUid) || 0;
    const isMyRunning = typeof (running.get(myUid) ?? null) === 'number';
    const allSeconds = Array.from(totals.values()).reduce((acc, v) => acc + v, 0);
    const hasRunning = Array.from(running.values()).some(v => typeof v === 'number');
    return { mySeconds, isMyRunning, allSeconds, hasRunning };
  }, [task.activities, currentUserId, tick]);

  const lastMyWorkAction = useMemo(() => {
    const myUid = currentUserId || 'unknown';
    let last: Activity | null = null;
    for (const a of task.activities || []) {
      const act = a.action || '';
      if (!act.startsWith('work:')) continue;
      const uid = a.userId || 'unknown';
      if (uid !== myUid) continue;
      if (!last || Date.parse(a.date) > Date.parse(last.date)) last = a;
    }
    return last?.action || null;
  }, [task.activities, currentUserId]);

  const isMyPaused = lastMyWorkAction === 'work:pause';

  useEffect(() => {
    if (!workStats.hasRunning) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      window.clearInterval(id);
    };
  }, [workStats.hasRunning]);

  const labels = [
    { id: '1', name: 'Acil', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200' },
    { id: '2', name: 'Tasarım', color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200' },
    { id: '3', name: 'Yazılım', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200' },
    { id: '4', name: 'Onay Bekliyor', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-200' },
  ];
  
  const timeTrackingEnabled = useMemo(() => {
    const list = task.activities || [];
    let enabled: boolean | null = null;
    for (const a of list) {
      const act = a.action || '';
      if (act === 'work:enable') enabled = true;
      else if (act === 'work:disable') enabled = false;
    }
    return !!enabled;
  }, [task.activities]);

  const formatSecondsDetailed = (s: number) => {
    const v = Math.max(0, Math.floor(s));
    const h = Math.floor(v / 3600);
    const m = Math.floor((v % 3600) / 60);
    const sec = v % 60;
    const hh = h > 0 ? `${h}:` : '';
    const mm = (h > 0 ? String(m).padStart(2, '0') : String(m)) + ':';
    const ss = String(sec).padStart(2, '0');
    return `${hh}${mm}${ss}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setMenu({ open: true, x: e.clientX, y: e.clientY });
      }}
      className={`p-3 ${task.coverColor ? 'pt-6' : ''} rounded-md border cursor-grab transition-all duration-150 shadow-none hover:shadow-sm hover:-translate-y-0.5 group relative overflow-hidden ${
        isCompleted
          ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:hover:border-emerald-400/60'
        : isOverdue
            ? 'bg-red-50 border-red-200 hover:border-red-300 dark:bg-red-500/15 dark:border-red-500/40 dark:hover:border-red-400/60'
            : 'bg-card border-border hover:border-primary/40'
      } ${!isCompleted ? (isMyPaused ? 'ring-1 ring-yellow-300' : (workStats.hasRunning ? 'ring-1 ring-emerald-300' : '')) : ''}`}
    >
      {!isCompleted && (workStats.hasRunning || isMyPaused) && (
        <div className={`absolute inset-y-0 left-0 w-1 ${workStats.hasRunning ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}`} />
      )}
      {task.coverColor && (
        <div
          className="absolute inset-x-0 top-0 h-3"
          style={{ backgroundColor: task.coverColor }}
        />
      )}
      {mounted && menu.open && createPortal(
        <div
          className="fixed inset-0 z-[70]"
          onContextMenu={(e) => {
            e.preventDefault();
            closeMenu();
          }}
        >
          <div
            ref={menuRef}
            className="fixed bg-card rounded-lg shadow-2xl border border-border p-1"
            style={{ left: menuPosition.x, top: menuPosition.y, width: menuPosition.width }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => fire({ type: 'open' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Kartı Aç</span>
            </button>
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => fire({ type: 'edit_labels' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
            >
              <Tags className="w-4 h-4" />
              <span>Etiketleri Düzenle</span>
            </button>
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => fire({ type: 'edit_members' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
            >
              <Users2 className="w-4 h-4" />
              <span>Üyeleri Değiştir</span>
            </button>
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => fire({ type: 'edit_cover' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Kapağı Değiştir</span>
            </button>
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => fire({ type: 'edit_dates' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
            >
              <Calendar className="w-4 h-4" />
              <span>Tarihleri düzenle</span>
            </button>
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => fire({ type: 'toggle_time_tracking' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
            >
              <Clock className="w-4 h-4" />
              <span>{timeTrackingEnabled ? 'Zaman Takibini Kapat' : 'Zaman Takibini Aç'}</span>
            </button>

            <div className="h-px bg-border my-1" />

            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu('move')}
              onClick={() => setActiveSubmenu((prev) => (prev === 'move' ? null : 'move'))}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
            >
              <span className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Taşı
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => fire({ type: 'copy' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
            >
              <Copy className="w-4 h-4" />
              <span>Kartı kopyala</span>
            </button>
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => fire({ type: 'copy_link' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
            >
              <LinkIcon className="w-4 h-4" />
              <span>Bağlantıyı kopyala</span>
            </button>
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu('mirror')}
              onClick={() => setActiveSubmenu((prev) => (prev === 'mirror' ? null : 'mirror'))}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Yansıtma
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="h-px bg-border my-1" />

            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => fire({ type: 'archive' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
            >
              <Archive className="w-4 h-4" />
              <span>Arşiv</span>
            </button>
          </div>

          {activeSubmenu && columns.length > 0 && (
            <div
              ref={submenuRef}
              className="fixed bg-card rounded-lg shadow-2xl border border-border p-1"
              style={{ left: submenuPosition.x, top: submenuPosition.y, width: submenuPosition.width }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {columns.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    if (activeSubmenu === 'move') fire({ type: 'move', toColumnId: c.id });
                    if (activeSubmenu === 'mirror') fire({ type: 'mirror', toColumnId: c.id });
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
                >
                  <span className="truncate">{c.title}</span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{c.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
      <div className="flex items-start gap-2 mb-2">
        {/* Check Circle Section */}
        <div className="flex-shrink-0 pt-0.5">
          {isCompleted ? (
            <button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus?.(task.id, task.status);
              }}
              className="text-green-500 hover:text-green-600 transition-colors"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          ) : (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus?.(task.id, task.status);
              }}
              className="text-slate-300 hover:text-green-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Circle className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Title Section */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1 mb-1">
            {task.labels?.map(labelId => {
              const label = labels.find(l => l.id === labelId);
              if (!label) return null;
              return (
                <span key={labelId} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${label.color}`}>
                  {label.name}
                </span>
              );
            })}
          </div>
          <div className="flex items-center gap-1">
            {workStats.hasRunning && !isCompleted && (
              <Clock className="w-3 h-3 text-emerald-600 animate-pulse flex-shrink-0" />
            )}
            {!workStats.hasRunning && isMyPaused && !isCompleted && (
              <Pause className="w-3 h-3 text-yellow-600 flex-shrink-0" />
            )}
            <h4 className={`font-medium text-sm leading-snug break-words ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {task.title}
            </h4>
          </div>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all bg-card pl-2">
          {timeTrackingEnabled && (
            <div className="flex items-center gap-1">
              <div className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {formatSecondsDetailed(workStats.isMyRunning ? workStats.mySeconds : workStats.allSeconds)}
              </div>
              {onTrackTime && (
                <>
                  {workStats.isMyRunning ? (
                    <>
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrackTime(task, 'pause');
                        }}
                        className="text-yellow-500 hover:text-yellow-600"
                        title="Duraklat"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrackTime(task, 'stop');
                        }}
                        className="text-red-500 hover:text-red-600"
                        title="Bitir"
                      >
                        <StopCircle className="w-4 h-4" />
                      </button>
                    </>
                  ) : isMyPaused ? (
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTrackTime(task, 'resume');
                      }}
                      className="text-green-500 hover:text-green-600"
                      title="Devam Et"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTrackTime(task, 'start');
                      }}
                      className="text-green-500 hover:text-green-600"
                      title="Başlat"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          )}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(task);
            }}
            className="text-muted-foreground hover:text-foreground"
            title="Düzenle"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          {formattedDate && (
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                !isCompleted && isOverdue
                  ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200'
                  : isImportant
                    ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
          )}
          
          {checklistTotal > 0 && (
            <div className={`flex items-center gap-1 text-xs ${
              checklistCompleted === checklistTotal ? 'text-green-600' : 'text-muted-foreground'
            }`}>
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{checklistCompleted}/{checklistTotal}</span>
            </div>
          )}

          {attachmentCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{attachmentCount}</span>
            </div>
          )}
          
        </div>

        <div className="flex items-center gap-2">
          {task.description && (
            <div className="text-muted-foreground">
              <AlignLeft className="w-4 h-4" />
            </div>
          )}
          
          {task.assignee ? (
            <div className="h-6 w-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] text-white font-bold ring-1 ring-background" title={task.assignee.name}>
              {task.assignee.name.substring(0, 2).toUpperCase()}
            </div>
          ) : (task.memberCount || 0) > 0 ? (
             <div className="flex items-center gap-1 text-muted-foreground text-xs bg-muted px-1.5 py-0.5 rounded">
               <Users className="w-3 h-3" />
               <span>{task.memberCount}</span>
             </div>
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground" title="Atanmamış">
              <User className="w-3 h-3" />
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
