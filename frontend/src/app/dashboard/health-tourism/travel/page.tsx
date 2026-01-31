"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plane,
  Car,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  MoreVertical,
  Plus,
  Search,
  Filter,
  Users,
  Luggage,
  Megaphone,
  Bell,
} from "lucide-react";
import { patients as initialPatients, type Patient } from "../data";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Helper to calculate time remaining
function getTimeRemaining(dateStr?: string) {
  if (!dateStr) return null;
  
  // Basic parsing for "12 Mart 2025 • 14:20" format
  // In a real app, use date-fns or dayjs with proper locale
  try {
    const parts = dateStr.split(" • ");
    if (parts.length !== 2) return null;
    
    const dateParts = parts[0].split(" "); // ["12", "Mart", "2025"]
    const timeParts = parts[1].split(":"); // ["14", "20"]
    
    const months: Record<string, number> = {
      "Ocak": 0, "Şubat": 1, "Mart": 2, "Nisan": 3, "Mayıs": 4, "Haziran": 5,
      "Temmuz": 6, "Ağustos": 7, "Eylül": 8, "Ekim": 9, "Kasım": 10, "Aralık": 11
    };
    
    const day = parseInt(dateParts[0]);
    const month = months[dateParts[1]];
    const year = parseInt(dateParts[2]);
    const hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    
    const flightDate = new Date(year, month, day, hour, minute);
    const now = new Date(); // Mocking "now" as close to flight date for demo purposes or use real now
    
    // For demo: if date is in past, return null. 
    // If it's effectively "now" (mock scenario), show something.
    // Let's assume the mock dates are in future relative to "now".
    
    const diffMs = flightDate.getTime() - now.getTime();
    if (diffMs < 0) return null;
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 48) return null; // Don't show countdown for far future
    
    return `${diffHours} sa ${diffMinutes} dk kaldı`;
  } catch (e) {
    return null;
  }
}

type TravelStage =
  | "FLIGHT_PENDING"
  | "TRANSFER_PENDING"
  | "DRIVER_ASSIGNED"
  | "COMPLETED";

const stageConfig: Record<
  TravelStage,
  { label: string; color: string; icon: any }
> = {
  FLIGHT_PENDING: {
    label: "Uçuş Bekleyenler",
    color: "bg-sky-50 border-sky-100 text-sky-900",
    icon: Plane,
  },
  TRANSFER_PENDING: {
    label: "Transfer Planlanacak",
    color: "bg-amber-50 border-amber-100 text-amber-900",
    icon: Calendar,
  },
  DRIVER_ASSIGNED: {
    label: "Şoför Atandı / Hazır",
    color: "bg-purple-50 border-purple-100 text-purple-900",
    icon: Car,
  },
  COMPLETED: {
    label: "Tamamlanan Transferler",
    color: "bg-emerald-50 border-emerald-100 text-emerald-900",
    icon: CheckCircle2,
  },
};

