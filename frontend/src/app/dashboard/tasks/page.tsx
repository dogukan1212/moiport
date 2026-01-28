'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragEndEvent,
  DragOverEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import api from '@/lib/api';
import { Plus, MoreVertical, Archive, RotateCcw, LayoutGrid, Table as TableIcon, Calendar as CalendarIcon, ListStart, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SortableTaskCard } from './task-card';
import { BoardColumn } from './board-column';
import { TaskDetailModal } from './task-detail-modal';
import { useAuth } from '@/hooks/use-auth';
import { useSearchParams } from 'next/navigation';
import type { TaskContextAction, ColumnOption } from './task-card';
import { Task, Activity, Attachment, ChecklistItem, ChecklistGroup, TaskChecklist } from './types';
import { TableView } from './views/TableView';
import { CalendarView } from './views/CalendarView';
import { TimelineView } from './views/TimelineView';
import { DashboardView } from './views/DashboardView';

const ORDER_STEP = 1024;
const ORDER_START = ORDER_STEP;

const COLUMNS = [
  { id: 'TODO', title: 'Yapılacaklar', archived: false },
  { id: 'IN_PROGRESS', title: 'Devam Edenler', archived: false },
  { id: 'REVIEW', title: 'İncelemede', archived: false },
  { id: 'DONE', title: 'Tamamlandı', archived: false },
];

