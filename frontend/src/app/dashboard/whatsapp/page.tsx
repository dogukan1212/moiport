"use client";

import { useEffect, useState } from "react";
import api, { SOCKET_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MessageCircle, Clock, X, Pencil, Check, CheckCheck, Paperclip, Smile, Search, Trash, Archive, Undo, Dot, ListFilter, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";

type WhatsappActivity = {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  status?: string; // SENT, DELIVERED, READ
};

type Attachment = {
  url: string;
  type: string;
  name: string;
  size?: number;
  mime?: string;
};

type WhatsappConversation = {
  id: string;
  name: string;
  phone?: string;
  stage?: {
    id: string;
    name: string;
    color?: string | null;
  };
  assignee?: {
    id: string;
    name?: string | null;
    avatar?: string | null;
  } | null;
  pipeline?: {
    id: string;
    name: string;
    stages?: { id: string; name: string; color?: string }[];
  };
  lastWhatsappActivity?: WhatsappActivity | null;
  hasNewMessage: boolean;
  activities?: WhatsappActivity[];
  isWhatsappArchived?: boolean;
};

type LeadDetail = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  stage?: {
    id: string;
    name: string;
    color?: string | null;
  };
  assignee?: {
    id: string;
    name?: string | null;
    avatar?: string | null;
  } | null;
  pipeline?: {
    id: string;
    name: string;
    stages?: { id: string; name: string; color?: string }[];
  };
  activities?: WhatsappActivity[];
  isWhatsappArchived?: boolean;
};

const EMOJIS = [
  "😀",
  "😁",
  "😂",
  "😊",
  "😍",
  "👍",
  "👏",
  "🙏",
  "🎉",
  "💯",
  "🔥",
  "😉",
  "😎",
  "🤔",
  "😢",
  "❤️",
];

