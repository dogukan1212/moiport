"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/hooks/use-auth";
import api, { getBaseURL, SOCKET_URL } from "@/lib/api";
import { MessageSquare, Send, X, MoreHorizontal, Users as UsersIcon, Hash, Check, CheckCheck, Plus, Instagram, RefreshCw } from "lucide-react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";

type ChatRoom = {
  id: string;
  name: string;
  type: string;
  isPrivate?: boolean;
  projectId?: string | null;
  updatedAt?: string;
  unreadCount?: number;
  memberships?: { 
    userId: string;
    user?: {
      id: string;
      name?: string | null;
      email: string;
      avatar?: string | null;
    }
  }[];
};

type ChatMessage = {
  id: string;
  roomId: string;
  userId: string;
  tenantId: string;
  content: string;
  attachments?: string | null;
  status?: string;
  createdAt: string;
  deletedAt?: string | null;
};

export default function ChatPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [users, setUsers] = useState<Array<{id: string; name?: string; email: string; avatar?: string; role?: string}>>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [contextForMessageId, setContextForMessageId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [adminViewMode, setAdminViewMode] = useState<'mine' | 'all'>('mine');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [brandProjects, setBrandProjects] = useState<Array<{ id: string; name: string; customer?: { id: string; name: string } }>>([]);
  
  // States specific to ChatPage layout
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  // Other chat states
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Array<{ url: string; name: string; size: number; mime: string; type?: 'image' | 'file' }>>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, Record<string, number>>>({}); 
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [hasInteraction, setHasInteraction] = useState(false);
  const [unreads, setUnreads] = useState<Record<string, number>>({});

  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesListRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const baseUrl = useMemo(() => getBaseURL(), []);
  const isAdmin = (user?.role || "").includes("ADMIN");
  const EMOJIS = useMemo(() => ['😀','😁','😂','😊','😍','👍','👏','🙏','🎉','💯','🔥','😉','😎','🤔','😢','❤️'], []);

  const handleSync = async () => {
    if (!selectedRoomId) return;
    setIsSyncing(true);
    try {
      await api.post(`/chat/rooms/${selectedRoomId}/sync`);
      if (selectedRoomId) await fetchMessages(selectedRoomId);
      toast.success('Mesajlar senkronize edildi.');
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Senkronizasyon başarısız.');
    } finally {
      setIsSyncing(false);
    }
  };

  const getAvatarUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return baseUrl + path;
  };

  const getUserLabel = (uid?: string) => {
    if (!uid) return "";
    const u = users.find((x) => x.id === uid);
    return u?.name || u?.email || uid;
  };

  const getDMTargetUser = (r: ChatRoom) => {
    if ((r.type || "").toUpperCase() !== "DM") return null;
    let targetId = (r.name || "").replace(/^DM-/, "");
    
    if (r.memberships && r.memberships.length > 0) {
       const other = r.memberships.find(m => m.userId !== user?.id);
       if (other && other.user) {
          return {
            id: other.user.id,
            name: other.user.name || undefined,
            email: other.user.email,
            avatar: other.user.avatar || undefined
          };
       }
       if (other) targetId = other.userId;
    }

    if (targetId === user?.id && r.memberships && r.memberships.length > 0) {
       const other = r.memberships.find(m => m.userId !== user.id);
       if (other) targetId = other.userId;
    }
    return users.find(u => u.id === targetId);
  };

  const getRoomLabel = (r: ChatRoom) => {
    const t = (r.type || "").toUpperCase();
    if (t === "DM") {
      if (adminViewMode === 'all' && r.memberships && r.memberships.length > 0) {
         const names = r.memberships.map(m => {
           if (m.user) return m.user.name || m.user.email;
           const u = users.find(x => x.id === m.userId);
           return u?.name || u?.email || "Kullanıcı";
         });
         return names.join(" & ");
      }
      const u = getDMTargetUser(r);
      return u?.name || u?.email || "Kullanıcı";
    }
    return r.name;
  };

  const isMentionToMe = (content: string) => {
    const t = content.toLowerCase();
    const nm = (user?.name || "").toLowerCase();
    const em = (user?.email || "").toLowerCase();
    if (!t.includes("@")) return false;
    return (nm && t.includes("@" + nm)) || (em && t.includes("@" + em));
  };

  const parseAttachments = (att?: string | null) => {
    if (!att) return [];
    try {
      const parsed = JSON.parse(att);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return [];
    }
  };

  // Sound Logic
  const ensureAudioCtx = async () => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      try {
        await audioCtxRef.current.resume();
      } catch {}
    }
  };

  const sendBrowserNotification = (title: string, body: string, icon?: string) => {
    if (typeof window === 'undefined' || !("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon, silent: !soundEnabled });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, { body, icon, silent: !soundEnabled });
        }
      });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('chat.selectedProjectId');
      setSelectedProjectId(saved || null);
    }
  }, []);

  const playNotification = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (ctx.state === 'suspended') return;

      const t = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, t);
      gain1.gain.setValueAtTime(0, t);
      gain1.gain.linearRampToValueAtTime(0.1, t + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1760, t);
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(0.05, t + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start(t);
      osc1.stop(t + 0.5);
      osc2.start(t);
      osc2.stop(t + 0.5);
    } catch {}
  }, [soundEnabled]);

  // Socket & Data Fetching Effects
  useEffect(() => {
    if (!user?.id) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const s = io(SOCKET_URL + '/chat', { 
      auth: { token }, 
      transports: ["polling", "websocket"],
    });
    setSocket(s);
    
    s.on("chat:typing", (payload: { userId: string; roomId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        const currentRoomTyping = next[payload.roomId] || {};
        if (payload.isTyping) {
          next[payload.roomId] = { ...currentRoomTyping, [payload.userId]: Date.now() };
        } else {
          const newRoomTyping = { ...currentRoomTyping };
          delete newRoomTyping[payload.userId];
          next[payload.roomId] = newRoomTyping;
        }
        return next;
      });
    });

    s.on("chat:message:read", (payload: { roomId: string; messageIds: string[]; userId: string; status?: string }) => {
      setMessages((prev) => 
        prev.map((m) => {
          if (m.roomId === payload.roomId && payload.messageIds.includes(m.id)) {
            return { ...m, status: 'READ' };
          }
          return m;
        })
      );
    });

    s.on("chat:message:delivered", (payload: { roomId: string; messageIds: string[]; userId: string }) => {
      setMessages((prev) => 
        prev.map((m) => {
          if (m.roomId === payload.roomId && payload.messageIds.includes(m.id)) {
            if (m.status === 'READ') return m;
            return { ...m, status: 'DELIVERED' };
          }
          return m;
        })
      );
    });

    s.on("chat:users:online", (users: string[]) => setOnlineUsers(new Set(users)));
    s.on("chat:user:online", (payload: { userId: string }) => {
      setOnlineUsers(prev => { const next = new Set(prev); next.add(payload.userId); return next; });
    });
    s.on("chat:user:offline", (payload: { userId: string }) => {
      setOnlineUsers(prev => { const next = new Set(prev); next.delete(payload.userId); return next; });
    });

    return () => { s.disconnect(); setSocket(null); };
  }, [user?.id, baseUrl]);

  // Typing cleanup
  useEffect(() => {
    const int = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(roomId => {
           const roomTyping = { ...next[roomId] };
           let roomChanged = false;
           Object.entries(roomTyping).forEach(([uid, ts]) => {
             if (now - ts > 5000) { delete roomTyping[uid]; roomChanged = true; }
           });
           if (roomChanged) { next[roomId] = roomTyping; changed = true; }
        });
        return changed ? next : prev;
      });
    }, 2000);
    return () => clearInterval(int);
  }, []);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const viewParam = isAdmin ? adminViewMode : 'mine';
      const res = await api.get(`/chat/rooms?view=${viewParam}${selectedProjectId ? `&projectId=${selectedProjectId}` : ''}`);
      const list: ChatRoom[] = (res.data || []) as ChatRoom[];
      const uniqByTypeName = new Map<string, ChatRoom>();
      const nextUnreads: Record<string, number> = {};
      
      for (const r of list) {
        const key = `${(r.type || "").toUpperCase()}:${r.name}`;
        if (!uniqByTypeName.has(key)) uniqByTypeName.set(key, r);
        if (r.unreadCount && r.unreadCount > 0) nextUnreads[r.id] = r.unreadCount;
      }
      setRooms(Array.from(uniqByTypeName.values()));
      setUnreads(nextUnreads);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchUsers = async () => {
    const res = await api.get("/chat/users");
    setUsers(res.data || []);
  };
  const fetchProjects = async () => {
    const res = await api.get("/projects");
    setBrandProjects(Array.isArray(res.data) ? res.data : []);
  };

  const fetchMessages = async (roomId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/chat/rooms/${roomId}/messages?limit=50`);
      const msgs = res.data || [];
      setMessages(msgs);
      
      if (socket && user?.id) {
        const toDeliver = msgs
          .filter((m: ChatMessage) => m.userId !== user.id && m.status === 'SENT')
          .map((m: ChatMessage) => m.id);
        if (toDeliver.length > 0) socket.emit("chat:delivered", { roomId, messageIds: toDeliver });
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!selectedRoomId || messages.length === 0 || loadingMore) return;
    const oldestId = messages[0].id;
    setLoadingMore(true);
    try {
      const res = await api.get(`/chat/rooms/${selectedRoomId}/messages?limit=50&cursor=${oldestId}`);
      const newMessages = res.data || [];
      if (newMessages.length > 0) setMessages((prev) => [...newMessages, ...prev]);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchRooms();
    fetchUsers();
    fetchProjects();
  }, [user, adminViewMode, selectedProjectId]);

  useEffect(() => {
    if (!socket || !selectedRoomId) return;
    socket.emit("chat:join", { roomId: selectedRoomId });
  }, [selectedRoomId, socket]);

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { message: ChatMessage; ts?: number }) => {
      const m = payload.message;
      if (m.roomId === selectedRoomId) {
        setMessages((prev) => {
          const exists = prev.some((pm) => pm.id === m.id);
          return exists ? prev : [...prev, m];
        });
      }
      
      if (m.userId !== user?.id) {
        const room = rooms.find(r => r.id === m.roomId);
        const amIMember = room?.memberships?.some(mem => mem.userId === user?.id);
        
        if (!amIMember && !isMentionToMe(m.content)) return;

        socket.emit("chat:delivered", { roomId: m.roomId, messageIds: [m.id] });
        if (soundEnabled) Promise.resolve().then(() => playNotification());

        // Browser Notification
        if (
             document.hidden || 
             m.roomId !== selectedRoomId
           ) {
            const sender = users.find(u => u.id === m.userId);
            const senderName = sender?.name || sender?.email || "Birisi";
            const icon = getAvatarUrl(sender?.avatar) || undefined;
            
            let title = "Yeni Mesaj";
            let body = `${senderName}: ${m.content}`;

            if (isMentionToMe(m.content)) {
                title = "Yeni Etiketlenme";
                body = `${senderName} sizi etiketledi: ${m.content}`;
            } else if ((room?.type || "").toUpperCase() === "DM") {
                title = senderName;
                body = m.content;
            } else {
                title = getRoomLabel(room || { name: 'Sohbet', type: 'CHANNEL', id: '?' } as ChatRoom);
                body = `${senderName}: ${m.content}`;
            }
            sendBrowserNotification(title, body, icon);
        }

        if (m.roomId === selectedRoomId && m.userId !== user?.id) {
           socket.emit("chat:read", { roomId: m.roomId, messageIds: [m.id] });
        }
 
        if (m.roomId !== selectedRoomId) {
          setUnreads((prev) => ({ ...prev, [m.roomId]: (prev[m.roomId] || 0) + 1 }));
        }
      }
    };
    const delHandler = (payload: { message: ChatMessage; ts?: number }) => {
      const m = payload.message;
      if (m.roomId === selectedRoomId) {
        setMessages((prev) => prev.map((pm) => (pm.id === m.id ? m : pm)));
      }
    };
    socket.on("chat:message:new", handler);
    socket.on("chat:message:deleted", delHandler);
    return () => {
      socket.off("chat:message:new", handler);
      socket.off("chat:message:deleted", delHandler);
    };
  }, [selectedRoomId, soundEnabled, users, user?.id, rooms, socket]);

  useEffect(() => {
    if (!socket) return;
    rooms.forEach((r) => socket.emit("chat:join", { roomId: r.id }));
  }, [rooms, socket]);

  useEffect(() => {
    if (!socket || !selectedRoomId) return;
    if (input.length > 0) {
      socket.emit("chat:typing", { roomId: selectedRoomId, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socket && selectedRoomId) socket.emit("chat:typing", { roomId: selectedRoomId, isTyping: false });
      }, 2000);
    }
  }, [input, selectedRoomId, socket]);

  useEffect(() => {
    if (!selectedRoomId || !socket || !messages.length) return;
    const unreadIds = messages.filter(m => m.userId !== user?.id && m.status !== 'READ').map(m => m.id);
    if (unreadIds.length > 0) {
      socket.emit("chat:read", { roomId: selectedRoomId, messageIds: unreadIds });
      setMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, status: 'READ' } : m));
    }
  }, [selectedRoomId, messages, user?.id, socket]);

  // Scroll Logic
  const shouldScrollToBottom = useRef(true);
  const prevScrollHeight = useRef(0);

  useEffect(() => {
    if (loadingMore) {
        const el = messagesListRef.current;
        if (el) el.scrollTop = el.scrollHeight - prevScrollHeight.current;
        shouldScrollToBottom.current = false;
    } else {
        shouldScrollToBottom.current = true;
    }
  }, [messages]);

  useEffect(() => {
      const el = messagesListRef.current;
      if (el && shouldScrollToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, selectedRoomId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop === 0 && !loadingMore && !loadingMessages && messages.length >= 50) {
        prevScrollHeight.current = el.scrollHeight;
        loadMoreMessages();
    }
  };

  // Actions
  const handleSelectRoom = async (roomId: string) => {
    setSelectedRoomId(roomId);
    await fetchMessages(roomId);
    setUnreads((prev) => { const next = { ...prev }; delete next[roomId]; return next; });
  };

  const startDM = async (userId: string) => {
    const existing = rooms.find(r => {
        if (r.type !== 'DM') return false;
        const hasTarget = r.memberships?.some(m => m.userId === userId);
        const hasMe = r.memberships?.some(m => m.userId === user?.id);
        return hasTarget && hasMe && r.memberships?.length === 2;
    });

    if (existing) {
      handleSelectRoom(existing.id);
      return;
    }
    
    const room = await api.post("/chat/rooms", { name: "DM", type: "DM", memberIds: [userId], isPrivate: true });
    await fetchRooms();
    handleSelectRoom(room.data.id);
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!selectedRoomId) return;
    if (!content && pendingAttachments.length === 0) return;
    setInput("");
    setShowEmoji(false);
    try {
      const attachments = pendingAttachments.map((att) => {
        const type = att.type || (att.mime?.startsWith('image/') ? 'image' : 'file');
        return { ...att, type };
      });
      const payload: any = { content };
      if (attachments.length > 0) payload.attachments = attachments;
      if (replyTo) {
        payload.attachments = [...(payload.attachments || []), { type: 'reply', messageId: replyTo.id, preview: (replyTo.content || '').slice(0, 120) }];
      }
      const res = await api.post(`/chat/rooms/${selectedRoomId}/messages`, payload);
      if (socket) socket.emit("chat:join", { roomId: selectedRoomId });
      setMessages((prev) => {
        const exists = prev.some((pm) => pm.id === res.data.id);
        return exists ? prev : [...prev, res.data];
      });
      setPendingAttachments([]);
      setReplyTo(null);
    } catch {
      setInput(content);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const toUpload = Array.from(files);
    for (const f of toUpload) {
      const form = new FormData();
      form.append('file', f);
      try {
        const res = await api.post('/chat/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        const data = res.data || {};
        setPendingAttachments((prev) => [...prev, { url: data.url, name: data.name || f.name, size: data.size || f.size, mime: data.mime || f.type, type: (f.type || '').startsWith('image/') ? 'image' : 'file' }]);
      } catch {}
    }
  };

  const createChannel = async () => {
    const name = newChannelName.trim();
    if (!name) return;
    await api.post("/chat/rooms", { name, type: "CHANNEL", isPrivate: false });
    setShowNewChannel(false);
    setNewChannelName("");
    fetchRooms();
  };

  const handleConvertToTask = async (messageId: string) => {
    try {
      await api.post(`/chat/messages/${messageId}/to-task`);
      setContextForMessageId(null);
    } catch {}
  };

  const removeAttachment = (idx: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const renderAttachmentsPreview = () => {
    if (pendingAttachments.length === 0) return null;
    return (
      <div className="px-6 py-2 border-b bg-gray-50 flex flex-wrap gap-2 dark:bg-slate-900 dark:border-slate-800">
        {pendingAttachments.map((att, i) => {
          const isImg = (att.type || '').startsWith('image');
          return (
            <div
              key={i}
              className="relative flex items-center gap-2 border rounded px-2 py-1 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700"
            >
              {isImg ? (
                <img src={baseUrl + att.url} alt={att.name} className="w-10 h-10 object-cover rounded" />
              ) : (
                <div className="text-xs font-medium text-slate-900 dark:text-slate-100">{att.name}</div>
              )}
              <button onClick={() => removeAttachment(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-600">×</button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderReplyPreview = () => {
    if (!replyTo) return null;
    return (
      <div className="px-6 py-2 border-b bg-gray-50 flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col gap-0.5 border-l-2 border-blue-500 pl-2">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Yanıtlanan Mesaj</span>
          <span className="text-xs text-slate-600 line-clamp-1 dark:text-slate-300">{replyTo.content}</span>
        </div>
        <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
          <X size={16} />
        </button>
      </div>
    );
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    const idx = val.lastIndexOf("@");
    if (idx !== -1) {
      const q = val.slice(idx + 1).split(/\s/)[0];
      setMentionQuery(q);
      setShowMentionList(true);
    } else {
      setShowMentionList(false);
      setMentionQuery("");
    }
  };

  const insertMention = (u: { id: string; name?: string; email: string }) => {
    const label = u.name || u.email;
    const idx = input.lastIndexOf("@");
    if (idx !== -1) {
      const before = input.slice(0, idx);
      const afterRest = input.slice(idx);
      const after = afterRest.replace(/^@[^ ]*/, "@" + label) + " ";
      setInput(before + after);
    } else {
      setInput(input + "@" + label + " ");
    }
    setShowMentionList(false);
    setMentionQuery("");
  };

  const filteredUsers = users.filter((u) => {
    if (!mentionQuery) return false;
    const s = mentionQuery.toLowerCase();
    return (u.name || "").toLowerCase().includes(s) || (u.email || "").toLowerCase().includes(s);
  }).slice(0, 6);

  // Render Helpers
  const renderDateSeparator = (date: Date) => {
    let label = format(date, "d MMMM yyyy", { locale: tr });
    if (isToday(date)) label = "Bugün";
    else if (isYesterday(date)) label = "Dün";
    
    return (
      <div className="flex justify-center my-4 sticky top-2 z-10">
        <span className="bg-white/80 backdrop-blur-sm border border-gray-100 text-[10px] font-medium text-gray-500 px-3 py-1 rounded-full shadow-sm dark:bg-slate-900/80 dark:border-slate-700 dark:text-slate-400">
          {label}
        </span>
      </div>
    );
  };

  const renderContentWithMentions = (text: string) => {
    const parts = text.split(/(\s+)/);
    return (
      <>
        {parts.map((p, i) => {
          const lp = p.toLowerCase();
          const meName = (user?.name || "").toLowerCase();
          const meEmail = (user?.email || "").toLowerCase();
          const isMention = lp.startsWith("@");
          const isToMe = isMention && ((meName && lp.includes(meName)) || (meEmail && lp.includes(meEmail)));
          return (
            <span
              key={i}
              className={
                isMention
                  ? isToMe
                    ? "bg-yellow-200 rounded px-1 dark:bg-yellow-300/30"
                    : "text-blue-600 dark:text-blue-400"
                  : ""
              }
            >
              {p}
            </span>
          );
        })}
      </>
    );
  };

  const channels = rooms.filter((r) => r.type === "CHANNEL");
  const projects = rooms.filter((r) => r.type === "PROJECT");

  if (!user) return null;

  return (
    <div className="flex h-full bg-white dark:bg-slate-950">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white dark:bg-slate-900 dark:border-slate-800">
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-sm font-bold text-slate-900 dark:text-slate-50">Sohbetler</div>
          {isAdmin && (
            <button
              onClick={() => setShowNewChannel(true)}
              className="p-1.5 rounded hover:bg-gray-100 text-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
        
        {/* Admin View Switcher */}
        {isAdmin && (
           <div className="px-4 py-2 flex gap-2 border-b border-gray-100 bg-gray-50/50 dark:border-slate-800 dark:bg-slate-900">
              <button 
                onClick={() => setAdminViewMode('mine')}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${
                  adminViewMode === 'mine'
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-50 dark:text-slate-900'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                Sohbetlerim
              </button>
              <button 
                onClick={() => setAdminViewMode('all')}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${
                  adminViewMode === 'all'
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-50 dark:text-slate-900'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                Tüm Mesajlar
              </button>
           </div>
        )}
        <div className="px-4 py-2 border-b border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-semibold text-slate-700 mb-1 dark:text-slate-300">Marka</div>
          <select
            value={selectedProjectId || ''}
            onChange={(e) => {
              const v = e.target.value || '';
              const val = v.length > 0 ? v : null;
              setSelectedProjectId(val);
              if (typeof window !== 'undefined') {
                if (val) window.localStorage.setItem('chat.selectedProjectId', val);
                else window.localStorage.removeItem('chat.selectedProjectId');
              }
              fetchRooms();
            }}
            className="w-full border border-gray-200 rounded-md text-sm px-2 py-1.5 bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          >
            <option value="">Tümü</option>
            {brandProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.customer?.name ? `${p.customer.name} - ${p.name}` : p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Channels */}
          {channels.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-bold text-slate-900 uppercase tracking-wider mt-2 dark:text-slate-200">Kanallar</div>
              {channels.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelectRoom(r.id)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition ${
                    selectedRoomId === r.id
                      ? "bg-slate-50 border-r-2 border-slate-900 dark:bg-slate-900 dark:border-emerald-400"
                      : "hover:bg-gray-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Hash size={16} className="text-gray-500 dark:text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900 truncate text-sm dark:text-slate-100">{getRoomLabel(r)}</span>
                      {unreads[r.id] ? (
                        <span className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full dark:bg-emerald-500">
                          {unreads[r.id]}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-bold text-slate-900 uppercase tracking-wider mt-2 dark:text-slate-200">
                Projeler
              </div>
              {projects.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelectRoom(r.id)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition ${
                    selectedRoomId === r.id
                      ? "bg-slate-50 border-r-2 border-slate-900 dark:bg-slate-900 dark:border-emerald-400"
                      : "hover:bg-gray-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Hash size={16} className="text-gray-500 dark:text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900 truncate text-sm dark:text-slate-100">{getRoomLabel(r)}</span>
                      {unreads[r.id] ? (
                        <span className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full dark:bg-emerald-500">
                          {unreads[r.id]}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Team */}
          <div className="px-4 py-2 text-xs font-bold text-slate-900 uppercase tracking-wider mt-2 dark:text-slate-200">
            Ekip
          </div>
          {users
            .filter((u) => !u.role || u.role !== 'CLIENT')
            .map((u) => (
              <button
                key={u.id}
                onClick={() => startDM(u.id)}
                className="w-full text-left px-4 py-2.5 flex items-center gap-3 transition hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                <div className="relative w-8 h-8 shrink-0">
                  {u.avatar ? (
                    <img
                      src={getAvatarUrl(u.avatar) || ''}
                      alt={u.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-xs dark:bg-slate-700 dark:text-slate-200">
                      {(u.name || u.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                  {onlineUsers.has(u.id) && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-white rounded-full dark:border-slate-900"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 truncate text-sm dark:text-slate-100">
                      {u.name || u.email}
                    </span>
                    {(() => {
                      const existingRoom = rooms.find((r) => {
                        if (r.type !== 'DM') return false;
                        const target = getDMTargetUser(r);
                        return target?.id === u.id;
                      });
                      if (existingRoom && unreads[existingRoom.id]) {
                        return (
                          <span className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full dark:bg-emerald-500">
                            {unreads[existingRoom.id]}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </button>
            ))}

          {/* Instagram / Customers */}
          <div className="px-4 py-2 text-xs font-bold text-slate-900 uppercase tracking-wider mt-2 dark:text-slate-200">
            Instagram / Müşteriler
          </div>
          {users
            .filter((u) => u.role === 'CLIENT')
            .map((u) => (
              <button
                key={u.id}
                onClick={() => startDM(u.id)}
                className="w-full text-left px-4 py-2.5 flex items-center gap-3 transition hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                <div className="relative w-8 h-8 shrink-0">
                  {u.avatar ? (
                    <img
                      src={getAvatarUrl(u.avatar) || ''}
                      alt={u.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-xs dark:bg-slate-700 dark:text-slate-200">
                      {(u.name || u.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm dark:bg-slate-900">
                    <Instagram size={12} className="text-pink-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 truncate text-sm dark:text-slate-100">
                      {u.name || u.email}
                    </span>
                    {(() => {
                      const existingRoom = rooms.find((r) => {
                        if (r.type !== 'DM') return false;
                        const target = getDMTargetUser(r);
                        return target?.id === u.id;
                      });
                      if (existingRoom && unreads[existingRoom.id]) {
                        return (
                          <span className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full dark:bg-emerald-500">
                            {unreads[existingRoom.id]}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-w-0 dark:bg-slate-900">
        {selectedRoomId ? (
          <>
            {/* Header */}
            <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between shrink-0 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-50">
                  {(() => {
                    const r = rooms.find(r => r.id === selectedRoomId);
                    return r ? getRoomLabel(r) : 'Sohbet';
                  })()}
                </div>
                {(() => {
                    const roomTyping = typingUsers[selectedRoomId] || {};
                    const typingUserIds = Object.keys(roomTyping);
                    if (typingUserIds.length > 0) {
                       return <span className="text-[11px] text-gray-500 font-medium animate-pulse dark:text-slate-400">Yazıyor...</span>;
                    }
                    const room = rooms.find(r => r.id === selectedRoomId);
                    if (room && (room.type === 'DM' || room.isPrivate)) {
                        const otherMember = getDMTargetUser(room);
                        if (otherMember && onlineUsers.has(otherMember.id)) {
                            return <span className="text-[11px] text-green-600 font-medium dark:text-emerald-400">Çevrimiçi</span>;
                        }
                    }
                    return null; 
                 })()}
              </div>
              <div className="flex items-center gap-2">
                 <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={`p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 ${isSyncing ? 'animate-spin' : ''}`}
                    title="Mesajları Senkronize Et"
                 >
                    <RefreshCw size={18} />
                 </button>
                 <button
                   onClick={() => setSoundEnabled(v => !v)}
                   className="p-2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200"
                 >
                   {soundEnabled ? "🔔" : "🔕"}
                 </button>
              </div>
            </div>

            {/* Messages */}
            <div 
                className="flex-1 overflow-y-auto px-6 py-4 space-y-4" 
                ref={messagesListRef}
                onScroll={handleScroll}
            >
              {loadingMore && (
                <div className="text-center text-xs text-gray-400 py-2 dark:text-slate-500">
                  Eski mesajlar yükleniyor...
                </div>
              )}
              {loadingMessages && (
                <div className="text-center text-xs text-gray-500 mt-4 dark:text-slate-400">
                  Sohbet yükleniyor...
                </div>
              )}
              {!loadingMessages &&
                messages.map((m, i) => {
                  const mine = m.userId === user?.id;
                  const attachments = parseAttachments(m.attachments);
                  const reply = attachments.find((a: any) => a?.type === 'reply');
                  const isAdmin = (user?.role || '').includes('ADMIN');
                  const isDeleted = !!m.deletedAt;
                  const sender = getUserLabel(m.userId);
                  
                  // Date Separator
                  const prevM = messages[i - 1];
                  const showDateSeparator = !prevM || !isSameDay(new Date(m.createdAt), new Date(prevM.createdAt));

                  return (
                    <div key={m.id}>
                      {showDateSeparator && renderDateSeparator(new Date(m.createdAt))}
                      <div className={`flex w-full ${mine ? "justify-end gap-2" : "justify-start gap-2"} mb-2`}>
                      {!mine && (
                         <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mt-1 dark:bg-slate-700">
                           {(() => {
                              const u = users.find(x => x.id === m.userId);
                              if (u?.avatar) return <img src={getAvatarUrl(u.avatar) || ""} className="w-full h-full object-cover" />;
                              return (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-slate-300">
                                  {(sender || '?')[0]}
                                </div>
                              );
                           })()}
                         </div>
                      )}
                      <div 
                        className={`relative max-w-[75%] rounded-lg px-4 py-2.5 text-sm shadow-sm group ${
                          mine 
                            ? "bg-slate-900 text-white rounded-tr-none"
                            : "bg-gray-100 text-slate-900 rounded-tl-none dark:bg-slate-800 dark:text-slate-100"
                        }`}
                      >
                        {!mine && (
                          <div className="text-[10px] font-bold text-slate-500 mb-0.5 leading-tight dark:text-slate-400">{sender}</div>
                        )}
                        
                        {isDeleted && !isAdmin ? (
                          <div className="italic text-gray-400 text-xs flex items-center gap-1 dark:text-slate-500">
                            <X size={12}/> Mesaj silindi
                          </div>
                        ) : (
                          <>
                            {reply && (
                               <div
                                 className={`border-l-2 rounded-sm px-2 py-1 mb-1 text-xs truncate ${
                                   mine
                                     ? "border-gray-500 bg-white/10 text-gray-300"
                                     : "border-gray-400 bg-black/5 text-gray-600 dark:bg-slate-900/40 dark:text-slate-300"
                                 }`}
                               >
                                 {reply.preview}
                               </div>
                            )}
                            
                            <div className="break-words whitespace-pre-wrap leading-relaxed">
                              {renderContentWithMentions(m.content)}
                            </div>

                            {attachments.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {attachments.filter((a: any) => a?.type && a.type !== 'reply').map((a: any, idx: number) => {
                                    const isImg = (a.type || '').startsWith('image') || (a.mime || '').startsWith('image/');
                                    return (
                                      <div
                                        key={idx}
                                        className="rounded overflow-hidden border border-gray-200 dark:border-slate-700"
                                      >
                                        {isImg ? (
                                          <img 
                                            src={baseUrl + a.url} 
                                            alt="Attachment" 
                                            className="max-w-[200px] max-h-[150px] object-cover cursor-pointer hover:opacity-90 transition"
                                            onClick={() => setPreviewImage(baseUrl + a.url)}
                                          />
                                        ) : (
                                          <a
                                            href={baseUrl + a.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1 bg-white text-black px-2 py-1 text-xs hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                                          >
                                            <span>📄</span> {a.name || 'Dosya'}
                                          </a>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                            )}
                          </>
                        )}

                        <div className="flex items-center justify-end gap-1 mt-1 select-none">
                           <span
                             className={`text-[10px] min-w-[30px] text-right ${
                               mine
                                 ? "text-gray-400 dark:text-slate-400"
                                 : "text-gray-500 dark:text-slate-400"
                             }`}
                           >
                             {format(new Date(m.createdAt), 'HH:mm')}
                           </span>
                           {mine && !isDeleted && (
                             <span className={m.status === 'READ' ? "text-blue-500" : "text-gray-400"}>
                               {m.status === 'READ' ? (
                                 <CheckCheck size={14} /> 
                               ) : m.status === 'DELIVERED' ? (
                                 <CheckCheck size={14} />
                               ) : (
                                 <Check size={14} />
                               )}
                             </span>
                           )}
                        </div>

                        {/* Hover Actions */}
                        {!isDeleted && (
                           <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button
                               onClick={() => setContextForMessageId(m.id)}
                               className="bg-white/90 rounded-full p-1 shadow hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900"
                             >
                               <MoreHorizontal size={14} className="text-slate-900 dark:text-slate-100" />
                             </button>
                           </div>
                        )}
                        
                        {/* Context Menu */}
                        {contextForMessageId === m.id && (
                          <div className="absolute top-6 right-2 z-50 bg-white border border-gray-200 rounded shadow-lg py-1 w-32 flex flex-col dark:bg-slate-900 dark:border-slate-700">
                             <button
                               onClick={() => {
                                 setReplyTo(m);
                                 setContextForMessageId(null);
                               }}
                               className="text-left px-3 py-1.5 text-xs text-slate-800 hover:bg-gray-100 dark:text-slate-100 dark:hover:bg-slate-800"
                             >
                               Yanıtla
                             </button>
                             <button
                               onClick={() => handleConvertToTask(m.id)}
                               className="text-left px-3 py-1.5 text-xs text-slate-800 hover:bg-gray-100 dark:text-slate-100 dark:hover:bg-slate-800"
                             >
                               Göreve Çevir
                             </button>
                             {(mine || isAdmin) && (
                               <button
                                 onClick={async () => {
                                   try {
                                     await api.post(`/chat/messages/${m.id}/delete`);
                                     setContextForMessageId(null);
                                     setMessages((prev) =>
                                       prev.map((pm) =>
                                         pm.id === m.id ? { ...pm, deletedAt: new Date().toISOString() } : pm,
                                       ),
                                     );
                                   } catch {}
                                 }}
                                 className="text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                               >
                                 Sil
                               </button>
                             )}
                             <div className="border-t my-1 dark:border-slate-700"></div>
                             <button
                               onClick={() => setContextForMessageId(null)}
                               className="text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                             >
                               Kapat
                             </button>
                          </div>
                        )}
                      </div>
                      {mine && (
                         <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mt-1 dark:bg-slate-700">
                           {user?.avatar ? (
                             <img src={getAvatarUrl(user.avatar) || ""} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-slate-300">
                               {(user?.name || user?.email || '?')[0].toUpperCase()}
                             </div>
                           )}
                         </div>
                      )}
                    </div>
                  </div>
                  );
                })}
            </div>

            {/* Input Area */}
            <div className="bg-white flex flex-col border-t border-gray-100 shrink-0 relative z-20 dark:bg-slate-900 dark:border-slate-800">
              {renderReplyPreview()}
              {renderAttachmentsPreview()}
              
              <div className="px-6 py-4 flex items-center gap-3 relative">
                 {/* Mention List Popup */}
                 {showMentionList && filteredUsers.length > 0 && (
                    <div className="absolute bottom-full left-12 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50 dark:bg-slate-900 dark:border-slate-700">
                       <div className="px-3 py-2 text-xs font-bold text-gray-500 bg-gray-50 border-b border-gray-100 dark:text-slate-400 dark:bg-slate-900 dark:border-slate-700">
                         Kişi Etiketle
                       </div>
                       {filteredUsers.map(u => (
                          <button 
                             key={u.id}
                             onClick={() => insertMention(u)}
                             className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 transition-colors dark:hover:bg-slate-800"
                          >
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0 overflow-hidden dark:bg-slate-700 dark:text-slate-200">
                                {u.avatar ? <img src={getAvatarUrl(u.avatar) || ""} className="w-full h-full object-cover" /> : (u.name || u.email || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-900 truncate dark:text-slate-100">
                                  {u.name || u.email}
                                </div>
                          </div>
                          </button>
                       ))}
                    </div>
                 )}

                 <button
                   onClick={() => setShowEmoji((v) => !v)}
                   className="p-2 text-slate-400 hover:text-slate-600 transition rounded-full hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                 >
                   🙂
                 </button>
                 {showEmoji && (
                   <div className="absolute bottom-20 left-6 bg-white border rounded shadow-xl p-2 w-64 z-50 dark:bg-slate-900 dark:border-slate-700">
                      <div className="grid grid-cols-8 gap-1">
                         {EMOJIS.map(e => (
                           <button
                             key={e}
                             onClick={() => setInput(p => p + e)}
                             className="text-xl hover:bg-gray-100 rounded dark:hover:bg-slate-800"
                           >
                             {e}
                           </button>
                         ))}
                      </div>
                   </div>
                 )}
                 <label className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer transition rounded-full hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800">
                   <input type="file" multiple className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                   📎
                 </label>
                 
                 <div className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 flex items-center border border-transparent focus-within:border-gray-300 transition-colors dark:bg-slate-900 dark:border-slate-700 dark:focus-within:border-slate-500">
                    <input
                      value={input}
                      onChange={onInputChange}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                      placeholder="Bir mesaj yazın... (@ ile etiketle)"
                      className="w-full text-sm outline-none text-slate-900 placeholder:text-slate-400 bg-transparent dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                 </div>
                 
                 <button
                   onClick={handleSend}
                   disabled={!input.trim() && pendingAttachments.length === 0}
                   className={`p-3 rounded-full transition ${
                     !input.trim() && pendingAttachments.length === 0
                       ? 'text-slate-300 bg-gray-100 dark:text-slate-600 dark:bg-slate-800'
                       : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                   }`}
                 >
                   <Send size={18} />
                 </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <div className="text-lg font-medium">Bir sohbet seçin</div>
            <div className="text-sm">Mesajlaşmaya başlamak için soldaki listeden birini seçin.</div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
            onClick={() => setPreviewImage(null)}
          >
            <X size={32} />
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* New Channel Modal */}
      {showNewChannel && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[360px] p-6 dark:bg-slate-900">
            <div className="text-lg font-bold text-slate-900 mb-4 dark:text-slate-50">Yeni Kanal Oluştur</div>
            <input
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:border-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
              placeholder="Kanal adı"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewChannel(false)}
                className="px-4 py-2 rounded-md border border-gray-200 text-sm font-medium hover:bg-gray-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                İptal
              </button>
              <button
                onClick={createChannel}
                className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
              >
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
