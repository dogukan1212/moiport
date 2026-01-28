"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import api, { getBaseURL, SOCKET_URL } from "@/lib/api";
import { Send, X, MoreHorizontal, Hash, Check, CheckCheck, Instagram, MessageCircle, MessageSquare, Smile, Heart, RefreshCw } from "lucide-react";
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
    <div className="flex h-full bg-gray-50 dark:bg-slate-950">
      {/* Sidebar List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col dark:bg-slate-900 dark:border-slate-800">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4 dark:text-slate-50">
            <Instagram className="text-pink-600" />
            Instagram
          </h1>
          
          {/* Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-lg dark:bg-slate-800">
            <button
              onClick={() => setActiveTab('dm')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'dm' 
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-50' 
                  : 'text-gray-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Mesajlar
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'comments' 
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-50' 
                  : 'text-gray-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Yorumlar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingRooms ? (
            <div className="p-4 text-center text-gray-400 text-sm dark:text-slate-500">Yükleniyor...</div>
          ) : currentList.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2 dark:text-slate-500">
              <MessageSquare size={32} className="opacity-20" />
              <p>Henüz {activeTab === 'dm' ? 'mesaj' : 'yorum'} yok.</p>
            </div>
          ) : (
            currentList.map(room => (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`w-full p-4 text-left border-b border-gray-50 transition-colors hover:bg-gray-50 flex gap-3 dark:border-slate-800 dark:hover:bg-slate-800 ${
                  selectedRoomId === room.id ? 'bg-blue-50/50 dark:bg-slate-800/70' : ''
                }`}
              >
                <div className="relative w-10 h-10 shrink-0">
                    {/* Avatar Logic */}
                    {(() => {
                        const otherMember = room.memberships?.find(m => m.userId !== user?.id);
                        const avatar = otherMember?.user?.avatar;
                        const initial = (getRoomLabel(room) || '?')[0];
                        
                        return avatar ? (
                            <img src={getAvatarUrl(avatar) || ''} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold">
                                {initial}
                            </div>
                        );
                    })()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-slate-900 truncate text-sm dark:text-slate-50">
                            {getRoomLabel(room)}
                        </span>
                        {room.updatedAt && (
                            <span className="text-[10px] text-gray-400 dark:text-slate-500">
                                {format(new Date(room.updatedAt), 'HH:mm')}
                            </span>
                        )}
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 truncate dark:text-slate-400">
                            {activeTab === 'comments' ? 'Bir gönderiye yorum yaptı' : 'Sohbeti görüntüle'}
                        </span>
                        {room.unreadCount ? (
                            <span className="bg-pink-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {room.unreadCount}
                            </span>
                        ) : null}
                    </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col relative bg-slate-50 dark:bg-slate-900`}>
        {/* Chat Background Pattern removed for cleaner IG look */}
        
        {selectedRoomId ? (
          <>
            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 z-10 dark:bg-slate-900 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden dark:bg-slate-700">
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
                        <h3 className="font-bold text-slate-900 dark:text-slate-50">
                            {rooms.find(r => r.id === selectedRoomId) ? getRoomLabel(rooms.find(r => r.id === selectedRoomId)!) : 'Sohbet'}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                            {isCommentRoom ? 'Gönderi Yorumları' : 'Instagram Direct'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 ${isSyncing ? 'animate-spin' : ''}`}
                        title="Mesajları Senkronize Et"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200">
                        <MoreHorizontal />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div 
                className="flex-1 overflow-y-auto p-6 z-10" 
                ref={messagesListRef}
            >
                <div className={`space-y-${isCommentRoom ? '6' : '4'}`}>
                {messages.map((msg, i) => {
                    const isMe = msg.userId === user?.id;
                    const showDate = i === 0 || !isSameDay(new Date(msg.createdAt), new Date(messages[i-1].createdAt));

                    if (isCommentRoom) {
                        // COMMENT STYLE
                        return (
                            <div key={msg.id} className="group">
                                <div className="flex gap-3 items-start">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 overflow-hidden mt-1">
                                         {/* Mock Avatar for message sender - in real app fetch user details */}
                                         <div className="w-full h-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                            {isMe ? user?.name?.[0] || 'B' : '?'}
                                         </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-transparent">
                                            <span className="font-bold text-sm text-slate-900 mr-2 dark:text-slate-50">
                                                {isMe ? (user?.name || 'Ben') : 'Kullanıcı'}
                                            </span>
                                            <span className="text-sm text-slate-800 leading-relaxed dark:text-slate-100">
                                                {msg.content}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 font-medium dark:text-slate-400">
                                            <span>{format(new Date(msg.createdAt), 'd MMM', { locale: tr })}</span>
                                            <button className="hover:text-gray-800">Yanıtla</button>
                                            <button className="hover:text-gray-800">Çevirisini Gör</button>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 dark:text-slate-400 dark:hover:text-red-400">
                                        <Heart size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    // DM STYLE (Instagram Direct)
                    return (
                        <div key={msg.id} className={`flex gap-2 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {/* Avatar for received messages */}
                            {!isMe && (
                                <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden shrink-0 self-end mb-1 dark:bg-slate-700">
                                    {/* In real app use actual user avatar */}
                                    <div className="w-full h-full bg-gradient-to-tr from-yellow-400 to-pink-600 flex items-center justify-center text-white text-[10px] font-bold">
                                        {getRoomLabel(selectedRoom!)?.[0] || '?'}
                                    </div>
                                </div>
                            )}

                            <div 
                                className={`max-w-[70%] px-4 py-3 text-sm relative break-words ${
                                    isMe 
                                        ? 'bg-[#0095F6] text-white rounded-3xl rounded-br-md' 
                                        : 'bg-gray-100 text-slate-900 rounded-3xl rounded-bl-md dark:bg-slate-800 dark:text-slate-100'
                                }`}
                            >
                                <p className="leading-relaxed">
                                    {msg.content}
                                </p>
                                
                                {/* Status/Time - Minimalist for IG */}
                                {/* Only show status for own messages if needed, usually just "Seen" text at bottom of chat */}
                            </div>
                        </div>
                    );
                })}
                </div>
            </div>

            {/* Input */}
            <div className="bg-white p-4 border-t border-gray-200 z-10 dark:bg-slate-900 dark:border-slate-800">
                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                    <button 
                        type="button"
                        className="p-3 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-full transition-colors dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <Smile size={24} />
                    </button>
                    <div className="flex-1 bg-gray-100 rounded-3xl flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-pink-500/50 focus-within:bg-white transition-all border border-transparent focus-within:border-pink-200 dark:bg-slate-800 dark:focus-within:bg-slate-900 dark:border-slate-700">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isCommentRoom ? "Yorum ekle..." : "Mesaj gönder..."}
                            className="flex-1 bg-transparent border-0 focus:ring-0 p-1 text-slate-900 placeholder:text-gray-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                        />
                        {input.trim() && (
                            <button 
                                type="submit" 
                                className="ml-2 text-pink-600 font-semibold text-sm hover:text-pink-700"
                            >
                                Paylaş
                            </button>
                        )}
                    </div>
                    {!input.trim() && (
                         <div className="flex gap-1">
                             {/* Optional: Add Like/Image buttons for empty state if needed */}
                         </div>
                    )}
                </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-white z-10 dark:bg-slate-900">
            <div className="relative">
                <div className="w-24 h-24 rounded-full border-2 border-pink-100 flex items-center justify-center mb-6 relative z-10 bg-white dark:bg-slate-900 dark:border-pink-500/40">
                    <Instagram size={48} className="text-pink-600" />
                </div>
                <div className="absolute inset-0 bg-pink-50 rounded-full blur-xl opacity-50 dark:bg-pink-500/20"></div>
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 mb-2 dark:text-slate-50">Instagram Sohbetleri</h2>
            <p className="text-gray-500 text-center max-w-xs dark:text-slate-400">
                Görüşmelerinizi ve yorumlarınızı buradan yönetebilirsiniz. Başlamak için soldan bir sohbet seçin.
            </p>
            
            <button className="mt-8 px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                Yeni Mesaj Gönder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
