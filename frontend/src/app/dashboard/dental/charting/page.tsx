"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { DentalChart } from "@/components/dental/dental-chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  User,
  Search,
  ArrowLeft,
  Phone,
  History,
  Info,
} from "lucide-react";

interface DentalPatient {
  id: string;
  fullName: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  teeth: DentalTooth[];
  createdAt?: string;
}

interface DentalTooth {
  number: number;
  condition: string;
  notes?: string;
}

const CONDITIONS = [
  { value: "HEALTHY", label: "Sağlıklı", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "DECAYED", label: "Çürük (Caries)", color: "bg-red-50 text-red-700 border-red-200" },
  { value: "FILLED", label: "Dolgulu", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "MISSING", label: "Eksik Diş", color: "bg-gray-100 text-gray-500 border-gray-200" },
  { value: "IMPLANT", label: "İmplant", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "CROWN", label: "Kaplama (Crown)", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "ROOT_CANAL", label: "Kanal Tedavisi", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

function calculateAge(birthDate?: string) {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) {
    age -= 1;
  }
  return age;
}

export default function DentalChartingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Data State
  const [patients, setPatients] = useState<DentalPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  
  // Selection State
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [currentPatient, setCurrentPatient] = useState<DentalPatient | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Tooth Editing State
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [toothForm, setToothForm] = useState({ condition: "HEALTHY", notes: "" });
  const [savingTooth, setSavingTooth] = useState(false);

  // Create Patient State
  const [isCreatePatientOpen, setIsCreatePatientOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [creatingPatient, setCreatingPatient] = useState(false);

  // Initial Data Load
  useEffect(() => {
    const fetchPatients = async () => {
      setLoadingPatients(true);
      try {
        const res = await api.get("/dental/patients");
        setPatients(res.data || []);
      } catch (error) {
        toast.error("Hasta listesi yüklenirken hata oluştu");
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  // URL Sync
  useEffect(() => {
    const urlPatientId = searchParams.get("patientId");
    if (urlPatientId && urlPatientId !== selectedPatientId) {
      setSelectedPatientId(urlPatientId);
    }
  }, [searchParams]);

  // Fetch Details on Selection
  useEffect(() => {
    if (!selectedPatientId) {
      setCurrentPatient(null);
      return;
    }

    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const res = await api.get(`/dental/patients/${selectedPatientId}`);
        setCurrentPatient(res.data);
      } catch (error) {
        toast.error("Hasta detayları alınamadı");
        setSelectedPatientId(null);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [selectedPatientId]);

  // Derived State
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    const lower = searchTerm.toLowerCase();
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(lower) ||
        p.phone?.includes(lower)
    );
  }, [patients, searchTerm]);

  const teethMap = useMemo(() => {
    if (!currentPatient) return {};
    const map: Record<number, any> = {};
    currentPatient.teeth.forEach((t) => {
      map[t.number] = t;
    });
    return map;
  }, [currentPatient]);

  // Handlers
  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    router.push(`/dashboard/dental/charting?patientId=${id}`);
  };

  const handleBackToSelection = () => {
    setSelectedPatientId(null);
    setCurrentPatient(null);
    router.push("/dashboard/dental/charting");
  };

  const handleToothClick = (num: number) => {
    const toothData = teethMap[num];
    setToothForm({
      condition: toothData?.condition || "HEALTHY",
      notes: toothData?.notes || "",
    });
    setSelectedTooth(num);
    setIsDialogOpen(true);
  };

  const handleSaveTooth = async () => {
    if (!selectedPatientId || !selectedTooth) return;
    setSavingTooth(true);
    try {
      await api.patch(
        `/dental/patients/${selectedPatientId}/teeth/${selectedTooth}`,
        {
          condition: toothForm.condition,
          notes: toothForm.notes,
        }
      );

      // Refresh details
      const res = await api.get(`/dental/patients/${selectedPatientId}`);
      setCurrentPatient(res.data);

      toast.success(`Diş #${selectedTooth} güncellendi`);
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Kayıt başarısız oldu");
    } finally {
      setSavingTooth(false);
    }
  };

  const handleCreatePatient = async () => {
    if (!newPatientName.trim()) return;
    setCreatingPatient(true);
    try {
      const res = await api.post("/dental/patients", {
        fullName: newPatientName,
      });
      setPatients([res.data, ...patients]);
      handleSelectPatient(res.data.id);
      setNewPatientName("");
      setIsCreatePatientOpen(false);
      toast.success("Yeni hasta oluşturuldu");
    } catch (error) {
      toast.error("Hasta oluşturulamadı");
    } finally {
      setCreatingPatient(false);
    }
  };

  // Renders
  if (selectedPatientId && currentPatient) {
    // CHART VIEW
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col bg-slate-50/50">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToSelection}
              className="text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Hasta Listesi
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                {currentPatient.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  {currentPatient.fullName}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {currentPatient.gender && (
                     <span>{currentPatient.gender === 'MALE' ? 'Erkek' : currentPatient.gender === 'FEMALE' ? 'Kadın' : 'Diğer'}</span>
                  )}
                  {currentPatient.birthDate && (
                    <>
                      <span>•</span>
                      <span>{calculateAge(currentPatient.birthDate)} yaş</span>
                    </>
                  )}
                  {currentPatient.phone && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {currentPatient.phone}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div>
            <Button variant="outline" size="sm">
              <History className="mr-2 h-4 w-4" />
              Tedavi Geçmişi
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden p-6">
          <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-6 lg:grid-cols-4 h-full">
            {/* Left: Chart */}
            <Card className="col-span-1 flex flex-col overflow-hidden border-slate-200 shadow-sm lg:col-span-3 h-full">
              <CardHeader className="bg-slate-50/50 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-800">
                      Diş Şeması (Yetişkin)
                    </CardTitle>
                    <CardDescription>
                      İşlem yapmak istediğiniz dişin üzerine tıklayın.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-white">
                    Son Güncelleme: Bugün
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-white">
                <div className="w-full max-w-4xl transform scale-95 origin-center">
                   <DentalChart
                    teethData={teethMap}
                    onToothClick={handleToothClick}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Right: Sidebar */}
            <div className="flex h-full flex-col gap-4 overflow-hidden">
              {/* Legend */}
              <Card className="flex-1 overflow-hidden border-slate-200 shadow-sm flex flex-col">
                <CardHeader className="py-3 px-4 border-b bg-slate-50/50">
                  <CardTitle className="text-sm font-medium">Lejant & Durumlar</CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1">
                  <CardContent className="p-4 space-y-2">
                    {CONDITIONS.map((c) => (
                      <div
                        key={c.value}
                        className={`flex items-center gap-3 rounded-lg border p-2 text-xs font-medium transition-colors ${c.color} bg-opacity-50`}
                      >
                        <div className={`h-3 w-3 rounded-full ${c.color.replace('text-', 'bg-').replace('border-', '')} opacity-80`} />
                        <span>{c.label}</span>
                      </div>
                    ))}
                  </CardContent>
                </ScrollArea>
              </Card>

              {/* Selected Tooth Info (Mini) */}
              {selectedTooth && (
                 <Card className="border-slate-200 shadow-sm bg-blue-50/50">
                   <CardContent className="p-4">
                     <div className="flex items-center gap-2 mb-2">
                       <Info className="h-4 w-4 text-blue-600" />
                       <span className="font-semibold text-blue-900">Seçili Diş: #{selectedTooth}</span>
                     </div>
                     <p className="text-xs text-blue-800">
                       {teethMap[selectedTooth]?.condition 
                         ? CONDITIONS.find(c => c.value === teethMap[selectedTooth].condition)?.label 
                         : "Sağlıklı"}
                     </p>
                     {teethMap[selectedTooth]?.notes && (
                       <p className="mt-2 text-xs text-slate-600 italic">
                         {teethMap[selectedTooth].notes}
                       </p>
                     )}
                   </CardContent>
                 </Card>
              )}
            </div>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                  {selectedTooth}
                </span>
                <span>Diş Durumunu Düzenle</span>
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase text-slate-500">
                  Durum Seçimi
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITIONS.map((c) => (
                    <div
                      key={c.value}
                      className={`
                        cursor-pointer rounded-lg px-3 py-2 text-xs font-medium border transition-all
                        ${
                          toothForm.condition === c.value
                            ? `ring-2 ring-primary border-transparent ${c.color}`
                            : "border-slate-200 hover:bg-slate-50 text-slate-600"
                        }
                      `}
                      onClick={() =>
                        setToothForm({ ...toothForm, condition: c.value })
                      }
                    >
                      <div className="flex items-center gap-2">
                         <div className={`h-2 w-2 rounded-full ${c.color.replace('text-', 'bg-').replace('border-', '')}`} />
                         {c.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs font-semibold uppercase text-slate-500">
                  Notlar
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Örn: Derin çürük temizlendi, dolgu yapıldı..."
                  className="min-h-[80px] resize-none text-sm"
                  value={toothForm.notes}
                  onChange={(e) =>
                    setToothForm({ ...toothForm, notes: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                İptal
              </Button>
              <Button 
                onClick={handleSaveTooth} 
                disabled={savingTooth}
                className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800"
              >
                {savingTooth && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // SELECTION VIEW
  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Diş Şeması
            </h1>
            <p className="mt-2 text-slate-500">
              Tedavi planlaması yapmak için listeden bir hasta seçin veya yeni
              hasta oluşturun.
            </p>
          </div>
          <Button
            onClick={() => setIsCreatePatientOpen(true)}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Hasta Ekle
          </Button>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-white pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Hasta ara (Ad, Telefon, TC)..."
                className="pl-9 border-slate-200 focus-visible:ring-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingPatients ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="mb-2 h-8 w-8 animate-spin" />
                <p>Hastalar yükleniyor...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                  <User className="h-8 w-8 text-slate-300" />
                </div>
                <p className="font-medium text-slate-600">Hasta Bulunamadı</p>
                <p className="text-sm">
                  Aradığınız kriterlere uygun kayıt yok veya henüz hiç hasta
                  eklenmemiş.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                <div className="grid grid-cols-12 gap-4 bg-slate-50/50 px-6 py-3 text-xs font-semibold uppercase text-slate-500">
                  <div className="col-span-5 md:col-span-4">Hasta Adı</div>
                  <div className="col-span-4 md:col-span-3">İletişim</div>
                  <div className="hidden md:col-span-3 md:block">Son İşlem</div>
                  <div className="col-span-3 md:col-span-2 text-right">İşlem</div>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                   {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="group grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
                  >
                    <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                        {patient.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="truncate font-medium text-slate-900">
                          {patient.fullName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                           {calculateAge(patient.birthDate) ? `${calculateAge(patient.birthDate)} yaş` : 'Yaş belirtilmemiş'} 
                           {patient.gender && ` • ${patient.gender === 'MALE' ? 'Erkek' : patient.gender === 'FEMALE' ? 'Kadın' : 'Diğer'}`}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-4 md:col-span-3">
                      {patient.phone ? (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {patient.phone}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Telefon yok
                        </span>
                      )}
                    </div>
                    <div className="hidden md:col-span-3 md:block">
                      <span className="text-xs text-slate-500">
                        -
                      </span>
                    </div>
                    <div className="col-span-3 md:col-span-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelectPatient(patient.id)}
                        className="hover:border-emerald-500 hover:text-emerald-600"
                      >
                        Şemayı Aç
                      </Button>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={isCreatePatientOpen}
          onOpenChange={setIsCreatePatientOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hızlı Hasta Oluştur</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Ad Soyad</Label>
                <Input
                  placeholder="Hasta Adı Soyadı"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Detaylı bilgileri daha sonra hasta profilinden
                  ekleyebilirsiniz.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreatePatientOpen(false)}
              >
                İptal
              </Button>
              <Button
                onClick={handleCreatePatient}
                disabled={creatingPatient || !newPatientName.trim()}
              >
                {creatingPatient && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Oluştur
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
