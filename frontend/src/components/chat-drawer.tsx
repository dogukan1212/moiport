"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/hooks/use-auth";
import api, { getBaseURL, SOCKET_URL } from "@/lib/api";
import { MessageSquare, MessageCircle, Send, X, MoreHorizontal, Users as UsersIcon, Hash, Check, CheckCheck } from "lucide-react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";

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

export default function ChatDrawer() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [users, setUsers] = useState<Array<{id: string; name?: string; email: string; avatar?: string}>>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [contextForMessageId, setContextForMessageId] = useState<string | null>(null);
  const [showRooms, setShowRooms] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Admin View Mode: 'mine' | 'all'
  const [adminViewMode, setAdminViewMode] = useState<'mine' | 'all'>('mine');


  const getAvatarUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return getBaseURL() + path;
  };
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Array<{ url: string; name: string; size: number; mime: string; type?: 'image' | 'file' }>>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [unreadMentions, setUnreadMentions] = useState(0);
  const [lastMention, setLastMention] = useState<{ roomId?: string; fromUserId?: string; content?: string } | null>(null);
  const [showMentionPreview, setShowMentionPreview] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [hasInteraction, setHasInteraction] = useState(false);
  const [unreads, setUnreads] = useState<Record<string, number>>({});
  const [lastSeenByRoom, setLastSeenByRoom] = useState<Record<string, number>>({});
  const [lastIncoming, setLastIncoming] = useState<{ roomId?: string; roomType?: string; roomName?: string; fromUserId?: string; content?: string } | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, Record<string, number>>>({}); // roomId -> userId -> timestamp
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesListRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const baseUrl = useMemo(() => getBaseURL(), []);

  const [tenantName, setTenantName] = useState<string>("");

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const res = await api.get('/tenants/me');
        if (res.data?.name) {
          setTenantName(res.data.name);
        }
      } catch {}
    };
    if (open) fetchTenant();
  }, [open]);

  const sendNotification = useCallback((title: string, body: string, icon?: string) => {
    if (typeof window === 'undefined' || !("Notification" in window)) return;
    
    // Windows/Electron AppID düzeltmesi için title'ı manipüle etmeye gerek yok
    // çünkü main.js'de setAppUserModelId yaptık.
    // Ancak kullanıcı "ayarlar bölümünden çeksin" dediği için,
    // Bildirim başlığına firma adını ekleyebiliriz.
    
    const finalTitle = tenantName ? `${tenantName} - ${title}` : title;

    if (Notification.permission === "granted") {
      new Notification(finalTitle, { body, icon });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(finalTitle, { body, icon });
        }
      });
    }
  }, [tenantName]);

  const playNotification = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      
      // Resume if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {
            // If resume fails (no user interaction yet), we can't play sound.
            // Just ignore to avoid console errors.
        });
      }
      
      // If still suspended after resume attempt, don't try to play
      if (ctx.state === 'suspended') return;

      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // Modern "Pop" / "Ding" sound (Polyphonic)
      // Oscillator 1 - Fundamental Tone (A5 - 880Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, t);
      
      gain1.gain.setValueAtTime(0, t);
      gain1.gain.linearRampToValueAtTime(0.1, t + 0.01); // Fast attack
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.5); // Decay
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      // Oscillator 2 - Harmonic (A6 - 1760Hz) for "glassy" feel
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1760, t);
      
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(0.05, t + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.3); // Shorter decay
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start(t);
      osc1.stop(t + 0.5);
      osc2.start(t);
      osc2.stop(t + 0.5);
    } catch {}
  }, [soundEnabled]);

  const EMOJIS = useMemo(() => ['😀','😁','😂','😊','😍','👍','👏','🙏','🎉','💯','🔥','😉','😎','🤔','😢','❤️'], []);

  const getUserLabel = (uid?: string) => {
    if (!uid) return "";
    const u = users.find((x) => x.id === uid);
    return u?.name || u?.email || uid;
  };

  const getDMTargetUser = (r: ChatRoom) => {
    if ((r.type || "").toUpperCase() !== "DM") return null;
    let targetId = (r.name || "").replace(/^DM-/, "");
    
    // Eğer üye bilgisi backend'den gelmişse (ki artık geliyor), onu kullan
    if (r.memberships && r.memberships.length > 0) {
       const other = r.memberships.find(m => m.userId !== user?.id);
       if (other && other.user) {
          // Backend'den gelen kullanıcı bilgisini dönüştür
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
      // Eğer admin tüm mesajları görüntülüyorsa, odanın iki tarafını da göster
      if (adminViewMode === 'all' && r.memberships && r.memberships.length > 0) {
         const names = r.memberships.map(m => {
           // Backend'den gelen user bilgisini tercih et
           if (m.user) return m.user.name || m.user.email;
           
           // Yoksa users listesinden bul
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
    if (!user?.id) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    
    const s = io(SOCKET_URL + '/chat', {
      auth: { token },
      transports: ["polling", "websocket"],
    });
    setSocket(s);
    
    s.on("connect", () => {});
    s.on("disconnect", () => {});
    s.on("connect_error", () => {});

    // Typing
    s.on("chat:typing", (payload: { userId: string; roomId: string; isTyping: boolean }) => {
      console.warn("[ChatDrawer] ### TYPING EVENT RECEIVED ###", payload);
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

    // Message Read
    s.on("chat:message:read", (payload: { roomId: string; messageIds: string[]; userId: string; status?: string }) => {
      console.log("[ChatDrawer] Message read event:", payload);
      setMessages((prev) => 
        prev.map((m) => {
          if (m.roomId === payload.roomId && payload.messageIds.includes(m.id)) {
            return { ...m, status: 'READ' };
          }
          return m;
        })
      );
    });

    // Message Delivered
    s.on("chat:message:delivered", (payload: { roomId: string; messageIds: string[]; userId: string }) => {
      console.log("[ChatDrawer] Message delivered event:", payload);
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

    // Online Users Events
    s.on("chat:users:online", (users: string[]) => {
      console.log("[ChatDrawer] Initial online users list:", users);
      setOnlineUsers(new Set(users));
    });

    s.on("chat:user:online", (payload: { userId: string }) => {
      console.log("[ChatDrawer] User online:", payload.userId);
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.add(payload.userId);
        return next;
      });
    });

    s.on("chat:user:offline", (payload: { userId: string }) => {
      console.log("[ChatDrawer] User offline:", payload.userId);
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(payload.userId);
        return next;
      });
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user?.id, baseUrl]);

  useEffect(() => {
    const v = localStorage.getItem("chatSoundEnabled");
    if (v === "false") setSoundEnabled(false);
  }, []);

  // Clear old typing users
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
             if (now - ts > 5000) {
               delete roomTyping[uid];
               roomChanged = true;
             }
           });
           if (roomChanged) {
             next[roomId] = roomTyping;
             changed = true;
           }
        });
        
        return changed ? next : prev;
      });
    }, 2000);
    return () => clearInterval(int);
  }, []);
  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      // Eğer kullanıcı adminse ve 'all' modundaysa tüm odaları çek
      const isAdmin = (user?.role || '').includes('ADMIN');
      const viewParam = isAdmin ? adminViewMode : 'mine';
      const res = await api.get(`/chat/rooms?view=${viewParam}`);
      const list: ChatRoom[] = (res.data || []) as ChatRoom[];
      const uniqByTypeName = new Map<string, ChatRoom>();
      const nextUnreads: Record<string, number> = {};
      
      for (const r of list) {
        const key = `${(r.type || "").toUpperCase()}:${r.name}`;
        if (!uniqByTypeName.has(key)) uniqByTypeName.set(key, r);
        if (r.unreadCount && r.unreadCount > 0) {
           nextUnreads[r.id] = r.unreadCount;
        }
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

  const fetchMessages = async (roomId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/chat/rooms/${roomId}/messages?limit=50`);
      const msgs = res.data || [];
      setMessages(msgs);
      
      // Emit delivered for messages that are still SENT
      if (socket && user?.id) {
        const toDeliver = msgs
          .filter((m: ChatMessage) => m.userId !== user.id && m.status === 'SENT')
          .map((m: ChatMessage) => m.id);
          
        if (toDeliver.length > 0) {
           socket.emit("chat:delivered", { roomId, messageIds: toDeliver });
        }
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
      if (newMessages.length > 0) {
        setMessages((prev) => [...newMessages, ...prev]);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchRooms();
    fetchUsers();
  }, [user, open, adminViewMode]);

  useEffect(() => {
    if (!socket || !selectedRoomId) return;
    socket.emit("chat:join", { roomId: selectedRoomId });
  }, [selectedRoomId, socket]);

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { message: ChatMessage; ts?: number }) => {
      const m = payload.message;
      const room = rooms.find((r) => r.id === m.roomId);
      if (m.roomId === selectedRoomId) {
        setMessages((prev) => {
          const exists = prev.some((pm) => pm.id === m.id);
          return exists ? prev : [...prev, m];
        });
      }
      
      // Global logic for new message
      if (m.userId !== user?.id) {
        // Eğer kullanıcı adminse ve tüm mesajları izliyorsa, ama odaya üye değilse
        // bildirim gösterme (ses çıkarma, unread artırma). Sadece listeyi güncelle.
        const room = rooms.find(r => r.id === m.roomId);
        const amIMember = room?.memberships?.some(mem => mem.userId === user?.id);
        
        // Eğer odaya üye değilsem ve mesaj bana mention içermiyorsa bildirim yapma
        if (!amIMember && !isMentionToMe(m.content)) {
            return;
        }

        // Emit delivered for any incoming message
        socket.emit("chat:delivered", { roomId: m.roomId, messageIds: [m.id] });
        
        // Play sound
        if (soundEnabled) {
          Promise.resolve().then(() => playNotification());
        }

        // Browser Notification
        const isChatPage = pathname?.startsWith("/dashboard/chat");
        // Notify if:
        // 1. Document is hidden (user is in another tab/app)
        // 2. OR Drawer is closed AND we are NOT on chat page (or we are on chat page but maybe scrolled away? hard to know. simple check: !isChatPage)
        // 3. OR Drawer is open BUT message is from another room
        if (
             document.hidden || 
             (!open && !isChatPage) || 
             (open && m.roomId !== selectedRoomId)
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
            
            // Sadece mention veya DM ise veya kullanıcı "biri mesaj attıysa" dediği için tüm mesajlarda gönderiyoruz.
            // Ama çok fazla bildirim olmaması için kanal mesajlarında sadece hidden ise göndermek mantıklı olabilir.
            // Şimdilik kullanıcı isteğine sadık kalıp gönderiyoruz.
            sendNotification(title, body, icon);
        }

        // Read receipt if window is open and user is in the room
        if (m.roomId === selectedRoomId && open && m.userId !== user?.id) {
           socket.emit("chat:read", { roomId: m.roomId, messageIds: [m.id] });
        }
 
        if (isMentionToMe(m.content) && m.userId !== user?.id) {
          setUnreadMentions((c) => c + 1);
          setUnreads((prev) => ({ ...prev, [m.roomId]: (prev[m.roomId] || 0) + 1 }));
          setLastIncoming({ roomId: m.roomId, roomType: room?.type, roomName: room ? getRoomLabel(room) : "Sohbet", fromUserId: m.userId, content: m.content });
          setShowMentionPreview(true);
        } else if ((room?.type || "").toUpperCase() === "DM" && m.userId !== user?.id) {
          setUnreads((prev) => ({ ...prev, [m.roomId]: (prev[m.roomId] || 0) + 1 }));
          setLastIncoming({ roomId: m.roomId, roomType: room?.type, roomName: room ? getRoomLabel(room) : "Sohbet", fromUserId: m.userId, content: m.content });
          setShowMentionPreview(true);
        } else if (m.roomId !== selectedRoomId && m.userId !== user?.id) {
          const roomId = m.roomId;
          setUnreads((prev) => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }));
          setLastIncoming({ roomId, roomType: room?.type, roomName: room ? getRoomLabel(room) : "Sohbet", fromUserId: m.userId, content: m.content });
          setShowMentionPreview(true);
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
  }, [selectedRoomId, soundEnabled, users, user?.id, rooms, socket, open]);

  useEffect(() => {
    if (!socket) return;
    rooms.forEach((r) => {
      socket.emit("chat:join", { roomId: r.id });
    });
  }, [rooms, socket]);

  // Handle typing emission
  useEffect(() => {
    if (!socket || !selectedRoomId) return;
    if (input.length > 0) {
      console.log("[ChatDrawer] Emitting chat:typing", { roomId: selectedRoomId, isTyping: true });
      socket.emit("chat:typing", { roomId: selectedRoomId, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socket && selectedRoomId) {
          console.log("[ChatDrawer] Emitting chat:typing (stop)", { roomId: selectedRoomId, isTyping: false });
          socket.emit("chat:typing", { roomId: selectedRoomId, isTyping: false });
        }
      }, 2000);
    }
  }, [input, selectedRoomId, socket]);

  // Handle Read Receipt emission
  useEffect(() => {
    if (!selectedRoomId || !socket || !messages.length || !open) return;
    const unreadIds = messages
      .filter(m => m.userId !== user?.id && m.status !== 'READ')
      .map(m => m.id);

    if (unreadIds.length > 0) {
      console.log("[ChatDrawer] Emitting chat:read", { roomId: selectedRoomId, messageIds: unreadIds });
      socket.emit("chat:read", { roomId: selectedRoomId, messageIds: unreadIds });
      // Optimistic update
      setMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, status: 'READ' } : m));
    }
  }, [selectedRoomId, messages, open, user?.id, socket]);

  useEffect(() => {
    const el = messagesListRef.current;
    if (el) {
      if (loadingMore) {
        // If we were loading more, maintain scroll position relative to bottom or specific item
        // But since we prepend, the scroll height increases.
        // We want to stay at the same message.
        // React's layout effect might be better, but let's try simple adjustment.
        // Actually, we need to capture scrollHeight before update.
        // Let's rely on useLayoutEffect or handle it in the loadMoreMessages function if possible.
        // For simplicity in this step, let's just let it be, user might jump a bit.
        // Better: capture previous scrollHeight
      } else {
        // Initial load or new message
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [messages, selectedRoomId, open]); // This dependency array is tricky for pagination

  // Use a separate effect for scrolling to bottom on initial load / new message
  // And another logic for maintaining scroll on pagination
  
  // Ref to track if we should auto-scroll
  const shouldScrollToBottom = useRef(true);
  const prevScrollHeight = useRef(0);

  useEffect(() => {
    if (loadingMore) {
        const el = messagesListRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight - prevScrollHeight.current;
        }
        shouldScrollToBottom.current = false;
    } else {
        shouldScrollToBottom.current = true;
    }
  }, [messages]);

  useEffect(() => {
      const el = messagesListRef.current;
      if (el && shouldScrollToBottom.current) {
          el.scrollTop = el.scrollHeight;
      }
  }, [messages, selectedRoomId, open]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop === 0 && !loadingMore && !loadingMessages && messages.length >= 50) {
        prevScrollHeight.current = el.scrollHeight;
        loadMoreMessages();
    }
  };
  useEffect(() => {
    if (open) {
      setShowMentionPreview(false);
    }
  }, [open]);

  const handleSelectRoom = async (roomId: string) => {
    setSelectedRoomId(roomId);
    setShowRooms(false);
    setShowUsers(false);
    await fetchMessages(roomId);
    setUnreadMentions(0);
    setShowMentionPreview(false);
    setUnreads((prev) => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
    setLastSeenByRoom((prev) => ({ ...prev, [roomId]: Date.now() }));
  };
  const startDM = async (userId: string) => {
    // Önce mevcut odalar içinde, sadece bu iki kişinin (ben ve hedef) olduğu DM odası var mı kontrol et.
    // Backend zaten createRoom çağrıldığında mevcut odayı dönüyor, bu yüzden
    // frontend tarafında isimle arama yapmak yerine direkt create isteği atmak daha güvenli.
    // Ancak UI'da hızlı geçiş için listede varsa onu seçmek mantıklı.
    // İsim kontrolü (DM-userId) YANLIŞTI çünkü herkes için aynı ismi üretiyordu.
    // Artık backend'e güveneceğiz veya members listesine bakacağız.
    
    const existing = rooms.find(r => {
        if (r.type !== 'DM') return false;
        // Odanın üyeleri arasında hedef kişi var mı?
        const hasTarget = r.memberships?.some(m => m.userId === userId);
        // Odanın üyeleri arasında ben var mıyım? (Tabii ki varım ama emin olalım)
        const hasMe = r.memberships?.some(m => m.userId === user?.id);
        // DM odası genelde 2 kişiliktir.
        return hasTarget && hasMe && r.memberships?.length === 2;
    });

    if (existing) {
      handleSelectRoom(existing.id);
      return;
    }
    
    // Oda yoksa oluştur (Backend zaten varsa onu döner)
    // İsim olarak unique bir şey göndermeye gerek yok, backend handle eder ama 
    // yine de ayırt edici olması için memberId'leri kullanabiliriz.
    // Backend createRoom mantığı zaten "bu iki üye varsa odayı dön" şeklinde çalışıyor (az önce düzelttik/kontrol ettik).
    const room = await api.post("/chat/rooms", { 
        name: "DM", // İsim backend'de veya UI'da override edilebilir, "DM" generic olsun
        type: "DM", 
        memberIds: [userId], 
        isPrivate: true 
    });
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
      if (socket) {
        socket.emit("chat:join", { roomId: selectedRoomId });
      }
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

  const pickEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
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

  const removeAttachment = (idx: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const renderAttachmentsPreview = () => {
    if (pendingAttachments.length === 0) return null;
    return (
      <div className="px-2 py-2 border-b bg-gray-50">
        <div className="text-xs font-medium text-slate-700 mb-1">Eklenecek Dosyalar</div>
        <div className="flex flex-wrap gap-2">
          {pendingAttachments.map((att, i) => {
            const isImg = (att.type || '').startsWith('image');
            return (
              <div key={i} className="flex items-center gap-2 border rounded px-2 py-1 bg-white">
                {isImg ? (
                  <img src={baseUrl + att.url} alt={att.name} className="w-10 h-10 object-cover rounded" />
                ) : (
                  <div className="text-xs font-medium text-slate-900">{att.name}</div>
                )}
                <button onClick={() => removeAttachment(i)} className="text-xs text-red-600 hover:underline">Kaldır</button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderReplyPreview = () => {
    if (!replyTo) return null;
    return (
      <div className="px-2 py-1 border-b bg-gray-50">
        <div className="text-xs text-slate-700">Yanıtlanan mesaj:</div>
        <div className="text-xs text-slate-900 line-clamp-2">{replyTo.content}</div>
        <button onClick={() => setReplyTo(null)} className="text-xs text-blue-600 hover:underline">Kaldır</button>
      </div>
    );
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

  const handleConvertToTask = async (messageId: string) => {
    try {
      await api.post(`/chat/messages/${messageId}/to-task`);
      setContextForMessageId(null);
    } catch {}
  };

  const toggleSound = () => {
    setSoundEnabled((v) => {
      const next = !v;
      localStorage.setItem("chatSoundEnabled", String(next));
      setHasInteraction(true);
      try {
        if (!next && audioCtxRef.current) {
          audioCtxRef.current.suspend();
        } else {
          ensureAudioCtx();
        }
      } catch {}
      return next;
    });
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
  const filteredUsers = users.filter((u) => {
    if (!mentionQuery) return false;
    const s = mentionQuery.toLowerCase();
    return (u.name || "").toLowerCase().includes(s) || (u.email || "").toLowerCase().includes(s);
  }).slice(0, 6);
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
            <span key={i} className={isMention ? (isToMe ? "bg-yellow-200 rounded px-1" : "text-blue-600") : ""}>{p}</span>
          );
        })}
      </>
    );
  };

  const renderDateSeparator = (date: Date) => {
    let label = format(date, "d MMMM yyyy", { locale: tr });
    if (isToday(date)) label = "Bugün";
    else if (isYesterday(date)) label = "Dün";
    
    return (
      <div className="flex justify-center my-4 sticky top-2 z-10">
        <span className="bg-white/80 backdrop-blur-sm border border-gray-100 text-[10px] font-medium text-gray-500 px-3 py-1 rounded-full shadow-sm">
          {label}
        </span>
      </div>
    );
  };

  const renderDrawer = () => (
    <div className="fixed bottom-16 right-4 z-40 w-[380px] h-[600px] bg-white shadow-2xl border border-gray-200 rounded-lg overflow-hidden flex flex-col font-sans">
      {/* Header */}
      <div className="flex flex-col bg-white border-b border-gray-100 shrink-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col">
            <div className="text-sm font-semibold text-slate-900">
              {(() => {
                if (!selectedRoomId) return 'Sohbet';
                const r = rooms.find(r => r.id === selectedRoomId);
                return r ? getRoomLabel(r) : 'Sohbet';
              })()}
            </div>
            {selectedRoomId && (() => {
                const roomTyping = typingUsers[selectedRoomId] || {};
                // TEST: Kendi ID'mizi filtrelemiyoruz, böylece aynı hesapla test ederken de görünsün
                const typingUserIds = Object.keys(roomTyping); //.filter(uid => uid !== user?.id);
                
                // Debug log for render
                if (typingUserIds.length > 0) {
                  console.warn("[ChatDrawer] Rendering typing indicator for:", typingUserIds);
                }

                if (typingUserIds.length > 0) {
                   return <span className="text-[11px] text-gray-500 font-medium animate-pulse">Yazıyor...</span>;
                }
                
                // Show online status for DM if not typing
                const room = rooms.find(r => r.id === selectedRoomId);
                if (room && (room.type === 'DM' || room.isPrivate)) {
                    const otherMember = getDMTargetUser(room);
                    if (otherMember && onlineUsers.has(otherMember.id)) {
                        return <span className="text-[11px] text-green-600 font-medium">Çevrimiçi</span>;
                    }
                }
                return null; 
             })()}
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Ses"
              onClick={toggleSound}
              className="p-2 rounded-full hover:bg-gray-100 transition"
            >
              {soundEnabled ? "🔔" : "🔕"}
            </button>
            <button
              aria-label="Sohbetler"
              onClick={() => {
                setShowRooms((v) => !v);
                setShowUsers(false);
              }}
              className={`p-2 rounded-full transition ${showRooms ? "bg-gray-200" : "hover:bg-gray-100"}`}
            >
              <Hash size={18} className="text-slate-700" />
            </button>
            <button
              aria-label="Kişiler"
              onClick={() => {
                setShowUsers((v) => !v);
                setShowRooms(false);
              }}
              className={`p-2 rounded-full transition ${showUsers ? "bg-gray-200" : "hover:bg-gray-100"}`}
            >
              <UsersIcon size={18} className="text-slate-700" />
            </button>
            <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition">
              <X size={18} className="text-slate-700" />
            </button>
          </div>
        </div>

        {/* Admin View Switcher (Visible for Admin) */}
        {(user?.role || '').includes('ADMIN') && (
           <div className="px-4 py-2 flex gap-2 border-b border-gray-100 bg-gray-50/50">
              <button 
                onClick={() => {
                    setAdminViewMode('mine');
                    setShowRooms(true);
                    setShowUsers(false);
                }}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${adminViewMode === 'mine' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Sohbetlerim
              </button>
              <button 
                onClick={() => {
                    setAdminViewMode('all');
                    setShowRooms(true);
                    setShowUsers(false);
                }}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${adminViewMode === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Tüm Mesajlar
              </button>
           </div>
        )}
      </div>

      {renderReplyPreview()}
      {renderAttachmentsPreview()}

      <div className="relative flex-1 bg-white">
        
        {showRooms && (
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-white z-20 overflow-y-auto">
            <div className="px-4 py-3 text-xs font-bold text-slate-900 uppercase tracking-wider">Sohbetler</div>
            {loadingRooms && <div className="px-4 py-2 text-sm text-gray-400">Yükleniyor...</div>}
            {!loadingRooms &&
              rooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelectRoom(r.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 flex items-center gap-3 transition ${
                    selectedRoomId === r.id ? "bg-gray-100" : ""
                  }`}
                >
                  <div className="relative w-10 h-10 shrink-0">
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                   {(() => {
                      if (r.type === "DM") {
                          if (adminViewMode === 'all') {
                             return <UsersIcon size={18} className="text-gray-600" />;
                          }
                          const u = getDMTargetUser(r);
                          if (u?.avatar) return <img src={getAvatarUrl(u.avatar) || ""} className="w-full h-full object-cover" alt={u.name} />;
                          if (u) return <span className="text-gray-600 font-semibold">{(u.name || u.email || '?')[0].toUpperCase()}</span>;
                          return <UsersIcon size={18} className="text-gray-600" />;
                      }
                      return <Hash size={18} className="text-gray-600" />;
                   })()}
                    </div>
                    {r.type === "DM" && adminViewMode !== 'all' && (() => {
                        const u = getDMTargetUser(r);
                        if (u && onlineUsers.has(u.id)) {
                            return <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full z-10"></span>;
                        }
                        return null;
                    })()}
                </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 truncate">{getRoomLabel(r)}</span>
                      {r.updatedAt && <span className="text-[10px] text-gray-400">{format(new Date(r.updatedAt), 'HH:mm')}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-gray-500 truncate">
                         {/* Last message preview could go here if available */}
                         Görüntülemek için tıklayın
                      </span>
                      {unreads[r.id] ? (
                        <span className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {unreads[r.id]}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        )}
        {showUsers && (
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-white z-20 overflow-y-auto">
             <div className="px-4 py-3 text-xs font-bold text-slate-900 uppercase tracking-wider">Kişiler</div>
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => startDM(u.id)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 flex items-center gap-3 transition"
              >
                <div className="relative w-10 h-10 flex-shrink-0">
                  {u.avatar ? (
                    <img src={getAvatarUrl(u.avatar) || ""} alt={u.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                      {(u.name || u.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                  {onlineUsers.has(u.id) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{u.name || u.email}</div>
                  {/* Find existing room for unread count */}
                  {(() => {
                    const existingRoom = rooms.find(r => {
                      if (r.type !== 'DM') return false;
                      const target = getDMTargetUser(r);
                      return target?.id === u.id;
                    });
                    
                    if (existingRoom && unreads[existingRoom.id]) {
                       return (
                         <div className="text-[10px] text-red-600 font-medium mt-0.5">
                           {unreads[existingRoom.id]} okunmamış mesaj
                         </div>
                       );
                    }
                    return null;
                  })()}
                </div>
              </button>
            ))}
          </div>
        )}
        {!showRooms && !showUsers && (
          <div className="absolute top-0 left-0 right-0 bottom-0 z-10">
            <div 
                className="h-full overflow-y-auto px-4 py-4 space-y-3" 
                ref={messagesListRef}
                onScroll={handleScroll}
            >
              {loadingMore && <div className="text-center text-xs text-gray-400 py-2">Eski mesajlar yükleniyor...</div>}
              {loadingMessages && <div className="text-center text-xs text-gray-500 mt-4">Sohbet yükleniyor...</div>}
              {!loadingMessages &&
                messages.map((m, i) => {
                  const mine = m.userId === user?.id;
                  const attachments = parseAttachments(m.attachments);
                  const reply = attachments.find((a: any) => a?.type === 'reply');
                  const isAdmin = (user?.role || '').includes('ADMIN');
                  const isDeleted = !!m.deletedAt;
                  const sender = getUserLabel(m.userId);
                  
                  // Date Separator Logic
                  const prevM = messages[i - 1];
                  const showDateSeparator = !prevM || !isSameDay(new Date(m.createdAt), new Date(prevM.createdAt));

                  return (
                    <div key={m.id}>
                      {showDateSeparator && renderDateSeparator(new Date(m.createdAt))}
                      <div className={`flex w-full ${mine ? "justify-end gap-2" : "justify-start gap-2"} mb-2`}>
                      {!mine && (
                         <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mt-1">
                           {(() => {
                              const u = users.find(x => x.id === m.userId);
                              if (u?.avatar) return <img src={getAvatarUrl(u.avatar) || ""} className="w-full h-full object-cover" />;
                              return <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">{(sender || '?')[0]}</div>;
                           })()}
                         </div>
                      )}
                      <div 
                        className={`relative max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm group ${
                          mine 
                            ? "bg-slate-900 text-white rounded-tr-none" 
                            : "bg-gray-100 text-slate-900 rounded-tl-none"
                        }`}
                      >
                        {!mine && (
                          <div className="text-[10px] font-bold text-slate-500 mb-0.5 leading-tight">{sender}</div>
                        )}
                        
                        {isDeleted && !isAdmin ? (
                          <div className="italic text-gray-400 text-xs flex items-center gap-1">
                            <X size={12}/> Mesaj silindi
                          </div>
                        ) : (
                          <>
                            {reply && (
                               <div className={`border-l-2 rounded-sm px-2 py-1 mb-1 text-xs truncate ${mine ? "border-gray-500 bg-white/10 text-gray-300" : "border-gray-400 bg-black/5 text-gray-600"}`}>
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
                                      <div key={idx} className="rounded overflow-hidden border border-gray-200">
                                        {isImg ? (
                                          <img 
                                            src={baseUrl + a.url} 
                                            alt="Attachment" 
                                            className="max-w-[200px] max-h-[150px] object-cover cursor-pointer hover:opacity-90 transition"
                                            onClick={() => setPreviewImage(baseUrl + a.url)}
                                          />
                                        ) : (
                                          <a href={baseUrl + a.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-white text-black px-2 py-1 text-xs hover:bg-gray-50">
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
                           <span className={`text-[10px] min-w-[30px] text-right ${mine ? "text-gray-400" : "text-gray-500"}`}>
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
                               className="bg-white/90 rounded-full p-1 shadow hover:bg-white"
                             >
                               <MoreHorizontal size={14} className="text-slate-900" />
                             </button>
                           </div>
                        )}
                        
                        {/* Context Menu */}
                        {contextForMessageId === m.id && (
                          <div className="absolute top-6 right-2 z-50 bg-white border border-gray-200 rounded shadow-lg py-1 w-32 flex flex-col">
                             <button onClick={() => {setReplyTo(m); setContextForMessageId(null)}} className="text-left px-3 py-1.5 text-xs text-slate-800 hover:bg-gray-100">Yanıtla</button>
                             <button onClick={() => handleConvertToTask(m.id)} className="text-left px-3 py-1.5 text-xs text-slate-800 hover:bg-gray-100">Göreve Çevir</button>
                             {(mine || isAdmin) && (
                               <button onClick={async () => {
                                 try {
                                   await api.post(`/chat/messages/${m.id}/delete`);
                                   setContextForMessageId(null);
                                   setMessages((prev) => prev.map((pm) => (pm.id === m.id ? { ...pm, deletedAt: new Date().toISOString() } : pm)));
                                 } catch {}
                               }} className="text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">Sil</button>
                             )}
                             <div className="border-t my-1"></div>
                             <button onClick={() => setContextForMessageId(null)} className="text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100">Kapat</button>
                          </div>
                        )}
                      </div>
                      {mine && (
                         <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden mt-1">
                           {user?.avatar ? (
                             <img src={getAvatarUrl(user.avatar) || ""} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
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
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white px-3 py-3 flex items-center gap-2 border-t border-gray-100 shrink-0 z-10">
        <button
          onClick={() => setShowEmoji((v) => !v)}
          className="p-2 text-slate-400 hover:text-slate-600 transition"
        >
          🙂
        </button>
        {showEmoji && (
          <div className="absolute bottom-16 left-2 bg-white border rounded shadow-xl p-2 w-64 z-50">
             <div className="grid grid-cols-8 gap-1">
                {EMOJIS.map(e => <button key={e} onClick={() => pickEmoji(e)} className="text-xl hover:bg-gray-100 rounded">{e}</button>)}
             </div>
          </div>
        )}
        <label className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer transition">
          <input type="file" multiple className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
          📎
        </label>
        
        <div className="flex-1 bg-gray-50 rounded-md px-3 py-2 flex items-center border border-transparent focus-within:border-gray-300 transition-colors">
           <input
             value={input}
             onChange={onInputChange}
             onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
             placeholder="Bir mesaj yazın..."
             className="w-full text-sm outline-none text-slate-900 placeholder:text-slate-400 bg-transparent"
           />
        </div>
        
        <button
          onClick={handleSend}
          disabled={!input.trim() && pendingAttachments.length === 0}
          className={`p-2 rounded-full transition ${(!input.trim() && pendingAttachments.length === 0) ? 'text-slate-300 bg-transparent' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'}`}
        >
          <Send size={18} />
        </button>
      </div>
      
      {/* Attachment Preview (if any) */}
      {pendingAttachments.length > 0 && (
         <div className="absolute bottom-16 left-0 right-0 bg-white border-t p-2 flex gap-2 overflow-x-auto z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           {pendingAttachments.map((a, i) => (
             <div key={i} className="relative w-16 h-16 bg-gray-50 border rounded flex items-center justify-center">
                <button onClick={() => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-slate-900 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">×</button>
                <span className="text-[10px] text-gray-500 truncate px-1">{a.name}</span>
             </div>
           ))}
         </div>
      )}

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
    </div>
  );

  if (!user) return null;

  return (
    <>
      <button
        aria-label="Chat"
        onClick={() => {
          setHasInteraction(true);
          ensureAudioCtx();
          if (!open) {
            setShowRooms(true);
            setShowUsers(false);
          }
          setOpen((v) => !v);
        }}
        className={`fixed bottom-6 right-6 z-50 rounded-full p-4 shadow-xl transition-all duration-300 transform hover:scale-105 ${
          open 
            ? "bg-slate-900 rotate-90" 
            : "bg-slate-900 hover:bg-slate-800"
        } text-white`}
      >
        {open ? <X size={24} /> : <MessageCircle size={28} className="fill-current" />}
        {!open && (() => {
          const totalUnreads = Object.values(unreads).reduce((acc, n) => acc + (n || 0), 0) + (unreadMentions || 0);
          return totalUnreads > 0 ? (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm animate-bounce">
              {totalUnreads}
            </span>
          ) : null;
        })()}
      </button>
      {!open && showMentionPreview && lastIncoming?.content && (
        <div
          className="fixed bottom-16 right-4 z-50 bg-white border rounded-full shadow px-3 py-2 flex items-center gap-2"
          onClick={async () => {
            setOpen(true);
            if (lastIncoming?.roomId) {
              await handleSelectRoom(lastIncoming.roomId);
            }
          }}
        >
          <div className="text-[11px] text-slate-500">{getUserLabel(lastIncoming?.fromUserId)}</div>
          <div className="text-[12px] font-medium text-slate-900 max-w-[220px] truncate">
            {(lastIncoming?.roomType || "").toUpperCase() === "DM" ? "DM: " : ""}
            {lastIncoming?.roomName}
            {" • "}
            {lastIncoming?.content}
          </div>
          <button
            className="ml-2 text-[11px] text-slate-600 hover:text-slate-900"
            onClick={(e) => {
              e.stopPropagation();
              setShowMentionPreview(false);
            }}
          >
            ×
          </button>
        </div>
      )}
      {open && renderDrawer()}
    </>
  );
}
