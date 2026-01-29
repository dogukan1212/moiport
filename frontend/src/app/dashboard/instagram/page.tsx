"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import api, { getBaseURL, SOCKET_URL } from "@/lib/api";
import { Send, X, MoreHorizontal, Hash, Check, CheckCheck, Instagram, MessageCircle, MessageSquare, Smile, Heart, RefreshCw, ArrowLeft } from "lucide-react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { io, Socket } from "socket.io-client";

type ChatRoom = {
  id: string;
  name: string;
  type: string;
  platform?: string;
  externalId?: string | null;
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
  platform?: string;
};

export default function InstagramPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dm' | 'comments'>('dm');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesListRef = useRef<HTMLDivElement | null>(null);
  
  const baseUrl = useMemo(() => getBaseURL(), []);

  // Fetch Rooms
  useEffect(() => {
    if (!user) return;
    fetchRooms();
  }, [user]);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await api.get("/chat/rooms?view=all");
      // Client-side filtering for Instagram
      const allRooms: ChatRoom[] = res.data;
      const igRooms = allRooms.filter(r => r.platform === 'INSTAGRAM');
      setRooms(igRooms);
    } catch (error) {
      console.error("Odalar yüklenirken hata:", error);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Socket Connection
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const newSocket = io(SOCKET_URL + "/chat", {
      auth: { token },
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Instagram Chat Socket connected");
    });

    newSocket.on("message", (msg: ChatMessage) => {
        // If message belongs to current room, append it
        if (selectedRoomId && msg.roomId === selectedRoomId) {
            setMessages((prev) => [...prev, msg]);
            scrollToBottom();
        }
        // Update room list order and unread count
        setRooms((prev) => {
            const roomIndex = prev.findIndex((r) => r.id === msg.roomId);
            if (roomIndex === -1) {
                // New room logic could be added here if needed, but usually rooms exist
                fetchRooms(); // Refresh to get new room if not exists
                return prev;
            }
            
            const updatedRooms = [...prev];
            const room = updatedRooms[roomIndex];
            
            // Move to top
            updatedRooms.splice(roomIndex, 1);
            updatedRooms.unshift({
                ...room,
                updatedAt: msg.createdAt,
                unreadCount: (msg.userId !== user?.id && msg.roomId !== selectedRoomId) 
                    ? (room.unreadCount || 0) + 1 
                    : room.unreadCount
            });
            
            return updatedRooms;
        });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [selectedRoomId, user?.id]);

  // Load Messages
  useEffect(() => {
    if (!selectedRoomId) return;
    
    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await api.get(`/chat/rooms/${selectedRoomId}/messages`);
        setMessages(res.data);
        scrollToBottom();
        
        // Reset unread count locally
        setRooms(prev => prev.map(r => r.id === selectedRoomId ? { ...r, unreadCount: 0 } : r));
        
        // Mark as read on backend (optional implementation)
      } catch (error) {
        console.error("Mesajlar yüklenirken hata:", error);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedRoomId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesListRef.current) {
        messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedRoomId || !user?.id || !user?.tenantId) return;

    const tempId = Math.random().toString(36).substring(7);
    const optimisticMsg: ChatMessage = {
      id: tempId,
      roomId: selectedRoomId,
      userId: user.id,
      tenantId: user.tenantId,
      content: input,
      createdAt: new Date().toISOString(),
      status: 'sending'
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setInput("");
    scrollToBottom();

    try {
      await api.post(`/chat/rooms/${selectedRoomId}/messages`, {
        content: optimisticMsg.content,
      });
      // Socket will handle the real message coming back
    } catch (error) {
      console.error("Mesaj gönderilemedi:", error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleSync = async () => {
    if (!selectedRoomId) return;
    setIsSyncing(true);
    try {
      await api.post(`/chat/rooms/${selectedRoomId}/sync`);
      // Re-fetch messages after sync
      const res = await api.get(`/chat/rooms/${selectedRoomId}/messages`);
      setMessages(res.data);
      scrollToBottom();
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getRoomLabel = (room: ChatRoom) => {
    if (room.type === 'DM') {
        const otherMember = room.memberships?.find(m => m.userId !== user?.id);
        return otherMember?.user?.name || room.name;
    }
    return room.name; // Post name
  };

  const getAvatarUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return baseUrl + path;
  };

  // Filtered Rooms
  const dms = rooms.filter(r => r.type === 'DM');
  const comments = rooms.filter(r => r.type === 'CHANNEL'); // Assuming Post Comments are Channels

  const currentList = activeTab === 'dm' ? dms : comments;
  
  const selectedRoom = useMemo(() => rooms.find(r => r.id === selectedRoomId), [rooms, selectedRoomId]);
  const isCommentRoom = selectedRoom?.type === 'CHANNEL';

  return (
    <div className="flex h-[calc(100vh-10rem)] overflow-hidden bg-background -m-6 rounded-none md:rounded-tl-2xl">
      {/* Sidebar List */}
      <div className="w-[360px] bg-card border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Instagram className="text-pink-600" />
              Instagram
            </h1>
            <div className="flex items-center gap-1">
              <button className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} onClick={handleSync} />
              </button>
              <button className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 bg-muted/50 rounded-lg">
            <button
              onClick={() => setActiveTab('dm')}
              className={`py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'dm' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Mesajlar
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'comments' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Yorumlar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingRooms ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
              <div className="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Sohbetler yükleniyor...</span>
            </div>
          ) : currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageCircle size={32} className="opacity-50" />
              </div>
              <p className="font-medium text-foreground">Henüz mesaj yok</p>
              <p className="text-sm mt-1">Gelen mesajlar burada listelenecek.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {currentList.map(room => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`w-full p-4 text-left transition-colors hover:bg-muted/50 flex gap-3 ${
                    selectedRoomId === room.id ? 'bg-muted/80' : ''
                  }`}
                >
                  <div className="relative w-12 h-12 shrink-0">
                      {/* Avatar Logic */}
                      {(() => {
                          const otherMember = room.memberships?.find(m => m.userId !== user?.id);
                          const avatar = otherMember?.user?.avatar;
                          const initial = (getRoomLabel(room) || '?')[0];
                          
                          return avatar ? (
                              <img src={getAvatarUrl(avatar) || ''} className="w-full h-full rounded-full object-cover ring-2 ring-background" />
                          ) : (
                              <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold text-lg ring-2 ring-background">
                                  {initial}
                              </div>
                          );
                      })()}
                      {room.platform === 'INSTAGRAM' && (
                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                          <div className="bg-gradient-to-tr from-yellow-400 to-pink-600 rounded-full p-1">
                            <Instagram size={10} className="text-white" />
                          </div>
                        </div>
                      )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-0.5">
                          <span className="font-semibold text-foreground truncate text-sm">
                              {getRoomLabel(room)}
                          </span>
                          {room.updatedAt && (
                              <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                  {format(new Date(room.updatedAt), 'HH:mm')}
                              </span>
                          )}
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground truncate pr-2">
                              {activeTab === 'comments' ? 'Bir gönderiye yorum yaptı' : 'Sohbeti görüntüle'}
                          </span>
                          {room.unreadCount ? (
                              <span className="bg-pink-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                                  {room.unreadCount}
                              </span>
                          ) : null}
                      </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!selectedRoomId ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative bg-muted/20`}>
        {selectedRoomId ? (
          <>
            {/* Header */}
            <div className="h-[73px] bg-card border-b border-border px-4 md:px-6 flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-3 md:gap-4">
                    <button 
                      onClick={() => setSelectedRoomId(null)}
                      className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
                         {(() => {
                            const room = rooms.find(r => r.id === selectedRoomId);
                            if (!room) return null;
                            const otherMember = room.memberships?.find(m => m.userId !== user?.id);
                            const avatar = otherMember?.user?.avatar;
                            const initial = (getRoomLabel(room) || '?')[0];
                            
                            return avatar ? (
                                <img src={getAvatarUrl(avatar) || ''} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold">
                                    {initial}
                                </div>
                            );
                        })()}
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-sm">
                            {rooms.find(r => r.id === selectedRoomId) ? getRoomLabel(rooms.find(r => r.id === selectedRoomId)!) : 'Sohbet'}
                        </h3>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {isCommentRoom ? 'Gönderi Yorumları' : 'Instagram Direct'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div 
                className="flex-1 overflow-y-auto p-6 z-10" 
                ref={messagesListRef}
            >
                <div className={`space-y-${isCommentRoom ? '6' : '2'} max-w-4xl mx-auto`}>
                {messages.map((msg, i) => {
                    const isMe = msg.userId === user?.id;
                    const showDate = i === 0 || !isSameDay(new Date(msg.createdAt), new Date(messages[i-1].createdAt));

                    if (isCommentRoom) {
                        // COMMENT STYLE
                        return (
                            <div key={msg.id} className="group">
                                <div className="flex gap-3 items-start">
                                    <div className="w-8 h-8 rounded-full bg-muted shrink-0 overflow-hidden mt-1">
                                         {/* Mock Avatar for message sender - in real app fetch user details */}
                                         <div className="w-full h-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                            {isMe ? user?.name?.[0] || 'B' : '?'}
                                         </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-transparent">
                                            <span className="font-bold text-sm text-foreground mr-2">
                                                {isMe ? (user?.name || 'Ben') : 'Kullanıcı'}
                                            </span>
                                            <span className="text-sm text-foreground/90 leading-relaxed">
                                                {msg.content}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground font-medium">
                                            <span>{format(new Date(msg.createdAt), 'd MMM', { locale: tr })}</span>
                                            <button className="hover:text-foreground">Yanıtla</button>
                                            <button className="hover:text-foreground">Çevirisini Gör</button>
                                        </div>
                                    </div>
                                    <button className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                        <Heart size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    // DM STYLE (Instagram Direct)
                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`flex gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar for received messages */}
                                {!isMe && (
                                    <div className="w-7 h-7 rounded-full bg-muted overflow-hidden shrink-0 self-end mb-1">
                                        {/* In real app use actual user avatar */}
                                        <div className="w-full h-full bg-gradient-to-tr from-yellow-400 to-pink-600 flex items-center justify-center text-white text-[10px] font-bold">
                                            {getRoomLabel(selectedRoom!)?.[0] || '?'}
                                        </div>
                                    </div>
                                )}

                                <div 
                                    className={`px-4 py-2.5 text-sm relative break-words shadow-sm ${
                                        isMe 
                                            ? 'bg-pink-600 text-white rounded-2xl rounded-br-sm' 
                                            : 'bg-card border border-border text-foreground rounded-2xl rounded-bl-sm'
                                    }`}
                                >
                                    <p className="leading-relaxed">
                                        {msg.content}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-[10px] text-muted-foreground mt-1 px-1 ${isMe ? 'mr-1' : 'ml-10'}`}>
                                {format(new Date(msg.createdAt), 'HH:mm')}
                            </span>
                        </div>
                    );
                })}
                </div>
            </div>

            {/* Input */}
            <div className="bg-card p-4 border-t border-border z-10">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3 items-end">
                    <button 
                        type="button"
                        className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors shrink-0"
                    >
                        <Smile size={24} />
                    </button>
                    <div className="flex-1 bg-muted/50 hover:bg-muted transition-colors rounded-[24px] flex items-center px-4 py-2 border border-transparent focus-within:border-pink-500/30 focus-within:bg-background focus-within:ring-4 focus-within:ring-pink-500/10">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isCommentRoom ? "Yorum ekle..." : "Mesaj gönder..."}
                            className="flex-1 bg-transparent border-0 focus:ring-0 p-1 text-foreground placeholder:text-muted-foreground"
                        />
                        {input.trim() && (
                            <button 
                                type="submit" 
                                className="ml-2 text-pink-600 font-semibold text-sm hover:text-pink-700 px-2"
                            >
                                Paylaş
                            </button>
                        )}
                    </div>
                    {!input.trim() && (
                         <div className="flex gap-1">
                            <button type="button" className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
                                <Heart size={24} />
                            </button>
                         </div>
                    )}
                </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/10 p-8">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-[32px] rotate-6 opacity-20 blur-xl animate-pulse"></div>
                    <div className="relative w-full h-full bg-card rounded-[32px] shadow-2xl flex items-center justify-center border border-border/50">
                        <Instagram size={64} className="text-pink-600" />
                    </div>
                </div>
                
                <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-foreground">Instagram Sohbetleri</h2>
                    <p className="text-muted-foreground">
                        DM kutunuzu ve yorumlarınızı buradan yönetin. Müşterilerinizle etkileşime geçmek için sol menüden bir sohbet seçin.
                    </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center mb-3 mx-auto">
                            <MessageSquare size={20} className="text-pink-600" />
                        </div>
                        <h3 className="font-semibold text-sm mb-1">Mesajlar</h3>
                        <p className="text-xs text-muted-foreground">Direkt mesajları anında yanıtlayın</p>
                    </div>
                    <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-3 mx-auto">
                            <MessageCircle size={20} className="text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-sm mb-1">Yorumlar</h3>
                        <p className="text-xs text-muted-foreground">Gönderi yorumlarını takip edin</p>
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
