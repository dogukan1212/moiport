"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Plus, CreditCard, MoreVertical } from "lucide-react";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Plan = {
  id: string;
  code: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  isPopular?: boolean;
  maxUsers?: number;
  maxStorage?: number;
  features?: string[];
  price: string;
  period: string;
  activeCount?: number;
};

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<{ code: string; name: string; monthlyPrice: number; yearlyPrice?: number; description?: string }>({ code: "", name: "", monthlyPrice: 0, yearlyPrice: undefined, description: "" });
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState<{ code: string; name?: string; monthlyPrice?: number; yearlyPrice?: number; description?: string } | null>(null);

  const loadPlans = async () => {
    const res = await api.get("/subscriptions/admin/plans");
    setPlans(res.data || []);
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const submitCreate = async () => {
    if (!form.code || !form.name || !form.monthlyPrice || form.monthlyPrice <= 0) return;
    await api.post("/subscriptions/admin/plans", {
      code: form.code.toUpperCase(),
      name: form.name,
      description: form.description,
      monthlyPrice: form.monthlyPrice,
      yearlyPrice: form.yearlyPrice,
      isPopular: false,
      features: [],
    });
    setCreateOpen(false);
    setForm({ code: "", name: "", monthlyPrice: 0, yearlyPrice: undefined, description: "" });
    await loadPlans();
  };
  
  const submitEdit = async () => {
    if (!edit?.code) return;
    const code = edit.code;
    const payload: any = {};
    if (edit.name) payload.name = edit.name;
    if (typeof edit.monthlyPrice === "number" && edit.monthlyPrice > 0) payload.monthlyPrice = edit.monthlyPrice;
    if (typeof edit.yearlyPrice === "number" && edit.yearlyPrice > 0) payload.yearlyPrice = edit.yearlyPrice;
    if (typeof edit.description === "string") payload.description = edit.description;
    await api.patch(`/subscriptions/admin/plans/${code}`, payload);
    setEditOpen(false);
    setEdit(null);
    await loadPlans();
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Abonelik Yönetimi</h1>
          <p className="text-slate-500 mt-2">Paketleri düzenleyin, fiyatları güncelleyin ve abonelikleri izleyin.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Paket Oluştur
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="border-slate-200 shadow-sm relative overflow-hidden">
             {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                  EN ÇOK TERCİH EDİLEN
                </div>
              )}
            <CardHeader>
              <div className="flex justify-between items-start">
                 <div>
                    <CardTitle className="text-xl font-bold text-slate-900">{plan.name}</CardTitle>
                    <CardDescription className="mt-2 h-10">{plan.description}</CardDescription>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
               <div>
                  <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 text-sm font-medium">{plan.period}</span>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                    <span className="text-sm text-slate-600 font-medium">Aktif Abone</span>
                    <span className="text-lg font-bold text-indigo-600">{plan.activeCount || 0}</span>
                </div>

                <ul className="space-y-3">
                  {(plan.features || []).map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
            </CardContent>
            <CardFooter className="flex gap-3">
                <Button variant="outline" className="w-full" onClick={() => { 
                  setEdit({ code: plan.code, name: plan.name, monthlyPrice: plan.monthlyPrice, yearlyPrice: plan.yearlyPrice, description: plan.description });
                  setEditOpen(true);
                }}>Düzenle</Button>
                <Button variant="ghost" size="icon" className="shrink-0"><MoreVertical className="w-4 h-4" /></Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Son Abonelik İşlemleri</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                 <div key={i} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                          <CreditCard className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="font-medium text-slate-900">Ajans {i} Medya</p>
                          <p className="text-xs text-slate-500">Profesyonel Paket (Aylık)</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="font-bold text-slate-900">+₺499.00</p>
                       <p className="text-xs text-slate-400">Bugün, 14:30</p>
                    </div>
                 </div>
              ))}
           </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Paket</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-3">
              <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="border rounded p-2 flex-1" placeholder="Kod (STARTER, PRO)" />
              <input type="number" value={form.monthlyPrice} onChange={(e) => setForm((f) => ({ ...f, monthlyPrice: Number(e.target.value) }))} className="border rounded p-2 w-40" placeholder="Aylık ₺" />
              <input type="number" value={form.yearlyPrice || 0} onChange={(e) => setForm((f) => ({ ...f, yearlyPrice: Number(e.target.value) || undefined }))} className="border rounded p-2 w-40" placeholder="Yıllık ₺" />
            </div>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="border rounded p-2 w-full" placeholder="İsim" />
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="border rounded p-2 w-full" placeholder="Açıklama" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>İptal</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={submitCreate}>Oluştur</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paket Düzenle</DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <input value={edit.code} disabled className="border rounded p-2 flex-1 bg-slate-50" />
                <input type="number" value={edit.monthlyPrice || 0} onChange={(e) => setEdit((f) => f ? ({ ...f, monthlyPrice: Number(e.target.value) }) : f)} className="border rounded p-2 w-40" placeholder="Aylık ₺" />
                <input type="number" value={edit.yearlyPrice || 0} onChange={(e) => setEdit((f) => f ? ({ ...f, yearlyPrice: Number(e.target.value) }) : f)} className="border rounded p-2 w-40" placeholder="Yıllık ₺" />
              </div>
              <input value={edit.name || ""} onChange={(e) => setEdit((f) => f ? ({ ...f, name: e.target.value }) : f)} className="border rounded p-2 w-full" placeholder="İsim" />
              <textarea value={edit.description || ""} onChange={(e) => setEdit((f) => f ? ({ ...f, description: e.target.value }) : f)} className="border rounded p-2 w-full" placeholder="Açıklama" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>İptal</Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={submitEdit}>Kaydet</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