export default function TravelPage() {
  const searchParams = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Patient | null>(null);

  // Check for patientId in URL on mount
  useEffect(() => {
    const patientId = searchParams.get("patientId");
    if (patientId) {
      const patient = patients.find((p) => p.id === patientId);
      if (patient) {
        setSelectedPatient(patient);
        setEditValues(patient);
        setIsEditing(true);
      }
    }
  }, [searchParams, patients]);

  // Helper to determine stage based on patient data
  const getPatientStage = (p: Patient): TravelStage => {
    if (p.stage === "TABURCU" || p.stage === "KAYBEDILDI") return "COMPLETED";
    if (p.transferDriverName) return "DRIVER_ASSIGNED";
    if (p.flightCode || p.flightArrivalTime) return "TRANSFER_PENDING";
    return "FLIGHT_PENDING";
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Filter out candidates who haven't approved yet, unless they have flight info
      if (p.stage === "ADAY" && !p.flightCode) return false;
      
      if (
        search &&
        !`${p.name} ${p.passportName} ${p.country}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [patients, search]);

  const groupedPatients = useMemo(() => {
    const groups: Record<TravelStage, Patient[]> = {
      FLIGHT_PENDING: [],
      TRANSFER_PENDING: [],
      DRIVER_ASSIGNED: [],
      COMPLETED: [],
    };

    filteredPatients.forEach((p) => {
      const stage = getPatientStage(p);
      groups[stage].push(p);
    });

    return groups;
  }, [filteredPatients]);

  const handleSave = () => {
    if (!editValues) return;
    
    setPatients((prev) =>
      prev.map((p) => (p.id === editValues.id ? editValues : p))
    );

    // Simulate SMS sending if driver is assigned
    if (editValues.transferDriverName && editValues.transferDriverPhone) {
      toast.success(`Transfer planı güncellendi ve şoföre (${editValues.transferDriverName}) SMS gönderildi.`);
    } else {
      toast.success("Transfer bilgileri güncellendi");
    }

    setSelectedPatient(null);
    setIsEditing(false);
    setEditValues(null);
  };

  const handleEditChange = (key: keyof Patient, value: any) => {
    setEditValues((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col p-8 space-y-6">
      <div className="flex items-center justify-between flex-none">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seyahat & Transfer</h1>
          <p className="text-muted-foreground mt-2">
            Hasta uçuş takibi ve transfer operasyonları yönetimi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hasta ara..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button className="bg-[#00e676] text-black hover:bg-[#00c853]">
            <Plus className="mr-2 h-4 w-4" /> Yeni Transfer
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex h-full gap-6 min-w-[1200px]">
          {(Object.keys(stageConfig) as TravelStage[]).map((stageKey) => {
            const config = stageConfig[stageKey];
            const items = groupedPatients[stageKey];
            const Icon = config.icon;

            return (
              <div key={stageKey} className="flex flex-col w-80 flex-none gap-4">
                <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${config.color}`}>
                  <div className="flex items-center gap-2 font-semibold">
                    <Icon className="h-4 w-4" />
                    {config.label}
                  </div>
                  <Badge variant="secondary" className="bg-white/50 text-slate-700 font-bold">
                    {items.length}
                  </Badge>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {items.map((patient) => (
                    <Card
                      key={patient.id}
                      className="cursor-pointer hover:shadow-md transition-all border-slate-200"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setEditValues(patient);
                        setIsEditing(true);
                      }}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-slate-900">{patient.name}</div>
                            <div className="text-xs text-slate-500">{patient.country}</div>
                          </div>
                          {patient.hotel && (
                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100">
                              {patient.hotel}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2 text-xs text-slate-600">
                          {(patient.flightArrivalTime || patient.flightCode) ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                                <Plane className={`h-3 w-3 ${getTimeRemaining(patient.flightArrivalTime) ? "text-emerald-500 animate-pulse" : "text-slate-400"}`} />
                                <div className="flex flex-col flex-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-slate-900">
                                      {patient.flightCode || "Kod Yok"}
                                    </span>
                                    {getTimeRemaining(patient.flightArrivalTime) && (
                                      <Badge variant="outline" className="text-[9px] h-4 bg-emerald-50 text-emerald-700 border-emerald-200">
                                        {getTimeRemaining(patient.flightArrivalTime)}
                                      </Badge>
                                    )}
                                  </div>
                                  <span>{patient.flightArrivalTime || "Saat Yok"}</span>
                                  {patient.airport && (
                                    <div className="text-[10px] text-slate-500 mt-0.5 flex gap-1">
                                      <span>{patient.airport}</span>
                                      {patient.arrivalTerminal && <span>• {patient.arrivalTerminal}</span>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400 italic">
                              <Plane className="h-3 w-3" />
                              Uçuş bilgisi bekleniyor
                            </div>
                          )}

                          {patient.transferDriverName ? (
                            <div className="flex items-center gap-2 bg-emerald-50 p-2 rounded border border-emerald-100">
                              <Car className="h-3 w-3 text-emerald-600" />
                              <div className="flex flex-col flex-1">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-emerald-900">
                                    {patient.transferDriverName}
                                  </span>
                                  {patient.driverNotified && (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  )}
                                </div>
                                <span className="text-emerald-700">{patient.transferDriverPhone}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400 italic">
                              <Car className="h-3 w-3" />
                              Transfer atanmadı
                            </div>
                          )}
                          {patient.companionCount !== undefined && patient.companionCount > 0 && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Users className="h-3 w-3" />
                              <span>{patient.companionCount} Refakatçi</span>
                            </div>
                          )}
                          
                          {patient.transferNotes && (
                             <div className="flex items-start gap-1.5 text-amber-600 bg-amber-50 p-1.5 rounded text-[10px]">
                               <Megaphone className="h-3 w-3 mt-0.5 flex-none" />
                               <span className="line-clamp-2">{patient.transferNotes}</span>
                             </div>
                          )}
                        </div>

                        <div className="pt-2 border-t flex justify-between items-center text-[10px] text-slate-400">
                          <span>{patient.treatment}</span>
                          <span>{patient.arrivalMonth}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {items.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-xl border-slate-200 text-slate-400 text-sm">
                      Bu aşamada kayıt yok
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="max-w-[95vw] lg:max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transfer Detayları: {selectedPatient?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedPatient && editValues && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-4">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                    <Plane className="h-4 w-4" /> Uçuş & Karşılama Detayları
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-500">Uçuş Kodu</label>
                      <Input 
                        value={editValues.flightCode || ""} 
                        onChange={(e) => handleEditChange("flightCode", e.target.value)}
                        placeholder="Örn: TK 1923"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-500">Varış Tarihi & Saati</label>
                      <Input 
                        value={editValues.flightArrivalTime || ""} 
                        onChange={(e) => handleEditChange("flightArrivalTime", e.target.value)}
                        placeholder="Örn: 12 Mart 14:30"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-500">Havalimanı</label>
                      <Select 
                        value={editValues.airport || "IST"} 
                        onValueChange={(val) => handleEditChange("airport", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IST">İstanbul Havalimanı (IST)</SelectItem>
                          <SelectItem value="SAW">Sabiha Gökçen (SAW)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-500">Terminal / Kapı</label>
                      <Input 
                        value={editValues.arrivalTerminal || ""} 
                        onChange={(e) => handleEditChange("arrivalTerminal", e.target.value)}
                        placeholder="Örn: Dış Hatlar, Kapı 9"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-medium text-slate-500">Karşılama Levhası</label>
                      <Input 
                        value={editValues.welcomeSignText || editValues.name} 
                        onChange={(e) => handleEditChange("welcomeSignText", e.target.value)}
                        placeholder="Levhada yazacak isim"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                    <MapPin className="h-4 w-4" /> Konaklama
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-500">Otel</label>
                      <Input 
                        value={editValues.hotel || ""} 
                        onChange={(e) => handleEditChange("hotel", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-500">Oda No</label>
                      <Input 
                        value={editValues.hotelRoomNumber || ""} 
                        onChange={(e) => handleEditChange("hotelRoomNumber", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                  <Car className="h-4 w-4" /> Transfer & Şoför Operasyonu
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500">Refakatçi Sayısı</label>
                    <Input 
                      type="number"
                      min={0}
                      value={editValues.companionCount || 0} 
                      onChange={(e) => handleEditChange("companionCount", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2 flex items-end pb-2">
                     <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="driverNotified" 
                        checked={editValues.driverNotified || false}
                        onCheckedChange={(checked) => handleEditChange("driverNotified", checked)}
                      />
                      <label
                        htmlFor="driverNotified"
                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Şoföre Bildirim Gönderildi
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500">Şoför Adı</label>
                    <Input 
                      value={editValues.transferDriverName || ""} 
                      onChange={(e) => handleEditChange("transferDriverName", e.target.value)}
                      placeholder="Şoför Seçin veya Yazın"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500">Şoför Telefon</label>
                    <Input 
                      value={editValues.transferDriverPhone || ""} 
                      onChange={(e) => handleEditChange("transferDriverPhone", e.target.value)}
                      placeholder="+90 5XX XXX XX XX"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-medium text-slate-500">Önemli Transfer Notları</label>
                    <Textarea 
                      value={editValues.transferNotes || ""} 
                      onChange={(e) => handleEditChange("transferNotes", e.target.value)}
                      placeholder="Bagaj durumu, tekerlekli sandalye vb."
                      className="h-20"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPatient(null)}>İptal</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Değişiklikleri Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
