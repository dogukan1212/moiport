"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

type Employee = { id: string; name: string };
type Leave = {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: string;
  note?: string;
};

export default function HRLeavesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [form, setForm] = useState<{ employeeId?: string; startDate?: string; endDate?: string; type?: string; note?: string }>({
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date().toISOString().substring(0, 10),
    type: "Yıllık İzin",
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get("/finance/employees");
        const list = (res.data || []).map((e: any) => ({ id: e.id, name: e.name }));
        setEmployees(list);
      } catch {
        // ignore
      }
    };
    fetchEmployees();
  }, []);

  const addLeave = () => {
    if (!form.employeeId || !form.startDate || !form.endDate) return;
    const emp = employees.find((e) => e.id === form.employeeId);
    const item: Leave = {
      id: Date.now().toString(),
      employeeId: form.employeeId,
      employeeName: emp?.name || "Personel",
      startDate: form.startDate,
      endDate: form.endDate,
      type: form.type || "İzin",
      note: form.note || "",
    };
    setLeaves((prev) => [item, ...prev]);
    setForm({ ...form, note: "" });
  };

  const removeLeave = (id: string) => {
    setLeaves((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-normal tracking-[-0.03em] text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-slate-900 dark:text-slate-50" />
            <span>İzinler</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-300 text-sm mt-2">
            Temel izin takibi. Gelişmiş işlevler (onay akışı, bildirimler) ilerleyen sürümlerde eklenecek.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Yeni İzin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-xs w-32 text-slate-500 dark:text-slate-400">Personel</label>
                <select
                  className="border rounded px-2 py-2 text-sm w-full bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                  value={form.employeeId || ""}
                  onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                >
                  <option value="">Seçiniz</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs w-32 text-slate-500 dark:text-slate-400">Başlangıç</label>
                <input
                  type="date"
                  className="border rounded px-2 py-1 text-sm w-full bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                  value={form.startDate || ""}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs w-32 text-slate-500 dark:text-slate-400">Bitiş</label>
                <input
                  type="date"
                  className="border rounded px-2 py-1 text-sm w-full bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                  value={form.endDate || ""}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs w-32 text-slate-500 dark:text-slate-400">Tür</label>
                <select
                  className="border rounded px-2 py-2 text-sm w-full bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                  value={form.type || ""}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option>Yıllık İzin</option>
                  <option>Mazeret İzni</option>
                  <option>Sağlık İzni</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs w-32 text-slate-500 dark:text-slate-400">Not</label>
                <input
                  className="border rounded px-2 py-1 text-sm w-full bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                  value={form.note || ""}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>
              <div>
                <Button size="sm" onClick={addLeave}>Ekle</Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">Kayıtlar</div>
              <div className="grid grid-cols-1 gap-3">
                {leaves.length === 0 && (
                  <div className="text-xs text-slate-400 dark:text-slate-500">Henüz kayıt yok</div>
                )}
                {leaves.map((l) => (
                  <div
                    key={l.id}
                    className="border rounded p-3 text-xs bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                  >
                    <div className="font-semibold text-slate-900 dark:text-slate-50">{l.employeeName}</div>
                    <div className="text-slate-600 dark:text-slate-300">
                      {l.type} • {l.startDate} → {l.endDate}
                    </div>
                    {l.note && <div className="text-slate-500 dark:text-slate-400 mt-1">{l.note}</div>}
                    <div className="pt-2">
                      <Button size="sm" variant="ghost" onClick={() => removeLeave(l.id)}>Sil</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