export default function TasksPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const tasksRef = useRef<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const dragStartTaskRef = useRef<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'board' | 'table' | 'calendar' | 'timeline' | 'dashboard'>('board');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const dedupeTasks = (list: Task[]) => {
    const seen = new Set<string>();
    const out: Task[] = [];
    for (const t of Array.isArray(list) ? list : []) {
      if (!t?.id) continue;
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      out.push(t);
    }
    return out;
  };

  const setTasksSafe = (updater: (prev: Task[]) => Task[]) => {
    setTasks((prev) => {
      const prevSafe = dedupeTasks(prev);
      const next = dedupeTasks(updater(prevSafe));
      tasksRef.current = next;
      return next;
    });
  };

  const pendingPatchesRef = useRef<Map<string, any>>(new Map());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRealtimeAtRef = useRef<number>(Date.now());
  const authoritativeTsRef = useRef<number>(0);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const clientIdRef = useRef<string>('');
  const lastEmitTsRef = useRef<number>(0);
  const ackTimerRef = useRef<number | null>(null);
  const pendingPositionsRef = useRef<Map<string, { status: string; order: number }>>(new Map());
  const positionsFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const positionsQueueRef = useRef<Promise<unknown>>(Promise.resolve());

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

  const [groupBy, setGroupBy] = useState<'status' | 'assignee' | 'project'>('status');

  const [columns, setColumns] = useState(COLUMNS);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [watchedColumns, setWatchedColumns] = useState<string[]>([]);

  const updateUrl = (taskId?: string | null) => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (taskId) {
        url.searchParams.set('taskId', taskId);
      } else {
        url.searchParams.delete('taskId');
      }
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.error('URL güncellenemedi:', e);
    }
  };

  useEffect(() => {
    if (!user) return;
    const savedColumns = localStorage.getItem('taskColumns');
    let initial = savedColumns ? JSON.parse(savedColumns) : null;
    if (user?.role === 'CLIENT') {
      const clientColumns = [
        { id: 'TODO', title: 'Görevler', archived: false },
        { id: 'DONE', title: 'Tamamlandı', archived: false },
      ];
      setColumns(clientColumns);
      setGroupBy('project');
    } else {
      const base = initial || COLUMNS.slice();
      const hasBrands = base.some((c: any) => c.id === 'BRANDS');
      const next = hasBrands
        ? base
        : [{ id: 'BRANDS', title: 'Markalar', archived: false }, ...base];
      setColumns(next);
      setGroupBy('assignee');
    }
  }, [user]);

  const persistColumns = (nextColumns: any) => {
    setColumns(nextColumns);
    localStorage.setItem('taskColumns', JSON.stringify(nextColumns));
  };

  const updateColumnTitle = (columnId: string, newTitle: string) => {
    const newColumns = columns.map(col => 
      col.id === columnId ? { ...col, title: newTitle } : col
    );
    persistColumns(newColumns);
  };

  const archivedColumns = useMemo(() => columns.filter(c => c.archived), [columns]);
  const archivedTasks = useMemo(() => tasks.filter(t => t.status === 'ARCHIVED'), [tasks]);

  const unarchiveColumn = async (columnId: string) => {
    try {
      const raw = localStorage.getItem('archivedColumnTasks');
      const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
      const ids = Array.isArray(map[columnId]) ? map[columnId] : [];
      const toRestore = tasks.filter(t => ids.includes(t.id) && t.status === 'ARCHIVED');
      if (toRestore.length > 0) {
        const baseOrder = getNextOrderForStatus(columnId);
        const changes = new Map<string, number>();
        for (let i = 0; i < toRestore.length; i++) {
          changes.set(toRestore[i].id, baseOrder + i * ORDER_STEP);
        }
        setTasksSafe((prev) =>
          prev.map((t) =>
            ids.includes(t.id) && t.status === 'ARCHIVED'
              ? { ...t, status: columnId, order: changes.get(t.id)! }
              : t,
          ),
        );
        try {
          await Promise.allSettled(
            toRestore.map(t =>
              api.patch(`/tasks/${t.id}`, { status: columnId, order: changes.get(t.id)! }),
            ),
          );
        } catch (error) {
          console.error('Sütun arşivden çıkarılırken kartlar geri yüklenemedi:', error);
          fetchTasks();
        }
      }
      delete map[columnId];
      localStorage.setItem('archivedColumnTasks', JSON.stringify(map));
    } catch {}
    const next = columns.map(c => (c.id === columnId ? { ...c, archived: false } : c));
    persistColumns(next);
  };

  const restoreArchivedTask = async (taskId: string, toColumnId?: string) => {
    const target = toColumnId || 'TODO';
    const nextOrder = getNextOrderForStatus(target);
    setTasksSafe((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: target, order: nextOrder } : t)),
    );
    try {
      await api.patch(`/tasks/${taskId}`, { status: target, order: nextOrder });
    } catch (error) {
      console.error('Arşivden çıkarma başarısız:', error);
      fetchTasks();
    }
  };

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const selectedTaskRef = useRef<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalInitialPopover, setDetailModalInitialPopover] = useState<'labels' | 'members' | 'date' | 'column' | 'cover' | null>(null);
  const [detailModalAutoOpenFilePicker, setDetailModalAutoOpenFilePicker] = useState(false);
  const openedFromUrlRef = useRef(false);

  useEffect(() => {
    selectedTaskRef.current = selectedTask;
  }, [selectedTask]);

  useEffect(() => {
    fetchTasks();
    fetchWatchedColumns();
  }, []);

  const fetchWatchedColumns = async () => {
    try {
      const res = await api.get('/tasks/watchers/columns');
      setWatchedColumns(res.data || []);
    } catch (error) {
      console.error('İzlenen sütunlar yüklenemedi:', error);
    }
  };

  const toggleWatchColumn = async (columnId: string) => {
    try {
      const res = await api.post('/tasks/watchers/columns', { columnId });
      const isWatching = res.data.watching;
      setWatchedColumns(prev => 
        isWatching 
          ? [...prev, columnId] 
          : prev.filter(id => id !== columnId)
      );
    } catch (error) {
      console.error('Sütun takibi değiştirilemedi:', error);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL + '/tasks', {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    });
    socketRef.current = socket;

    console.log('[tasks socket] init');
    socket.on('connect', () => {
      console.log('[tasks socket] connect', {
        id: socket.id,
        transport: socket.io.engine.transport.name,
      });
    });
    socket.on('disconnect', (reason) => {
      console.warn('[tasks socket] disconnect', { reason });
    });
    socket.on('connect_error', (err) => {
      const anyErr = err as any;
      console.error('[tasks socket] connect_error', {
        message: err.message,
        name: err.name,
        description: anyErr?.description,
        data: anyErr?.data,
      });
    });
    socket.io.engine.on('upgrade', (transport) => {
      console.log('[tasks socket] upgrade', { transport: transport.name });
    });

    socket.on('tasks:created', ({ task, ts }: { task: Task, ts?: number }) => {
      console.log('[tasks socket] tasks:created', { taskId: task?.id, status: task?.status });
      const eventTs = Number.isFinite(ts) ? Number(ts) : Date.now();
      lastRealtimeAtRef.current = eventTs;
      authoritativeTsRef.current = Math.max(authoritativeTsRef.current, eventTs);
      setTasksSafe((prev) =>
        prev.some((t) => t.id === task.id) ? prev : [...prev, task],
      );
    });

    socket.on('tasks:updated', ({ task, ts }: { task: Task, ts?: number }) => {
      console.log('[tasks socket] tasks:updated', { taskId: task?.id, status: task?.status, order: task?.order });
      const eventTs = Number.isFinite(ts) ? Number(ts) : Date.now();
      lastRealtimeAtRef.current = eventTs;
      authoritativeTsRef.current = Math.max(authoritativeTsRef.current, eventTs);
      setTasksSafe((prev) => {
        const exists = prev.some((t) => t.id === task.id);
        return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [...prev, task];
      });
      setSelectedTask((prev) => (prev?.id === task.id ? task : prev));
    });

    socket.on('tasks:bulkUpdated', ({ tasks, ts }: { tasks: Task[], ts?: number }) => {
      console.log('[tasks socket] tasks:bulkUpdated', { count: tasks?.length || 0 });
      const eventTs = Number.isFinite(ts) ? Number(ts) : Date.now();
      lastRealtimeAtRef.current = eventTs;
      authoritativeTsRef.current = Math.max(authoritativeTsRef.current, eventTs);
      setTasksSafe((prev) => {
        const byId = new Map(tasks.map((t) => [t.id, t]));
        const next = prev.map((t) => byId.get(t.id) || t);
        const existing = new Set(prev.map((t) => t.id));
        for (const t of tasks) {
          if (!existing.has(t.id)) next.push(t);
        }
        return next;
      });
      setSelectedTask((prev) => {
        if (!prev) return prev;
        const next = tasks.find((t) => t.id === prev.id);
        return next || prev;
      });
    });

    socket.on('tasks:deleted', ({ taskId, ts }: { taskId: string, ts?: number }) => {
      console.log('[tasks socket] tasks:deleted', { taskId });
      const eventTs = Number.isFinite(ts) ? Number(ts) : Date.now();
      lastRealtimeAtRef.current = eventTs;
      authoritativeTsRef.current = Math.max(authoritativeTsRef.current, eventTs);
      setTasksSafe((prev) => prev.filter((t) => t.id !== taskId));
      setSelectedTask((prev) => (prev?.id === taskId ? null : prev));
      if (selectedTaskRef.current?.id === taskId) {
        setIsDetailModalOpen(false);
        setDetailModalInitialPopover(null);
        setDetailModalAutoOpenFilePicker(false);
        updateUrl(null);
      }
    });

    socket.on('tasks:reordered', ({ taskIds, ts }: { taskIds: string[], ts?: number }) => {
      console.log('[tasks socket] tasks:reordered', { count: taskIds?.length || 0 });
      const eventTs = Number.isFinite(ts) ? Number(ts) : Date.now();
      lastRealtimeAtRef.current = eventTs;
      setTasksSafe((prev) => {
        const orderById = new Map(taskIds.map((id, index) => [id, index]));
        return prev.map((t) =>
          orderById.has(t.id) ? { ...t, order: orderById.get(t.id)! } : t,
        );
      });
      setSelectedTask((prev) => {
        if (!prev) return prev;
        const index = taskIds.indexOf(prev.id);
        if (index === -1) return prev;
        return { ...prev, order: index };
      });
    });
    socket.on('tasks:positions', ({ changes, ts }: { changes: Array<{ id: string; status: string; order: number }>, ts?: number }) => {
      lastRealtimeAtRef.current = Date.now();
      const eventTs = Number.isFinite(ts) ? Number(ts) : 0;
      authoritativeTsRef.current = Math.max(authoritativeTsRef.current, eventTs || Date.now());
      const map = new Map<string, { status: string; order: number }>();
      for (const c of changes) {
        if (!c?.id) continue;
        map.set(c.id, { status: c.status, order: c.order });
      }
      setTasksSafe((prev) =>
        prev.map((t) => (map.has(t.id) ? { ...t, ...map.get(t.id)! } : t)),
      );
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      clientIdRef.current =
        (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const BC: any =
        typeof window !== 'undefined' && (window as any).BroadcastChannel
          ? (window as any).BroadcastChannel
          : null;
      if (!BC) return;
      const bc = new BC('tasks-kanban');
      bcRef.current = bc;
      bc.onmessage = (ev: MessageEvent) => {
        const data: any = ev.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'tasks:positions' && Array.isArray(data.changes)) {
          const ts = Number.isFinite(data.ts) ? Number(data.ts) : 0;
          authoritativeTsRef.current = Math.max(authoritativeTsRef.current, ts || Date.now());
          const map = new Map<string, { status: string; order: number }>();
          for (const c of data.changes) {
            if (!c?.id) continue;
            map.set(c.id, { status: c.status, order: c.order });
          }
          setTasksSafe((prev) =>
            prev.map((t) => (map.has(t.id) ? { ...t, ...map.get(t.id)! } : t)),
          );
        }
      };
      return () => {
        try {
          bc.close();
        } catch {}
        bcRef.current = null;
      };
    } catch {}
  }, []);

  // Remove aggressive periodic fallback; rely on socket + REST, fetch only on errors

  const schedulePositionsFlush = (
    changes: Array<{ id: string; status: string; order: number }>,
  ) => {
    for (const c of changes) {
      if (!c?.id) continue;
      pendingPositionsRef.current.set(c.id, { status: c.status, order: c.order });
    }
    if (positionsFlushTimerRef.current) clearTimeout(positionsFlushTimerRef.current);
    positionsFlushTimerRef.current = setTimeout(() => {
      const entries = Array.from(pendingPositionsRef.current.entries());
      pendingPositionsRef.current.clear();
      positionsFlushTimerRef.current = null;
      const merged = entries.map(([id, v]) => ({ id, status: v.status, order: v.order }));
      if (merged.length === 0) return;
      positionsQueueRef.current = positionsQueueRef.current
        .then(() => api.patch('/tasks/positions', { changes: merged }))
        .catch((e) => {
          console.error('Sıralama güncellenemedi:', e);
          fetchTasks();
        });
    }, 80);
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      const list = Array.isArray(response.data) ? response.data : [];
      setTasksSafe((prev) => {
        const merged = new Map<string, Task>();
        for (const t of prev) merged.set(t.id, t);
        for (const t of list) merged.set(t.id, t);
        return Array.from(merged.values());
      });
    } catch (error) {
      console.error('Görevler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await api.get('/tenants/me');
      const users = Array.isArray(res.data?.users) ? res.data.users : [];
      setTeamMembers(users.map((u: any) => ({ id: String(u.id), name: String(u.name || u.email || u.id) })));
    } catch (e) {
      console.error('Ekip üyeleri yüklenemedi:', e);
    }
  };

  const fetchProjectsList = async () => {
    try {
      const res = await api.get('/projects');
      const list = Array.isArray(res.data) ? res.data : [];
      setProjects(list.map((p: any) => ({ id: String(p.id), name: String(p.name || p.id) })));
    } catch (e) {
      console.error('Projeler yüklenemedi:', e);
    }
  };
  
  useEffect(() => {
    if (groupBy === 'assignee' && teamMembers.length === 0) {
      fetchTeamMembers();
    } else if (groupBy === 'project' && projects.length === 0) {
      fetchProjectsList();
    }
  }, [groupBy]);

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status).sort((a, b) => a.order - b.order);
  };

  const tasksByStatus = useMemo(() => {
    const buckets: Record<string, Task[]> = {};
    for (const t of tasks) {
      // Skip archived tasks in the main board view
      if (t.status === 'ARCHIVED') continue;

      if (groupBy === 'assignee') {
         const memberList = Array.isArray(t.members) ? t.members.slice() : [];
         const primary = t.assigneeId || (memberList[0] || null);
         const allIds = new Set<string>(memberList);
         if (primary) allIds.add(primary);
         const ids = Array.from(allIds);
         if (ids.length > 0) {
           for (const mId of ids) {
             if (!buckets[mId]) buckets[mId] = [];
             buckets[mId].push(t);
           }
         } else {
           const k = 'unassigned';
           if (!buckets[k]) buckets[k] = [];
           buckets[k].push(t);
         }
      } else {
         let k = t.status;
         if (groupBy === 'project') k = t.projectId || 'no_project';
         if (!buckets[k]) buckets[k] = [];
         buckets[k].push(t);
      }
    }
    for (const k of Object.keys(buckets)) {
      buckets[k].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return buckets;
  }, [tasks, groupBy]);

  const getSortedStatusList = (status: string) => {
    return tasksRef.current
      .filter((t) => {
         if (groupBy === 'status') return t.status === status;
         if (groupBy === 'assignee') {
             if (status === 'unassigned') {
               const noMembers = !t.members || t.members.length === 0;
               const noAssignee = !t.assigneeId;
               return noMembers && noAssignee;
             }
             const inMembers = Array.isArray(t.members) && t.members.includes(status);
             const isAssignee = t.assigneeId === status;
             return inMembers || isAssignee;
         }
         if (groupBy === 'project') return (t.projectId || 'no_project') === status;
         return false;
      })
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  };

  const renormalizeStatus = (status: string) => {
    const list = getSortedStatusList(status);
    const changes = list.map((t, idx) => ({
      id: t.id,
      status,
      order: (idx + 1) * ORDER_STEP,
    }));
    setTasksSafe((prev) =>
      prev.map((t) => {
        const c = changes.find((x) => x.id === t.id);
        return c ? { ...t, status: c.status, order: c.order } : t;
      }),
    );
    return changes;
  };

  const getNextOrderForStatus = (status: string) => {
    const list = getSortedStatusList(status);
    const last = list[list.length - 1];
    return last ? (last.order ?? 0) + ORDER_STEP : ORDER_START;
  };

  const activeColumns: ColumnOption[] = useMemo(() => {
    if (groupBy === 'assignee') {
      const base = [{ id: 'unassigned', title: 'Atanmamış' } as ColumnOption];
      const users = teamMembers.map((u) => ({ id: u.id, title: u.name || u.id }));
      return [...base, ...users];
    }
    if (groupBy === 'project') {
      const base = [{ id: 'no_project', title: 'Projesiz' } as ColumnOption];
      const proj = projects.map((p) => ({ id: p.id, title: p.name || p.id }));
      return [...base, ...proj];
    }
    return columns.filter((c: any) => !c.archived).map((c: any) => ({ id: c.id, title: c.title }));
  }, [columns, groupBy, teamMembers, projects]);

  const openTaskModal = (
    task: Task,
    opts?: { popover?: 'labels' | 'members' | 'date' | 'column' | 'cover' | null; autoOpenFilePicker?: boolean }
  ) => {
    console.log('[openTaskModal] opening', task.id);
    setSelectedTask(task);
    setDetailModalInitialPopover(opts?.popover ?? null);
    setDetailModalAutoOpenFilePicker(!!opts?.autoOpenFilePicker);
    setIsDetailModalOpen(true);
    updateUrl(task.id);
  };

  const closeTaskModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTask(null);
    setDetailModalInitialPopover(null);
    setDetailModalAutoOpenFilePicker(false);
    updateUrl(null);
  };

  useEffect(() => {
    const taskId = searchParams.get('taskId');
    if (!taskId) {
      openedFromUrlRef.current = false;
      return;
    }
    if (loading) return;
    if (isDetailModalOpen && selectedTask?.id === taskId) return;
    if (openedFromUrlRef.current) return;
    const t = tasks.find((x) => x.id === taskId);
    if (!t) {
      updateUrl(null);
      openedFromUrlRef.current = false;
      return;
    }
    openedFromUrlRef.current = true;
    openTaskModal(t);
  }, [searchParams, tasks, loading, isDetailModalOpen, selectedTask]);

  const getFirstActiveColumnId = (excludeId?: string) => {
    const activeColumns = columns.filter(c => !c.archived && c.id !== excludeId);
    const todo = activeColumns.find(c => c.id === 'TODO');
    return (todo || activeColumns[0])?.id || 'TODO';
  };

  const moveTasksFromColumn = async (fromColumnId: string, toColumnId: string) => {
    const affected = tasks.filter(t => t.status === fromColumnId);
    if (affected.length === 0) return;

    setTasksSafe((prev) =>
      prev.map((t) =>
        t.status === fromColumnId ? { ...t, status: toColumnId } : t,
      ),
    );

    try {
      await Promise.allSettled(
        affected.map(t => api.patch(`/tasks/${t.id}`, { status: toColumnId }))
      );
    } catch (error) {
      console.error('Kartlar taşınamadı:', error);
      fetchTasks();
    }
  };

  const handleArchiveColumn = async (columnId: string) => {
    const affected = tasks.filter(t => t.status === columnId);
    if (affected.length > 0) {
      setTasksSafe((prev) =>
        prev.map((t) =>
          t.status === columnId ? { ...t, status: 'ARCHIVED' } : t,
        ),
      );
      try {
        await Promise.allSettled(
          affected.map(t => api.patch(`/tasks/${t.id}`, { status: 'ARCHIVED' })),
        );
      } catch (error) {
        console.error('Sütun arşivlenirken kartlar arşivlenemedi:', error);
        fetchTasks();
      }
      try {
        const raw = localStorage.getItem('archivedColumnTasks');
        const map = raw ? JSON.parse(raw) : {};
        map[columnId] = affected.map(t => t.id);
        localStorage.setItem('archivedColumnTasks', JSON.stringify(map));
      } catch {}
      if (selectedTaskRef.current && affected.some(t => t.id === selectedTaskRef.current!.id)) {
        closeTaskModal();
      }
    }
    const nextColumns = columns.map(c => (c.id === columnId ? { ...c, archived: true } : c));
    persistColumns(nextColumns);
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!window.confirm('Bu sütunu silmek istiyor musunuz?')) return;
    const targetColumnId = getFirstActiveColumnId(columnId);
    await moveTasksFromColumn(columnId, targetColumnId);
    const nextColumns = columns.filter(c => c.id !== columnId);
    persistColumns(nextColumns);
  };


  const handleDragStart = (event: any) => {
    const { active } = event;
    const realId = String(active.id).split('::')[0];
    const task = tasksRef.current.find((t) => t.id === realId);
    if (task) {
      setActiveTask(task);
      dragStartTaskRef.current = task;
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id).split('::')[0];
    const overIdStr = String(over.id);
    const isOverAColumn = columns.some(col => !col.archived && col.id === overIdStr);
    const overId = isOverAColumn ? overIdStr : overIdStr.split('::')[0];

    if (activeId === overId) return;

    const activeTask = tasksRef.current.find((t) => t.id === activeId);
    const overTask = isOverAColumn ? undefined : tasksRef.current.find((t) => t.id === overId);
    
    if (activeTask && (overTask || isOverAColumn)) {
      // ... logic for drag over ...
      // DragOver usually just helps visual placeholder. 
      // We don't update state here because it causes flickering with complex multi-column logic.
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const [activeTaskId, sourceColumnId] = String(active.id).split('::');
    const overIdStr = String(over.id);
    
    // Check if dropped on a column
    const isOverAColumn = columns.some((col) => !col.archived && col.id === overIdStr);
    
    // If dropped on a task, get that task's ID and its column? 
    // Wait, if I drop on a task, over.id is 'taskId::columnId'.
    // So target column is the second part.
    
    let targetColumnId: string | null = null;
    let overTaskId: string | null = null;

    if (isOverAColumn) {
      targetColumnId = overIdStr;
    } else {
      const parts = overIdStr.split('::');
      overTaskId = parts[0];
      targetColumnId = parts[1] || null; // Fallback if no :: (shouldn't happen with new logic)
    }

    // Fallback logic if parsing fails or old behavior
    if (!targetColumnId) {
        // Try to guess from overTask status if possible, but with multi-column it's ambiguous.
        // If we can't determine target column, abort.
        return; 
    }

    if (activeTaskId === overTaskId) return;

    const startTask = dragStartTaskRef.current || tasksRef.current.find((t) => t.id === activeTaskId);
    if (!startTask) return;

    const targetStatus = targetColumnId;
    const sourceStatus = sourceColumnId || getCol(startTask); // Fallback

    function getCol(t: Task) {
        if (groupBy === 'status') return t.status;
        if (groupBy === 'assignee') return t.assigneeId || 'unassigned';
        if (groupBy === 'project') return t.projectId || 'no_project';
        return 'TODO';
    }

    const sourceList = getSortedStatusList(sourceStatus).filter((t) => t.id !== activeTaskId);
    const targetBase =
      sourceStatus === targetStatus
        ? sourceList
        : getSortedStatusList(targetStatus).filter((t) => t.id !== activeTaskId);
    
    // Block client moving to DONE
    if (groupBy === 'status' && user?.role === 'CLIENT' && targetStatus === 'DONE') {
      dragStartTaskRef.current = null;
      return;
    }

    let targetInsertIndex = targetBase.length;
    if (overTaskId) {
      const idx = targetBase.findIndex((t) => t.id === overTaskId);
      if (idx !== -1) targetInsertIndex = idx;
    }
    const left = targetBase[targetInsertIndex - 1];
    const right = targetBase[targetInsertIndex];
    let newOrder: number;

    if (!left && !right) {
      newOrder = ORDER_START;
    } else if (!left && right) {
      newOrder = (right.order ?? 0) / 2;
    } else if (left && !right) {
      newOrder = (left.order ?? 0) + ORDER_STEP;
    } else {
      newOrder = ((left.order ?? 0) + (right.order ?? 0)) / 2;
    }

    const updatePayload: any = { order: newOrder };

    if (groupBy === 'status') {
        updatePayload.status = targetStatus;
    } else if (groupBy === 'assignee') {
        // Multi-assignee logic
        if (sourceStatus !== targetStatus) {
            let newMembers = new Set(startTask.members || []);
            
            // Remove from source if it wasn't unassigned
            if (sourceStatus !== 'unassigned') {
                newMembers.delete(sourceStatus);
            }
            
            // Add to target if it's not unassigned
            if (targetStatus !== 'unassigned') {
                newMembers.add(targetStatus);
            }
            
            const nextMembers = Array.from(newMembers);
            updatePayload.members = nextMembers;
            updatePayload.memberCount = nextMembers.length;
            
            // Update assigneeId (primary)
            // If target is a member, make them primary? Or keep existing if in list?
            // Logic from modal: "nextAssigneeId = ...".
            // Let's set assigneeId to targetStatus if it's a real user, 
            // otherwise fallback to first member.
            if (targetStatus !== 'unassigned') {
                updatePayload.assigneeId = targetStatus;
            } else {
                updatePayload.assigneeId = nextMembers.length > 0 ? nextMembers[0] : null;
            }
        }
    } else if (groupBy === 'project') {
        updatePayload.projectId = targetStatus === 'no_project' ? null : targetStatus;
    }

    setTasksSafe((prev) =>
      prev.map((t) =>
        t.id === activeTaskId ? { ...t, ...updatePayload } : t,
      ),
    );

    try {
      await api.patch(`/tasks/${activeTaskId}`, updatePayload);
    } catch (e) {
      console.error('Anlık patch başarısız:', e);
      fetchTasks();
    }
    dragStartTaskRef.current = null;
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
    return initials || '??';
  };

  const getIsCompletedFromActivities = (list: Activity[] | undefined) => {
    const activities = list || [];
    let last: Activity | null = null;
    for (const a of activities) {
      if (a?.type !== 'activity') continue;
      if (a.action !== 'completed' && a.action !== 'uncompleted') continue;
      if (!last) {
        last = a;
        continue;
      }
      if (Date.parse(a.date) > Date.parse(last.date)) last = a;
    }
    return last?.action === 'completed';
  };

  const handleToggleStatus = async (id: string, _currentStatus: string) => {
    const actorName = user?.name || 'Bilinmeyen';
    const actor: Omit<Activity, 'id' | 'text' | 'date' | 'type' | 'action'> = {
      userId: user?.id,
      user: actorName,
      initials: getInitials(actorName),
      color: 'bg-green-700',
    };

    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const wasCompleted = getIsCompletedFromActivities(task.activities);
    const nextCompleted = !wasCompleted;
    if (user?.role === 'CLIENT' && nextCompleted) {
      return;
    }

    const nextActivity: Activity = {
      id: Date.now().toString(),
      text: nextCompleted ? 'kartı tamamladı' : 'kartı tekrar açtı',
      action: nextCompleted ? 'completed' : 'uncompleted',
      ...actor,
      date: new Date().toISOString(),
      type: 'activity',
    };

    const nextActivities = [nextActivity, ...(task.activities || [])];

    const targetStatus = nextCompleted ? 'DONE' : 'TODO';
    setTasksSafe((prev) =>
      prev.map(t => {
        if (t.id === id) return { ...t, activities: nextActivities, status: targetStatus };
        if (task.mirrorGroupId && t.mirrorGroupId === task.mirrorGroupId) {
          return { ...t, activities: nextActivities };
        }
        return t;
      }),
    );

    try {
      await api.patch(`/tasks/${id}`, { activities: nextActivities, status: targetStatus });
    } catch (error) {
      console.error('Durum güncellenemedi:', error);
      fetchTasks();
    }
  };

  const handleEditTask = (task: Task) => {
    openTaskModal(task);
  };

  const handleTrackTime = async (task: Task, action: 'start' | 'pause' | 'resume' | 'stop') => {
    const actorName = user?.name || 'Bilinmeyen';
    const actor: Omit<Activity, 'id' | 'text' | 'date' | 'type' | 'action'> = {
      userId: user?.id,
      user: actorName,
      initials: getInitials(actorName),
      color: 'bg-indigo-700',
    };
    const textMap: Record<typeof action, string> = {
      start: 'çalışmaya başladı',
      pause: 'çalışmayı duraklattı',
      resume: 'çalışmaya devam etti',
      stop: 'çalışmayı tamamladı',
    };
    const nextActivity: Activity = {
      id: Date.now().toString(),
      text: textMap[action],
      action: `work:${action}`,
      ...actor,
      date: new Date().toISOString(),
      type: 'activity',
    };
    const nextActivities = [nextActivity, ...(task.activities || [])];
    setTasksSafe((prev) =>
      prev.map(t => {
        if (t.id === task.id) return { ...t, activities: nextActivities };
        if (task.mirrorGroupId && t.mirrorGroupId === task.mirrorGroupId) {
          return { ...t, activities: nextActivities };
        }
        return t;
      }),
    );
    try {
      await api.patch(`/tasks/${task.id}`, { activities: nextActivities });
    } catch (error) {
      console.error('Zaman takibi güncellenemedi:', error);
      fetchTasks();
    }
  };

  const getMirrorSyncPatch = (t: Task) => {
    const {
      title,
      description,
      priority,
      projectId,
      assigneeId,
      labels,
      checklist,
      checklistTotal,
      checklistCompleted,
      members,
      memberCount,
      dueDate,
      coverColor,
      attachments,
      attachmentCount,
      comments,
      activities,
    } = t;

    return {
      title,
      description,
      priority,
      projectId,
      assigneeId,
      labels,
      checklist,
      checklistTotal,
      checklistCompleted,
      members,
      memberCount,
      dueDate,
      coverColor,
      attachments,
      attachmentCount,
      comments,
      activities,
    } as Partial<Task>;
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    const mirrorPatch = getMirrorSyncPatch(updatedTask);
    setTasksSafe((prev) =>
      prev.map(t => {
        if (t.id === updatedTask.id) return updatedTask;
        if (updatedTask.mirrorGroupId && t.mirrorGroupId === updatedTask.mirrorGroupId) {
          return { ...t, ...mirrorPatch };
        }
        return t;
      }),
    );
    
    try {
      const backendPatch: any = {
        ...mirrorPatch,
        status: updatedTask.status,
        order: updatedTask.order,
        mirrorGroupId: updatedTask.mirrorGroupId,
      };
      delete backendPatch.attachments;
      delete backendPatch.attachmentCount;
      pendingPatchesRef.current.set(updatedTask.id, {
        ...(pendingPatchesRef.current.get(updatedTask.id) || {}),
        ...backendPatch,
      });

      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flushTimerRef.current = setTimeout(async () => {
        const entries = Array.from(pendingPatchesRef.current.entries());
        pendingPatchesRef.current.clear();
        flushTimerRef.current = null;
        try {
          await Promise.all(
            entries.map(([taskId, patch]) => {
              const current = tasksRef.current.find((t) => t.id === taskId);
              const safePatch = { ...patch };
              if (current) {
                safePatch.status = current.status;
                safePatch.order = current.order;
              }
              return api.patch(`/tasks/${taskId}`, safePatch);
            }),
          );
        } catch (e) {
          console.error('Görev güncellenemedi:', e);
          fetchTasks();
        }
      }, 300);
    } catch (error) {
      console.error('Görev güncellenemedi:', error);
      fetchTasks();
    }
  };

  const copyTaskLink = async (taskId: string) => {
    const url = `${window.location.origin}/dashboard/tasks?taskId=${taskId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
  };

  const moveTaskToColumn = async (task: Task, toColumnId: string) => {
    if (task.status === toColumnId) return;
    if (user?.role === 'CLIENT' && toColumnId === 'DONE') return;
    setTasksSafe((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: toColumnId } : t)),
    );
    try {
      await api.patch(`/tasks/${task.id}`, { status: toColumnId });
    } catch (error) {
      console.error('Kart taşınamadı:', error);
      fetchTasks();
    }
  };

  const duplicateTask = async (task: Task, toColumnId?: string) => {
    const targetStatus = toColumnId || task.status;
    const nextOrder = getNextOrderForStatus(targetStatus);
    const payload: any = {
      title: `${task.title} (Kopya)`,
      status: targetStatus,
      priority: task.priority,
      order: nextOrder,
      ...(task.projectId ? { projectId: task.projectId } : {}),
      description: task.description || '',
      labels: task.labels || [],
      checklist: (task as any).checklist || [],
      checklistTotal: (task as any).checklistTotal || 0,
      checklistCompleted: (task as any).checklistCompleted || 0,
      members: (task as any).members || [],
      memberCount: (task as any).memberCount || 0,
      dueDate: (task as any).dueDate || '',
      coverColor: (task as any).coverColor || '',
      attachments: (task as any).attachments || [],
      attachmentCount: (task as any).attachmentCount || 0,
      comments: [],
      activities: [],
    };

    try {
      const res = await api.post('/tasks', payload);
      setTasksSafe((prev) => [...prev, res.data]);
    } catch (error) {
      console.error('Kart kopyalanamadı:', error);
      fetchTasks();
    }
  };

  const mirrorTask = async (task: Task, toColumnId: string) => {
    const targetStatus = toColumnId || task.status;
    const nextOrder = getNextOrderForStatus(targetStatus);
    const groupId =
      task.mirrorGroupId ||
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

    if (!task.mirrorGroupId) {
      setTasksSafe((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, mirrorGroupId: groupId } : t)),
      );
      setSelectedTask((prev) => (prev?.id === task.id ? { ...prev, mirrorGroupId: groupId } : prev));
      try {
        await api.patch(`/tasks/${task.id}`, { mirrorGroupId: groupId });
      } catch (error) {
        console.error('Kart yansıtılamadı:', error);
        fetchTasks();
        return;
      }
    }

    const payload: any = {
      title: task.title,
      status: targetStatus,
      priority: task.priority,
      order: nextOrder,
      mirrorGroupId: groupId,
      ...(task.projectId ? { projectId: task.projectId } : {}),
      description: task.description || '',
      labels: task.labels || [],
      checklist: (task as any).checklist || [],
      checklistTotal: (task as any).checklistTotal || 0,
      checklistCompleted: (task as any).checklistCompleted || 0,
      members: (task as any).members || [],
      memberCount: (task as any).memberCount || 0,
      dueDate: (task as any).dueDate || '',
      coverColor: (task as any).coverColor || '',
      attachments: (task as any).attachments || [],
      attachmentCount: (task as any).attachmentCount || 0,
      comments: (task as any).comments || [],
      activities: (task as any).activities || [],
    };

    try {
      const res = await api.post('/tasks', payload);
      setTasksSafe((prev) => [...prev, res.data]);
    } catch (error) {
      console.error('Kart yansıtılamadı:', error);
      fetchTasks();
    }
  };

  const archiveTask = async (task: Task) => {
    setTasksSafe((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'ARCHIVED' } : t)),
    );
    try {
      await api.patch(`/tasks/${task.id}`, { status: 'ARCHIVED' });
      if (selectedTask?.id === task.id) closeTaskModal();
    } catch (error) {
      console.error('Kart arşivlenemedi:', error);
      fetchTasks();
    }
  };

  const handleTaskContextAction = async (task: Task, action: TaskContextAction) => {
    if (action.type === 'open') return openTaskModal(task);
    if (action.type === 'edit_labels') return openTaskModal(task, { popover: 'labels' });
    if (action.type === 'edit_members') return openTaskModal(task, { popover: 'members' });
    if (action.type === 'edit_dates') return openTaskModal(task, { popover: 'date' });
    if (action.type === 'edit_cover') return openTaskModal(task, { popover: 'cover' });
    if (action.type === 'copy') return duplicateTask(task);
    if (action.type === 'copy_link') return copyTaskLink(task.id);
    if (action.type === 'archive') return archiveTask(task);
    if (action.type === 'move') return moveTaskToColumn(task, action.toColumnId);
    if (action.type === 'mirror') return mirrorTask(task, action.toColumnId);
    if (action.type === 'toggle_time_tracking') {
      const actorName = user?.name || 'Bilinmeyen';
      const actor: Omit<Activity, 'id' | 'text' | 'date' | 'type' | 'action'> = {
        userId: user?.id,
        user: actorName,
        initials: getInitials(actorName),
        color: 'bg-indigo-700',
      };
      const activities = task.activities || [];
      let enabled: boolean | null = null;
      for (const a of activities) {
        const act = a.action || '';
        if (act === 'work:enable') enabled = true;
        else if (act === 'work:disable') enabled = false;
      }
      const nextEnabled = !enabled;
      const nextActivity: Activity = {
        id: Date.now().toString(),
        text: nextEnabled ? 'zaman takibini açtı' : 'zaman takibini kapattı',
        action: nextEnabled ? 'work:enable' : 'work:disable',
        ...actor,
        date: new Date().toISOString(),
        type: 'activity',
      };
      const nextActivities = [nextActivity, ...(task.activities || [])];
      setTasksSafe((prev) =>
        prev.map(t => {
          if (t.id === task.id) return { ...t, activities: nextActivities };
          if (task.mirrorGroupId && t.mirrorGroupId === task.mirrorGroupId) {
            return { ...t, activities: nextActivities };
          }
          return t;
        }),
      );
      try {
        await api.patch(`/tasks/${task.id}`, { activities: nextActivities });
      } catch (error) {
        console.error('Zaman takibi durumu güncellenemedi:', error);
        fetchTasks();
      }
      return;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTask = async (title: string, columnId: string) => {
    try {
      const nextOrder = getNextOrderForStatus(columnId);
      const payload: any = {
        title,
        priority: 'MEDIUM',
        order: nextOrder,
      };

      if (groupBy === 'status') {
         payload.status = columnId;
      } else if (groupBy === 'assignee') {
         payload.status = 'TODO';
         if (columnId !== 'unassigned') payload.assigneeId = columnId;
      } else if (groupBy === 'project') {
         payload.status = 'TODO';
         if (columnId !== 'no_project') payload.projectId = columnId;
      }

      const response = await api.post('/tasks', payload);
      // Add the new task to the state immediately
      console.log('[tasks] created via REST', { taskId: response.data?.id, status: response.data?.status });
      setTasksSafe((prev) => [...prev, response.data]);
    } catch (error) {
      console.error('Görev oluşturulamadı:', error);
    }
  };

  const handleAddColumn = () => {
    if (groupBy !== 'status') return;
    const newColumnId = `col-${Date.now()}`;
    const newColumn = { id: newColumnId, title: 'Yeni Liste', archived: false };
    const newColumns = [...columns, newColumn];
    persistColumns(newColumns);
  };

  if (loading) return <div className="py-12 text-center text-sm text-muted-foreground">Yükleniyor...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[28px] font-normal tracking-[-0.03em] text-foreground">
            Görev Yönetimi
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Proje süreçlerini kanban, tablo veya takvim görünümünde yönetin.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-muted px-1 py-1 rounded-full border border-border/60">
            <button
              onClick={() => setCurrentView('board')}
              className={`p-2 rounded-md transition-colors ${
                currentView === 'board'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Pano"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentView('table')}
              className={`p-2 rounded-md transition-colors ${
                currentView === 'table'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Tablo"
            >
              <TableIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentView('calendar')}
              className={`p-2 rounded-md transition-colors ${
                currentView === 'calendar'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Takvim"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentView('timeline')}
              className={`p-2 rounded-md transition-colors ${
                currentView === 'timeline'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Zaman Çizelgesi"
            >
              <ListStart className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`p-2 rounded-md transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Gösterge Panosu"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setIsArchiveOpen(true)}
              title="Arşiv"
            >
              <Archive className="h-4 w-4" /> Arşiv
            </Button>
            <div className="flex items-center gap-1 bg-muted px-1 py-1 rounded-full border border-border/60">
              <button
                onClick={() => {
                  setGroupBy('status');
                }}
                className={`px-2 py-1 rounded-md text-xs ${
                  groupBy === 'status' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Duruma göre"
              >
                Durum
              </button>
              <button
                onClick={() => {
                  setGroupBy('assignee');
                  if (teamMembers.length === 0) fetchTeamMembers();
                }}
                className={`px-2 py-1 rounded-md text-xs ${
                  groupBy === 'assignee' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Personel göre"
              >
                Personel
              </button>
              <button
                onClick={() => {
                  setGroupBy('project');
                  if (projects.length === 0) fetchProjectsList();
                }}
                className={`px-2 py-1 rounded-md text-xs ${
                  groupBy === 'project' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Proje göre"
              >
                Proje
              </button>
            </div>
          </div>
        </div>
      </div>

      {isArchiveOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/25"
            onClick={() => setIsArchiveOpen(false)}
          />
          <div className="absolute inset-x-0 top-10 mx-auto w-[800px] bg-card rounded-xl shadow-2xl border border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-foreground font-semibold">Arşiv</h2>
              </div>
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setIsArchiveOpen(false)}
                title="Kapat"
              >
                ✕
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Arşivlenmiş Sütunlar</h3>
                {archivedColumns.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Arşivlenmiş sütun yok.</div>
                ) : (
                  <div className="space-y-2">
                    {archivedColumns.map((col) => (
                      <div
                        key={col.id}
                        className="flex items-center justify-between px-3 py-2 bg-muted rounded-lg border border-border"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{col.title}</div>
                          <div className="text-[11px] text-muted-foreground">ID: {col.id}</div>
                        </div>
                        <button
                          className="text-sm px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1"
                          onClick={() => unarchiveColumn(col.id)}
                          title="Arşivden çıkar"
                        >
                          <RotateCcw className="h-4 w-4" /> Geri Al
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Arşivlenmiş Kartlar</h3>
                {archivedTasks.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Arşivlenmiş kart yok.</div>
                ) : (
                  <div className="space-y-2">
                    {archivedTasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between px-3 py-2 bg-muted rounded-lg border border-border"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{t.title}</div>
                          <div className="text-[11px] text-muted-foreground">#{t.id}</div>
                        </div>
                        <button
                          className="text-sm px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1"
                          onClick={() => restoreArchivedTask(t.id)}
                          title="Arşivden çıkar"
                        >
                          <RotateCcw className="h-4 w-4" /> Geri Yükle
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {currentView === 'board' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-board flex gap-8 overflow-x-auto pb-5 flex-1">
            {(groupBy === 'assignee'
              ? [{ id: 'unassigned', title: 'Atanmamış', archived: false }, ...teamMembers.map((u) => ({ id: u.id, title: u.name, archived: false }))]
              : groupBy === 'project'
              ? [{ id: 'no_project', title: 'Projesiz', archived: false }, ...projects.map((p) => ({ id: p.id, title: p.name, archived: false }))]
              : columns.filter(c => !c.archived)
            ).map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                columns={activeColumns}
                tasks={tasksByStatus[column.id] || []}
                onAddTask={handleAddTask}
                onUpdateTitle={groupBy === 'status' ? updateColumnTitle : () => {}}
                onToggleStatus={handleToggleStatus}
                onEditTask={handleEditTask}
                onTaskContextAction={handleTaskContextAction}
                onArchiveColumn={groupBy === 'status' ? handleArchiveColumn : () => {}}
                onDeleteColumn={groupBy === 'status' ? handleDeleteColumn : () => {}}
                onTrackTime={handleTrackTime}
                onToggleWatchColumn={toggleWatchColumn}
                isWatching={watchedColumns.includes(column.id)}
                currentUserId={user?.id}
              />
            ))}
            {groupBy === 'status' && (
              <div className="flex-shrink-0 w-80">
                <button
                  onClick={handleAddColumn}
                  className="w-full h-12 border-2 border-dashed border-border/60 rounded-lg text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="h-5 w-5" /> Liste Ekle
                </button>
              </div>
            )}
          </div>

          <DragOverlay>
            {activeTask ? <SortableTaskCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      ) : currentView === 'table' ? (
        <TableView tasks={tasks} columns={activeColumns} onTaskClick={handleEditTask} />
      ) : currentView === 'calendar' ? (
        <CalendarView tasks={tasks} columns={activeColumns} onTaskClick={handleEditTask} />
      ) : currentView === 'timeline' ? (
        <TimelineView tasks={tasks} columns={activeColumns} onTaskClick={handleEditTask} />
      ) : (
        <DashboardView tasks={tasks} columns={activeColumns} />
      )}

      <TaskDetailModal 
        task={selectedTask} 
        isOpen={isDetailModalOpen} 
        onClose={closeTaskModal} 
        columnTitle={selectedTask ? columns.find(c => c.id === selectedTask.status)?.title : ''}
        columns={activeColumns}
        initialPopover={detailModalInitialPopover}
        autoOpenFilePicker={detailModalAutoOpenFilePicker}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
}
