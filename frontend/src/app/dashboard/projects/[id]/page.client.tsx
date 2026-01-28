'use client';

import { useState, useEffect, useRef, use, useMemo } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import {
  ArrowLeft,
  Calendar,
  Layout,
  Loader2,
  Plus,
  Settings,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Task, Activity } from '../../tasks/types';
import { BoardColumn } from '../../tasks/board-column';
import { SortableTaskCard } from '../../tasks/task-card';
import { TaskDetailModal } from '../../tasks/task-detail-modal';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

const ORDER_STEP = 1024;
const ORDER_START = ORDER_STEP;

const COLUMNS = [
  { id: 'TODO', title: 'Yapılacaklar', archived: false },
  { id: 'IN_PROGRESS', title: 'Devam Edenler', archived: false },
  { id: 'REVIEW', title: 'İncelemede', archived: false },
  { id: 'DONE', title: 'Tamamlandı', archived: false },
];

export default function ProjectDetailClient() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const tasksRef = useRef<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const dragStartTaskRef = useRef<Task | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const selectedTaskRef = useRef<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const openedFromUrlRef = useRef(false);

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

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    selectedTaskRef.current = selectedTask;
  }, [selectedTask]);

  useEffect(() => {
    if (!id) return;
    fetchProject();
    fetchTasks();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
    } catch (error) {
      console.error('Proje yüklenemedi:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks', { params: { projectId: id } });
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Görevler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Socket connection
  useEffect(() => {
    if (!user?.id || !id) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL + '/tasks', {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[project socket] connect');
    });

    socket.on('tasks:created', ({ task }: { task: Task }) => {
      if (task.projectId === id) {
        setTasks((prev) => [...prev, task]);
      }
    });

    socket.on('tasks:updated', ({ task }: { task: Task }) => {
      if (task.projectId === id || tasksRef.current.some(t => t.id === task.id)) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        setSelectedTask((prev) => (prev?.id === task.id ? task : prev));
      }
    });

    socket.on('tasks:deleted', ({ taskId }: { taskId: string }) => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        if (selectedTaskRef.current?.id === taskId) {
            closeTaskModal();
        }
    });

    socket.on('tasks:reordered', ({ taskIds }: { taskIds: string[] }) => {
       // Ideally we should re-fetch or apply reordering if we have all tasks
       // For simplicity in this view, we might just re-fetch or ignore if we don't implement full reordering logic locally
       // But drag-drop updates state optimistically, so this is for other users.
       // Let's simplified reorder apply:
       setTasks((prev) => {
         const orderById = new Map(taskIds.map((id, index) => [id, index]));
         return prev.map((t) =>
           orderById.has(t.id) ? { ...t, order: orderById.get(t.id)! } : t
         );
       });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, id]);

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

  const openTaskModal = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
    updateUrl(task.id);
  };

  const closeTaskModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTask(null);
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
    if (t) {
      openedFromUrlRef.current = true;
      openTaskModal(t);
    }
  }, [searchParams, tasks, loading, isDetailModalOpen, selectedTask]);


  // DND Handlers
  const handleDragStart = (event: any) => {
    const { active } = event;
    const realId = String(active.id).split('::')[0];
    const task = tasksRef.current.find((t) => t.id === realId);
    if (task) {
      setActiveTask(task);
      dragStartTaskRef.current = task;
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const [activeTaskId, sourceColumnId] = String(active.id).split('::');
    const overIdStr = String(over.id);
    const isOverAColumn = COLUMNS.some((col) => col.id === overIdStr);
    
    let targetColumnId: string | null = null;
    let overTaskId: string | null = null;

    if (isOverAColumn) {
      targetColumnId = overIdStr;
    } else {
      const parts = overIdStr.split('::');
      overTaskId = parts[0];
      targetColumnId = parts[1] || null;
    }

    if (!targetColumnId) return;
    if (activeTaskId === overTaskId) return;

    const startTask = dragStartTaskRef.current || tasksRef.current.find((t) => t.id === activeTaskId);
    if (!startTask) return;

    const targetStatus = targetColumnId;
    
    // Sort tasks in target column
    const targetTasks = tasksRef.current
        .filter(t => t.status === targetStatus && t.id !== activeTaskId)
        .sort((a, b) => a.order - b.order);

    let newOrder: number;
    let targetInsertIndex = targetTasks.length;
    
    if (overTaskId) {
        const idx = targetTasks.findIndex(t => t.id === overTaskId);
        if (idx !== -1) targetInsertIndex = idx;
    }

    const left = targetTasks[targetInsertIndex - 1];
    const right = targetTasks[targetInsertIndex];

    if (!left && !right) {
      newOrder = ORDER_START;
    } else if (!left && right) {
      newOrder = (right.order) / 2;
    } else if (left && !right) {
      newOrder = (left.order) + ORDER_STEP;
    } else {
      newOrder = ((left.order) + (right.order)) / 2;
    }

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeTaskId ? { ...t, status: targetStatus, order: newOrder } : t
      )
    );

    try {
      await api.patch(`/tasks/${activeTaskId}`, { status: targetStatus, order: newOrder });
    } catch (e) {
      console.error('Task move failed:', e);
      fetchTasks();
    }
    dragStartTaskRef.current = null;
  };

  const tasksByStatus = useMemo(() => {
    const buckets: Record<string, Task[]> = {};
    for (const col of COLUMNS) buckets[col.id] = [];
    
    for (const t of tasks) {
      if (buckets[t.status]) {
        buckets[t.status].push(t);
      } else {
        // Handle tasks with status not in COLUMNS (e.g. archived or custom)
        // For now, maybe push to TODO or ignore?
        // Let's ignore if not in columns, or put in first column
      }
    }
    for (const k of Object.keys(buckets)) {
      buckets[k].sort((a, b) => a.order - b.order);
    }
    return buckets;
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-12">Proje bulunamadı.</div>;
  }

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'PLANNING': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Planlama</Badge>;
          case 'IN_PROGRESS': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Devam Ediyor</Badge>;
          case 'COMPLETED': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Tamamlandı</Badge>;
          case 'ON_HOLD': return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Beklemede</Badge>;
          default: return <Badge variant="outline">{status}</Badge>;
      }
  }

  const handleAddTask = async (title: string, columnId: string) => {
    try {
      const response = await api.post('/tasks', {
        title,
        status: columnId,
        projectId: id,
        order: ORDER_START // Simplified order for now
      });
      setTasks(prev => [...prev, response.data]);
    } catch (e) {
      console.error('Task create failed:', e);
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
      // Toggle logic similar to TasksPage but simplified
      // For now, let's just assume moving to DONE or TODO
      const target = currentStatus === 'DONE' ? 'TODO' : 'DONE';
      try {
          await api.patch(`/tasks/${taskId}`, { status: target });
          setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: target } : t));
      } catch(e) {
          console.error(e);
      }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.history.back()}
            className="rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 size-10 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
                {getStatusBadge(project.status)}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
                {project.customer && (
                    <span className="flex items-center gap-1">
                        <Layout className="h-3.5 w-3.5" />
                        {project.customer.name}
                    </span>
                )}
                <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(project.createdAt).toLocaleDateString('tr-TR')}
                </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                <Settings className="h-4 w-4" /> Ayarlar
            </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full gap-4 pb-4 min-w-max">
                {COLUMNS.map((col) => (
                    <BoardColumn
                        key={col.id}
                        column={col}
                        columns={COLUMNS}
                        tasks={tasksByStatus[col.id] || []}
                        onAddTask={handleAddTask}
                        onUpdateTitle={() => {}}
                        onToggleStatus={handleToggleStatus}
                        onEditTask={openTaskModal}
                        onTaskContextAction={() => {}}
                        onArchiveColumn={() => {}}
                        onDeleteColumn={() => {}}
                        onTrackTime={() => {}}
                        currentUserId={user?.id}
                    />
                ))}
            </div>
            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({}) }}>
                {activeTask ? (
                    <SortableTaskCard 
                        task={activeTask} 
                        isOverlay 
                        onToggleStatus={() => {}}
                        onEdit={() => {}}
                        columns={COLUMNS}
                        onContextAction={() => {}}
                        onTrackTime={() => {}}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
      </div>

      {isDetailModalOpen && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={isDetailModalOpen}
          onClose={closeTaskModal}
          initialPopover={null}
          autoOpenFilePicker={false}
        />
      )}
    </div>
  );
}
