"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Search, Briefcase, Clock, CheckCircle2, Plus, MoreVertical, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task } from "@/app/dashboard/tasks/types";
import { TaskDetailModal } from "@/app/dashboard/tasks/task-detail-modal";
import { useAuth } from "@/hooks/use-auth";

interface Customer {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
  startDate?: string;
  endDate?: string;
  customer?: { id: string; name: string };
  tasksByStatus?: { TODO: number; IN_PROGRESS: number; REVIEW: number; DONE: number };
}

export default function CustomerProjectsClient() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"Hepsi" | "Devam Edenler" | "Bekleyenler" | "Tamamlananlar">("Hepsi");
  const [loading, setLoading] = useState(true);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectProgress, setProjectProgress] = useState<Record<string, number>>({});
  const [form, setForm] = useState<{ name: string; description?: string; status: "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" }>({
    name: "",
    description: "",
    status: "PLANNING",
  });

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [customersRes, projectsRes, tasksRes] = await Promise.all([
        api.get("/customers"),
        api.get("/projects"),
        api.get("/tasks"),
      ]);

      const allCustomers = customersRes.data || [];
      const allProjects = projectsRes.data || [];
      const tasks = (tasksRes.data || []) as any[];

      const found = allCustomers.find((c: Customer) => c.id === id);
      setCustomer(found || null);

      const list = allProjects.filter((p: Project) => p.customer?.id === id);
      setProjects(list);

      const ids = new Set(list.map((p: Project) => p.id));
      const stats: Record<string, { total: number; completed: number }> = {};

      for (const t of tasks) {
        const pid = t.projectId as string | undefined;
        if (!pid || !ids.has(pid)) continue;
        const total = (t.checklistTotal as number | undefined) || 0;
        const completed = (t.checklistCompleted as number | undefined) || 0;
        if (!total) continue;
        const prev = stats[pid] || { total: 0, completed: 0 };
        stats[pid] = {
          total: prev.total + total,
          completed: prev.completed + completed,
        };
      }

      const progressMap: Record<string, number> = {};
      for (const pid of Object.keys(stats)) {
        const { total, completed } = stats[pid];
        if (total > 0) {
          progressMap[pid] = Math.round((completed / total) * 100);
        }
      }
      setProjectProgress(progressMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getProjectProgress = (p: Project) => {
    const done = p.tasksByStatus?.DONE || 0;
    const total =
      (p.tasksByStatus?.TODO || 0) +
      (p.tasksByStatus?.IN_PROGRESS || 0) +
      (p.tasksByStatus?.REVIEW || 0) +
      (p.tasksByStatus?.DONE || 0);
    const statusProgress = total > 0 ? Math.round((done / total) * 100) : 0;
    const checklistProgress = projectProgress[p.id] ?? 0;
    return checklistProgress || statusProgress;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects
      .filter((p) => p.name.toLowerCase().includes(q))
      .filter((p) => {
        if (activeTab === "Hepsi") return true;
        const progress = getProjectProgress(p);
        if (activeTab === "Devam Edenler") return progress > 0 && progress < 100;
        if (activeTab === "Bekleyenler") return progress === 0;
        if (activeTab === "Tamamlananlar") return progress === 100;
        return true;
      });
  }, [projects, search, activeTab, projectProgress]);

  const openProjectDetail = async (projectId: string) => {
    try {
      const res = await api.get("/tasks", { params: { projectId } });
      const tasks: Task[] = (res.data || []) as Task[];
      const target = tasks.find((t) => t.status === "TODO") || tasks[0] || null;
      if (target) {
        setDetailTask(target);
        setIsDetailOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!customer?.id || !form.name.trim()) return;
     try {
       await api.post("/projects", { ...form, customerId: customer.id });
       setIsCreateOpen(false);
       setForm({ name: "", description: "", status: "PLANNING" });
       fetchData();
     } catch (e) {
       console.error(e);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
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
        status,
        order,
        mirrorGroupId,
      } = updatedTask;

      const patch: any = {
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
        status,
        order,
        mirrorGroupId,
      };

      await api.patch(`/tasks/${updatedTask.id}`, patch);

      if (projectId && checklistTotal && checklistTotal > 0) {
        const pct =
          typeof checklistCompleted === "number"
            ? Math.round((checklistCompleted / checklistTotal) * 100)
            : 0;
        setProjectProgress((prev) => ({
          ...prev,
          [projectId]: pct,
        }));
      }
    } catch (error) {
      console.error("Görev güncellenemedi:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setIsDetailOpen(false);
      setDetailTask(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleArchiveProject = async (project: Project) => {
    try {
      // Arşivleme için statüyü 'COMPLETED' veya varsa 'ARCHIVED' yapabiliriz.
      // Backend şemasında 'ARCHIVED' yok, 'COMPLETED' veya 'ON_HOLD' var.
      // Ancak kullanıcı 'arşivle' dediği için görünürlüğü değiştirmek isteyebilir.
      // Şimdilik 'COMPLETED' yapalım veya backend destekliyorsa 'ARCHIVED'.
      // Mevcut şemada status: "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD"
      // Kullanıcıya "Tamamlandı" olarak işaretliyoruz.
      await api.patch(`/projects/${project.id}`, { status: "COMPLETED" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`${project.name} projesini silmek istediğinize emin misiniz?`)) return;
    try {
      await api.delete(`/projects/${project.id}`);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-end justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center dark:bg-emerald-500/10 dark:text-emerald-300">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {customer?.name || "Müşteri"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Bu markaya ait projeler</p>
          </div>
        </div>
        <Link href="/dashboard/projects">
          <Button variant="outline">Markalar</Button>
        </Link>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="ml-auto flex items-center gap-2 bg-[#00e676] text-black hover:bg-[#00e676]/90"
        >
          <Plus className="h-4 w-4" />
          Yeni Proje
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
        <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 dark:bg-slate-900/60 dark:border-slate-700/70">
          {["Hepsi", "Devam Edenler", "Bekleyenler", "Tamamlananlar"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === tab
                  ? "bg-white text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Proje ara..."
            className="w-full bg-white border border-slate-200 rounded-full py-2 pl-9 pr-4 text-sm text-slate-900 focus:outline-none focus:border-slate-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((p) => {
               const done = p.tasksByStatus?.DONE || 0;
               const total =
                 (p.tasksByStatus?.TODO || 0) +
                 (p.tasksByStatus?.IN_PROGRESS || 0) +
                 (p.tasksByStatus?.REVIEW || 0) +
                 (p.tasksByStatus?.DONE || 0);
               const statusProgress = total > 0 ? Math.round((done / total) * 100) : 0;
               const checklistProgress = projectProgress[p.id] ?? 0;
               const progress = checklistProgress || statusProgress;
               const deadline = p.endDate ? new Date(p.endDate).toLocaleDateString("tr-TR") : "Sürekli";
               const statusLabel =
                 p.status === "IN_PROGRESS"
                   ? "Devam Ediyor"
                   : p.status === "PLANNING"
                   ? "Planlandı"
                   : p.status === "ON_HOLD"
                   ? "Beklemede"
                   : "Tamamlandı";
               return (
                 <Card
                   key={p.id}
                   className="p-6 rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                 >
                   <div className="flex items-start justify-between mb-4">
                     <div className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-widest dark:bg-slate-800 dark:text-slate-300">
                      Proje
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleArchiveProject(p)}>
                          <Archive className="mr-2 h-4 w-4" />
                          Arşivle (Tamamla)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteProject(p)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">{p.name}</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{customer?.name || ""}</p>
                   <div className="space-y-3 mb-6">
                     <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                       <span className="text-slate-500 dark:text-slate-400">İlerleme</span>
                       <span className="text-slate-900 dark:text-slate-50">%{progress}</span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                       <div
                         className="h-full bg-emerald-500 rounded-full"
                         style={{ width: `${progress}%` }}
                       />
                     </div>
                   </div>
                   <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                     <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                       <Clock className="h-3 w-3" />
                       {deadline}
                       <span>•</span>
                       <span
                         className={
                           statusLabel === "Devam Ediyor"
                             ? "text-emerald-600 dark:text-emerald-400"
                             : statusLabel === "Planlandı"
                             ? "text-purple-600 dark:text-purple-400"
                             : statusLabel === "Beklemede"
                             ? "text-orange-600 dark:text-orange-400"
                             : "text-emerald-600 dark:text-emerald-400"
                         }
                       >
                         {statusLabel}
                       </span>
                     </div>
                     <Button
                       variant="ghost"
                       size="sm"
                       className="flex items-center gap-1 h-auto px-2 py-1 rounded-md font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-slate-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-slate-800"
                       onClick={() => openProjectDetail(p.id)}
                     >
                       Detay <CheckCircle2 className="h-3 w-3" />
                     </Button>
                   </div>
                 </Card>
               );
           })}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-lg border border-dashed dark:bg-slate-900 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400">Proje bulunamadı.</p>
            </div>
           )}
         </div>
       )}

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl dark:bg-slate-900 dark:text-slate-100">
            <h2 className="text-xl font-bold mb-4">Yeni Proje</h2>
            <form onSubmit={submitCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">Proje Adı</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">Durum</label>
                <select
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
                >
                  <option value="PLANNING">Planlama</option>
                  <option value="IN_PROGRESS">Devam Ediyor</option>
                  <option value="COMPLETED">Tamamlandı</option>
                  <option value="ON_HOLD">Beklemede</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">Açıklama</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[100px] dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                  İptal
                </Button>
                <Button type="submit">Oluştur</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TaskDetailModal
        task={detailTask}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        columnTitle="Görevler"
        columns={[
          { id: "TODO", title: "Görevler" },
          { id: "IN_PROGRESS", title: "Devam Edenler" },
          { id: "REVIEW", title: "İncelemede" },
          { id: "DONE", title: "Tamamlandı" },
        ]}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
}