export default function WhatsappPage() {
  const [conversations, setConversations] = useState<WhatsappConversation[]>([]);
  const [filtered, setFiltered] = useState<WhatsappConversation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadDetail, setLeadDetail] = useState<LeadDetail | null>(null);
  const [loadingLead, setLoadingLead] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [updatingName, setUpdatingName] = useState(false);

  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name?: string | null; avatar?: string | null }>>([]);
  const [assigning, setAssigning] = useState(false);

  const [searchInChat, setSearchInChat] = useState("");
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stageFilter, setStageFilter] = useState<string>("Tümü");
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<string>("anytime");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [conversationStatus, setConversationStatus] = useState<"active" | "archived" | "all">("active");
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [smartLoading, setSmartLoading] = useState<boolean>(false);
  const [autoReply, setAutoReply] = useState<boolean>(false);
  const [aiEnabled, setAiEnabled] = useState<boolean>(false);
  const [autoTemplates, setAutoTemplates] = useState<string[]>([]);

  useEffect(() => {
    // Socket connection
    const token = localStorage.getItem('token');
    if (!token) return;

    const s = io(SOCKET_URL + '/crm', {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      console.log("CRM socket connected");
    });

    s.on("lead:updated", (lead: any) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === lead.id
            ? {
                ...c,
                name: lead.name,
                stage: lead.stage,
                phone: lead.phone,
                assignee: lead.assignee ?? c.assignee,
              }
            : c,
        ),
      );

      setLeadDetail((prev) => {
        if (prev && prev.id === lead.id) {
          return {
            ...prev,
            name: lead.name,
            stage: lead.stage,
            phone: lead.phone,
            assignee: lead.assignee ?? prev.assignee,
          };
        }
        return prev;
      });
    });

    s.on("lead:updated", (lead: any) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === lead.id
            ? {
                ...c,
                name: lead.name ?? c.name,
                stage: lead.stage ?? c.stage,
                phone: lead.phone ?? c.phone,
                isWhatsappArchived: lead.isWhatsappArchived ?? c.isWhatsappArchived,
                assignee: lead.assignee ?? c.assignee,
              }
            : c,
        ),
      );
      setLeadDetail((prev) => {
        if (prev && prev.id === lead.id) {
          return {
            ...prev,
            name: lead.name ?? prev.name,
            stage: lead.stage ?? prev.stage,
            phone: lead.phone ?? prev.phone,
            isWhatsappArchived: lead.isWhatsappArchived ?? prev.isWhatsappArchived,
            assignee: lead.assignee ?? prev.assignee,
          };
        }
        return prev;
      });
    });

    s.on("lead:moved", (lead: any) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === lead.id
            ? {
                ...c,
                stage: lead.stage,
              }
            : c,
        ),
      );

      setLeadDetail((prev) => {
        if (prev && prev.id === lead.id) {
          return {
            ...prev,
            stage: lead.stage,
          };
        }
        return prev;
      });
    });

    s.on("whatsapp:message", async (data: any) => {
      const { leadId, activity, lead } = data;

      setConversations((prev) => {
        const exists = prev.find((c) => c.id === leadId);
        if (exists) {
           return prev.map((c) =>
            c.id === leadId
              ? {
                  ...c,
                  lastWhatsappActivity: activity,
                  hasNewMessage: activity.type === "WHATSAPP_IN",
                  // Update basic info just in case
                  name: lead.name,
                  stage: lead.stage,
                  isWhatsappArchived: lead.isWhatsappArchived,
                }
              : c,
          );
        } else {
          // New conversation
          const newConv: WhatsappConversation = {
             id: lead.id,
             name: lead.name,
             phone: lead.phone,
             stage: lead.stage,
             pipeline: lead.pipeline,
             lastWhatsappActivity: activity,
             hasNewMessage: activity.type === "WHATSAPP_IN",
             activities: [activity],
             isWhatsappArchived: lead.isWhatsappArchived,
          };
          return [newConv, ...prev];
        }
      });

      setLeadDetail((prev) => {
        if (prev && prev.id === leadId) {
          // Check if activity already exists (optimistic update prevention)
          if (prev.activities?.some((a) => a.id === activity.id)) {
            return prev;
          }
          // Also check for temp-id replacement if possible, but for now just add
          // If we had a temp id mechanism, we would replace it here.
          
          return {
            ...prev,
            activities: [...(prev.activities || []), activity],
          };
        }
        return prev;
      });

      if (activity?.type === "WHATSAPP_IN" && selectedLeadId === leadId) {
        const replies = await getSmartReplies();
        setSmartReplies(replies);
        if (autoReply) {
          const candidate = replies[0] || autoTemplates[0];
          if (candidate) {
            await sendMessageText(candidate);
          }
        }
      }
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/integrations/whatsapp/config')
      .then((res) => {
        if (cancelled) return;
        const cfg = res.data || {};
        setAiEnabled(!!cfg.aiEnabled);
        setAutoReply(!!cfg.autoReplyEnabled);
        try {
          const arr = cfg.autoReplyTemplates ? JSON.parse(cfg.autoReplyTemplates) : [];
          setAutoTemplates(Array.isArray(arr) ? arr : []);
        } catch {
          setAutoTemplates([]);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setAiEnabled(false);
        setAutoTemplates([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (leadDetail) {
      setEditedName(leadDetail.name);
    }
  }, [leadDetail]);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/users/list")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        if (!cancelled) setUsers(list);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      try {
        const includeArchived = conversationStatus !== "active";
        const res = await api.get(
          `/crm/whatsapp-conversations?includeArchived=${includeArchived}`,
        );
        const list = (res.data || []) as WhatsappConversation[];
        setConversations(Array.isArray(list) ? list : []);
        setFiltered(Array.isArray(list) ? list : []);
      } catch (error) {
        toast.error("WhatsApp konuşmaları yüklenemedi");
        setConversations([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [conversationStatus]);

  useEffect(() => {
    const term = search.trim().toLowerCase();
    const now = new Date();
    let startDate: Date | null = null;
    if (dateRange === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateRange === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    const next = conversations.filter((c) => {
      if (term) {
        const inName = c.name.toLowerCase().includes(term);
        const inPhone = (c.phone || "").toLowerCase().includes(term);
        const inLast = (c.lastWhatsappActivity?.content || "").toLowerCase().includes(term);
        if (!(inName || inPhone || inLast)) return false;
      }
      if (stageFilter !== "Tümü") {
        if ((c.stage?.name || "") !== stageFilter) return false;
      }
      if (unreadOnly && !c.hasNewMessage) return false;
      if (typeFilter !== "all") {
        const t = c.lastWhatsappActivity?.type || "";
        if (typeFilter === "in" && t !== "WHATSAPP_IN") return false;
        if (typeFilter === "out" && t !== "WHATSAPP_OUT") return false;
      }
      if (startDate && c.lastWhatsappActivity?.createdAt) {
        const d = new Date(c.lastWhatsappActivity.createdAt);
        if (d < startDate) return false;
      }
      if (conversationStatus === "active" && c.isWhatsappArchived) return false;
      if (conversationStatus === "archived" && !c.isWhatsappArchived) return false;
      return true;
    });
    setFiltered(next);
  }, [search, conversations, stageFilter, unreadOnly, dateRange, typeFilter, conversationStatus]);

  const handleCall = async () => {
    if (!leadDetail?.phone) return;

    // Log the call activity
    try {
      const newActivity: WhatsappActivity = {
        id: `temp-call-${Date.now()}`,
        type: "CALL",
        content: "Arama başlatıldı",
        createdAt: new Date().toISOString(),
      };

      // Optimistically add to UI
      setLeadDetail((prev) =>
        prev
          ? {
              ...prev,
              activities: [...(prev.activities || []), newActivity],
            }
          : prev,
      );

      await api.post(`/crm/leads/${leadDetail.id}/activities`, {
        type: "CALL",
        content: "WhatsApp ekranından arama başlatıldı",
      });
    } catch (error) {
      console.error("Arama kaydı oluşturulamadı", error);
    }

    // Trigger system dialer
    window.open(`tel:${leadDetail.phone.replace(/[^0-9+]/g, "")}`, "_self");
  };

  const handleUpdateName = async () => {
    if (!leadDetail || !editedName.trim() || editedName === leadDetail.name) {
      setEditingName(false);
      return;
    }
    setUpdatingName(true);
    try {
      await api.patch(`/crm/leads/${leadDetail.id}`, { name: editedName });
      setLeadDetail((prev) => (prev ? { ...prev, name: editedName } : null));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === leadDetail.id ? { ...c, name: editedName } : c,
        ),
      );
      toast.success("İsim güncellendi");
      setEditingName(false);
    } catch (error) {
      toast.error("İsim güncellenemedi");
    } finally {
      setUpdatingName(false);
    }
  };

  const handleChangeStage = async (stageId: string) => {
    if (!leadDetail) return;
    setUpdatingStage(true);

    try {
      await api.patch(`/crm/leads/${leadDetail.id}/move`, { stageId });
      const pipeline = leadDetail.pipeline;
      const newStage = pipeline?.stages?.find((s) => s.id === stageId);

      setLeadDetail((prev) =>
        prev
          ? {
              ...prev,
              stage: newStage
                ? {
                    id: newStage.id,
                    name: newStage.name,
                    color: newStage.color,
                  }
                : prev.stage,
            }
          : null,
      );

      setConversations((prev) =>
        prev.map((c) =>
          c.id === leadDetail.id
            ? {
                ...c,
                stage: newStage
                  ? {
                      id: newStage.id,
                      name: newStage.name,
                      color: newStage.color,
                    }
                  : c.stage,
              }
            : c,
        ),
      );

      toast.success("Aşama güncellendi");
    } catch (error) {
      toast.error("Aşama güncellenemedi");
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleAssign = async (assigneeId: string) => {
    if (!leadDetail) return;
    setAssigning(true);
    const nextAssigneeId = assigneeId === "none" ? null : assigneeId;
    try {
      const res = await api.patch(`/crm/leads/${leadDetail.id}/assignee`, {
        assigneeId: nextAssigneeId,
      });
      const updated = res.data || {};
      setLeadDetail((prev) =>
        prev ? { ...prev, assignee: updated.assignee || null } : prev,
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === leadDetail.id
            ? { ...c, assignee: updated.assignee || null }
            : c,
        ),
      );
      toast.success("Atama güncellendi");
    } catch {
      toast.error("Atama güncellenemedi");
    } finally {
      setAssigning(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const toUpload = Array.from(files);
    for (const f of toUpload) {
      const form = new FormData();
      form.append("file", f);
      try {
        const res = await api.post("/chat/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const data = res.data || {};
        setPendingAttachments((prev) => [
          ...prev,
          {
            url: data.url,
            name: data.name || f.name,
            type: (f.type || "").startsWith("image/") ? "image" : "file",
            mime: f.type,
            size: f.size,
          },
        ]);
      } catch {
        toast.error("Dosya yüklenemedi");
      }
    }
  };

  const pickEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
  };

  const openConversation = async (leadId: string) => {
    setSelectedLeadId(leadId);
    setLeadDetail(null);
    setMessage("");
    setLoadingLead(true);
    
    try {
      const res = await api.get(`/crm/leads/${leadId}`);
      const data = res.data || {};
      const whatsappActivities =
        (data.activities as WhatsappActivity[] | undefined)?.filter(
          (a) => a.type === "WHATSAPP_IN" || a.type === "WHATSAPP_OUT",
        ) || [];
      const isArchived =
        whatsappActivities.length > 0 &&
        whatsappActivities.every((a) => a.status === "ARCHIVED");
      setLeadDetail({
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        source: data.source,
        stage: data.stage,
        assignee: data.assignee || null,
        pipeline: data.pipeline,
        activities: whatsappActivities.sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt),
        ),
        isWhatsappArchived: isArchived,
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === leadId
            ? {
                ...c,
                hasNewMessage:
                  c.lastWhatsappActivity?.type === "WHATSAPP_IN"
                    ? false
                    : c.hasNewMessage,
              }
            : c,
        ),
      );
    } catch (error) {
      toast.error("Sohbet detayları yüklenemedi");
    } finally {
      setLoadingLead(false);
    }
  };

  const getSmartReplies = async (): Promise<string[]> => {
    if (!leadDetail || !Array.isArray(leadDetail.activities)) return [];
    if (!aiEnabled) return [];
    const history = (leadDetail.activities || [])
      .slice(-10)
      .map((a) => (a.type === "WHATSAPP_OUT" ? `Siz: ${a.content}` : `Müşteri: ${a.content}`));
    try {
      setSmartLoading(true);
      const res = await api.post("/ai/whatsapp/smart-replies", { messages: history });
      const list = Array.isArray(res.data?.replies) ? res.data.replies : [];
      return list;
    } catch {
      return [];
    } finally {
      setSmartLoading(false);
    }
  };

  const fetchSmartReplies = async () => {
    const list = await getSmartReplies();
    setSmartReplies(list);
  };

  useEffect(() => {
    if (selectedLeadId) {
      if (aiEnabled) void fetchSmartReplies();
    }
  }, [selectedLeadId, aiEnabled]);

  const sendMessageText = async (text: string) => {
    if (!leadDetail) return;
    const t = String(text || "").trim();
    if (!t) return;
    const newActivity: WhatsappActivity = {
      id: `temp-${Date.now()}`,
      type: "WHATSAPP_OUT",
      content: t,
      createdAt: new Date().toISOString(),
    };
    setSending(true);
    try {
      await api.post("/integrations/whatsapp/send", {
        leadId: leadDetail.id,
        message: t,
        attachments: [],
      });
      setLeadDetail((prev) =>
        prev
          ? {
              ...prev,
              activities: [...(prev.activities || []), newActivity],
            }
          : prev,
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === leadDetail.id
            ? {
                ...c,
                lastWhatsappActivity: newActivity,
                hasNewMessage: false,
              }
            : c,
        ),
      );
    } catch {
      toast.error("Mesaj gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!leadDetail) return;
    if (!message.trim() && pendingAttachments.length === 0) return;

    const text = message.trim();
    let displayContent = text;
    if (pendingAttachments.length > 0) {
      const fileNames = pendingAttachments.map((a) => a.name).join(", ");
      displayContent = text
        ? `${text}\n[Ekler: ${fileNames}]`
        : `[Ekler: ${fileNames}]`;
    }

    const newActivity: WhatsappActivity = {
      id: `temp-${Date.now()}`,
      type: "WHATSAPP_OUT",
      content: displayContent,
      createdAt: new Date().toISOString(),
    };
    setSending(true);
    try {
      await api.post("/integrations/whatsapp/send", {
        leadId: leadDetail.id,
        message: text,
        attachments: pendingAttachments,
      });
      setLeadDetail((prev) =>
        prev
          ? {
              ...prev,
              activities: [...(prev.activities || []), newActivity],
            }
          : prev,
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === leadDetail.id
            ? {
                ...c,
                lastWhatsappActivity: newActivity,
                hasNewMessage: false,
              }
            : c,
        ),
      );
      setMessage("");
      setPendingAttachments([]);
    } catch (error) {
      toast.error("Mesaj gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  const archiveConversation = async () => {
    if (!leadDetail) return;
    try {
      await api.patch(`/crm/leads/${leadDetail.id}/archive`, {
        archived: true,
      });
    } catch {
      toast.error("Sohbet arşivlenemedi");
      return;
    }
    setLeadDetail((prev) =>
      prev ? { ...prev, isWhatsappArchived: true } : prev,
    );
    setConversations((prev) =>
      prev.map((c) =>
        c.id === leadDetail.id ? { ...c, isWhatsappArchived: true } : c,
      ),
    );
    setFiltered((prev) =>
      prev.map((c) =>
        c.id === leadDetail.id ? { ...c, isWhatsappArchived: true } : c,
      ),
    );
    toast.success("Sohbet arşivlendi");
  };
  const unarchiveConversation = async () => {
    if (!leadDetail) return;
    try {
      await api.patch(`/crm/leads/${leadDetail.id}/archive`, {
        archived: false,
      });
    } catch {
      toast.error("Sohbet arşivden çıkarılamadı");
      return;
    }
    setLeadDetail((prev) =>
      prev ? { ...prev, isWhatsappArchived: false } : prev,
    );
    setConversations((prev) =>
      prev.map((c) =>
        c.id === leadDetail.id ? { ...c, isWhatsappArchived: false } : c,
      ),
    );
    setFiltered((prev) =>
      prev.map((c) =>
        c.id === leadDetail.id ? { ...c, isWhatsappArchived: false } : c,
      ),
    );
    toast.success("Sohbet arşivden çıkarıldı");
  };
  const markUnread = () => {
    if (!leadDetail) return;
    if (leadDetail.isWhatsappArchived) {
      toast.error("Arşivli sohbeti okunmadı yapamazsınız");
      return;
    }
    const hasIncoming = (leadDetail.activities || []).some(
      (a) => a.type === "WHATSAPP_IN" && a.status !== "ARCHIVED",
    );
    if (!hasIncoming) {
      toast.error("Okunmadı yapılacak gelen mesaj yok");
      return;
    }
    setConversations((prev) =>
      prev.map((c) =>
        c.id === leadDetail.id ? { ...c, hasNewMessage: true } : c,
      ),
    );
    setFiltered((prev) =>
      prev.map((c) =>
        c.id === leadDetail.id ? { ...c, hasNewMessage: true } : c,
      ),
    );
    toast.success("Sohbet okunmadı olarak işaretlendi");
  };
  const deleteConversation = async () => {
    if (!leadDetail) return;
    try {
      await api.delete(`/crm/leads/${leadDetail.id}`);
      setConversations((prev) => prev.filter((c) => c.id !== leadDetail.id));
      setFiltered((prev) => prev.filter((c) => c.id !== leadDetail.id));
      setSelectedLeadId(null);
      setLeadDetail(null);
      toast.success("Sohbet silindi");
    } catch {
      toast.error("Sohbet silinemedi");
    }
  };
  const archiveActivity = async (activityId: string, type: string) => {
    if (!leadDetail) return;
    try {
      await api.patch(`/crm/activities/${activityId}`, {
        status: "ARCHIVED",
      });
      setLeadDetail((prev) =>
        prev
          ? {
              ...prev,
              activities: (prev.activities || []).map((a) =>
                a.id === activityId ? { ...a, status: "ARCHIVED" } : a,
              ),
            }
          : prev,
      );
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== leadDetail.id) return c;
          const acts = (leadDetail.activities || []).filter(
            (a) =>
              (a.type === "WHATSAPP_IN" || a.type === "WHATSAPP_OUT") &&
              (a.id !== activityId ? a.status !== "ARCHIVED" : false),
          );
          const last = acts.length > 0 ? acts[acts.length - 1] : null;
          return {
            ...c,
            lastWhatsappActivity: last,
            hasNewMessage: last?.type === "WHATSAPP_IN",
          };
        }),
      );
    } catch {
      toast.error("Mesaj arşivlenemedi");
    }
  };
  const unarchiveActivity = async (activityId: string, type: string) => {
    if (!leadDetail) return;
    const restoreStatus = type === "WHATSAPP_IN" ? "DELIVERED" : "SENT";
    try {
      await api.patch(`/crm/activities/${activityId}`, {
        status: restoreStatus,
      });
      setLeadDetail((prev) =>
        prev
          ? {
              ...prev,
              activities: (prev.activities || []).map((a) =>
                a.id === activityId ? { ...a, status: restoreStatus } : a,
              ),
            }
          : prev,
      );
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== leadDetail.id) return c;
          const acts = (leadDetail.activities || []).filter(
            (a) =>
              (a.type === "WHATSAPP_IN" || a.type === "WHATSAPP_OUT") &&
              (a.id !== activityId ? a.status !== "ARCHIVED" : true),
          );
          const last = acts.length > 0 ? acts[acts.length - 1] : null;
          return {
            ...c,
            lastWhatsappActivity: last,
            hasNewMessage: last?.type === "WHATSAPP_IN",
          };
        }),
      );
    } catch {
      toast.error("Mesaj arşivden çıkarılamadı");
    }
  };
  const stageOptions = Array.from(
    new Set(conversations.map((c) => c.stage?.name).filter(Boolean)),
  ) as string[];

  const renderLastMessage = (conv: WhatsappConversation) => {
    if (!conv.lastWhatsappActivity) return "Mesaj yok";
    const prefix =
      conv.lastWhatsappActivity.type === "WHATSAPP_OUT" ? "Siz: " : "Müşteri: ";
    return `${prefix}${conv.lastWhatsappActivity.content}`;
  };

  const renderLastTime = (conv: WhatsappConversation) => {
    if (!conv.lastWhatsappActivity) return "-";
    return formatDistanceToNow(new Date(conv.lastWhatsappActivity.createdAt), {
      addSuffix: true,
      locale: tr,
    });
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            WhatsApp Sohbetleri
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            WhatsApp üzerinden gelen ve giden tüm lead konuşmalarını buradan
            yönetin.
          </p>
        </div>
      </div>

      <div className="flex gap-4 h-[650px]">
        <div className="w-[320px] flex-shrink-0 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="border-b border-border/60 bg-muted/30 px-3 py-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9 rounded-full border-border/50 bg-background/50 focus:bg-background transition-colors text-xs placeholder:text-muted-foreground"
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-9 w-9 rounded-full ${
                      stageFilter !== "Tümü" || typeFilter !== "all" || dateRange !== "anytime" 
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" 
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <ListFilter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium leading-none text-sm">Filtreler</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setStageFilter("Tümü");
                          setTypeFilter("all");
                          setDateRange("anytime");
                        }}
                      >
                        Sıfırla
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Aşama</Label>
                      <Select value={stageFilter} onValueChange={setStageFilter}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Tümü" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tümü">Tümü</SelectItem>
                          {stageOptions.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Mesaj Türü</Label>
                      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                        {["all", "in", "out"].map((value) => (
                          <button
                            key={value}
                            onClick={() => setTypeFilter(value)}
                            className={`flex-1 text-[10px] font-medium py-1.5 rounded-md transition-all ${
                              typeFilter === value
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {value === "all" ? "Hepsi" : value === "in" ? "Gelen" : "Giden"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Tarih</Label>
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Her zaman" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="anytime">Her zaman</SelectItem>
                          <SelectItem value="today">Bugün</SelectItem>
                          <SelectItem value="week">Son 7 gün</SelectItem>
                          <SelectItem value="month">Son 30 gün</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              <button
                onClick={() => {
                  setUnreadOnly(false);
                  setConversationStatus("active");
                  setShowArchived(false);
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border ${
                  !unreadOnly && conversationStatus === "active"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                    : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                }`}
              >
                Hepsi
              </button>
              <button
                onClick={() => {
                  setUnreadOnly(true);
                  setConversationStatus("active");
                  setShowArchived(false);
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border ${
                  unreadOnly
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                    : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                }`}
              >
                Okunmamış
              </button>
              <button
                onClick={() => {
                  setUnreadOnly(false);
                  setConversationStatus("archived");
                  setShowArchived(true);
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border ${
                  conversationStatus === "archived"
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                    : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                }`}
              >
                Arşivli
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-xs text-muted-foreground">Yükleniyor...</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-xs text-muted-foreground">
                Henüz WhatsApp konuşması bulunmuyor.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filtered.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => openConversation(conv.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 transition-colors text-left ${
                      conv.id === selectedLeadId
                        ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25"
                        : conv.isWhatsappArchived
                        ? "bg-muted hover:bg-muted/80"
                        : conv.hasNewMessage
                        ? "bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25"
                        : "hover:bg-muted/80"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                        <MessageCircle className="w-4 h-4" />
                        {conv.hasNewMessage && !conv.isWhatsappArchived && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-xs font-semibold truncate max-w-[160px] ${
                              conv.isWhatsappArchived
                                ? "text-muted-foreground"
                                : conv.hasNewMessage
                                ? "text-emerald-700 dark:text-emerald-300"
                                : "text-foreground"
                            }`}
                          >
                            {conv.name}
                          </p>
                          {conv.stage && (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium"
                              style={{
                                backgroundColor: `${conv.stage.color || "#e5e7eb"}1a`,
                                color: conv.stage.color || "#374151",
                              }}
                            >
                              {conv.stage.name}
                            </span>
                          )}
                        </div>
                        <div
                          className={`flex items-center gap-2 text-[11px] ${
                            conv.isWhatsappArchived
                              ? "text-muted-foreground"
                              : conv.hasNewMessage
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-muted-foreground"
                          }`}
                        >
                          {conv.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {conv.phone}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 truncate max-w-[170px]">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">
                              {renderLastMessage(conv)}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`flex items-center gap-1 text-[10px] ${
                          conv.hasNewMessage && !conv.isWhatsappArchived
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {renderLastTime(conv)}
                      </span>
                      {conv.pipeline && (
                        <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                          {conv.pipeline.name}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`${!selectedLeadId ? 'hidden md:flex' : 'flex'} flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col`}>
          {selectedLeadId ? (
            <>
              <div className="border-b border-border px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="md:hidden h-8 w-8 -ml-2 text-muted-foreground"
                      onClick={() => setSelectedLeadId(null)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-base font-semibold text-foreground">
                      WhatsApp Sohbeti
                    </h2>
                  </div>
                  <div className="flex items-center gap-1">
                    {leadDetail?.phone && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-emerald-600"
                        onClick={handleCall}
                        title="Ara"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </Button>
                    )}
                        {leadDetail && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-emerald-600"
                          onClick={markUnread}
                          title="Okunmadı işaretle"
                        >
                          <Dot className="w-3.5 h-3.5" />
                        </Button>
                        {leadDetail.isWhatsappArchived ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={unarchiveConversation}
                            title="Arşivden çıkar"
                          >
                            <Undo className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={archiveConversation}
                            title="Sohbeti arşivle"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </>
                    )}
                    {leadDetail && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-red-600"
                        onClick={deleteConversation}
                        title="Sohbeti sil"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {showSearchInChat ? (
                      <div className="flex items-center gap-1 bg-slate-100 rounded px-2 dark:bg-slate-800">
                        <Search className="w-3 h-3 text-muted-foreground" />
                        <input
                          autoFocus
                          className="bg-transparent border-0 text-xs w-32 focus:ring-0 h-6 outline-none dark:text-slate-100"
                          placeholder="Sohbette ara..."
                          value={searchInChat}
                          onChange={(e) => setSearchInChat(e.target.value)}
                        />
                        <button
                          onClick={() => {
                            setSearchInChat("");
                            setShowSearchInChat(false);
                          }}
                        >
                          <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => setShowSearchInChat(true)}
                      >
                        <Search className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
                {leadDetail && (
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      {editingName ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="h-7 w-48 text-xs"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={handleUpdateName}
                            disabled={updatingName}
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingName(false);
                              setEditedName(leadDetail.name);
                            }}
                          >
                            <X className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-2 group cursor-pointer"
                          onClick={() => setEditingName(true)}
                        >
                          <span className="font-medium text-foreground hover:text-emerald-600 transition-colors">
                            {leadDetail.name}
                          </span>
                          <Pencil className="w-3 h-3 text-slate-300 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all dark:text-slate-600" />
                        </div>
                      )}
                      {leadDetail.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {leadDetail.phone}
                        </span>
                      )}
                      {leadDetail.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {leadDetail.email}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={leadDetail.assignee?.id || "none"}
                        onValueChange={handleAssign}
                        disabled={assigning || users.length === 0}
                      >
                        <SelectTrigger className="h-6 min-w-[120px] rounded-full px-2 py-0 text-[10px] font-medium border border-border bg-background text-foreground">
                          <SelectValue placeholder="Atanan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Atanmamış</SelectItem>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name || "İsimsiz"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {leadDetail.stage && leadDetail.pipeline?.stages ? (
                        <Select
                          value={leadDetail.stage.id}
                          onValueChange={handleChangeStage}
                          disabled={updatingStage}
                        >
                          <SelectTrigger
                            className="h-6 min-w-[100px] rounded-full px-2 py-0 text-[10px] font-medium border-0"
                            style={{
                              backgroundColor: `${leadDetail.stage.color || "#e5e7eb"}1a`,
                              color: leadDetail.stage.color || "#374151",
                            }}
                          >
                            <SelectValue>{leadDetail.stage.name}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {leadDetail.pipeline.stages.map((stage) => (
                              <SelectItem key={stage.id} value={stage.id}>
                                {stage.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        leadDetail.stage && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{
                              backgroundColor: `${leadDetail.stage.color || "#e5e7eb"}1a`,
                              color: leadDetail.stage.color || "#374151",
                            }}
                          >
                            {leadDetail.stage.name}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col flex-1">
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-muted/60 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between mb-2">
                    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border"
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                      />
                      Arşivlenenleri göster
                    </label>
                  </div>
                  {loadingLead ? (
                    <div className="text-sm text-muted-foreground">Sohbet yükleniyor...</div>
                  ) : !leadDetail ||
                    !leadDetail.activities ||
                    leadDetail.activities.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Bu lead ile henüz WhatsApp mesajı bulunmuyor.
                    </div>
                  ) : (
                    leadDetail.activities
                      .filter((a) => showArchived || a.status !== "ARCHIVED")
                      .map((activity) => {
                        if (activity.type === "CALL") {
                          return (
                            <div
                              key={activity.id}
                              className="flex justify-center my-4"
                            >
                              <div className="bg-muted text-muted-foreground text-[10px] px-3 py-1 rounded-full flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>
                                  Arama yapıldı -{" "}
                                  {formatDistanceToNow(new Date(activity.createdAt), {
                                    addSuffix: true,
                                    locale: tr,
                                  })}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        const isOutgoing = activity.type === "WHATSAPP_OUT";
                        return (
                            <div
                              key={activity.id}
                              className={`flex ${
                              isOutgoing ? "justify-end" : "justify-start"
                            }`}
                              >
                              <div
                                className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                                  isOutgoing
                                    ? "bg-emerald-600 text-white rounded-br-sm"
                                    : "bg-card text-foreground rounded-bl-sm border border-border"
                                } ${activity.status === "ARCHIVED" ? "opacity-60" : ""}`}
                              >
                              <div
                                className={`whitespace-pre-wrap break-words ${
                                  showSearchInChat &&
                                  searchInChat &&
                                  activity.content
                                    .toLowerCase()
                                    .includes(searchInChat.toLowerCase())
                                    ? "bg-yellow-200 text-slate-900"
                                    : ""
                                }`}
                              >
                                {activity.content}
                              </div>
                              <div
                                className={`mt-1 text-[10px] flex items-center gap-1 ${
                                  isOutgoing
                                    ? "text-emerald-100/80 justify-end"
                                    : "text-muted-foreground"
                                }`}
                              >
                                <span>
                                  {formatDistanceToNow(new Date(activity.createdAt), {
                                    addSuffix: true,
                                    locale: tr,
                                  })}
                                </span>
                                {isOutgoing && (
                                  <span title={activity.status || "SENT"}>
                                    {activity.status === "READ" ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                                    ) : activity.status === "DELIVERED" ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                                    )}
                                  </span>
                                )}
                                <span className="ml-2 flex items-center gap-1">
                                  {activity.status === "ARCHIVED" ? (
                                    <button
                                      onClick={() =>
                                        unarchiveActivity(activity.id, activity.type)
                                      }
                                      className={`inline-flex items-center gap-1 text-[10px] ${
                                        isOutgoing ? "text-white/80" : "text-muted-foreground"
                                      } hover:underline`}
                                    >
                                      <Undo className="w-3 h-3" />
                                      Arşivden çıkar
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        archiveActivity(activity.id, activity.type)
                                      }
                                      className={`inline-flex items-center gap-1 text-[10px] ${
                                        isOutgoing ? "text-white/80" : "text-muted-foreground"
                                      } hover:underline`}
                                    >
                                      <Archive className="w-3 h-3" />
                                      Arşivle
                                    </button>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                <div className="border-t border-border px-6 py-3 bg-card relative">
                  {pendingAttachments.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto mb-2 pb-2">
                      {pendingAttachments.map((att, i) => (
                        <div key={i} className="relative group flex-shrink-0">
                          <div className="w-16 h-16 rounded border bg-background flex items-center justify-center overflow-hidden border-border">
                            {att.type === "image" ? (
                              <img
                                src={
                                  att.url.startsWith("http")
                                    ? att.url
                                    : `/api/proxy?url=${encodeURIComponent(att.url)}`
                                }
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] text-muted-foreground p-1 text-center break-all">
                                {att.name}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              setPendingAttachments((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                            className="absolute -top-1 -right-1 w-4 h-4 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {showEmoji && (
                    <div className="absolute bottom-16 left-6 bg-card border border-border rounded-xl shadow-xl p-2 w-64 z-50 grid grid-cols-8 gap-1">
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          onClick={() => pickEmoji(e)}
                          className="text-xl hover:bg-muted rounded p-1"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}

                <div className="flex items-center gap-3">
                  {smartReplies.length > 0 && (
                    <div className="absolute -top-12 left-6 right-6">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          Öneriler
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-2 text-[10px] px-2 py-1 rounded-full border border-border bg-background">
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 rounded border-border"
                              checked={autoReply}
                              onChange={(e) => setAutoReply(e.target.checked)}
                            />
                            Oto cevapla
                          </label>
                          <button
                            onClick={fetchSmartReplies}
                            className="text-[10px] font-bold text-blue-600"
                          >
                            {smartLoading ? "Yükleniyor..." : "Yenile"}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(aiEnabled ? smartReplies : []).map((r, i) => (
                          <button
                            key={`ai-${i}`}
                            onClick={() => setMessage(r)}
                            className="px-2 py-1 rounded-full border border-border bg-background text-[11px] text-foreground hover:bg-muted"
                          >
                            {r}
                          </button>
                        ))}
                        {autoTemplates.map((r, i) => (
                          <button
                            key={`tpl-${i}`}
                            onClick={() => setMessage(r)}
                            className="px-2 py-1 rounded-full border border-border bg-background text-[11px] text-foreground hover:bg-muted"
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowEmoji(!showEmoji)}
                      >
                        <Smile className="w-5 h-5" />
                      </Button>
                      <label className="cursor-pointer inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          onChange={(e) => handleFileSelect(e.target.files)}
                        />
                        <Paperclip className="w-5 h-5" />
                      </label>
                    </div>
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="WhatsApp üzerinden mesaj yazın..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="h-10 text-sm rounded-lg border-border bg-background focus:bg-background flex-1 text-foreground placeholder:text-muted-foreground"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={
                        (!message.trim() && pendingAttachments.length === 0) ||
                        sending
                      }
                      className="h-10 px-4 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-medium"
                    >
                      Gönder
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center flex-col gap-3 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-300">
                <MessageCircle className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Bir sohbet seçin
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Soldan bir kişi seçtiğinizde WhatsApp konuşması burada açılır.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-8 h-8" />
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
}
