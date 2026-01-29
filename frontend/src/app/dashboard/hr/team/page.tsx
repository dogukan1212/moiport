"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Phone, Calendar, CreditCard, Edit2, Plus, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Employee = {
  id: string;
  name: string;
  email?: string;
  role: string;
  salary?: number;
  iban?: string;
  startDate?: string;
  isActive?: boolean;
};

export default function HRTeamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selected, setSelected] = useState<Employee | null>(null);
  
  // Add Employee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
  });
  const [addLoading, setAddLoading] = useState(false);

  const canViewFinancial = user?.role === "ADMIN" || user?.role === "HR";

  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/finance/employees");
      setEmployees(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Personel listesi alınamadı");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openDetails = (e: Employee) => {
    router.push(`/dashboard/hr/team/${e.id}`);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await api.post("/users", newEmployee);
      alert("Personel başarıyla eklendi.");
      setIsAddModalOpen(false);
      setNewEmployee({ name: "", email: "", password: "", role: "STAFF" });
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || "Personel eklenirken hata oluştu.");
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-normal tracking-[-0.03em] text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Users className="h-6 w-6 text-slate-900 dark:text-slate-50" />
            <span>Ekip Yönetimi</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-300 text-sm mt-2">
            Personel listesini yönetin, iletişim bilgilerini düzenleyin.
          </p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-slate-900 text-white hover:bg-slate-800 w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Personel Ekle
        </Button>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-lg">Personel Listesi</CardTitle>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {loading ? "Yükleniyor..." : `${employees.length} kayıt`}
            {error && <span className="text-red-600 dark:text-red-400 ml-3">{error}</span>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {employees.map((e) => {
              const isInactive = e.isActive === false;
              return (
                <div
                  key={e.id}
                  className={cn(
                    "border rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800",
                    isInactive ? "opacity-70 bg-slate-50 dark:bg-slate-900/60" : ""
                  )}
                  onClick={() => openDetails(e)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-medium dark:bg-slate-800 dark:text-slate-300">
                        {e.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{e.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{e.role}</div>
                      </div>
                    </div>
                    {!isInactive ? (
                      <span className="text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/40">
                        Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                        Pasif
                      </span>
                    )}
                  </div>
                  <div className="mt-4 space-y-2 text-xs text-slate-600 border-t pt-3 border-slate-50 dark:text-slate-400 dark:border-slate-800">
                    {e.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                        <span>{e.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                      <span>Başlangıç: {e.startDate ? e.startDate.substring(0, 10) : "-"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Employee Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 dark:bg-slate-900 dark:border dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Yeni Personel Ekle</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Ad Soyad</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500 dark:focus:ring-slate-100/10"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  placeholder="Örn: Ahmet Yılmaz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">E-posta Adresi</label>
                <input
                  required
                  type="email"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500 dark:focus:ring-slate-100/10"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  placeholder="ahmet@sirket.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Geçici Şifre</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500 dark:focus:ring-slate-100/10"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  placeholder="******"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Rol</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-slate-100/10"
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                >
                  <option value="STAFF">Personel (STAFF)</option>
                  <option value="HR">İnsan Kaynakları (HR)</option>
                  <option value="ADMIN">Yönetici (ADMIN)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  İptal
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-slate-900 text-white hover:bg-slate-800"
                  disabled={addLoading}
                >
                  {addLoading ? "Ekleniyor..." : "Kaydet"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
