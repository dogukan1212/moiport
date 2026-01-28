"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ListFilter, Download, Clock, Users, Layers, CheckCircle2 } from "lucide-react";

type Activity = {
  id: string;
  text: string;
  action?: string;
  userId?: string;
  user: string;
  initials: string;
  color: string;
  date: string;
  type: "activity";
};

type Task = {
  id: string;
  title: string;
  projectId?: string;
  status: string;
  dueDate?: string;
  assignee?: {
    name: string;
  };
  activities?: Activity[];
};

type RangeKey = "day" | "week" | "month";

function formatSecondsDetailed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function parseDate(s: string) {
  return new Date(s).getTime();
}

function overlapSeconds(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  const diff = Math.floor((end - start) / 1000);
  return diff > 0 ? diff : 0;
}

function ymd(ts: number) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function TaskReportsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>("day");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get("/tasks"),
      api.get("/projects").catch(() => ({ data: [] })),
    ])
      .then(([tasksRes, projectsRes]) => {
        if (!mounted) return;
        setTasks(tasksRes.data || []);
        const list = (projectsRes.data || []) as Array<{ id?: string; name?: string }>;
        const map: Record<string, string> = {};
        for (const p of list) {
          if (p && p.id && p.name) {
            map[p.id] = p.name;
          }
        }
        setProjectNames(map);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const uniqueUsers = useMemo(() => {
    const m = new Map<string, { id: string; name: string; initials: string; color: string }>();
    for (const t of tasks) {
      for (const a of t.activities || []) {
        if (!a.action || !a.action.startsWith("work:")) continue;
        const id = a.userId || "unknown";
        if (!m.has(id)) m.set(id, { id, name: a.user || id, initials: a.initials || "??", color: a.color || "bg-slate-600" });
      }
    }
    return Array.from(m.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  const uniqueProjects = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tasks) {
      const pid = t.projectId || "none";
      m.set(pid, (m.get(pid) || 0) + 1);
    }
    return Array.from(m.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count);
  }, [tasks]);

  const {
    perUser,
    byUserTask,
    projectTotals,
    days,
    userDayTotals,
    sessionStats,
    tasksMap,
    rangeLabel,
  } = useMemo(() => {
    const now = Date.now();
    const computedStart = useCustomRange && customStart ? startOfDay(new Date(customStart).getTime()) : (range === "day" ? startOfToday() : range === "week" ? now - 7 * 24 * 3600 * 1000 : startOfMonth());
    const computedEnd = useCustomRange && customEnd ? startOfDay(new Date(customEnd).getTime()) + 24 * 3600 * 1000 : now;

    const tasksFiltered = tasks.filter((t) => {
      if (selectedProjects.length > 0) {
        const pid = t.projectId || "none";
        if (!selectedProjects.includes(pid)) return false;
      }
      return true;
    });

    const totals = new Map<
      string,
      {
        userId: string;
        name: string;
        initials: string;
        color: string;
        totalSeconds: number;
        taskIds: Set<string>;
      }
    >();

    const byTask = new Map<
      string,
      Map<
        string,
        {
          seconds: number;
          title: string;
        }
      >
    >();

    const projTotals = new Map<string, { seconds: number; taskIds: Set<string> }>();

    const dayStarts: number[] = [];
    let cursor = startOfDay(computedStart);
    while (cursor < computedEnd) {
      dayStarts.push(cursor);
      cursor += 24 * 3600 * 1000;
    }

    const userDay = new Map<string, Map<string, number>>();
    const sessionInfo = new Map<string, { count: number; sum: number; max: number }>();
    const tMap = new Map<string, Task>();
    for (const t of tasksFiltered) tMap.set(t.id, t);

    for (const t of tasksFiltered) {
      const acts = (t.activities || [])
        .filter((a) => a.action && a.action.startsWith("work:"))
        .slice()
        .sort((a, b) => parseDate(a.date) - parseDate(b.date));

      const running = new Map<string, number | null>();
      for (const a of acts) {
        const uid = a.userId || "unknown";
        if (!running.has(uid)) running.set(uid, null);
      }

      const segments: Array<{
        userId: string;
        start: number;
        end: number;
      }> = [];

      for (const a of acts) {
        const uid = a.userId || "unknown";
        const ts = parseDate(a.date);
        const act = a.action || "";
        if (act === "work:start" || act === "work:resume") {
          if (running.get(uid) == null) running.set(uid, ts);
        } else if (act === "work:pause" || act === "work:stop") {
          const st = running.get(uid);
          if (typeof st === "number") {
            segments.push({ userId: uid, start: st, end: ts });
            running.set(uid, null);
          }
        }
      }
      for (const [uid, st] of running.entries()) {
        if (typeof st === "number") {
          segments.push({ userId: uid, start: st, end: computedEnd });
        }
      }

      for (const seg of segments) {
        if (selectedUsers.length > 0 && !selectedUsers.includes(seg.userId)) continue;
        const secsInRange = overlapSeconds(seg.start, seg.end, computedStart, computedEnd);
        if (secsInRange <= 0) continue;
        const uActs = acts.filter((x) => (x.userId || "unknown") === seg.userId);
        const u = uActs[0];
        const name = u?.user || (seg.userId === "unknown" ? "Bilinmeyen" : seg.userId);
        const initials = u?.initials || "??";
        const color = u?.color || "bg-slate-600";

        if (!totals.has(seg.userId)) {
          totals.set(seg.userId, {
            userId: seg.userId,
            name,
            initials,
            color,
            totalSeconds: 0,
            taskIds: new Set<string>(),
          });
        }
        const rec = totals.get(seg.userId)!;
        rec.totalSeconds += secsInRange;
        rec.taskIds.add(t.id);

        if (!byTask.has(seg.userId)) byTask.set(seg.userId, new Map());
        const m = byTask.get(seg.userId)!;
        const prev = m.get(t.id) || { seconds: 0, title: t.title };
        prev.seconds += secsInRange;
        m.set(t.id, prev);

        const pid = t.projectId || "none";
        if (!projTotals.has(pid)) projTotals.set(pid, { seconds: 0, taskIds: new Set() });
        const p = projTotals.get(pid)!;
        p.seconds += secsInRange;
        p.taskIds.add(t.id);

        if (!userDay.has(seg.userId)) userDay.set(seg.userId, new Map());
        const um = userDay.get(seg.userId)!;
        for (let i = 0; i < dayStarts.length; i++) {
          const ds = dayStarts[i];
          const de = Math.min(ds + 24 * 3600 * 1000, computedEnd);
          const sec = overlapSeconds(seg.start, seg.end, ds, de);
          if (sec > 0) {
            const key = ymd(ds);
            um.set(key, (um.get(key) || 0) + sec);
          }
        }

        if (!sessionInfo.has(seg.userId)) sessionInfo.set(seg.userId, { count: 0, sum: 0, max: 0 });
        const si = sessionInfo.get(seg.userId)!;
        si.count += 1;
        si.sum += secsInRange;
        si.max = Math.max(si.max, secsInRange);
      }
    }

    const perUserArr = Array.from(totals.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);
    const details = Object.fromEntries(
      perUserArr.map((u) => [
        u.userId,
        Array.from(byTask.get(u.userId)?.entries() || [])
          .map(([taskId, info]) => ({ taskId, title: info.title, seconds: info.seconds }))
          .sort((a, b) => b.seconds - a.seconds),
      ])
    );

    const projArr = Array.from(projTotals.entries())
      .map(([projectId, v]) => ({ projectId, seconds: v.seconds, taskCount: v.taskIds.size }))
      .sort((a, b) => b.seconds - a.seconds);

    const rangeText = useCustomRange && customStart && customEnd
      ? `${customStart} → ${customEnd}`
      : range === "day"
        ? "Bugün"
        : range === "week"
          ? "Son 7 Gün"
          : "Bu Ay";

    return {
      perUser: perUserArr.map((u) => ({
        userId: u.userId,
        name: u.name,
        initials: u.initials,
        color: u.color,
        totalSeconds: u.totalSeconds,
        taskCount: u.taskIds.size,
      })),
      byUserTask: details as Record<string, Array<{ taskId: string; title: string; seconds: number }>>,
      projectTotals: projArr,
      days: dayStarts.map((ds) => ymd(ds)),
      userDayTotals: Object.fromEntries(Array.from(userDay.entries()).map(([uid, m]) => [uid, Object.fromEntries(m)])) as Record<string, Record<string, number>>,
      sessionStats: Object.fromEntries(Array.from(sessionInfo.entries()).map(([uid, s]) => [uid, { count: s.count, avg: s.count > 0 ? s.sum / s.count : 0, max: s.max }])) as Record<string, { count: number; avg: number; max: number }>,
      tasksMap: tMap,
      rangeLabel: rangeText,
    };
  }, [tasks, range, selectedUsers, selectedProjects, customStart, customEnd, useCustomRange]);

  const totalTrackedSeconds = useMemo(
    () => perUser.reduce((sum, u) => sum + u.totalSeconds, 0),
    [perUser],
  );

  const totalTasksWithTime = useMemo(() => {
    const ids = new Set<string>();
    Object.values(byUserTask).forEach((rows) => {
      rows.forEach((row) => ids.add(row.taskId));
    });
    return ids.size;
  }, [byUserTask]);

  const activeUserCount = perUser.length;
  const projectCountWithTime = projectTotals.length;
  const topUser = perUser[0];

  function getProjectLabel(projectId?: string | null) {
    if (!projectId || projectId === "none") return "Projesiz";
    return projectNames[projectId] || projectId;
  }

  function toggleUser(id: string) {
    setSelectedUsers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleProject(id: string) {
    setSelectedProjects((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function clearFilters() {
    setSelectedUsers([]);
    setSelectedProjects([]);
    setCustomStart("");
    setCustomEnd("");
    setUseCustomRange(false);
  }

  function exportCSV() {
    const rows: Array<string[]> = [];
    rows.push(["Aralık", rangeLabel]);
    rows.push(["Kullanıcı", "Görev", "Proje", "Süre(sn)"]);
    for (const u of perUser) {
      const list = byUserTask[u.userId] || [];
      for (const row of list) {
        const t = tasksMap.get(row.taskId);
        rows.push([u.name, row.title, getProjectLabel(t?.projectId), String(Math.floor(row.seconds))]);
      }
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gorevler-rapor-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "DONE":
        return (
          <span className="px-2 py-1 rounded text-[11px] font-semibold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/40">
            Tamamlandı
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-2 py-1 rounded text-[11px] font-semibold uppercase bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/40">
            Sürüyor
          </span>
        );
      case "TODO":
        return (
          <span className="px-2 py-1 rounded text-[11px] font-semibold uppercase border border-border bg-muted text-muted-foreground">
            Yapılacak
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded text-[11px] font-semibold uppercase bg-muted text-muted-foreground border border-border/60">
            {status}
          </span>
        );
    }
  }

  return (
    <div className="space-y-8 pb-12 font-sans text-foreground">
      <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Görevler Raporu</h1>
          <p className="text-sm text-muted-foreground">
            Personel, görev ve proje bazında zaman takibini bu ekran üzerinden analiz edin.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Aralık: {rangeLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted p-1 rounded-lg border border-border/60">
            <button
              onClick={() => setRange("day")}
              className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-all ${
                range === "day" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Bugün
            </button>
            <button
              onClick={() => setRange("week")}
              className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-all ${
                range === "week" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Son 7 Gün
            </button>
            <button
              onClick={() => setRange("month")}
              className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-all ${
                range === "month" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Bu Ay
            </button>
          </div>
          <Button variant="outline" size="sm" className="gap-2 ml-2" onClick={exportCSV}>
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-4 py-5 text-slate-50 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-300/90">Toplam Süre</div>
              <div className="mt-1 text-2xl font-semibold leading-tight">
                {formatSecondsDetailed(totalTrackedSeconds)}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50/10">
              <Clock className="h-5 w-5 text-slate-50" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-300/90">Seçili aralık: {rangeLabel}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Aktif Personel</div>
              <div className="mt-1 text-2xl font-semibold leading-tight">{activeUserCount}</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Users className="h-5 w-5 text-foreground" />
            </div>
          </div>
          {topUser && (
            <div className="mt-3 text-[11px] text-muted-foreground">
              En çok süre harcayan:{" "}
              <span className="font-medium text-foreground">
                {topUser.name} ({formatSecondsDetailed(topUser.totalSeconds)})
              </span>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Projeler</div>
              <div className="mt-1 text-2xl font-semibold leading-tight">{projectCountWithTime}</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Layers className="h-5 w-5 text-foreground" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground">
            Zamanlanan proje sayısı
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Görevler</div>
              <div className="mt-1 text-2xl font-semibold leading-tight">{totalTasksWithTime}</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <CheckCircle2 className="h-5 w-5 text-foreground" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground">
            Süre kaydı olan görev sayısı
          </div>
        </div>
      </div>

      <div className="border border-border rounded-lg p-6 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <ListFilter className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-[14px] font-semibold text-foreground">Filtreler</h3>
          <div className="ml-auto flex items-center gap-4">
            <label className="text-[13px] text-muted-foreground flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={useCustomRange} onChange={(e) => setUseCustomRange(e.target.checked)} className="rounded border-border" />
              Özel Tarih Aralığı
            </label>
            <button onClick={clearFilters} className="text-[13px] text-muted-foreground hover:text-foreground font-medium">
              Temizle
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Kullanıcı</div>
            <div className="flex flex-wrap gap-2">
              {uniqueUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                  className={`px-3 py-1.5 rounded-md text-[13px] border transition-all flex items-center gap-2 ${
                    selectedUsers.includes(u.id) 
                      ? "bg-card text-foreground border-border font-medium shadow-sm" 
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-muted inline-flex items-center justify-center text-foreground text-[9px]">
                    {u.initials}
                  </span>
                  {u.name}
                </button>
              ))}
              {uniqueUsers.length === 0 && <div className="text-[13px] text-muted-foreground">Kullanıcı bulunamadı.</div>}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Proje</div>
            <div className="flex flex-wrap gap-2">
              {uniqueProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => toggleProject(p.id)}
                  className={`px-3 py-1.5 rounded-md text-[13px] border transition-all ${
                    selectedProjects.includes(p.id)
                      ? "bg-card text-foreground border-border font-medium shadow-sm"
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                  }`}
                >
                  {p.id === "none" ? "Projesiz" : getProjectLabel(p.id)}{" "}
                  <span className="opacity-60 ml-1">({p.count})</span>
                </button>
              ))}
            </div>
          </div>
          <div className={useCustomRange ? "opacity-100" : "opacity-50 pointer-events-none"}>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Özel Aralık</div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="border border-border rounded px-3 py-2 text-[13px] text-foreground bg-background outline-none focus:border-foreground"
              />
              <span className="text-muted-foreground">→</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="border border-border rounded px-3 py-2 text-[13px] text-foreground bg-background outline-none focus:border-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
          </div>
      ) : (
        <>
          <div>
            <h2 className="text-[16px] font-semibold mb-4 text-foreground">Aktif Personeller</h2>
            {perUser.length === 0 ? (
              <div className="text-[13px] text-muted-foreground">Bu aralıkta kayıt bulunamadı.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {perUser.map((u) => (
                  <div key={u.userId} className="border border-border p-5 rounded-lg bg-card">
                    <div className="text-[12px] text-muted-foreground uppercase mb-1">Personel</div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground text-[11px] font-bold">
                        {u.initials}
                      </div>
                      <div className="text-[15px] font-semibold text-foreground">{u.name}</div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-[12px] text-muted-foreground uppercase mb-1">Toplam Süre</div>
                        <div className="text-[20px] font-semibold text-foreground">{formatSecondsDetailed(u.totalSeconds)}</div>
                      </div>
                      <div className="text-[12px] text-muted-foreground mb-1">{u.taskCount} görev</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-[16px] font-semibold mb-4 text-foreground">Detaylı Görev Listesi</h2>
            {perUser.length === 0 ? (
              <div className="text-[13px] text-muted-foreground">Liste boş.</div>
            ) : (
              <div className="space-y-8">
                {perUser.map((u) => (
                  <div key={u.userId} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-foreground text-[10px] font-bold">
                        {u.initials}
                      </div>
                      <h3 className="text-[14px] font-semibold text-foreground">{u.name}</h3>
                      <span className="text-[13px] text-muted-foreground">• {formatSecondsDetailed(u.totalSeconds)}</span>
                    </div>

                    <div className="border border-border rounded-lg overflow-hidden bg-card">
                      <table className="w-full text-[13px] border-collapse">
                        <thead>
                          <tr>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground border-b border-border">Görev Adı</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground border-b border-border">Proje</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground border-b border-border">Durum</th>
                            <th className="text-right px-4 py-3 font-medium text-muted-foreground border-b border-border">Süre</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(byUserTask[u.userId] || []).slice(0, 50).map((row) => {
                            const task = tasksMap.get(row.taskId);
                            return (
                              <tr key={row.taskId} className="group hover:bg-muted/60 transition-colors">
                                <td className="px-4 py-3 text-foreground border-b border-border">{row.title}</td>
                                <td className="px-4 py-3 text-muted-foreground border-b border-border">
                                  {task ? getProjectLabel(task.projectId) : "-"}
                                </td>
                                <td className="px-4 py-3 border-b border-border">
                                  {getStatusBadge(task?.status || "UNKNOWN")}
                                </td>
                                <td className="px-4 py-3 text-foreground text-right font-medium border-b border-border">
                                  {formatSecondsDetailed(row.seconds)}
                                </td>
                              </tr>
                            );
                          })}
                          {(byUserTask[u.userId] || []).length === 0 && (
                            <tr>
                              <td className="px-4 py-3 text-muted-foreground border-b border-border" colSpan={4}>
                                Kayıt yok.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-[16px] font-semibold mb-4 text-foreground">Proje Bazlı Toplamlar</h2>
            {projectTotals.length === 0 ? (
              <div className="text-[13px] text-muted-foreground">Kayıt yok.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {projectTotals.map((p) => (
                  <div key={p.projectId} className="border border-border p-5 rounded-lg bg-card">
                    <div className="text-[12px] text-muted-foreground uppercase mb-1">Proje</div>
                    <div className="text-[15px] font-semibold text-foreground mb-4">
                      {p.projectId === "none" ? "Projesiz" : getProjectLabel(p.projectId)}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-[12px] text-muted-foreground uppercase mb-1">Süre</div>
                        <div className="text-[20px] font-semibold text-foreground">{formatSecondsDetailed(p.seconds)}</div>
                      </div>
                      <div className="text-[12px] text-muted-foreground mb-1">{p.taskCount} görev</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-[16px] font-semibold mb-4 text-foreground">Gün Bazlı Dağılım</h2>
            <div className="border border-border rounded-lg p-6 bg-card">
              {perUser.length === 0 ? (
                <div className="text-[13px] text-muted-foreground">Kayıt yok.</div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>GÜNLER:</span>
                    {days.map((d) => (
                      <span key={d} className="px-2 py-0.5 rounded bg-muted text-muted-foreground">{d}</span>
                    ))}
                  </div>
                  {perUser.map((u) => {
                    const totals = userDayTotals[u.userId] || {};
                    const max = Math.max(1, ...days.map((d) => Math.floor(totals[d] || 0)));
                    return (
                      <div key={u.userId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-foreground text-[9px] font-bold">
                            {u.initials}
                          </div>
                          <div className="text-[13px] font-medium text-foreground">{u.name}</div>
                        </div>
                          <div className="text-[12px] text-muted-foreground">{formatSecondsDetailed(u.totalSeconds)}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {days.map((d) => {
                            const s = Math.floor(totals[d] || 0);
                            const w = Math.max(2, Math.round((s / max) * 60));
                            return (
                              <div key={d} className="h-2 rounded-sm bg-muted" style={{ width: `${w}px` }}>
                                <div className="h-2 rounded-sm bg-slate-400 dark:bg-slate-500" style={{ width: `${w}px`, opacity: s > 0 ? 1 : 0 }} title={`${d}: ${formatSecondsDetailed(s)}`}></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
             <h2 className="text-[16px] font-semibold mb-4 text-foreground">Oturum Analizi</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {perUser.map((u) => {
                const s = sessionStats[u.userId] || { count: 0, avg: 0, max: 0 };
                return (
                  <div key={u.userId} className="border border-border p-5 rounded-lg bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-foreground text-[10px] font-bold">
                        {u.initials}
                      </div>
                      <div className="text-[14px] font-medium text-foreground">{u.name}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-muted-foreground">Oturum sayısı</span>
                        <span className="text-foreground">{s.count}</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-muted-foreground">Ortalama süre</span>
                        <span className="text-foreground">{formatSecondsDetailed(Math.floor(s.avg))}</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-muted-foreground">En uzun</span>
                        <span className="text-foreground">{formatSecondsDetailed(Math.floor(s.max))}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
             </div>
          </div>
        </>
      )}
    </div>
  );
}
