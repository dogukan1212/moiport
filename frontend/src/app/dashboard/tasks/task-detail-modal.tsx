 'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MoreHorizontal, 
  Image as ImageIcon, 
  AlignLeft, 
  CheckSquare, 
  Plus, 
  Circle,
  CheckCircle2,
  Clock, 
  Play,
  Pause,
  StopCircle,
  Users, 
  Archive,
  Tag, 
  Layout,
  ChevronDown,
  CreditCard,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import { createPortal } from 'react-dom';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  assigneeId?: string;
  dueDate?: string;
}

interface ChecklistGroup {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface Comment {
  id: string;
  text: string;
  parentId?: string;
  userId?: string;
  user: string;
  initials: string;
  color: string;
  date: string;
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

interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
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
  coverColor?: string;
  assignee?: {
    name: string;
  };
  labels?: string[];
  checklist?: ChecklistItem[] | ChecklistGroup[];
  checklistTotal?: number;
  checklistCompleted?: number;
  members?: string[];
  memberCount?: number;
  watchers?: string[];
  dueDate?: string;
  attachments?: Attachment[];
  attachmentCount?: number;
  comments?: Comment[];
  activities?: Activity[];
}

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  columnTitle?: string;
  columns?: Array<{ id: string; title: string }>;
  initialPopover?: 'labels' | 'members' | 'date' | 'column' | 'cover' | null;
  autoOpenFilePicker?: boolean;
  onUpdateTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  columnTitle = 'Bekleyenler',
  columns,
  initialPopover = null,
  autoOpenFilePicker = false,
  onUpdateTask,
  onDeleteTask,
}: TaskDetailModalProps) {
  const { user } = useAuth();
  const coverColors = [
    '#b91c1c',
    '#c2410c',
    '#a16207',
    '#15803d',
    '#0f766e',
    '#0369a1',
    '#4338ca',
    '#6d28d9',
    '#be185d',
    '#334155',
  ];
  const [title, setTitle] = useState('');
  const [savedTitle, setSavedTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [description, setDescription] = useState('');
  const [savedDescription, setSavedDescription] = useState('');
  const [status, setStatus] = useState<string>('TODO');
  const [isCompleted, setIsCompleted] = useState(false);
  const [checklists, setChecklists] = useState<ChecklistGroup[]>([]);
  const [isAddingChecklistGroup, setIsAddingChecklistGroup] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [addingItemChecklistId, setAddingItemChecklistId] = useState<string | null>(null);
  const [newChecklistItemText, setNewChecklistItemText] = useState('');

  const [labels, setLabels] = useState([
    { id: '1', name: 'Acil', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    { id: '2', name: 'Tasarım', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    { id: '3', name: 'Yazılım', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    { id: '4', name: 'Onay Bekliyor', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  ]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>('');
  const [coverColor, setCoverColor] = useState<string>('');
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [watchers, setWatchers] = useState<string[]>([]);
  const [activePopover, setActivePopover] = useState<'labels' | 'date' | 'members' | 'column' | 'cover' | 'menu' | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [brandPopoverOpen, setBrandPopoverOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [brandName, setBrandName] = useState<string>('');
  
  const [activeChecklistItemId, setActiveChecklistItemId] = useState<string | null>(null);
  const [activeChecklistAction, setActiveChecklistAction] = useState<'assign' | 'date' | null>(null);
  const [activeChecklistGroupId, setActiveChecklistGroupId] = useState<string | null>(null);
  const checklistActionRef = useRef<HTMLDivElement>(null);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<'comments' | 'activities'>('comments');

  // Mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number | null>(null);
  const [mentionFilteredMembers, setMentionFilteredMembers] = useState<any[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionCoords, setMentionCoords] = useState<{ top: number; left: number } | null>(null);

  const labelPickerRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const memberPickerRef = useRef<HTMLDivElement>(null);
  const columnPickerRef = useRef<HTMLDivElement>(null);
  const coverPickerRef = useRef<HTMLDivElement>(null);
  const menuPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const taskRef = useRef<Task | null>(null);
  const onUpdateTaskRef = useRef<TaskDetailModalProps['onUpdateTask']>(undefined);
  const lastViewedKeyRef = useRef<string | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const appliedInitialKeyRef = useRef<string | null>(null);
  const openedAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (isOpen) openedAtRef.current = Date.now();
    else openedAtRef.current = null;
  }, [isOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  const togglePopover = (popover: 'labels' | 'date' | 'members' | 'column' | 'cover' | 'menu') => {
    setActivePopover(current => current === popover ? null : popover);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (labelPickerRef.current && !labelPickerRef.current.contains(event.target as Node)) {
        if (activePopover === 'labels') setActivePopover(null);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        if (activePopover === 'date') setActivePopover(null);
      }
      if (memberPickerRef.current && !memberPickerRef.current.contains(event.target as Node)) {
        if (activePopover === 'members') setActivePopover(null);
      }
      if (columnPickerRef.current && !columnPickerRef.current.contains(event.target as Node)) {
        if (activePopover === 'column') setActivePopover(null);
      }
      if (coverPickerRef.current && !coverPickerRef.current.contains(event.target as Node)) {
        if (activePopover === 'cover') setActivePopover(null);
      }
      if (menuPickerRef.current && !menuPickerRef.current.contains(event.target as Node)) {
        if (activePopover === 'menu') setActivePopover(null);
      }
      if (checklistActionRef.current && !checklistActionRef.current.contains(event.target as Node)) {
        setActiveChecklistAction(null);
        setActiveChecklistItemId(null);
        setActiveChecklistGroupId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activePopover]);

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
    return initials || '??';
  };

  const formatDateTime = (dateStr: string) => {
    const t = Date.parse(dateStr);
    if (Number.isNaN(t)) return dateStr;
    return new Date(t).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const parseDate = (dateStr: string) => {
    const t = Date.parse(dateStr);
    return Number.isNaN(t) ? 0 : t;
  };

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

  const getIsCompletedFromActivities = (list: Activity[]) => {
    let last: Activity | null = null;
    for (const a of list) {
      if (a?.type !== 'activity') continue;
      if (a.action !== 'completed' && a.action !== 'uncompleted') continue;
      if (!last) {
        last = a;
        continue;
      }
      if (parseDate(a.date) > parseDate(last.date)) last = a;
    }
    if (!last) return false;
    return last.action === 'completed';
  };

  const normalizeChecklists = (raw: any): ChecklistGroup[] => {
    if (!Array.isArray(raw)) return [];
    if (raw.length === 0) return [];
    const first = raw[0];
    if (first && typeof first === 'object' && Array.isArray(first.items)) {
      return raw
        .filter((g: any) => g && typeof g === 'object')
        .map((g: any) => ({
          id: String(g.id || (Date.now().toString() + Math.random().toString(36).substring(2, 9))),
          title: typeof g.title === 'string' && g.title.trim() ? g.title : 'Kontrol Listesi',
          items: Array.isArray(g.items) ? g.items : [],
        }));
    }
    return [
      {
        id: 'default',
        title: 'Kontrol Listesi',
        items: raw as ChecklistItem[],
      },
    ];
  };

  const getChecklistTotals = (lists: ChecklistGroup[]) => {
    const total = lists.reduce((acc, cl) => acc + (cl.items?.length || 0), 0);
    const completed = lists.reduce((acc, cl) => acc + (cl.items?.filter(i => i.completed).length || 0), 0);
    return { total, completed };
  };

  const actor = {
    userId: user?.id,
    user: user?.name || 'Bilinmeyen',
    initials: getInitials(user?.name || 'Bilinmeyen'),
    color: 'bg-green-700',
  };

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await api.get('/users/list');
        const users = (res.data || []) as Array<{ id: string; name: string; email?: string }>;
        const palette = ['bg-blue-600', 'bg-emerald-600', 'bg-indigo-600', 'bg-rose-600', 'bg-amber-600', 'bg-violet-600', 'bg-cyan-600'];

        const mapped = users.map((u, idx) => ({
          id: u.id,
          name: u.name,
          initials: getInitials(u.name),
          color: palette[idx % palette.length],
          email: u.email,
        }));

        if (!cancelled) setMembers(mapped);
      } catch {
        // Fallback for older API or if users/list fails, try tenants/me but only if role allows (caught by 403)
        // Actually tenants/me is restricted, so we just set empty if users/list fails or maybe try catch block logic
        if (!cancelled) setMembers([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const initializedTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !task?.id) {
      initializedTaskIdRef.current = null;
      return;
    }

    if (initializedTaskIdRef.current === task.id) return;
    initializedTaskIdRef.current = task.id;

    setTitle(task.title || '');
    setSavedTitle(task.title || '');
    setIsEditingTitle(false);
    setDescription(task.description || '');
    setSavedDescription(task.description || '');
    setStatus(task.status);
    setIsCompleted(getIsCompletedFromActivities(task.activities || []));
    setSelectedLabels(task.labels || []);
    setDueDate(task.dueDate || '');
    setCoverColor(task.coverColor || '');
    setChecklists(normalizeChecklists(task.checklist || []));
    setSelectedMembers(task.members || []);
    setWatchers(task.watchers || []);
    setAttachments(Array.isArray(task.attachments) ? task.attachments : []);
    setComments(Array.isArray(task.comments) ? task.comments : []);
    setActivities(task.activities || []);
    setRightTab('comments');
    setNewComment('');
    setReplyToCommentId(null);
    setAddingItemChecklistId(null);
    setNewChecklistItemText('');
    setIsAddingChecklistGroup(false);
    setNewChecklistTitle('');
    setActivePopover(null);
    appliedInitialKeyRef.current = null;
    lastViewedKeyRef.current = null;
  }, [isOpen, task?.id]);

  useEffect(() => {
    if (!isOpen || !task?.id) return;
    const key = `${task.id}:${initialPopover || 'none'}:${autoOpenFilePicker ? 'upload' : 'no-upload'}`;
    if (appliedInitialKeyRef.current === key) return;
    appliedInitialKeyRef.current = key;
    if (initialPopover) setActivePopover(initialPopover);
    if (autoOpenFilePicker) {
      requestAnimationFrame(() => {
        fileInputRef.current?.click();
      });
    }
  }, [isOpen, task?.id, initialPopover, autoOpenFilePicker]);

  useEffect(() => {
    if (!isOpen) return;
    if (user?.role === 'CLIENT') return;
    api.get('/customers')
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        setCustomers(list);
      })
      .catch(() => {});
  }, [isOpen, user?.role]);

  useEffect(() => {
    if (!isOpen) return;
    if (user?.role === 'CLIENT') return;
    const pid = (taskRef.current || task)?.projectId;
    if (!pid) {
      setBrandName('');
      return;
    }
    api.get(`/projects/${pid}`)
      .then(res => {
        const prj = res.data || {};
        const name = prj?.customer?.name || prj?.name || '';
        setBrandName(typeof name === 'string' ? name : '');
      })
      .catch(() => {
        setBrandName('');
      });
  }, [isOpen, user?.role, task?.projectId]);
  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  useEffect(() => {
    onUpdateTaskRef.current = onUpdateTask;
  }, [onUpdateTask]);

  const [tick, setTick] = useState(0);
  const timeTrackingEnabled = (() => {
    let enabled: boolean | null = null;
    for (const a of activities) {
      const act = a.action || '';
      if (act === 'work:enable') enabled = true;
      else if (act === 'work:disable') enabled = false;
    }
    return !!enabled;
  })();
  const [isTimeDetailsOpen, setIsTimeDetailsOpen] = useState(false);

  const workDetails = (() => {
    const list = activities.slice().sort((a, b) => parseDate(a.date) - parseDate(b.date));
    const users = new Map<string, { id: string; name: string; initials: string; color: string }>();
    for (const m of members) {
      users.set(m.id, { id: m.id, name: m.name, initials: m.initials, color: m.color });
    }
    const totals = new Map<string, number>();
    const running = new Map<string, number | null>();
    const runningStartAction = new Map<string, 'start' | 'resume' | null>();
    const segments: Array<{ userId: string; start: number; end: number; running: boolean; startAction: 'start' | 'resume' | null; endAction: 'pause' | 'stop' | 'running' | null }> = [];
    for (const a of list) {
      const uid = a.userId || 'unknown';
      if (!totals.has(uid)) totals.set(uid, 0);
      if (!running.has(uid)) running.set(uid, null);
      const ts = parseDate(a.date);
      const act = a.action || '';
      if (act === 'work:start' || act === 'work:resume') {
        if (running.get(uid) == null) {
          running.set(uid, ts);
          runningStartAction.set(uid, act === 'work:start' ? 'start' : 'resume');
        }
      } else if (act === 'work:pause' || act === 'work:stop') {
        const startTs = running.get(uid);
        if (typeof startTs === 'number' && Number.isFinite(startTs) && ts > startTs) {
          totals.set(uid, (totals.get(uid) || 0) + Math.floor((ts - startTs) / 1000));
          segments.push({ userId: uid, start: startTs, end: ts, running: false, startAction: runningStartAction.get(uid) || 'start', endAction: act === 'work:pause' ? 'pause' : 'stop' });
        }
        running.set(uid, null);
        runningStartAction.set(uid, null);
      }
    }
    const now = Date.now();
    for (const [uid, startTs] of running.entries()) {
      if (typeof startTs === 'number' && Number.isFinite(startTs)) {
        totals.set(uid, (totals.get(uid) || 0) + Math.floor((now - startTs) / 1000));
        segments.push({ userId: uid, start: startTs, end: now, running: true, startAction: runningStartAction.get(uid) || 'start', endAction: 'running' });
      }
    }
    const firstLast = new Map<string, { firstStart: number | null; lastEnd: number | null }>();
    for (const seg of segments) {
      const prev = firstLast.get(seg.userId) || { firstStart: null, lastEnd: null };
      const firstStart =
        prev.firstStart == null ? seg.start : Math.min(prev.firstStart, seg.start);
      const endTs = seg.running ? now : seg.end;
      const lastEnd =
        prev.lastEnd == null ? endTs : Math.max(prev.lastEnd, endTs);
      firstLast.set(seg.userId, { firstStart, lastEnd });
    }
    const myUid = actor.userId || 'unknown';
    const mySeconds = totals.get(myUid) || 0;
    const isMyRunning = typeof (running.get(myUid) ?? null) === 'number';
    const perUser = Array.from(totals.entries()).map(([uid, secs]) => {
      const u = users.get(uid);
      const name = u?.name || (uid === 'unknown' ? 'Bilinmeyen' : uid);
      const initials = u?.initials || '??';
      const color = u?.color || 'bg-slate-600';
      const isRunning = typeof (running.get(uid) ?? null) === 'number';
      const fl = firstLast.get(uid) || { firstStart: null, lastEnd: null };
      return { userId: uid, name, initials, color, totalSeconds: secs, isRunning, firstStart: fl.firstStart, lastEnd: fl.lastEnd };
    });
    segments.sort((a, b) => b.end - a.end);
    return { mySeconds, isMyRunning, perUser, segments };
  })();

  const anyRunning = workDetails.perUser.some(u => u.isRunning);
  useEffect(() => {
    if (!anyRunning) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      window.clearInterval(id);
    };
  }, [anyRunning]);

  const lastMyWorkAction = (() => {
    const myUid = actor.userId || 'unknown';
    for (let i = activities.length - 1; i >= 0; i--) {
      const a = activities[i];
      if ((a.userId || 'unknown') !== myUid) continue;
      const act = a.action || '';
      if (act.startsWith('work:')) return act;
    }
    return '';
  })();

  useEffect(() => {
    const currentTask = taskRef.current;
    const updateTask = onUpdateTaskRef.current;
    if (currentTask && updateTask) {
      const { total, completed } = getChecklistTotals(checklists);
      
      // Determine assigneeId based on members
      // If current assignee is still in members, keep them.
      // If not (removed or didn't exist), assign the first member.
      // If no members, remove assignee.
      const currentAssigneeId = currentTask.assigneeId;
      const nextAssigneeId = (currentAssigneeId && selectedMembers.includes(currentAssigneeId))
        ? currentAssigneeId
        : (selectedMembers.length > 0 ? selectedMembers[0] : null);

      updateTask({
        ...currentTask,
        title,
        status,
        description,
        labels: selectedLabels,
        dueDate,
        coverColor,
        checklist: checklists,
        checklistTotal: total,
        checklistCompleted: completed,
        members: selectedMembers,
        memberCount: selectedMembers.length,
        assigneeId: nextAssigneeId as any, // Cast to any to allow null if type is strict
        watchers,
        attachments,
        attachmentCount: attachments.length,
        comments,
        activities,
      });
    }
  }, [title, status, description, selectedLabels, dueDate, coverColor, checklists, selectedMembers, watchers, attachments, comments, activities]);

  const logActivity = (text: string, action?: Activity['action']) => {
    const activity: Activity = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      text,
      action,
      userId: actor.userId,
      user: actor.user,
      initials: actor.initials,
      color: actor.color,
      date: new Date().toISOString(),
      type: 'activity',
    };
    setActivities(prev => [activity, ...prev]);
  };

  useEffect(() => {
    if (!isOpen || !task?.id) return;
    const key = `${task.id}:${actor.userId || actor.user}`;
    if (lastViewedKeyRef.current === key) return;
    lastViewedKeyRef.current = key;
    logActivity('kartı görüntüledi');
  }, [isOpen, task?.id, actor.userId, actor.user]);

  useEffect(() => {
    if (!replyToCommentId) return;
    commentInputRef.current?.focus();
  }, [replyToCommentId]);

  useEffect(() => {
    if (activePopover !== 'date') return;
    requestAnimationFrame(() => {
      const input = dateInputRef.current as
        | (HTMLInputElement & { showPicker?: () => void })
        | null;
      if (!input) return;
      // Modern browsers (Chromium) support showPicker for date inputs
      // Fallback to focus if not available
      if (typeof input.showPicker === 'function') {
        input.showPicker();
      } else {
        input.focus();
      }
    });
  }, [activePopover]);

  const availableColumns =
    columns && columns.length > 0
      ? columns
      : [
          { id: 'TODO', title: 'Yapılacaklar' },
          { id: 'IN_PROGRESS', title: 'Devam Edenler' },
          { id: 'REVIEW', title: 'İncelemede' },
          { id: 'DONE', title: 'Tamamlandı' },
        ];

  const currentColumnTitle =
    availableColumns.find(c => c.id === status)?.title || columnTitle || status;

  const handleSaveTitle = () => {
    const next = title.trim();
    if (!next) {
      setTitle(savedTitle);
      setIsEditingTitle(false);
      return;
    }
    setIsEditingTitle(false);
    if (next !== (savedTitle || '').trim()) {
      setSavedTitle(next);
      setTitle(next);
      logActivity('kart adını güncelledi');
    }
  };

  const handleCancelTitle = () => {
    setTitle(savedTitle);
    setIsEditingTitle(false);
  };

  const toggleDone = () => {
    setIsCompleted(prev => {
      const next = !prev;
      logActivity(next ? 'kartı tamamladı' : 'kartı tekrar açtı', next ? 'completed' : 'uncompleted');
      setStatus(next ? 'DONE' : 'TODO');
      return next;
    });
  };

  const completeWithSms = async () => {
    if (user?.role === 'CLIENT') return;
    const id = (taskRef.current || task)?.id;
    if (!id) return;
    try {
      await api.patch(`/tasks/${id}`, { status: 'DONE', sendSmsOnCompletion: true });
      setIsCompleted(true);
      setStatus('DONE');
      logActivity('kartı tamamladı', 'completed');
    } catch {
      toggleDone();
    }
  };

  const changeColumn = (nextStatus: string) => {
    if (nextStatus === status) {
      setActivePopover(null);
      return;
    }
    const nextTitle = availableColumns.find(c => c.id === nextStatus)?.title || nextStatus;
    setStatus(nextStatus);
    setActivePopover(null);
    logActivity(`sütunu "${nextTitle}" olarak değiştirdi`);
  };

  const addChecklistGroup = (title: string) => {
    const t = title.trim() || 'Kontrol Listesi';
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    setChecklists(prev => [...prev, { id, title: t, items: [] }]);
    logActivity(`"${t}" kontrol listesi eklendi`);
  };

  const updateChecklistTitle = (checklistId: string, title: string) => {
    setChecklists(prev => prev.map(cl => (cl.id === checklistId ? { ...cl, title } : cl)));
  };

  const deleteChecklistGroup = (checklistId: string) => {
    const title = checklists.find(cl => cl.id === checklistId)?.title;
    setChecklists(prev => prev.filter(cl => cl.id !== checklistId));
    if (addingItemChecklistId === checklistId) {
      setAddingItemChecklistId(null);
      setNewChecklistItemText('');
    }
    if (title) logActivity(`"${title}" kontrol listesi silindi`);
  };

  const toggleChecklistItem = (checklistId: string, itemId: string) => {
    const item = checklists.find(cl => cl.id === checklistId)?.items.find(i => i.id === itemId);
    setChecklists(prev =>
      prev.map(cl => {
        if (cl.id !== checklistId) return cl;
        return {
          ...cl,
          items: cl.items.map(i => (i.id === itemId ? { ...i, completed: !i.completed } : i)),
        };
      }),
    );
    if (item?.text) {
      logActivity(`"${item.text}" ${item.completed ? 'işareti kaldırıldı' : 'tamamlandı'}`);
    }
  };

  const addChecklistItemToGroup = (checklistId: string, text: string) => {
    const t = text.trim();
    if (!t) return;
    setChecklists(prev =>
      prev.map(cl => {
        if (cl.id !== checklistId) return cl;
        const newItem: ChecklistItem = { id: Date.now().toString() + Math.random().toString(36).substring(2, 9), text: t, completed: false };
        return { ...cl, items: [...cl.items, newItem] };
      }),
    );
    logActivity(`Kontrol listesine "${t}" eklendi`);
  };

  const deleteChecklistItemFromGroup = (checklistId: string, itemId: string) => {
    const itemText = checklists.find(cl => cl.id === checklistId)?.items.find(i => i.id === itemId)?.text;
    setChecklists(prev =>
      prev.map(cl => {
        if (cl.id !== checklistId) return cl;
        return { ...cl, items: cl.items.filter(i => i.id !== itemId) };
      }),
    );
    if (itemText) logActivity(`Kontrol listesinden "${itemText}" silindi`);
  };

  const updateChecklistItemAssignee = (groupId: string, itemId: string, assigneeId: string | undefined) => {
    setChecklists(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        items: g.items.map(i => {
          if (i.id !== itemId) return i;
          return { ...i, assigneeId };
        })
      };
    }));
    logActivity(assigneeId ? 'kontrol listesi maddesine üye atadı' : 'kontrol listesi maddesinden üyeyi kaldırdı');
  };

  const updateChecklistItemDueDate = (groupId: string, itemId: string, date: string | undefined) => {
    setChecklists(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        items: g.items.map(i => {
          if (i.id !== itemId) return i;
          return { ...i, dueDate: date };
        })
      };
    }));
    logActivity(date ? 'kontrol listesi maddesine tarih ekledi' : 'kontrol listesi maddesinden tarihi kaldırdı');
  };

  const handleSaveDescription = () => {
    setIsEditingDescription(false);
    if (description.trim() !== (savedDescription || '').trim()) {
      setSavedDescription(description);
      logActivity('açıklamayı güncelledi');
    }
  };

  const handleCancelDescription = () => {
    setDescription(savedDescription);
    setIsEditingDescription(false);
    setMentionQuery(null);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDescription(val);

    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, selectionStart);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      // Check if there's a space before @ or it's the start of the string
      const charBeforeAt = lastAtPos > 0 ? textBeforeCursor[lastAtPos - 1] : ' ';
      if (charBeforeAt === ' ' || charBeforeAt === '\n') {
        const query = textBeforeCursor.slice(lastAtPos + 1);
        // Check if query contains spaces (limit mention search to single word or short phrase if needed, but names have spaces)
        // Let's assume names can have spaces but newlines break it.
        if (!query.includes('\n')) {
          setMentionQuery(query);
          setMentionIndex(lastAtPos);
          
          // Calculate coordinates for popover
          // This is a rough estimation. For production, use a library like 'textarea-caret'
          // We will just position it below the textarea for now or use a simple hack.
          // Since we are inside a modal, let's try to get relative coordinates.
          if (textareaRef.current) {
            // Using a simple trick: create a dummy div with same styles to measure position
            // Or just fixed position relative to textarea bottom-left for simplicity first.
            // We'll improve if user complains.
            // Actually, let's try to do better.
            const { offsetLeft, offsetTop, scrollTop } = textareaRef.current;
            // It's hard to get X,Y of caret without a lib.
            // Let's position it at the bottom left of the textarea for now, simpler.
            setMentionCoords({ top: offsetTop + 20, left: offsetLeft + 10 }); 
          }
          
          const filtered = members.filter(m => 
            m.name.toLowerCase().includes(query.toLowerCase())
          );
          setMentionFilteredMembers(filtered);
          return;
        }
      }
    }
    
    setMentionQuery(null);
    setMentionIndex(null);
  };

  const insertMention = (memberName: string) => {
    if (mentionIndex === null) return;
    const before = description.slice(0, mentionIndex);
    const after = description.slice(textareaRef.current?.selectionStart || mentionIndex + 1);
    const newText = `${before}@${memberName} ${after}`;
    setDescription(newText);
    setMentionQuery(null);
    setMentionIndex(null);
    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Dosya çok büyük. En fazla 2MB yükleyebilirsiniz.');
        e.target.value = '';
        return;
      }
      const newAttachment: Attachment = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
      };
      setAttachments(prev => [...prev, newAttachment]);
      logActivity(`"${file.name}" eklendi`);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = (id: string) => {
    const fileName = attachments.find(att => att.id === id)?.name;
    setAttachments(prev => prev.filter(att => att.id !== id));
    if (fileName) logActivity(`"${fileName}" silindi`);
  };

  const toggleLabel = (id: string) => {
    const labelName = labels.find(l => l.id === id)?.name;
    const isRemoving = selectedLabels.includes(id);
    setSelectedLabels(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
    if (labelName) logActivity(`"${labelName}" etiketi ${isRemoving ? 'kaldırıldı' : 'eklendi'}`);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setDueDate(e.target.value);
    setActivePopover(null);
    if (next) {
      logActivity(`son tarihi ${new Date(next).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} olarak ayarladı`);
    } else {
      logActivity('son tarihi kaldırdı');
    }
  };

  const toggleMember = (id: string) => {
    const memberName = members.find(m => m.id === id)?.name;
    const isRemoving = selectedMembers.includes(id);
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
    if (memberName) logActivity(`"${memberName}" ${isRemoving ? 'kaldırıldı' : 'eklendi'}`);
  };

  const [commentMentionQuery, setCommentMentionQuery] = useState<string | null>(null);
  const [commentMentionIndex, setCommentMentionIndex] = useState<number | null>(null);
  const [commentMentionFilteredMembers, setCommentMentionFilteredMembers] = useState<any[]>([]);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewComment(val);

    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, selectionStart);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      const charBeforeAt = lastAtPos > 0 ? textBeforeCursor[lastAtPos - 1] : ' ';
      if (charBeforeAt === ' ' || charBeforeAt === '\n') {
        const query = textBeforeCursor.slice(lastAtPos + 1);
        if (!query.includes('\n')) {
          setCommentMentionQuery(query);
          setCommentMentionIndex(lastAtPos);
          
          const filtered = members.filter(m => 
            m.name.toLowerCase().includes(query.toLowerCase())
          );
          setCommentMentionFilteredMembers(filtered);
          return;
        }
      }
    }
    
    setCommentMentionQuery(null);
    setCommentMentionIndex(null);
  };

  const insertCommentMention = (memberName: string) => {
    if (commentMentionIndex === null) return;
    const before = newComment.slice(0, commentMentionIndex);
    const after = newComment.slice(commentTextareaRef.current?.selectionStart || commentMentionIndex + 1);
    const newText = `${before}@${memberName} ${after}`;
    setNewComment(newText);
    setCommentMentionQuery(null);
    setCommentMentionIndex(null);
    setTimeout(() => {
      commentTextareaRef.current?.focus();
    }, 0);
  };

  const handleAddComment = () => {
    const text = newComment.trim();
    if (!text) return;
    const comment: Comment = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      text,
      parentId: replyToCommentId || undefined,
      userId: actor.userId,
      user: actor.user,
      initials: actor.initials,
      color: actor.color,
      date: new Date().toISOString(),
    };
    setComments(prev => [...prev, comment]);
    setNewComment('');
    setReplyToCommentId(null);
    logActivity(replyToCommentId ? 'yoruma yanıt yazdı' : 'yorum yazdı');
    setRightTab('comments');
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId));
    if (replyToCommentId === commentId) setReplyToCommentId(null);
    logActivity('yorumu sildi');
  };

  const rootComments = comments
    .filter(c => !c.parentId)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));

  const getReplies = (parentId: string) =>
    comments
      .filter(c => c.parentId === parentId)
      .sort((a, b) => parseDate(a.date) - parseDate(b.date));

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !task) return null;
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-8 overflow-hidden font-sans">
      <div
        className="absolute inset-0 z-0"
        onClick={(e) => {
          if (openedAtRef.current && Date.now() - openedAtRef.current < 150) return;
          if (e.target === e.currentTarget) onClose();
        }}
      />
      <div
        className="bg-card border border-border rounded-lg shadow-xl w-full max-w-6xl h-[85vh] flex flex-col relative z-10 overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {coverColor && (
          <div
            className="absolute inset-x-0 top-0 h-16 z-0 pointer-events-none"
            style={{ backgroundColor: coverColor }}
          />
        )}
        
        {/* Header Icons & Close */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePopover('menu');
            }}
            className={`p-2 rounded-md transition-colors ${
              coverColor
                ? 'text-white hover:bg-white/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Menü"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className={`p-2 rounded-md transition-colors ${
              coverColor
                ? 'text-white hover:bg-white/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {activePopover === 'menu' && (
          <div
            ref={menuPickerRef}
            className="absolute top-16 right-4 bg-popover rounded-lg shadow-xl border border-border z-20 p-2"
          >
            <button
              type="button"
              onClick={() => {
                const current = taskRef.current;
                const updateTask = onUpdateTaskRef.current;
                if (current && updateTask) {
                  updateTask({ ...current, status: 'ARCHIVED' });
                }
                setActivePopover(null);
                onClose();
              }}
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md"
            >
              <Archive className="w-4 h-4 mr-2 inline-block" /> Arşivle
            </button>
            {onDeleteTask && (
              <button
                type="button"
                onClick={() => {
                  const current = taskRef.current;
                  if (current) {
                    if (confirm('Bu görevi silmek istediğinize emin misiniz?')) {
                      onDeleteTask(current.id);
                      setActivePopover(null);
                      onClose();
                    }
                  }
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                <X className="w-4 h-4 mr-2 inline-block" /> Sil
              </button>
            )}
          </div>
        )}

        {/* Header List Name */}
        <div className={`px-6 ${coverColor ? 'pt-4' : 'pt-6'} pb-2 relative z-10`}>
          <div className="relative inline-block" ref={columnPickerRef}>
            <button
              onClick={() => togglePopover('column')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider transition-colors ${
                coverColor
                  ? 'text-white bg-white/10 hover:bg-white/20'
                  : 'text-muted-foreground bg-muted hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {currentColumnTitle} <ChevronDown className="w-4 h-4" />
            </button>
            {activePopover === 'column' && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-popover rounded-lg shadow-xl border border-border z-20 p-2">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase mb-2 px-1">Sütun Değiştir</h4>
                <div className="space-y-1">
                  {availableColumns.map((c) => {
                    const isActive = c.id === status;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => changeColumn(c.id)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                          isActive ? 'bg-muted text-foreground' : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <span>{c.title}</span>
                        <span className="text-[10px] text-muted-foreground">{c.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
          {/* Left Column - Main Content */}
          <div className="flex-1 p-6 md:pr-8 overflow-y-auto scrollbar-hide min-h-0">
            
            {/* Title Section */}
            <div className="flex gap-4 mb-8">
              <div className="pt-1">
                <button
                  type="button"
                  onClick={toggleDone}
                  className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-[#029a46]" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </div>
              <div className="flex-1">
                {isEditingTitle ? (
                  <input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') handleCancelTitle();
                    }}
                    onBlur={handleSaveTitle}
                    className="w-full text-[22px] font-medium text-foreground leading-tight mb-4 bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-foreground"
                  />
                ) : (
                  <h2
                    className="text-[22px] font-medium text-foreground leading-tight mb-4 cursor-text"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {title}
                  </h2>
                )}
                
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {user?.role !== 'CLIENT' && !isCompleted && (
                    <Button size="sm" variant="secondary" onClick={completeWithSms}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Tamamla + SMS
                    </Button>
                  )}
                  <button
                    onClick={() => {
                      const enabled = timeTrackingEnabled;
                      if (enabled) {
                        logActivity('zaman takibini kapattı', 'work:disable');
                      } else {
                        logActivity('zaman takibini açtı', 'work:enable');
                      }
                    }}
                    className="px-3 py-1 bg-card hover:bg-muted text-foreground rounded-[99px] text-xs font-medium transition-colors border border-border"
                  >
                    {timeTrackingEnabled ? 'Zaman Takibini Kapat' : 'Zaman Takibini Aç'}
                  </button>
                    {timeTrackingEnabled && (
                    <div className="flex items-center gap-2">
                      <div className="text-[11px] px-2 py-0.5 rounded-[99px] bg-muted text-foreground font-medium border border-border">
                        {formatSecondsDetailed(workDetails.mySeconds)}
                      </div>
                      {workDetails.isMyRunning ? (
                        <>
                          <button
                            onClick={() => logActivity('çalışmayı duraklattı', 'work:pause')}
                            className="text-muted-foreground hover:text-foreground"
                            title="Duraklat"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => logActivity('çalışmayı tamamladı', 'work:stop')}
                            className="text-[#c02020] hover:text-red-700"
                            title="Bitir"
                          >
                            <StopCircle className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            const resume = lastMyWorkAction === 'work:pause' ? true : false;
                            logActivity(resume ? 'çalışmaya devam etti' : 'çalışmaya başladı', resume ? 'work:resume' : 'work:start');
                          }}
                          className="text-[#029a46] hover:text-green-700"
                          title="Başlat"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Quick Actions Bar */}
                <div className="flex flex-wrap gap-2 relative">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted text-foreground rounded-[6px] text-sm font-medium transition-colors border border-border cursor-pointer">
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                    <Plus className="w-4 h-4 text-muted-foreground" />
                    <span>Ekle</span>
                  </label>

                  <div className="relative" ref={coverPickerRef}>
                    <button
                      type="button"
                      onClick={() => togglePopover('cover')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted text-foreground rounded-[6px] text-sm font-medium transition-colors border border-border"
                    >
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      <span>Kapak</span>
                    </button>
                    {activePopover === 'cover' && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-popover rounded-lg shadow-xl border border-border z-20 p-2">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase mb-2 px-1">Kapak</h4>
                        <div className="grid grid-cols-5 gap-2 px-1">
                          {coverColors.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setCoverColor(c);
                                setActivePopover(null);
                                logActivity('kapağı değiştirdi');
                              }}
                              className={`h-8 rounded-md border border-border ${coverColor === c ? 'ring-2 ring-offset-2 ring-muted-foreground' : ''}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCoverColor('');
                            setActivePopover(null);
                            logActivity('kapağı kaldırdı');
                          }}
                          className="mt-3 w-full text-left px-2 py-1.5 rounded-md text-sm text-foreground hover:bg-muted"
                        >
                          Kapağı kaldır
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative" ref={labelPickerRef}>
                    <button 
                      onClick={() => togglePopover('labels')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted text-foreground rounded-[6px] text-sm font-medium transition-colors border border-border"
                    >
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <span>Etiketler</span>
                    </button>
                    {activePopover === 'labels' && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-popover rounded-lg shadow-xl border border-border z-20 p-2">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase mb-2 px-1">Etiket Seç</h4>
                        <div className="space-y-1">
                          {labels.map(label => (
                            <button
                              key={label.id}
                              onClick={() => toggleLabel(label.id)}
                              className={`w-full text-left px-2 py-1.5 rounded text-xs font-medium flex items-center justify-between ${label.color} ${selectedLabels.includes(label.id) ? 'ring-2 ring-offset-1 ring-[#949494]' : ''}`}
                            >
                              {label.name}
                              {selectedLabels.includes(label.id) && <CheckSquare className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {user?.role !== 'CLIENT' && (
                    <div className="relative">
                        <button
                          onClick={() => setBrandPopoverOpen(prev => !prev)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted text-foreground rounded-[6px] text-sm font-medium transition-colors border border-border"
                        >
                        <Layout className="w-4 h-4 text-muted-foreground" />
                        <span>{brandName ? `Marka: ${brandName}` : 'Marka'}</span>
                      </button>
                      {brandPopoverOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-popover rounded-lg shadow-xl border border-border z-20 p-2">
                          {(() => {
                            const currentProjectId = (taskRef.current || task)?.projectId;
                            return currentProjectId ? (
                            <button
                              onClick={async () => {
                                try {
                                  if (task?.id) {
                                    await api.patch(`/tasks/${task.id}`, { projectId: null });
                                    const next = { ...(taskRef.current || task)!, projectId: undefined };
                                    taskRef.current = next;
                                    onUpdateTaskRef.current?.(next as any);
                                  }
                                  setBrandName('');
                                } catch {}
                                setBrandPopoverOpen(false);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-md text-sm bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 mb-2"
                            >
                              Markayı Kaldır
                            </button>
                          ) : null;
                          })()}
                          <div className="px-1 mb-2">
                            <input
                              value={brandSearch}
                              onChange={(e) => setBrandSearch(e.target.value)}
                              placeholder="Marka ara"
                              className="w-full px-2 py-1.5 border border-border rounded text-sm bg-background text-foreground"
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {customers
                              .filter((c) =>
                                brandSearch
                                  ? (c.name || '').toLowerCase().includes(brandSearch.toLowerCase())
                                  : true,
                              )
                              .map((c) => (
                                <button
                                  key={c.id}
                                  onClick={async () => {
                                    try {
                                      const prjRes = await api.get('/projects');
                                      const prjs = Array.isArray(prjRes.data) ? prjRes.data : [];
                                      let target = prjs.find((p: any) => p.customer?.id === c.id);
                                      if (!target) {
                                        const created = await api.post('/projects', {
                                          name: `${c.name} Genel`,
                                          description: 'Müşteri görevleri',
                                          customerId: c.id,
                                        });
                                        target = created.data;
                                      }
                                      if (task?.id && target?.id) {
                                        await api.patch(`/tasks/${task.id}`, { projectId: target.id });
                                        const next = { ...(taskRef.current || task)!, projectId: target.id };
                                        taskRef.current = next;
                                        onUpdateTaskRef.current?.(next as any);
                                      }
                                      setBrandName(c.name || '');
                                    } catch {}
                                    setBrandPopoverOpen(false);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-muted text-foreground"
                                >
                                  {c.name}
                                </button>
                              ))}
                            {customers.length === 0 && (
                              <div className="px-2 py-2 text-sm text-slate-500">Marka bulunamadı</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="relative" ref={datePickerRef}>
                    <button 
                      onClick={() => togglePopover('date')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted text-foreground rounded-[6px] text-sm font-medium transition-colors border border-border"
                    >
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Tarihler</span>
                    </button>
                    {activePopover === 'date' && (
                      <div className="absolute top-full left-0 mt-2 p-2 bg-popover rounded-lg shadow-xl border border-border z-20">
                        <input 
                          ref={dateInputRef}
                          type="date" 
                          value={dueDate} 
                          onChange={handleDateChange}
                          className="border border-border rounded px-2 py-1 text-sm text-foreground bg-background outline-none focus:border-foreground"
                        />
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={memberPickerRef}>
                    <button 
                      onClick={() => togglePopover('members')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted text-foreground rounded-[6px] text-sm font-medium transition-colors border border-border"
                    >
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>Üyeler</span>
                    </button>
                    {activePopover === 'members' && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-popover rounded-lg shadow-xl border border-border z-20 p-2">
                         <h4 className="text-[10px] font-semibold text-muted-foreground uppercase mb-2 px-1">Üye Ata</h4>
                         <div className="space-y-1">
                           {members.map(member => (
                             <button
                               key={member.id}
                               onClick={() => toggleMember(member.id)}
                               className={`w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2 ${
                                 selectedMembers.includes(member.id) ? 'bg-muted' : ''
                               }`}
                             >
                               <div className={`w-6 h-6 rounded-full ${member.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                                 {member.initials}
                               </div>
                              <span className="text-sm text-foreground">{member.name}</span>
                              {selectedMembers.includes(member.id) && <CheckSquare className="w-3 h-3 ml-auto text-muted-foreground" />}
                             </button>
                           ))}
                         </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      const isWatching = watchers.includes(actor.userId || '');
                      const next = isWatching 
                        ? watchers.filter(id => id !== actor.userId)
                        : [...watchers, actor.userId || ''];
                      setWatchers(next);
                      logActivity(isWatching ? 'takipten çıktı' : 'takibe aldı');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-sm font-medium transition-colors border ${
                      watchers.includes(actor.userId || '')
                        ? 'bg-muted text-foreground border-border hover:bg-muted/80'
                        : 'bg-card hover:bg-muted text-foreground border-border'
                    }`}
                  >
                    <Eye className={`w-4 h-4 ${watchers.includes(actor.userId || '') ? 'text-foreground' : 'text-muted-foreground'}`} />
                    <span>{watchers.includes(actor.userId || '') ? 'Takip Ediliyor' : 'Takip Et'}</span>
                  </button>
                </div>

                {/* Meta Information Display - Moved inside title section for alignment */}
                {(selectedMembers.length > 0 || selectedLabels.length > 0 || dueDate) && (
                  <div className="flex flex-wrap gap-6 mt-6">
                    {/* Members */}
                    {selectedMembers.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Üyeler</span>
                        <div className="flex gap-1">
                            {members.filter(m => selectedMembers.includes(m.id)).map(member => (
                              <div
                                key={member.id}
                                className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-background cursor-help`}
                                title={member.name}
                              >
                                {member.initials}
                              </div>
                            ))}
                            <button
                              onClick={() => togglePopover('members')}
                              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Labels */}
                    {selectedLabels.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Etiketler</span>
                        <div className="flex gap-2 flex-wrap">
                            {labels.filter(l => selectedLabels.includes(l.id)).map(label => (
                              <div key={label.id} className={`px-2.5 py-1 rounded font-medium text-xs ${label.color}`}>
                                {label.name}
                              </div>
                            ))}
                            <button
                              onClick={() => togglePopover('labels')}
                              className="w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                        </div>
                      </div>
                    )}

                    {/* Due Date */}
                    {dueDate && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Son Tarih</span>
                        <div
                          className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 px-3 py-1.5 rounded text-sm text-foreground cursor-pointer transition-colors"
                          onClick={() => togglePopover('date')}
                        >
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {new Date(dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                          <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {timeTrackingEnabled && (
              <div className="mb-8 pl-10">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => setIsTimeDetailsOpen((prev) => !prev)}
                    className="flex items-center gap-3"
                  >
                    <Clock className="w-6 h-6 text-foreground" />
                    <h3 className="font-semibold text-foreground text-lg">Zaman Takibi</h3>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isTimeDetailsOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {isTimeDetailsOpen && (
                <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Kişi Bazlı Toplamlar</div>
                      <div className="space-y-3">
                        {workDetails.perUser.map(u => (
                          <div key={u.userId} className="p-3 bg-muted rounded-md">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full ${u.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                                  {u.initials}
                                </div>
                                <span className="text-sm text-foreground font-medium">{u.name}</span>
                                {u.isRunning && <span className="text-xs text-emerald-600 ml-2">devam ediyor</span>}
                              </div>
                              <div className="text-sm text-foreground">{formatSecondsDetailed(u.totalSeconds)}</div>
                            </div>
                            <div className="text-xs text-muted-foreground flex justify-between mt-1">
                              <span>Başlangıç: {typeof u.firstStart === 'number' ? new Date(u.firstStart).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : '-'}</span>
                              <span>Bitiş: {typeof u.lastEnd === 'number' ? new Date(u.lastEnd).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : (u.isRunning ? 'Şimdi' : '-')}</span>
                            </div>
                          </div>
                        ))}
                        {workDetails.perUser.length === 0 && (
                        <div className="text-sm text-muted-foreground">Kayıt yok.</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Çalışma Segmentleri</div>
                      <div className="space-y-3">
                        {workDetails.segments.map((seg, idx) => {
                          const u = members.find(m => m.id === seg.userId);
                          const name = u?.name || 'Bilinmeyen';
                          const initials = u?.initials || '??';
                          const color = u?.color || 'bg-slate-600';
                          const secs = Math.floor((seg.end - seg.start) / 1000);
                          const startVerb = seg.startAction === 'resume' ? 'çalışmaya devam etti' : 'çalışmaya başladı';
                          const endVerb = seg.endAction === 'pause' ? 'çalışmayı duraklattı' : seg.endAction === 'stop' ? 'çalışmayı tamamladı' : 'devam ediyor';
                          return (
                            <div key={`${seg.userId}-${seg.start}-${idx}`} className="p-3 bg-muted rounded-md flex items-start justify-between">
                              <div className="flex items-start gap-2">
                                <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center text-white text-[10px] font-bold`}>
                                  {initials}
                                </div>
                                <div className="text-sm text-foreground">
                                  <span className="font-medium">{name}</span>{' '}
                                  <span className="text-muted-foreground">{startVerb} → {endVerb}</span>
                                  {seg.running && <span className="text-xs text-emerald-600 ml-2">(canlı)</span>}
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {new Date(seg.start).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })} 
                                    {' '}–{' '}
                                    {seg.running ? 'Şimdi' : new Date(seg.end).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-foreground">{formatSecondsDetailed(secs)}</div>
                            </div>
                          );
                        })}
                        {workDetails.segments.length === 0 && (
                        <div className="text-sm text-muted-foreground">Segment bulunamadı.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>
            )}
            {/* Description Section */}
            <div className="mb-8 pl-10">
              <div className="flex items-center gap-3 mb-3">
                <AlignLeft className="w-6 h-6 text-foreground" />
                <h3 className="font-semibold text-foreground text-lg">Açıklama</h3>
                {isEditingDescription && (
                  <div className="ml-auto flex gap-2">
                    <Button size="sm" onClick={handleSaveDescription}>Kaydet</Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelDescription}>İptal</Button>
                  </div>
                )}
              </div>
              <div 
                className={`bg-muted/70 hover:bg-muted transition-colors rounded-lg p-3 min-h-[80px] cursor-pointer ${
                  isEditingDescription ? 'bg-background ring-2 ring-border cursor-text' : ''
                }`}
                onClick={() => !isEditingDescription && setIsEditingDescription(true)}
              >
                {isEditingDescription ? (
                  <div className="relative w-full h-full min-h-[120px]">
                    <textarea
                      ref={textareaRef}
                      value={description}
                      onChange={handleDescriptionChange}
                      className="w-full h-full bg-transparent outline-none resize-none text-foreground text-sm"
                      placeholder="Daha ayrıntılı bir açıklama ekleyin..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (mentionQuery !== null && mentionFilteredMembers.length > 0) {
                          if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault();
                            insertMention(mentionFilteredMembers[0].name);
                          } else if (e.key === 'Escape') {
                            setMentionQuery(null);
                          }
                        }
                      }}
                    />
                    {mentionQuery !== null && mentionFilteredMembers.length > 0 && (
                      <div className="absolute left-0 top-full mt-1 w-64 bg-popover rounded-lg shadow-xl border border-border z-50 max-h-48 overflow-y-auto">
                         {mentionFilteredMembers.map(member => (
                           <button
                             key={member.id}
                             onClick={(e) => {
                               e.stopPropagation();
                               insertMention(member.name);
                             }}
                             className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                           >
                             <div className={`w-6 h-6 rounded-full ${member.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                               {member.initials}
                             </div>
                             <div>
                               <p className="text-sm font-medium text-foreground">{member.name}</p>
                               <p className="text-xs text-muted-foreground">{member.email}</p>
                             </div>
                           </button>
                         ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {description || 'Daha ayrıntılı bir açıklama ekleyin...'}
                  </p>
                )}
              </div>
            </div>

            {/* Checklist Section */}
            <div className="mb-8 pl-10">
                <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <CheckSquare className="w-6 h-6 text-foreground" />
                  <h3 className="font-medium text-foreground text-lg">Kontrol Listeleri</h3>
                </div>
                <Button
                  variant="outline"
                  className="h-8 text-xs bg-muted border-none hover:bg-muted/80 text-foreground"
                  onClick={() => setIsAddingChecklistGroup(true)}
                >
                  Kontrol listesi ekle
                </Button>
              </div>

              {isAddingChecklistGroup && (
                <div className="flex items-center gap-2 mb-4">
                  <input
                    autoFocus
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addChecklistGroup(newChecklistTitle);
                        setNewChecklistTitle('');
                        setIsAddingChecklistGroup(false);
                      } else if (e.key === 'Escape') {
                        setNewChecklistTitle('');
                        setIsAddingChecklistGroup(false);
                      }
                    }}
                    placeholder="Kontrol listesi adı..."
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-md outline-none bg-background text-foreground focus:border-foreground"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      addChecklistGroup(newChecklistTitle);
                      setNewChecklistTitle('');
                      setIsAddingChecklistGroup(false);
                    }}
                  >
                    Ekle
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNewChecklistTitle('');
                      setIsAddingChecklistGroup(false);
                    }}
                  >
                    İptal
                  </Button>
                </div>
              )}

              {checklists.length === 0 ? (
                <div className="text-sm text-muted-foreground bg-card border border-dashed border-border rounded-lg p-4">
                  Henüz kontrol listesi yok.
                </div>
              ) : (
                <div className="space-y-4">
                  {checklists.map((cl) => {
                    const total = cl.items.length;
                    const completed = cl.items.filter(i => i.completed).length;
                    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                    const isAddingItemHere = addingItemChecklistId === cl.id;

                    return (
                      <div key={cl.id} className="bg-muted/70 rounded-lg p-4 border border-border">
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            value={cl.title}
                            onChange={(e) => updateChecklistTitle(cl.id, e.target.value)}
                            className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-red-600"
                            onClick={() => deleteChecklistGroup(cl.id)}
                          >
                            Sil
                          </Button>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-xs font-medium text-muted-foreground w-8">{progress}%</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-foreground transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          {cl.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 group min-h-[2rem]">
                              <div className="flex items-center justify-center w-6 h-6">
                                <input
                                  type="checkbox"
                                  checked={item.completed}
                                  onChange={() => toggleChecklistItem(cl.id, item.id)}
                                  className="w-5 h-5 rounded border-2 border-border text-foreground focus:ring-foreground cursor-pointer"
                                />
                              </div>
                              <span className={`text-sm text-foreground flex-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {item.text}
                              </span>

                              <div className={`flex items-center gap-1 ${activeChecklistItemId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                {/* Assignee */}
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveChecklistGroupId(cl.id);
                                      setActiveChecklistItemId(item.id);
                                      setActiveChecklistAction('assign');
                                    }}
                                    className={`p-1 rounded hover:bg-muted text-muted-foreground ${
                                      item.assigneeId ? 'opacity-100 bg-muted' : ''
                                    }`}
                                    title="Üye ata"
                                  >
                                    {item.assigneeId ? (
                                      <div className={`w-5 h-5 rounded-full ${members.find(m => m.id === item.assigneeId)?.color || 'bg-slate-400'} flex items-center justify-center text-white text-[9px] font-bold`}>
                                        {members.find(m => m.id === item.assigneeId)?.initials || '?'}
                                      </div>
                                    ) : (
                                      <Users className="w-4 h-4" />
                                    )}
                                  </button>
                                  {activeChecklistItemId === item.id && activeChecklistAction === 'assign' && (
                                    <div ref={checklistActionRef} className="absolute top-full right-0 mt-1 w-48 bg-popover rounded-lg shadow-xl border border-border z-50 p-2">
                                      <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1">Üye Ata</h4>
                                      <div className="space-y-1">
                                        {members.map(member => (
                                          <button
                                            key={member.id}
                                            onClick={() => {
                                              updateChecklistItemAssignee(cl.id, item.id, item.assigneeId === member.id ? undefined : member.id);
                                              setActiveChecklistAction(null);
                                            }}
                                            className={`w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2 ${
                                              item.assigneeId === member.id ? 'bg-muted/80' : ''
                                            }`}
                                          >
                                            <div className={`w-5 h-5 rounded-full ${member.color} flex items-center justify-center text-white text-[9px] font-bold`}>
                                              {member.initials}
                                            </div>
                                            <span className="text-xs text-foreground">{member.name}</span>
                                            {item.assigneeId === member.id && <CheckSquare className="w-3 h-3 ml-auto text-muted-foreground" />}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Due Date */}
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveChecklistGroupId(cl.id);
                                      setActiveChecklistItemId(item.id);
                                      setActiveChecklistAction('date');
                                    }}
                                    className={`p-1 rounded hover:bg-muted text-muted-foreground ${
                                      item.dueDate ? 'opacity-100 bg-muted' : ''
                                    }`}
                                    title="Tarih ekle"
                                  >
                                    {item.dueDate ? (
                                      <span className="text-xs font-medium text-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(item.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                      </span>
                                    ) : (
                                      <Clock className="w-4 h-4" />
                                    )}
                                  </button>
                                  {activeChecklistItemId === item.id && activeChecklistAction === 'date' && (
                                    <div ref={checklistActionRef} className="absolute top-full right-0 mt-1 p-2 bg-popover rounded-lg shadow-xl border border-border z-50">
                                      <input 
                                        type="date" 
                                        value={item.dueDate || ''}
                                        onChange={(e) => {
                                          updateChecklistItemDueDate(cl.id, item.id, e.target.value || undefined);
                                          setActiveChecklistAction(null);
                                        }}
                                        className="border border-border rounded px-2 py-1 text-xs text-foreground bg-background outline-none focus:border-foreground"
                                      />
                                      {item.dueDate && (
                                        <button 
                                          onClick={() => {
                                            updateChecklistItemDueDate(cl.id, item.id, undefined);
                                            setActiveChecklistAction(null);
                                          }}
                                          className="mt-2 w-full text-xs text-red-600 hover:bg-red-50 py-1 rounded"
                                        >
                                          Tarihi Kaldır
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => deleteChecklistItemFromGroup(cl.id, item.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {isAddingItemHere ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={newChecklistItemText}
                              onChange={(e) => setNewChecklistItemText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addChecklistItemToGroup(cl.id, newChecklistItemText);
                                  setNewChecklistItemText('');
                                } else if (e.key === 'Escape') {
                                  setAddingItemChecklistId(null);
                                  setNewChecklistItemText('');
                                }
                              }}
                              placeholder="Öğe adı..."
                              className="flex-1 px-3 py-2 text-sm border border-border rounded-md outline-none bg-background text-foreground focus:border-foreground"
                            />
                            <Button
                              size="sm"
                              disabled={!newChecklistItemText.trim()}
                              onClick={() => {
                                addChecklistItemToGroup(cl.id, newChecklistItemText);
                                setNewChecklistItemText('');
                              }}
                            >
                              Ekle
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setAddingItemChecklistId(null);
                                setNewChecklistItemText('');
                              }}
                            >
                              Bitti
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => {
                              setAddingItemChecklistId(cl.id);
                              setNewChecklistItemText('');
                            }}
                            variant="secondary"
                            className="bg-muted hover:bg-muted/80 text-foreground text-sm h-9 px-4"
                          >
                            Madde ekle
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Attachments Section */}
            {attachments.length > 0 && (
                <div className="mb-8 pl-10">
                <div className="flex items-center gap-3 mb-3">
                  <ImageIcon className="w-6 h-6 text-foreground" />
                  <h3 className="font-semibold text-foreground text-lg">Eklentiler</h3>
                </div>
                <div className="flex flex-wrap gap-4">
                  {attachments.map(att => (
                    <a
                      key={att.id}
                      href={att.url}
                      download={att.name}
                      className="group relative w-32 h-24 bg-muted rounded-lg border border-border overflow-hidden block cursor-pointer"
                    >
                      {att.type.startsWith('image/') ? (
                        <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                           <Layout className="w-8 h-8" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteAttachment(att.id);
                        }}
                        className="absolute top-1 right-1 bg-background/80 p-1 rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-black/50 p-1 truncate text-[10px] text-white">
                        {att.name}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column - Activity & Comments */}
          <div className="w-full md:w-[380px] bg-muted/60 p-6 border-l border-border flex flex-col overflow-hidden min-h-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layout className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Etkinlik</h3>
              </div>
              <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setRightTab('comments')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    rightTab === 'comments' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Yorumlar
                </button>
                <button
                  onClick={() => setRightTab('activities')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    rightTab === 'activities' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Etkinlik
                </button>
              </div>
            </div>

            {rightTab === 'comments' ? (
              <>
                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                  {rootComments.map((comment) => {
                    const isMine = (comment.userId && actor.userId) ? comment.userId === actor.userId : comment.user === actor.user;
                    const replies = getReplies(comment.id);

                    return (
                      <div key={comment.id} className="space-y-2">
                        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] ${isMine ? 'text-right' : 'text-left'}`}>
                            <div className={`inline-block rounded-2xl px-3 py-2 shadow-sm border ${
                              isMine ? 'bg-muted text-foreground border-border' : 'bg-card text-foreground border-border'
                            }`}>
                              <div className={`text-[11px] font-semibold ${isMine ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                                {isMine ? 'Siz' : comment.user} · {formatDateTime(comment.date)}
                              </div>
                              <div className="text-sm whitespace-pre-wrap mt-1">
                                {comment.text}
                              </div>
                            </div>
                            <div className={`mt-1 flex gap-3 text-[11px] ${isMine ? 'justify-end' : 'justify-start'} text-muted-foreground`}>
                              <button
                                onClick={() => setReplyToCommentId(comment.id)}
                                className="hover:text-foreground transition-colors"
                              >
                                Yanıtla
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="hover:text-red-600 transition-colors"
                              >
                                Sil
                              </button>
                            </div>
                          </div>
                        </div>

                        {replies.length > 0 && (
                          <div className="space-y-2 pl-6 border-l border-[#e6e6e6]">
                            {replies.map((reply) => {
                              const isMyReply = (reply.userId && actor.userId) ? reply.userId === actor.userId : reply.user === actor.user;
                              return (
                                <div key={reply.id} className={`flex ${isMyReply ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[85%] ${isMyReply ? 'text-right' : 'text-left'}`}>
                                    <div className={`inline-block rounded-2xl px-3 py-2 shadow-sm border ${
                                      isMyReply ? 'bg-muted text-foreground border-border' : 'bg-card text-foreground border-border'
                                    }`}>
                                      <div className={`text-[11px] font-semibold ${isMyReply ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                                        {isMyReply ? 'Siz' : reply.user} · {formatDateTime(reply.date)}
                                      </div>
                                      <div className="text-sm whitespace-pre-wrap mt-1">
                                        {reply.text}
                                      </div>
                                    </div>
                                    <div className={`mt-1 flex gap-3 text-[11px] ${isMyReply ? 'justify-end' : 'justify-start'} text-muted-foreground`}>
                                      <button
                                        onClick={() => setReplyToCommentId(reply.id)}
                                        className="hover:text-[#111] transition-colors"
                                      >
                                        Yanıtla
                                      </button>
                                      <button
                                        onClick={() => handleDeleteComment(reply.id)}
                                        className="hover:text-red-600 transition-colors"
                                      >
                                        Sil
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {comments.length === 0 && (
                    <div className="text-sm text-muted-foreground bg-card border border-dashed border-border rounded-lg p-4">
                      Henüz yorum yok.
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  {replyToCommentId && (
                    <div className="mb-2 flex items-center justify-between text-xs bg-card border border-border rounded-lg px-3 py-2">
                      <div className="text-muted-foreground">
                        Yanıt: <span className="font-semibold text-foreground">{comments.find(c => c.id === replyToCommentId)?.user || 'Yorum'}</span>
                      </div>
                      <button
                        onClick={() => setReplyToCommentId(null)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full ${actor.color} flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0`}>
                      {actor.initials}
                    </div>
                    <div className="flex-1">
                      <div className="bg-card border border-border rounded-lg shadow-sm overflow-visible p-2 relative">
                        <textarea
                          ref={commentTextareaRef}
                          value={newComment}
                          onChange={handleCommentChange}
                          onKeyDown={(e) => {
                            if (commentMentionQuery !== null && commentMentionFilteredMembers.length > 0) {
                              if (e.key === 'Enter' || e.key === 'Tab') {
                                e.preventDefault();
                                insertCommentMention(commentMentionFilteredMembers[0].name);
                                return;
                              } else if (e.key === 'Escape') {
                                setCommentMentionQuery(null);
                                return;
                              }
                            }
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment();
                            }
                          }}
                          placeholder="Yorum yaz..."
                          className="w-full text-sm outline-none placeholder:text-muted-foreground text-foreground resize-none h-10 min-h-[40px]"
                        />
                        {commentMentionQuery !== null && commentMentionFilteredMembers.length > 0 && (
                          <div className="absolute left-0 bottom-full mb-1 w-64 bg-popover rounded-lg shadow-xl border border-border z-50 max-h-48 overflow-y-auto">
                            {commentMentionFilteredMembers.map(member => (
                              <button
                                key={member.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  insertCommentMention(member.name);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
                              >
                                <div className={`w-6 h-6 rounded-full ${member.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                                  {member.initials}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                                  <p className="text-xs text-muted-foreground">{member.email}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-end mt-2">
                          <Button size="sm" disabled={!newComment.trim()} onClick={handleAddComment} className="bg-muted text-foreground hover:bg-muted/80 rounded-full">
                            Gönder
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {[...activities].sort((a, b) => parseDate(b.date) - parseDate(a.date)).map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0 mt-1`}>
                      {item.initials}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-slate-800">
                        <span className="font-bold">{item.user}</span> {item.text}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {formatDateTime(item.date)}
                      </div>
                    </div>
                  </div>
                ))}

                {activities.length === 0 && (
                  <div className="text-sm text-muted-foreground bg-card border border-dashed border-border rounded-lg p-4">
                    Henüz etkinlik yok.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function QuickActionButton({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-md text-sm font-medium transition-colors border border-border shadow-sm">
      {icon}
      <span>{text}</span>
    </button>
  );
}
