"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Calendar, CheckCircle2, Clock, Edit2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type Payroll = {
  id: string;
  period: string; // YYYY-MM
  baseSalary: number;
  bonus?: number;
  deductions: number;
  netSalary: number;
  status: "PENDING" | "PAID";
  paymentDate?: string;
  user?: { name: string };
};

export default function HRPayrollPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ baseSalary?: string; bonus?: string; deductions?: string }>({});

  const isAdmin = user?.role === "ADMIN";

  const fetchPayrolls = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/finance/payroll");
      setItems(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Bordro listesi alınamadı");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const startEdit = (p: Payroll) => {
    setEditId(p.id);
    setEditData({
      baseSalary: String(p.baseSalary ?? 0),
      bonus: String(p.bonus ?? 0),
      deductions: String(p.deductions ?? 0),
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
  };

  const saveEdit = async (p: Payroll) => {
    try {
      await api.patch(`/finance/payroll/${p.id}`, {
        baseSalary: parseFloat(editData.baseSalary || "0"),
        bonus: parseFloat(editData.bonus || "0"),
        deductions: parseFloat(editData.deductions || "0"),
      });
      await fetchPayrolls();
      setEditId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Bordro güncellenemedi");
    }
  };

  const payPayroll = async (p: Payroll) => {
    if (!isAdmin) return;
    if (!confirm(`${p.user?.name} (${p.period}) bordrosu ödensin mi?`)) return;
    try {
      await api.post(`/finance/payroll/${p.id}/pay`);
      await fetchPayrolls();
    } catch (err: any) {
      alert(err.response?.data?.message || "Ödeme işlemi başarısız");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-normal tracking-[-0.03em] text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-slate-900 dark:text-slate-50" />
            <span>Bordro & Maaşlar</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-300 text-sm mt-2">
            Bordro kayıtlarını görüntüleyin ve gerekli düzeltmeleri yapın. Ödeme işlemi sadece Yönetici rolüne açıktır.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-lg">Bordro Listesi</CardTitle>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {loading ? "Yükleniyor..." : `${items.length} kayıt`}
            {error && <span className="text-red-600 dark:text-red-400 ml-3">{error}</span>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((p) => {
              const isEditing = editId === p.id;
              return (
                <div
                  key={p.id}
                  className="border rounded-lg p-4 space-y-3 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {p.user?.name || "-"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Dönem: {p.period}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.status === "PAID" ? (
                        <span className="text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/40">
                          <CheckCircle2 className="h-3 w-3" /> Ödendi
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/40">
                          <Clock className="h-3 w-3" /> Beklemede
                        </span>
                      )}
                    </div>
                  </div>
                  {!isEditing ? (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-slate-600 dark:text-slate-300">
                        Brüt: {p.baseSalary.toLocaleString("tr-TR")} TL
                      </div>
                      <div className="text-slate-600 dark:text-slate-300">
                        Bonus: {(p.bonus || 0).toLocaleString("tr-TR")} TL
                      </div>
                      <div className="text-slate-600 dark:text-slate-300">
                        Kesinti: {p.deductions.toLocaleString("tr-TR")} TL
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-slate-50">
                        Net: {p.netSalary.toLocaleString("tr-TR")} TL
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs w-24 text-slate-500 dark:text-slate-400">Brüt</label>
                        <input
                          className="border rounded px-2 py-1 text-sm w-full bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                          value={editData.baseSalary || ""}
                          onChange={(e) => setEditData((d) => ({ ...d, baseSalary: e.target.value }))}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs w-24 text-slate-500 dark:text-slate-400">Bonus</label>
                        <input
                          className="border rounded px-2 py-1 text-sm w-full bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                          value={editData.bonus || ""}
                          onChange={(e) => setEditData((d) => ({ ...d, bonus: e.target.value }))}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs w-24 text-slate-500 dark:text-slate-400">Kesinti</label>
                        <input
                          className="border rounded px-2 py-1 text-sm w-full bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                          value={editData.deductions || ""}
                          onChange={(e) => setEditData((d) => ({ ...d, deductions: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {!isEditing ? (
                      <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                        <Edit2 className="h-3 w-3 mr-2" />
                        Düzenle
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" onClick={() => saveEdit(p)}>Kaydet</Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>İptal</Button>
                      </>
                    )}
                    {isAdmin && p.status !== "PAID" && (
                      <Button size="sm" variant="secondary" onClick={() => payPayroll(p)}>
                        Öde
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
