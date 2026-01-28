"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, Trash2, Calendar, UserPlus, AtSign, Info } from "lucide-react";
import api, { SOCKET_URL } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { io, Socket } from "socket.io-client";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
};

export function NotificationsPopover() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const router = useRouter();

  // Mock data for notifications when user is not logged in or API fails
  const mockNotifications: Notification[] = [
    {
      id: "1",
      title: "Yeni Görev Atandı",
      message: "Ahmet Yılmaz size 'Homepage Tasarımı' görevini atadı.",
      type: "TASK_ASSIGNMENT",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    },
    {
      id: "2",
      title: "Toplantı Hatırlatması",
      message: "Müşteri toplantısı 15 dakika içinde başlayacak.",
      type: "CRM_REMINDER",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    },
    {
      id: "3",
      title: "Yeni Yorum",
      message: "Selin Demir projenize bir yorum bıraktı.",
      type: "TASK_MENTION",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
  ];

  useEffect(() => {
    // If no user/token, use mock data for demo purposes
    if (!user) {
      setNotifications(mockNotifications);
      setUnreadCount(2);
      return;
    }

    // Fetch initial data
    fetchNotifications();
    fetchUnreadCount();

    // Socket connection
    const token = localStorage.getItem("token");
    if (!token) return;

    const s = io(SOCKET_URL + '/notifications', {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      console.log("Notifications socket connected");
    });

    s.on("notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Show toast notification
      toast(notification.title, {
        description: notification.message,
        action: {
          label: "Görüntüle",
          onClick: () => handleNotificationClick(notification),
        },
      });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications?limit=20");
      setNotifications(res.data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data.count);
    } catch (error) {
      console.error("Failed to fetch unread count", error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    setIsOpen(false);

    if (notification.referenceType === "TASK" && notification.referenceId) {
      // Navigate to task
      // Assuming tasks are in /dashboard/tasks?taskId=... or similar
      // Or just open the tasks page and let the user find it (less ideal)
      // Ideally we should open the task modal.
      // For now, let's navigate to tasks page with a query param if supported, or just tasks page
      router.push(`/dashboard/tasks?taskId=${notification.referenceId}`);
    } else if (notification.referenceType === "CRM_ACTIVITY" && notification.referenceId) {
      // Navigate to CRM leads page - the reminder will be visible in the lead detail modal
      router.push(`/dashboard/crm`);
    } else if (notification.referenceType === "LEAD" && notification.referenceId) {
      // Navigate to CRM leads page with the specific lead selected
      router.push(`/dashboard/crm?leadId=${notification.referenceId}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "TASK_ASSIGNMENT":
        return <UserPlus size={16} className="text-blue-500" />;
      case "TASK_MENTION":
        return <AtSign size={16} className="text-orange-500" />;
      case "TASK_DUE":
        return <Calendar size={16} className="text-red-500" />;
      case "CRM_REMINDER_CREATED":
      case "CRM_REMINDER":
        return <Bell size={16} className="text-purple-500" />;
      default:
        return <Info size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-slate-200 dark:border-zinc-800 z-50 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Bildirimler</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <Check size={14} />
                Tümünü Okundu İşaretle
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-sm">Yükleniyor...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-sm">Hiç bildiriminiz yok.</div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-zinc-800">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer flex gap-3 ${
                      !notification.isRead ? "bg-blue-50/30 dark:bg-blue-500/5" : ""
                    }`}
                  >
                    <div className="mt-1 flex-shrink-0">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? "font-semibold text-slate-900 dark:text-white" : "text-slate-700 dark:text-zinc-400"}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-600 mt-1.5">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="flex-shrink-0 self-center">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
