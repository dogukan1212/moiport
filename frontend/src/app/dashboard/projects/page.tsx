 "use client";
 
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Plus, Briefcase, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
 
interface Customer {
  id: string;
  name: string;
  _count?: { projects: number };
}

interface Project {
  id: string;
  name: string;
  status: "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
  endDate?: string;
  customer?: { id: string; name: string };
  tasksByStatus?: { TODO: number; IN_PROGRESS: number; REVIEW: number; DONE: number };
}

interface ProjectForm {
  name: string;
  description?: string;
  status: "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
  customerId: string;
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [projectChecklist, setProjectChecklist] = useState<
    Record<string, { total: number; completed: number }>
  >({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<ProjectForm>({
     name: "",
     description: "",
     status: "PLANNING",
     customerId: "",
   });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, projectsRes, tasksRes] = await Promise.all([
        api.get("/customers"),
        api.get("/projects"),
        api.get("/tasks"),
      ]);
      setCustomers(customersRes.data || []);
      setProjects(projectsRes.data || []);
      const tasks = (tasksRes.data || []) as any[];
      const stats: Record<string, { total: number; completed: number }> = {};
      for (const t of tasks) {
        const pid = t.projectId as string | undefined;
        if (!pid) continue;
        const total = (t.checklistTotal as number | undefined) || 0;
        const completed = (t.checklistCompleted as number | undefined) || 0;
        if (!total) continue;
        const prev = stats[pid] || { total: 0, completed: 0 };
        stats[pid] = {
          total: prev.total + total,
          completed: prev.completed + completed,
        };
      }
      setProjectChecklist(stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
 
  const projectsByCustomer = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const p of projects || []) {
      const cid = p.customer?.id;
      if (!cid) continue;
      const arr = map.get(cid) || [];
      arr.push(p);
      map.set(cid, arr);
    }
    return map;
  }, [projects]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = (customers || []).filter((c) => {
      if (c.name?.toLowerCase().includes(q)) return true;
      const customerProjects = projectsByCustomer.get(c.id) || [];
      return customerProjects.some(p => p.name.toLowerCase().includes(q));
    });
    const isClient = user?.role === "CLIENT";
    const onlyMine =
      isClient && (user as any)?.customerId
        ? base.filter((c) => c.id === (user as any).customerId)
        : base;
    return onlyMine
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, search, projectsByCustomer, user]);

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId || !form.name.trim()) return;
    try {
      await api.post("/projects", form);
      setIsCreateOpen(false);
      setForm({ name: "", description: "", status: "PLANNING", customerId: "" });
      setLoading(true);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const progressOf = (p: Project) => {
    const checklist = projectChecklist[p.id];
    if (checklist && checklist.total > 0) {
      return Math.round((checklist.completed / checklist.total) * 100);
    }
    const t = p.tasksByStatus || { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
    const total = t.TODO + t.IN_PROGRESS + t.REVIEW + t.DONE;
    if (!total) return 0;
    return Math.round((t.DONE / total) * 100);
  };

  const palette = ["#00e676", "#3b82f6", "#a855f7", "#f59e0b", "#06b6d4", "#ef4444"];
  const colorOf = (name: string) => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-[24px] md:text-[28px] font-semibold tracking-[-0.02em] text-slate-900 dark:text-slate-50">Markalar ve Projeler</h1>
          <p className="text-slate-500 text-sm dark:text-slate-400">Müşteriler altında projeleri görüntüleyin ve yönetin.</p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-[#00e676] text-black hover:bg-[#00e676]/90"
        >
          <Plus className="h-4 w-4" />
          Yeni Proje
        </Button>
      </div>

      <div className="space-y-6 pb-12">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              type="text"
              placeholder="Müşteri ara..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="h-8 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((customer) => {
              const list = (projectsByCustomer.get(customer.id) || []).sort((a, b) =>
                a.name.localeCompare(b.name),
              );
              return (
                <Card
                  key={customer.id}
                  className="p-6 hover:shadow-md transition-shadow border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 h-[320px] flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-black font-semibold"
                        style={{ backgroundColor: "#00e676" }}
                      >
                        {customer.name ? customer.name.trim().charAt(0).toUpperCase() : <Briefcase className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
                          {customer.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{list.length} proje</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setIsCreateOpen(true);
                        setForm((prev) => ({ ...prev, customerId: customer.id }));
                      }}
                      variant="outline"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Yeni Proje
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-1 pt-2 border-t border-slate-100 dark:border-slate-800 h-[180px] overflow-y-auto projects-tasks-scroll items-start">
                    {list.map((p) => {
                      const pct = progressOf(p);
                      const color = colorOf(p.name);
                      return (
                        <Link
                          key={p.id}
                          href={`/dashboard/projects/${p.id}`}
                          className="block rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[80%]">
                              {p.name}
                            </span>
                            <span className="text-xs font-semibold" style={{ color }}>{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Projelerin ilerlemesini görüntüleyin</div>
                    <Link href={`/dashboard/projects/customers/${customer.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 h-auto px-2 py-1 rounded-md font-medium text-emerald-600 hover:text-emerald-700 hover:bg-slate-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-slate-800"
                      >
                        Görüntüle <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
            {filtered.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center bg-white rounded-lg border border-dashed dark:bg-slate-900 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400">Müşteri bulunamadı.</p>
              </div>
            )}
          </div>
        )}

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Proje</DialogTitle>
              <DialogDescription>Projenizi bir müşteri altında oluşturun.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submitCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Proje Adı</Label>
                <Input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Müşteri</Label>
                <select
                  required
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                >
                  <option value="">Seçin</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Durum</Label>
                <select
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as ProjectForm["status"] })
                  }
                >
                  <option value="PLANNING">Planlama</option>
                  <option value="IN_PROGRESS">Devam Ediyor</option>
                  <option value="COMPLETED">Tamamlandı</option>
                  <option value="ON_HOLD">Beklemede</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <textarea
                  className="border-input min-h-[100px] w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                  İptal
                </Button>
                <Button type="submit">Oluştur</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
