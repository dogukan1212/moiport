"use client";

import { useState } from "react";
import {
  format,
  parseISO,
} from "date-fns";
import { tr } from "date-fns/locale";
import {
  ClipboardList,
  Plus,
  Calendar,
  User,
  Stethoscope,
  Pill,
  Syringe,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  MoreVertical,
  Activity,
  Package,
  Printer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  treatmentPlans,
  patients,
  doctors,
  type TreatmentPlan,
  type TreatmentStage,
  type MedicalMaterial,
  type Medication,
} from "../data";

export default function TreatmentPlansPage() {
  const [plans, setPlans] = useState<TreatmentPlan[]>(treatmentPlans);
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Helper to get patient name
  const getPatientName = (id: string) => patients.find((p) => p.id === id)?.name || "Bilinmeyen Hasta";
  const getDoctorName = (id: string) => doctors.find((d) => d.id === id)?.name || "Atanmamış Doktor";

  // Calculate progress based on completed stages
  const getProgress = (stages: TreatmentStage[]) => {
    const total = stages.length;
    const completed = stages.filter((s) => s.status === "COMPLETED").length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleOpenDetail = (plan: TreatmentPlan) => {
    setSelectedPlan(plan);
    setIsDetailOpen(true);
    setEditMode(false);
  };

  const handleStageStatusChange = (stageId: string, newStatus: string) => {
    if (!selectedPlan) return;

    const updatedStages = selectedPlan.stages.map((stage) => 
        stage.id === stageId ? { ...stage, status: newStatus as any } : stage
    );

    const updatedPlan = { ...selectedPlan, stages: updatedStages };
    
    // Update local state and list
    setSelectedPlan(updatedPlan);
    setPlans(plans.map(p => p.id === updatedPlan.id ? updatedPlan : p));

    // Simulate automation logic
    if (newStatus === "COMPLETED") {
        const stage = selectedPlan.stages.find(s => s.id === stageId);
        if (stage?.name.includes("Operasyon")) {
            toast.success("Operasyon tamamlandı. Stok düşümü yapıldı ve aftercare mesajları planlandı.");
        }
    }
  };

  // --- Edit Functions ---

  const handleUpdatePlan = () => {
    if (!selectedPlan) return;
    setPlans(plans.map(p => p.id === selectedPlan.id ? selectedPlan : p));
    toast.success("Tedavi planı güncellendi.");
    setEditMode(false);
  };

  const handleAddStage = () => {
    if (!selectedPlan) return;
    const newStage: TreatmentStage = {
        id: Math.random().toString(36).substr(2, 9),
        name: "Yeni Aşama",
        description: "",
        status: "PENDING",
    };
    setSelectedPlan({ ...selectedPlan, stages: [...selectedPlan.stages, newStage] });
  };

  const handleUpdateStage = (id: string, field: keyof TreatmentStage, value: any) => {
    if (!selectedPlan) return;
    const updatedStages = selectedPlan.stages.map(s => s.id === id ? { ...s, [field]: value } : s);
    setSelectedPlan({ ...selectedPlan, stages: updatedStages });
  };

  const handleDeleteStage = (id: string) => {
    if (!selectedPlan) return;
    setSelectedPlan({ ...selectedPlan, stages: selectedPlan.stages.filter(s => s.id !== id) });
  };

  const handleAddMaterial = () => {
    if (!selectedPlan) return;
    const newMat: MedicalMaterial = {
        id: Math.random().toString(36).substr(2, 9),
        name: "",
        brand: "",
        quantity: 1,
        unit: "Adet",
    };
    setSelectedPlan({ ...selectedPlan, materials: [...selectedPlan.materials, newMat] });
  };

  const handleUpdateMaterial = (id: string, field: keyof MedicalMaterial, value: string | number) => {
    if (!selectedPlan) return;
    const updatedMaterials = selectedPlan.materials.map(m => m.id === id ? { ...m, [field]: value } : m);
    setSelectedPlan({ ...selectedPlan, materials: updatedMaterials });
  };

  const handleDeleteMaterial = (id: string) => {
    if (!selectedPlan) return;
    setSelectedPlan({ ...selectedPlan, materials: selectedPlan.materials.filter(m => m.id !== id) });
  };

  const handleAddMedication = () => {
    if (!selectedPlan) return;
    const newMed: Medication = {
        id: Math.random().toString(36).substr(2, 9),
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
    };
    setSelectedPlan({ ...selectedPlan, medications: [...selectedPlan.medications, newMed] });
  };

  const handleUpdateMedication = (id: string, field: keyof Medication, value: string) => {
    if (!selectedPlan) return;
    const updatedMedications = selectedPlan.medications.map(m => m.id === id ? { ...m, [field]: value } : m);
    setSelectedPlan({ ...selectedPlan, medications: updatedMedications });
  };

  const handleDeleteMedication = (id: string) => {
    if (!selectedPlan) return;
    setSelectedPlan({ ...selectedPlan, medications: selectedPlan.medications.filter(m => m.id !== id) });
  };

  const handleAddInstruction = () => {
    if (!selectedPlan) return;
    setSelectedPlan({ ...selectedPlan, postOpInstructions: [...selectedPlan.postOpInstructions, ""] });
  };

  const handleUpdateInstruction = (index: number, value: string) => {
    if (!selectedPlan) return;
    const updatedInstructions = [...selectedPlan.postOpInstructions];
    updatedInstructions[index] = value;
    setSelectedPlan({ ...selectedPlan, postOpInstructions: updatedInstructions });
  };

  const handleDeleteInstruction = (index: number) => {
    if (!selectedPlan) return;
    const updatedInstructions = selectedPlan.postOpInstructions.filter((_, i) => i !== index);
    setSelectedPlan({ ...selectedPlan, postOpInstructions: updatedInstructions });
  };

  const handlePrint = (sectionId: string, title: string) => {
    const content = document.getElementById(sectionId);
    if (!content) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>${title} - Yazdır</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { padding: 40px; font-family: sans-serif; -webkit-print-color-adjust: exact; }
            @media print {
              .no-print { display: none !important; }
              button { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="mb-8 border-b pb-4">
            <h1 class="text-3xl font-bold text-gray-900">${title}</h1>
            <div class="mt-2 text-gray-600">
                <p class="font-semibold text-lg">${selectedPlan?.title}</p>
                <p>Hasta: ${getPatientName(selectedPlan?.patientId || '')}</p>
                <p>Doktor: ${getDoctorName(selectedPlan?.doctorId || '')}</p>
                <p>Tarih: ${format(new Date(), "d MMMM yyyy", { locale: tr })}</p>
            </div>
          </div>
          <div class="mt-6">
            ${content.innerHTML}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tedavi Planları</h1>
          <p className="text-muted-foreground">
            Hastaların tedavi süreçlerini, operasyon detaylarını ve ilaç takiplerini yönetin.
          </p>
        </div>
        <Button className="bg-[#00e676] text-black hover:bg-[#00c853]">
          <Plus className="mr-2 h-4 w-4" /> Yeni Plan Oluştur
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
            const progress = getProgress(plan.stages);
            return (
                <Card 
                    key={plan.id} 
                    className="cursor-pointer hover:border-emerald-500 transition-colors"
                    onClick={() => handleOpenDetail(plan)}
                >
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">{plan.title}</CardTitle>
                                <CardDescription className="flex items-center gap-1 mt-1">
                                    <User className="h-3 w-3" /> {getPatientName(plan.patientId)}
                                </CardDescription>
                            </div>
                            <Badge variant={plan.status === 'ACTIVE' ? 'default' : 'secondary'} className={plan.status === 'ACTIVE' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                {plan.status === 'ACTIVE' ? 'Aktif' : plan.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>İlerleme</span>
                                    <span>%{progress}</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Stethoscope className="h-4 w-4 text-emerald-600" />
                                {getDoctorName(plan.doctorId)}
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="text-xs font-normal">
                                    {plan.stages.length} Aşama
                                </Badge>
                                <Badge variant="outline" className="text-xs font-normal">
                                    {plan.medications.length} İlaç
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        })}
      </div>

      {/* Plan Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="!max-w-[95vw] lg:!max-w-[90vw] w-full max-h-[90vh] overflow-y-auto">
            {selectedPlan && (
                <>
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-2xl flex items-center gap-3">
                                    {editMode ? (
                                        <Input 
                                            value={selectedPlan.title} 
                                            onChange={(e) => setSelectedPlan({...selectedPlan, title: e.target.value})}
                                            className="text-2xl font-bold h-auto py-1 px-2 w-[400px]"
                                        />
                                    ) : (
                                        selectedPlan.title
                                    )}
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-2 mt-1">
                                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {getPatientName(selectedPlan.patientId)}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><Stethoscope className="h-3 w-3" /> {getDoctorName(selectedPlan.doctorId)}</span>
                                </DialogDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {editMode ? (
                                    <Button onClick={handleUpdatePlan} className="bg-emerald-600 hover:bg-emerald-700">
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Değişiklikleri Kaydet
                                    </Button>
                                ) : (
                                    <Button variant="outline" onClick={() => setEditMode(true)}>
                                        <FileText className="mr-2 h-4 w-4" /> Düzenle
                                    </Button>
                                )}
                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">
                                    {selectedPlan.status}
                                </Badge>
                            </div>
                        </div>
                    </DialogHeader>

                    <Tabs defaultValue="timeline" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                            <TabsTrigger value="timeline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent px-4 py-2">
                                Tedavi Yolculuğu
                            </TabsTrigger>
                            <TabsTrigger value="medical" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent px-4 py-2">
                                Tıbbi Detaylar & Materyal
                            </TabsTrigger>
                            <TabsTrigger value="medication" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent px-4 py-2">
                                İlaç & Reçete
                            </TabsTrigger>
                            <TabsTrigger value="postop" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent px-4 py-2">
                                Post-Op Talimatlar
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="timeline" className="pt-4 space-y-4">
                            <div className="flex justify-end mb-2">
                                <Button variant="outline" size="sm" onClick={() => handlePrint('print-timeline', 'Tedavi Yolculuğu')}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Listeyi Yazdır
                                </Button>
                            </div>
                            <div id="print-timeline" className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4">
                                {selectedPlan.stages.map((stage, index) => (
                                    <div key={stage.id} className="relative pl-8">
                                        <div className={cn(
                                            "absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 bg-white",
                                            stage.status === 'COMPLETED' ? "border-emerald-500 bg-emerald-500" :
                                            stage.status === 'IN_PROGRESS' ? "border-amber-500 bg-amber-500" : "border-slate-300"
                                        )} />
                                        <div className="flex flex-col gap-2">
                                            {editMode ? (
                                                <div className="grid gap-2 p-4 border rounded-lg bg-slate-50/50">
                                                    <div className="flex items-center gap-2">
                                                        <Input 
                                                            value={stage.name} 
                                                            onChange={(e) => handleUpdateStage(stage.id, "name", e.target.value)}
                                                            placeholder="Aşama Adı"
                                                            className="font-semibold"
                                                        />
                                                        <Select 
                                                            value={stage.status} 
                                                            onValueChange={(val) => handleUpdateStage(stage.id, "status", val)}
                                                        >
                                                            <SelectTrigger className="w-[140px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="PENDING">Bekliyor</SelectItem>
                                                                <SelectItem value="IN_PROGRESS">Sürüyor</SelectItem>
                                                                <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteStage(stage.id)}>
                                                            <AlertTriangle className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <Textarea 
                                                        value={stage.description} 
                                                        onChange={(e) => handleUpdateStage(stage.id, "description", e.target.value)}
                                                        placeholder="Açıklama"
                                                        className="text-sm"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <Input 
                                                            type="datetime-local"
                                                            value={stage.date ? stage.date.substring(0, 16) : ""}
                                                            onChange={(e) => handleUpdateStage(stage.id, "date", e.target.value)}
                                                            className="w-auto text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-semibold text-sm">{stage.name}</h3>
                                                        <Badge variant="outline" className={cn(
                                                            "text-[10px]",
                                                            stage.status === 'COMPLETED' ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-slate-500"
                                                        )}>
                                                            {stage.status === 'COMPLETED' ? 'Tamamlandı' : stage.status === 'IN_PROGRESS' ? 'Sürüyor' : 'Bekliyor'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{stage.description}</p>
                                                    {stage.date && (
                                                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                                            <Clock className="h-3 w-3" />
                                                            {format(parseISO(stage.date), "d MMMM yyyy HH:mm", { locale: tr })}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            
                                            {!editMode && stage.status !== 'COMPLETED' && (
                                                <div className="mt-2">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="h-7 text-xs"
                                                        onClick={() => handleStageStatusChange(stage.id, "COMPLETED")}
                                                    >
                                                        Tamamlandı İşaretle
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {editMode && (
                                    <Button onClick={handleAddStage} variant="outline" className="w-full ml-4 border-dashed">
                                        <Plus className="mr-2 h-4 w-4" /> Yeni Aşama Ekle
                                    </Button>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="medical" className="pt-4 space-y-6">
                            <div className="flex justify-end mb-2">
                                <Button variant="outline" size="sm" onClick={() => handlePrint('print-medical', 'Tıbbi Detaylar ve Materyal Listesi')}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Listeyi Yazdır
                                </Button>
                            </div>
                            <div id="print-medical" className="space-y-6">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-emerald-600" />
                                            Operasyon Notları
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {editMode ? (
                                            <Textarea 
                                                value={selectedPlan.description}
                                                onChange={(e) => setSelectedPlan({...selectedPlan, description: e.target.value})}
                                                className="min-h-[100px]"
                                            />
                                        ) : (
                                            <p className="text-sm text-slate-700 leading-relaxed">
                                                {selectedPlan.description}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
    
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold flex items-center gap-2">
                                            <Package className="h-4 w-4 text-indigo-600" />
                                            Kullanılan Materyaller & Envanter
                                        </h3>
                                        {editMode && (
                                            <Button size="sm" onClick={handleAddMaterial} variant="outline">
                                                <Plus className="h-3 w-3 mr-1" /> Ekle
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {selectedPlan.materials.map((mat) => (
                                            <div key={mat.id} className="flex flex-col gap-2 p-3 border rounded-lg bg-slate-50 relative group">
                                                {editMode ? (
                                                    <>
                                                        <div className="absolute top-2 right-2">
                                                             <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDeleteMaterial(mat.id)}>
                                                                <AlertTriangle className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                        <Input 
                                                            placeholder="Materyal Adı" 
                                                            value={mat.name} 
                                                            onChange={(e) => handleUpdateMaterial(mat.id, "name", e.target.value)}
                                                            className="h-8 text-sm"
                                                        />
                                                        <div className="flex gap-2">
                                                            <Input 
                                                                placeholder="Marka" 
                                                                value={mat.brand} 
                                                                onChange={(e) => handleUpdateMaterial(mat.id, "brand", e.target.value)}
                                                                className="h-8 text-xs"
                                                            />
                                                            <Input 
                                                                placeholder="Seri No" 
                                                                value={mat.serialNumber || ""} 
                                                                onChange={(e) => handleUpdateMaterial(mat.id, "serialNumber", e.target.value)}
                                                                className="h-8 text-xs font-mono"
                                                            />
                                                        </div>
                                                        <div className="flex gap-2 items-center">
                                                            <Input 
                                                                type="number" 
                                                                value={mat.quantity} 
                                                                onChange={(e) => handleUpdateMaterial(mat.id, "quantity", parseInt(e.target.value))}
                                                                className="h-8 w-20 text-xs"
                                                            />
                                                            <Input 
                                                                value={mat.unit} 
                                                                onChange={(e) => handleUpdateMaterial(mat.id, "unit", e.target.value)}
                                                                className="h-8 w-20 text-xs"
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex items-start justify-between w-full">
                                                        <div>
                                                            <div className="font-medium text-sm">{mat.name}</div>
                                                            <div className="text-xs text-slate-500">{mat.brand}</div>
                                                            {mat.serialNumber && (
                                                                <div className="text-[10px] text-slate-400 font-mono mt-1">SN: {mat.serialNumber}</div>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <Badge variant="secondary" className="bg-white">
                                                                {mat.quantity} {mat.unit}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="medication" className="pt-4 space-y-4">
                             <div className="flex justify-end mb-2">
                                <Button variant="outline" size="sm" onClick={() => handlePrint('print-medication', 'İlaç ve Reçete Listesi')}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Listeyi Yazdır
                                </Button>
                             </div>
                             <div id="print-medication">
                                {editMode && (
                                    <div className="flex justify-end mb-4">
                                        <Button size="sm" onClick={handleAddMedication} variant="outline">
                                            <Plus className="h-3 w-3 mr-1" /> Yeni İlaç Ekle
                                        </Button>
                                    </div>
                                )}
                                <div className="grid gap-4">
                                    {selectedPlan.medications.map((med) => (
                                    <div key={med.id} className="flex items-start p-4 border rounded-xl hover:bg-slate-50 transition-colors relative">
                                        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mr-4 shrink-0 mt-1">
                                            <Pill className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            {editMode ? (
                                                <>
                                                    <div className="flex gap-2">
                                                        <Input 
                                                            placeholder="İlaç Adı" 
                                                            value={med.name} 
                                                            onChange={(e) => handleUpdateMedication(med.id, "name", e.target.value)}
                                                            className="font-semibold"
                                                        />
                                                        <Input 
                                                            placeholder="Doz (Örn: 500mg)" 
                                                            value={med.dosage} 
                                                            onChange={(e) => handleUpdateMedication(med.id, "dosage", e.target.value)}
                                                            className="w-1/3"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Input 
                                                            placeholder="Sıklık (Örn: Sabah-Akşam)" 
                                                            value={med.frequency} 
                                                            onChange={(e) => handleUpdateMedication(med.id, "frequency", e.target.value)}
                                                        />
                                                        <Input 
                                                            placeholder="Süre (Örn: 1 Hafta)" 
                                                            value={med.duration} 
                                                            onChange={(e) => handleUpdateMedication(med.id, "duration", e.target.value)}
                                                        />
                                                    </div>
                                                    <Textarea 
                                                        placeholder="Kullanım Talimatı"
                                                        value={med.instructions}
                                                        onChange={(e) => handleUpdateMedication(med.id, "instructions", e.target.value)}
                                                        className="text-xs"
                                                    />
                                                    <div className="flex justify-end">
                                                        <Button variant="ghost" size="sm" className="text-red-500 h-8" onClick={() => handleDeleteMedication(med.id)}>
                                                            Sil
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="font-semibold text-sm">{med.name}</h4>
                                                        <Badge variant="outline">{med.dosage}</Badge>
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {med.frequency}</span>
                                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {med.duration}</span>
                                                    </div>
                                                    <div className="mt-2 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded inline-block">
                                                        {med.instructions}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                         </div>
                        </TabsContent>

                        <TabsContent value="postop" className="pt-4">
                            <div className="flex justify-end mb-2">
                                <Button variant="outline" size="sm" onClick={() => handlePrint('print-postop', 'Taburcu Sonrası Talimatlar')}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Listeyi Yazdır
                                </Button>
                            </div>
                            <div id="print-postop">
                                <Card className="border-amber-200 bg-amber-50/30">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center justify-between text-amber-800">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4" />
                                                Taburcu Sonrası Talimatlar
                                            </div>
                                            {editMode && (
                                                <Button size="sm" variant="outline" onClick={handleAddInstruction} className="bg-white border-amber-200 hover:bg-amber-50 text-amber-800">
                                                    <Plus className="h-3 w-3 mr-1" /> Madde Ekle
                                                </Button>
                                            )}
                                        </CardTitle>
                                        <CardDescription>
                                            Bu talimatlar hastanın mobil uygulamasına otomatik olarak gönderilmiştir.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3">
                                            {selectedPlan.postOpInstructions.map((inst, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                    {editMode ? (
                                                        <div className="flex gap-2 w-full">
                                                            <Input 
                                                                value={inst} 
                                                                onChange={(e) => handleUpdateInstruction(i, e.target.value)}
                                                                className="bg-white"
                                                            />
                                                            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 text-red-500" onClick={() => handleDeleteInstruction(i)}>
                                                                <AlertTriangle className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                                            <span>{inst}</span>
                                                        </>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter className="bg-amber-100/50 border-t border-amber-200 p-3">
                                        <div className="flex items-center gap-2 text-xs text-amber-800 w-full">
                                            <Clock className="h-3 w-3" />
                                            <span>Otomatik Aftercare mesajları: <strong>Aktif</strong> (1. Hafta, 1. Ay, 6. Ay)</span>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}