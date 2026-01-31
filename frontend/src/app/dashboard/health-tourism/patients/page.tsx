"use client";

import { useMemo, useRef, useState, useEffect, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api, { getBaseURL } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Calendar,
  Filter,
  Globe2,
  Plane,
  Plus,
  Search,
  Users,
  Image as ImageIcon,
  Trash2,
  Eye
} from "lucide-react";
import Link from "next/link";
import {
  type Patient,
  type PatientStage,
  type TreatmentCategory,
  type DepositStatus,
  type HeatStatus,
  patients,
  stageConfig,
  heatConfig,
  formatCurrency,
  patientContracts,
  contractTemplates,
} from "../data";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";


export default function PatientsPage() {
  const [patientsState, setPatientsState] = useState<Patient[]>(patients);
  const [view, setView] = useState<"list" | "pipeline">("list");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [treatmentFilter, setTreatmentFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Patient | null>(null);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [whatsappTemplate, setWhatsappTemplate] = useState<
    "WELCOME" | "REMINDER" | "FLIGHT_INFO"
  >("WELCOME");
  const [patientFiles, setPatientFiles] = useState<
    Record<string, { id: string; name: string }[]>
  >({});
  const [patientMedia, setPatientMedia] = useState<
    Record<string, { id: string; name: string; url: string; category: "BEFORE" | "AFTER" | "XRAY" | "OTHER" }[]>
  >({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!selectedPatient) return;

    const fetchPatientMedia = async () => {
      try {
        // 1. Root klasörleri çek
        const rootResponse = await api.get('/storage/content');
        const folders = rootResponse.data.folders || [];
        
        // 2. Hasta klasörünü bul
        const folderName = `Patient-${selectedPatient.id}`;
        const folder = folders.find((f: any) => f.name === folderName);

        if (folder) {
          // 3. Klasör varsa içeriğini çek
          const contentResponse = await api.get(`/storage/content?folderId=${folder.id}`);
          const files = contentResponse.data.files || [];
          
          // 4. Dosyaları formatla ve state'e at (Blob olarak çek)
          const mediaFilesPromises = files.map(async (file: any) => {
            try {
                // Blob olarak çek
                const response = await api.get(`/storage/file/${file.id}/preview`, { responseType: 'blob' });
                const blobUrl = URL.createObjectURL(response.data);
                
                return {
                    id: file.id,
                    name: file.name,
                    url: blobUrl,
                    category: "OTHER" as const
                };
            } catch (err) {
                console.error(`Failed to load image ${file.name}`, err);
                return null;
            }
          });

          const resolvedFiles = (await Promise.all(mediaFilesPromises)).filter(Boolean);

          setPatientMedia(prev => ({
            ...prev,
            [selectedPatient.id]: resolvedFiles as any
          }));
        } else {
             setPatientMedia(prev => ({
            ...prev,
            [selectedPatient.id]: []
          }));
        }
      } catch (error) {
        console.error("Görseller yüklenirken hata:", error);
      }
    };

    fetchPatientMedia();
  }, [selectedPatient]);


  const treatmentCategories = useMemo(
    () =>
      Array.from(new Set(patientsState.map((p) => p.treatmentCategory))).sort(),
    [patientsState],
  );

  const countries = useMemo(
    () =>
      Array.from(new Set(patientsState.map((p) => p.country))).sort((a, b) =>
        a.localeCompare(b, "tr"),
      ),
    [patientsState],
  );

  const salesOwners = useMemo(
    () =>
      Array.from(new Set(patientsState.map((p) => p.salesOwner))).sort(
        (a, b) => a.localeCompare(b, "tr"),
      ),
    [patientsState],
  );

  const filteredPatients = useMemo(
    () =>
      patientsState.filter((p) => {
        if (
          search &&
          !`${p.name} ${p.passportName} ${p.country} ${p.city} ${p.treatment} ${p.phone}`
            .toLowerCase()
            .includes(search.toLowerCase())
        ) {
          return false;
        }
        if (treatmentFilter !== "all" && p.treatmentCategory !== treatmentFilter) {
          return false;
        }
        if (countryFilter !== "all" && p.country !== countryFilter) {
          return false;
        }
        if (ownerFilter !== "all" && p.salesOwner !== ownerFilter) {
          return false;
        }
        if (stageFilter !== "all" && p.stage !== stageFilter) {
          return false;
        }
        return true;
      }),
    [search, treatmentFilter, countryFilter, ownerFilter, stageFilter, patientsState],
  );

  const activePatients = patientsState.filter((p) => p.stage !== "KAYBEDILDI");
  const wonPatients = patientsState.filter(
    (p) => p.stage === "ONAYLANDI" || p.stage === "OPERASYON_BEKLIYOR" || p.stage === "TABURCU",
  );
  const conversionRate =
    patientsState.length > 0
      ? Math.round((wonPatients.length / patientsState.length) * 100)
      : 0;
  const pipelineValue = activePatients.reduce(
    (sum, p) => sum + p.revenuePotential * p.pipelineProbability,
    0,
  );
  const postOpCount = patientsState.filter((p) => p.stage === "TABURCU").length;

  const pipelineStages: PatientStage[] = [
    "ADAY",
    "ONAYLANDI",
    "OPERASYON_BEKLIYOR",
    "TABURCU",
    "KAYBEDILDI",
  ];

  function handleEditChange<K extends keyof Patient>(key: K, value: Patient[K]) {
    setEditValues((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  const handleCreatePatient = () => {
    const newId = `P-${String(patientsState.length + 100).padStart(3, "0")}`;
    const newPatient: Patient = {
      id: newId,
      name: "",
      passportName: "",
      country: "",
      city: "",
      nationality: "",
      language: "",
      phone: "",
      refSource: "",
      treatmentCategory: "ESTETIK",
      treatment: "",
      package: "",
      budget: 0,
      currency: "EUR",
      stage: "ADAY",
      offerPackage: "",
      agreedAmount: 0,
      agreedCurrency: "EUR",
      depositStatus: "NONE",
      contracts: [],
      arrivalMonth: "",
      salesOwner: "Mert",
      source: "Manual",
      channel: "Direct",
      lastContact: new Date().toISOString(),
      pipelineProbability: 0.1,
      revenuePotential: 0,
      tags: [],
      createdAt: new Date().toISOString(),
    };
    setEditValues(newPatient);
    setSelectedPatient(newPatient);
    setIsEditing(true);
  };

  const handleStageChange = (id: string, newStage: PatientStage) => {
    setPatientsState((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stage: newStage } : p)),
    );
    toast.success("Aşama güncellendi.");
  };

  const handleSavePatient = () => {
    if (!selectedPatient || !editValues) return;
    
    const exists = patientsState.find(p => p.id === selectedPatient.id);
    
    if (exists) {
      setPatientsState((prev) =>
        prev.map((p) => (p.id === selectedPatient.id ? editValues : p)),
      );
    } else {
      setPatientsState((prev) => [editValues, ...prev]);
    }
    
    setSelectedPatient(editValues);
    setIsEditing(false);
    toast.success("Hasta bilgileri kaydedildi.");
  };

  const handleSendWhatsapp = async () => {
    if (!selectedPatient) return;
    const to = selectedPatient.whatsapp || selectedPatient.phone;
    if (!to) {
      toast.error("Bu hasta için kayıtlı bir telefon numarası bulunamadı.");
      return;
    }
    setSendingWhatsapp(true);
    try {
      let message: string;
      if (whatsappTemplate === "REMINDER") {
        message = `Merhaba ${selectedPatient.name}, sağlık turizmi için planlanan ${selectedPatient.treatment} sürecinizle ilgili randevu hatırlatmasıdır. Uygun olduğunuzda bu mesaja yanıt verebilirsiniz.`;
      } else if (whatsappTemplate === "FLIGHT_INFO") {
        message = `Merhaba ${selectedPatient.name}, ${selectedPatient.treatment} için uçuş bilgilerinizi (tarih, saat, uçuş kodu) iletmeniz için yazıyorum. Size en iyi şekilde planlama yapmak istiyoruz.`;
      } else {
        message = `Merhaba ${selectedPatient.name}, sağlık turizmi süreçlerinizle ilgili bilgilendirme için yazıyorum. Uygun olduğunuzda bu mesajı yanıtlayabilirsiniz.`;
      }
      await api.post("/integrations/whatsapp/send", {
        to,
        message,
      });
      toast.success("WhatsApp mesajı gönderildi.");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "WhatsApp mesajı gönderilirken bir hata oluştu.";
      toast.error(message);
    } finally {
      setSendingWhatsapp(false);
    }
  };

  const handleOpenFilePicker = () => {
    if (!selectedPatient) return;
    fileInputRef.current?.click();
  };

  const handleOpenMediaPicker = () => {
    if (!selectedPatient) return;
    mediaInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPatient) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderId", "");
      formData.append("isPublic", "false");
      const response = await api.post("/storage/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploaded = response?.data || {};
      if (uploaded.id) {
        setPatientFiles((prev) => {
          const existing = prev[selectedPatient.id] || [];
          return {
            ...prev,
            [selectedPatient.id]: [
              ...existing,
              { id: uploaded.id, name: uploaded.name || file.name },
            ],
          };
        });
      }
      toast.success("Dosya yüklendi. Dosyayı Dosyalar bölümünden görüntüleyebilirsiniz.");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Dosya yüklenirken bir hata oluştu.";
      toast.error(message);
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const handleMediaChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedPatient) return;
    setUploadingFile(true);

    try {
      // 1. Klasörü bul veya oluştur
      const folderName = `Patient-${selectedPatient.id}`;
      let folderId: string;
      
      // Root klasörleri çekip kontrol et
      const rootResponse = await api.get('/storage/content');
      const folders = rootResponse.data.folders || [];
      const existingFolder = folders.find((f: any) => f.name === folderName);

      if (existingFolder) {
        folderId = existingFolder.id;
      } else {
        // Yoksa oluştur
        const createResponse = await api.post('/storage/folder', {
            name: folderName,
            parentId: null
        });
        folderId = createResponse.data.id;
      }

      const mediaFiles = Array.from(files);
      const uploadedMedia: { id: string; name: string; url: string; category: "BEFORE" | "AFTER" | "XRAY" | "OTHER" }[] = [];

      for (const file of mediaFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folderId", folderId);
        formData.append("isPublic", "false");

        try {
          const response = await api.post("/storage/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const uploaded = response?.data || {};
          
          // Use ObjectURL for immediate preview to ensure the image is visible
          // Backend URL might fail if there are auth/CORS issues or if getBaseURL is incorrect
          const fileUrl = URL.createObjectURL(file);

          if (uploaded.id || fileUrl) {
            uploadedMedia.push({
              id: uploaded.id || Math.random().toString(),
              name: uploaded.name || file.name,
              url: fileUrl,
              category: "OTHER" as const
            });
          }
        } catch (err) {
          console.error(`Failed to upload file ${file.name}`, err);
          // Continue with other files even if one fails
        }
      }

      if (uploadedMedia.length > 0) {
        setPatientMedia((prev) => {
          const existing = prev[selectedPatient.id] || [];
          return {
            ...prev,
            [selectedPatient.id]: [...existing, ...uploadedMedia],
          };
        });
        toast.success(`${uploadedMedia.length} görsel galeriye eklendi.`);
      } else {
         toast.error("Görseller yüklenemedi.");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Görsel yüklenirken genel bir hata oluştu.");
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const handleMediaPreview = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  const handleOpenFilePreview = (fileId: string) => {
    if (typeof window === "undefined") return;
    const base = getBaseURL();
    const url = `${base}/storage/file/${fileId}/preview`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCreateTask = async () => {
    if (!selectedPatient) return;
    setCreatingTask(true);
    try {
      const descriptionLines = [
        "Bu görev Hasta Yönetimi ekranından otomatik oluşturuldu.",
        "",
        `Hasta ID: ${selectedPatient.id}`,
        `Ad Soyad: ${selectedPatient.name}`,
        `Pasaport Adı: ${selectedPatient.passportName}`,
        `Ülke/Şehir: ${selectedPatient.country}, ${selectedPatient.city}`,
        `Telefon: ${selectedPatient.phone}`,
        selectedPatient.whatsapp
          ? `WhatsApp: ${selectedPatient.whatsapp}`
          : "",
        selectedPatient.email ? `E-posta: ${selectedPatient.email}` : "",
        "",
        `Tedavi: ${selectedPatient.treatment}`,
        `Paket: ${selectedPatient.package}`,
      ].filter(Boolean);

      const payload: any = {
        title: `Hasta: ${selectedPatient.name} - ${selectedPatient.treatment}`,
        description: descriptionLines.join("\n"),
        status: "TODO",
        priority: "MEDIUM",
        labels: ["HEALTH_TOURISM", "PATIENT"],
      };

      await api.post("/tasks", payload);
      toast.success("Görev oluşturuldu. Görevler ekranından detaylara bakabilirsiniz.");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Görev oluşturulurken bir hata oluştu.";
      toast.error(message);
    } finally {
      setCreatingTask(false);
    }
  };

  const generateContractContent = (templateContent: string, patient: Patient) => {
    return templateContent
      .replace(/{{hasta_adi}}/g, patient.name)
      .replace(/{{pasaport_no}}/g, patient.passportName || patient.passportNumber || "")
      .replace(/{{telefon}}/g, patient.phone)
      .replace(/{{tedavi_adi}}/g, patient.treatment)
      .replace(/{{tedavi_tarihi}}/g, patient.arrivalMonth || format(new Date(), "dd.MM.yyyy"))
      .replace(/{{tarih}}/g, format(new Date(), "dd.MM.yyyy"))
      .replace(/{{toplam_tutar}}/g, patient.agreedAmount ? patient.agreedAmount.toString() : "Belirtilmemiş")
      .replace(/{{para_birimi}}/g, patient.agreedCurrency || "EUR");
  };

  const handleViewContract = (templateId: string) => {
    if (!selectedPatient) return;
    const template = contractTemplates.find(t => t.id === templateId);
    if (!template) return;

    const content = generateContractContent(template.content, selectedPatient);
    
    // Create a new window for viewing
    const newWindow = window.open("", "_blank", "width=800,height=600");
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${template.title}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; line-height: 1.6; }
              h1 { border-bottom: 1px solid #ccc; padding-bottom: 10px; }
              pre { white-space: pre-wrap; font-family: inherit; }
            </style>
          </head>
          <body>
            <h1>${template.title}</h1>
            <pre>${content}</pre>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const handleDownloadPDF = (templateId: string) => {
     if (!selectedPatient) return;
    const template = contractTemplates.find(t => t.id === templateId);
    if (!template) return;

    const content = generateContractContent(template.content, selectedPatient);
    
    // Create a new window for printing
    const newWindow = window.open("", "_blank", "width=800,height=600");
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${template.title}</title>
            <style>
              body { font-family: serif; padding: 40px; line-height: 1.6; color: #000; }
              h1 { text-align: center; margin-bottom: 30px; }
              pre { white-space: pre-wrap; font-family: inherit; }
              @media print {
                body { padding: 0; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>${template.title}</h1>
            <pre>${content}</pre>
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Hasta Yönetimi</h1>
            <Badge
              variant="outline"
              className="border-emerald-300 bg-emerald-50 text-[11px] font-semibold text-emerald-800"
            >
              Sağlık Turizmi CRM
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
            Lead aşamasından operasyon sonrası takibe kadar tüm sağlık turizmi
            hastalarınızı tek ekrandan yönetin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "list" | "pipeline")}
          >
            <TabsList>
              <TabsTrigger value="list">Liste Görünümü</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            className="bg-[#00e676] text-black hover:bg-[#00c853]"
            size="default"
            onClick={handleCreatePatient}
          >
            <Plus className="mr-2 h-4 w-4" /> Yeni Hasta Ekle
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Users className="h-4 w-4 text-emerald-500" />
              Aktif Hasta
            </CardDescription>
            <CardTitle className="text-2xl">
              {activePatients.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Pipeline&apos;da açık olan tüm lead ve hastalar.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Globe2 className="h-4 w-4 text-sky-500" />
              Aylık Potansiyel Gelir
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(pipelineValue, "EUR")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Ağırlıklı olasılık ile hesaplanan tahmini gelir.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Calendar className="h-4 w-4 text-indigo-500" />
              Operasyon Geçiren
            </CardDescription>
            <CardTitle className="text-2xl">
              {postOpCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Operasyon sonrası takip aşamasındaki hasta sayısı.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              Dönüşüm Oranı
            </CardDescription>
            <CardTitle className="text-2xl">
              %{conversionRate}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Toplam lead içinden rezervasyon veya operasyon aşamasına geçenler.
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={view}
        onValueChange={(v) => setView(v as "list" | "pipeline")}
      >
        <TabsContent value="list" className="mt-0">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-base">
                    Hasta Listesi ve Filtreler
                  </CardTitle>
                  <CardDescription>
                    Kaynak, ülke, aşama ve koordinatöre göre segmentleyin.
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <div className="relative w-full md:w-64">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="İsim, ülke veya tedavi ara..."
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="mt-1 md:mt-0"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Tedavi Türü
                  </span>
                  <Select
                    value={treatmentFilter}
                    onValueChange={setTreatmentFilter}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="DIS">Diş</SelectItem>
                      <SelectItem value="SAC_EKIMI">Saç Ekimi</SelectItem>
                      <SelectItem value="ESTETIK">Estetik / Bariatrik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Ülke
                  </span>
                  <Select
                    value={countryFilter}
                    onValueChange={setCountryFilter}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {countries.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Satış Temsilcisi
                  </span>
                  <Select
                    value={ownerFilter}
                    onValueChange={setOwnerFilter}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {salesOwners.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Durum
                  </span>
                  <Select
                    value={stageFilter}
                    onValueChange={setStageFilter}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="ADAY">Aday</SelectItem>
                      <SelectItem value="ONAYLANDI">Onaylandı</SelectItem>
                      <SelectItem value="OPERASYON_BEKLIYOR">
                        Operasyon Bekliyor
                      </SelectItem>
                      <SelectItem value="TABURCU">Taburcu</SelectItem>
                      <SelectItem value="KAYBEDILDI">Kaybedildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {filteredPatients.length} hasta listeleniyor
                  {filteredPatients.length !== patientsState.length &&
                    ` (${patientsState.length} toplam içinde filtrelenmiş)`}
                  .
                </span>
              </div>
              <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.2fr)] gap-4 border-b pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
                <div>Hasta</div>
                <div>Ülke / Şehir</div>
                <div>Tedavi</div>
                <div>Potansiyel</div>
                <div>Olasılık</div>
                <div className="text-right">Aşama</div>
              </div>
              <div className="divide-y">
                {filteredPatients.map((p) => {
                  const stage = stageConfig[p.stage];
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPatient(p);
                        setIsEditing(false);
                        setEditValues(p);
                      }}
                      className="group w-full cursor-pointer border-0 bg-transparent px-0 py-3 text-left transition-colors hover:bg-muted/60"
                    >
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-center">
                        <div className="space-y-0.5">
                          <span className="text-sm font-semibold text-slate-900">
                            {p.name}
                          </span>
                          <div className="text-[11px] text-slate-500">
                            ID: {p.id}
                          </div>
                        </div>
                        <div className="text-sm text-slate-700">
                          <div className="text-[13px]">
                            {p.country}, {p.city}
                          </div>
                        </div>
                        <div className="text-sm text-slate-700">
                          <div className="font-medium">{p.treatment}</div>
                          <div className="text-[11px] text-slate-500">
                            {p.package}
                          </div>
                        </div>
                        <div className="text-sm text-slate-700">
                          <span className="font-medium">
                            {formatCurrency(p.revenuePotential, p.currency)}
                          </span>
                        </div>
                        <div className="text-sm text-slate-700">
                          <span className="font-medium">
                             %{Math.round(p.pipelineProbability * 100)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 md:justify-end">
                          <div className="flex flex-col items-start gap-1 text-right md:items-end" onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={p.stage}
                              onValueChange={(val) => handleStageChange(p.id, val as PatientStage)}
                            >
                              <SelectTrigger className={`h-7 w-[140px] border-0 text-[11px] font-semibold ${stage.color}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADAY">Aday</SelectItem>
                                <SelectItem value="ONAYLANDI">Onaylandı</SelectItem>
                                <SelectItem value="OPERASYON_BEKLIYOR">Op. Bekliyor</SelectItem>
                                <SelectItem value="TABURCU">Taburcu</SelectItem>
                                <SelectItem value="KAYBEDILDI">Kaybedildi</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredPatients.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Seçilen filtrelere uygun hasta bulunamadı.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-0">
                <div className="grid gap-4 md:grid-cols-5">
                  {pipelineStages.map((stageKey) => {
                    const stage = stageConfig[stageKey];
                    const stagePatients = filteredPatients.filter(
                      (p) => p.stage === stageKey,
                    );
                    return (
                <div
                  key={stageKey}
                  className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/40"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {stage.label}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {stagePatients.length} kayıt
                      </span>
                    </div>
                  </div>
                      <div className="flex-1 space-y-2 overflow-y-auto">
                        {stagePatients.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatient(p);
                              setIsEditing(false);
                              setEditValues(p);
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white p-2 text-left text-[11px] shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-slate-700 dark:bg-slate-900/80"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[12px] font-semibold text-slate-900">
                                {p.name}
                              </span>
                              <Badge
                                variant="outline"
                                className="border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-600"
                              >
                                {p.country}
                              </Badge>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <div className="text-[11px] text-slate-600">
                                {p.treatment}
                              </div>
                              {p.heatStatus && (
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold ${heatConfig[p.heatStatus].color}`}
                                >
                                  {heatConfig[p.heatStatus].label}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                              <span>
                                {formatCurrency(p.revenuePotential, p.currency)}
                              </span>
                              <span>Olasılık %{Math.round(p.pipelineProbability * 100)}</span>
                            </div>
                          </button>
                        ))}
                    {stagePatients.length === 0 && (
                      <div
                        className={`rounded-lg border border-dashed px-2 py-4 text-center text-[11px] text-slate-400 ${stage.subtle}`}
                      >
                        Henüz hasta yok.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!selectedPatient}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPatient(null);
            setIsEditing(false);
            setEditValues(null);
          }
        }}
      >
        {selectedPatient && (
          <DialogContent className="!max-w-[95vw] lg:!max-w-[55vw] w-full h-[95vh] p-0 gap-0 overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950 border-none">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex-none border-b bg-white px-8 py-5 dark:border-slate-800 dark:bg-slate-950">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
                        {selectedPatient.name
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join("")}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {selectedPatient.name}
                        </span>
                        <span className="text-sm font-medium text-slate-500">
                          {selectedPatient.country}, {selectedPatient.city}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {isEditing ? (
                          <Select
                            value={editValues?.stage ?? selectedPatient.stage}
                            onValueChange={(val) =>
                              handleEditChange("stage", val as PatientStage)
                            }
                          >
                            <SelectTrigger className={`h-8 w-[160px] border-0 text-xs font-semibold ${stageConfig[editValues?.stage ?? selectedPatient.stage].color}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADAY">Aday</SelectItem>
                              <SelectItem value="ONAYLANDI">Onaylandı</SelectItem>
                              <SelectItem value="OPERASYON_BEKLIYOR">Op. Bekliyor</SelectItem>
                              <SelectItem value="TABURCU">Taburcu</SelectItem>
                              <SelectItem value="KAYBEDILDI">Kaybedildi</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${stageConfig[selectedPatient.stage].color}`}
                          >
                            {stageConfig[selectedPatient.stage].label}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          {isEditing ? (
                            <>
                              Potansiyel
                              <div className="flex items-center gap-1">
                                <Select
                                  value={editValues?.currency ?? selectedPatient.currency}
                                  onValueChange={(val) =>
                                    handleEditChange("currency", val as string)
                                  }
                                >
                                  <SelectTrigger className="h-8 w-20 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="TRY">TRY</SelectItem>
                                    <SelectItem value="GBP">GBP</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  className="h-8 w-24 text-xs"
                                  value={editValues?.revenuePotential ?? selectedPatient.revenuePotential}
                                  onChange={(e) =>
                                    handleEditChange("revenuePotential", Number(e.target.value))
                                  }
                                />
                              </div>
                              • Olasılık %
                              <Input
                                type="number"
                                className="h-8 w-16 text-xs"
                                value={Math.round((editValues?.pipelineProbability ?? selectedPatient.pipelineProbability) * 100)}
                                onChange={(e) =>
                                  handleEditChange("pipelineProbability", Number(e.target.value) / 100)
                                }
                              />
                            </>
                          ) : (
                            <>
                              <span className="font-medium">Potansiyel:</span>{" "}
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                {formatCurrency(
                                  selectedPatient.revenuePotential,
                                  selectedPatient.currency,
                                )}
                              </span>{" "}
                              <span className="text-slate-300 dark:text-slate-700">•</span>{" "}
                              <span className="font-medium">Olasılık:</span>{" "}
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                %{Math.round(selectedPatient.pipelineProbability * 100)}
                              </span>
                            </>
                          )}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs font-medium"
                          onClick={() => {
                            if (isEditing) {
                              setIsEditing(false);
                              setEditValues(selectedPatient);
                            } else {
                              setIsEditing(true);
                              setEditValues(selectedPatient);
                            }
                          }}
                        >
                          {isEditing ? "Düzenlemeyi İptal Et" : "Düzenle"}
                        </Button>
                      </div>
                    </div>
                  </DialogTitle>
                </DialogHeader>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
                <Tabs defaultValue="identity" className="flex h-full flex-col">
                  <div className="flex-none border-b bg-white px-6 dark:border-slate-800 dark:bg-slate-950">
                    <TabsList className="flex h-12 w-full justify-start gap-6 bg-transparent p-0">
                      <TabsTrigger 
                        value="identity" 
                        className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-2 font-medium text-slate-500 shadow-none transition-none data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none dark:text-slate-400 dark:data-[state=active]:text-emerald-500"
                      >
                        Kimlik Bilgileri
                      </TabsTrigger>
                      <TabsTrigger 
                        value="medical" 
                        className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-2 font-medium text-slate-500 shadow-none transition-none data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none dark:text-slate-400 dark:data-[state=active]:text-emerald-500"
                      >
                        Medikal Detaylar
                      </TabsTrigger>
                      <TabsTrigger 
                        value="media" 
                        className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-2 font-medium text-slate-500 shadow-none transition-none data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none dark:text-slate-400 dark:data-[state=active]:text-emerald-500"
                      >
                        Medya & Görseller
                      </TabsTrigger>
                      <TabsTrigger 
                        value="sales" 
                        className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-2 font-medium text-slate-500 shadow-none transition-none data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none dark:text-slate-400 dark:data-[state=active]:text-emerald-500"
                      >
                        Satış ve Finans
                      </TabsTrigger>
                      <TabsTrigger 
                        value="ops" 
                        className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-2 font-medium text-slate-500 shadow-none transition-none data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none dark:text-slate-400 dark:data-[state=active]:text-emerald-500"
                      >
                        Operasyon ve Lojistik
                      </TabsTrigger>
                      <TabsTrigger 
                        value="legal" 
                        className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-2 font-medium text-slate-500 shadow-none transition-none data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none dark:text-slate-400 dark:data-[state=active]:text-emerald-500"
                      >
                        Sözleşmeler ve KVKK
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8">
                    <TabsContent value="media" className="mt-0 space-y-8 animate-in fade-in-50 slide-in-from-bottom-2">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Hasta Görselleri</h3>
                            <p className="text-sm text-slate-500">Röntgen, Before/After ve diğer medikal görseller.</p>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="file"
                              ref={mediaInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={handleMediaChange}
                            />
                            <Button 
                              onClick={handleOpenMediaPicker} 
                              disabled={uploadingFile}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              {uploadingFile ? "Yükleniyor..." : (
                                <>
                                  <ImageIcon className="mr-2 h-4 w-4" />
                                  Görsel Yükle
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {(!patientMedia[selectedPatient.id] || patientMedia[selectedPatient.id].length === 0) ? (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                              <ImageIcon className="h-12 w-12 text-slate-300 mb-3" />
                              <p className="text-sm font-medium text-slate-900">Henüz görsel yüklenmemiş</p>
                              <p className="text-xs text-slate-500 mt-1">Yeni görsel yüklemek için butona tıklayın.</p>
                            </div>
                          ) : (
                            patientMedia[selectedPatient.id].map((media, idx) => (
                              <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm hover:shadow-md transition-all">
                                <img 
                                  src={media.url} 
                                  alt={media.name} 
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <Button 
                                    variant="secondary" 
                                    size="icon" 
                                    className="h-8 w-8 bg-white/90 hover:bg-white text-slate-900 rounded-full"
                                    onClick={() => handleMediaPreview(media.url)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => {
                                      setPatientMedia(prev => ({
                                        ...prev,
                                        [selectedPatient.id]: prev[selectedPatient.id].filter(m => m.id !== media.id)
                                      }))
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                                  <p className="text-xs text-white font-medium truncate px-1">{media.name}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="identity" className="mt-0 space-y-8 animate-in fade-in-50 slide-in-from-bottom-2">
                      <div className="grid gap-8 lg:grid-cols-2">
                        {/* Sol Kolon: Temel Kimlik */}
                        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800">
                            <Users className="h-5 w-5" />
                            Kişisel Bilgiler
                          </div>
                          
                          <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pasaport Adı / Soyadı</span>
                              {isEditing ? (
                                <Input
                                  className="h-10"
                                  value={editValues?.passportName ?? selectedPatient.passportName ?? ""}
                                  onChange={(e) => handleEditChange("passportName", e.target.value)}
                                />
                              ) : (
                                <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                  {selectedPatient.passportName || "-"}
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pasaport / Kimlik No</span>
                              {isEditing ? (
                                <Input
                                  className="h-10"
                                  value={editValues?.passportNumber ?? selectedPatient.passportNumber ?? ""}
                                  onChange={(e) => handleEditChange("passportNumber", e.target.value)}
                                />
                              ) : (
                                <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                  {selectedPatient.passportNumber || "-"}
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Milliyet</span>
                              {isEditing ? (
                                <Input
                                  className="h-10"
                                  value={editValues?.nationality ?? selectedPatient.nationality ?? ""}
                                  onChange={(e) => handleEditChange("nationality", e.target.value)}
                                />
                              ) : (
                                <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                  {selectedPatient.nationality || "-"}
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ülke</span>
                              {isEditing ? (
                                <Input
                                  className="h-10"
                                  value={editValues?.country ?? selectedPatient.country ?? ""}
                                  onChange={(e) => handleEditChange("country", e.target.value)}
                                />
                              ) : (
                                <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                  {selectedPatient.country || "-"}
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Şehir</span>
                              {isEditing ? (
                                <Input
                                  className="h-10"
                                  value={editValues?.city ?? selectedPatient.city ?? ""}
                                  onChange={(e) => handleEditChange("city", e.target.value)}
                                />
                              ) : (
                                <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                  {selectedPatient.city || "-"}
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">İletişim Dili</span>
                              {isEditing ? (
                                <Input
                                  className="h-10"
                                  value={editValues?.language ?? selectedPatient.language ?? ""}
                                  onChange={(e) => handleEditChange("language", e.target.value)}
                                />
                              ) : (
                                <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                  {selectedPatient.language || "-"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Sağ Kolon: İletişim */}
                        <div className="space-y-6">
                          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800">
                              <Users className="h-5 w-5" />
                              İletişim ve Kaynak
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2 mt-4">
                              <div className="space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telefon</span>
                                {isEditing ? (
                                  <Input
                                    className="h-10"
                                    value={editValues?.phone ?? selectedPatient.phone ?? ""}
                                    onChange={(e) => handleEditChange("phone", e.target.value)}
                                  />
                                ) : (
                                  <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                    {selectedPatient.phone || "-"}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">WhatsApp</span>
                                {isEditing ? (
                                  <Input
                                    className="h-10"
                                    value={editValues?.whatsapp ?? selectedPatient.whatsapp ?? ""}
                                    onChange={(e) => handleEditChange("whatsapp", e.target.value)}
                                  />
                                ) : (
                                  <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                    {selectedPatient.whatsapp || "-"}
                                  </div>
                                )}
                              </div>

                              <div className="col-span-2 space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">E-posta</span>
                                {isEditing ? (
                                  <Input
                                    className="h-10"
                                    value={editValues?.email ?? selectedPatient.email ?? ""}
                                    onChange={(e) => handleEditChange("email", e.target.value)}
                                  />
                                ) : (
                                  <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                    {selectedPatient.email || "-"}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Referans Kaynağı</span>
                                {isEditing ? (
                                  <Input
                                    className="h-10"
                                    value={editValues?.refSource ?? selectedPatient.refSource ?? ""}
                                    onChange={(e) => handleEditChange("refSource", e.target.value)}
                                  />
                                ) : (
                                  <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                    {selectedPatient.refSource || "-"}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Satış Temsilcisi</span>
                                {isEditing ? (
                                  <Input
                                    className="h-10"
                                    value={editValues?.salesOwner ?? selectedPatient.salesOwner ?? ""}
                                    onChange={(e) => handleEditChange("salesOwner", e.target.value)}
                                  />
                                ) : (
                                  <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                    {selectedPatient.salesOwner || "-"}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Son Temas</span>
                                <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                  {selectedPatient.lastContact}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Hasta Yakını / Acil Durum */}
                          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800">
                              <Users className="h-5 w-5" />
                              Hasta Yakını / Acil Durum
                            </div>
                            
                            <div className="grid gap-6 sm:grid-cols-2 mt-4">
                              <div className="col-span-2 space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ad Soyad</span>
                                {isEditing ? (
                                  <Input
                                    className="h-10"
                                    value={editValues?.emergencyContactName ?? selectedPatient.emergencyContactName ?? ""}
                                    onChange={(e) => handleEditChange("emergencyContactName", e.target.value)}
                                  />
                                ) : (
                                  <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                    {selectedPatient.emergencyContactName || "-"}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Yakınlık Derecesi</span>
                                {isEditing ? (
                                  <Input
                                    className="h-10"
                                    value={editValues?.emergencyContactRelation ?? selectedPatient.emergencyContactRelation ?? ""}
                                    onChange={(e) => handleEditChange("emergencyContactRelation", e.target.value)}
                                  />
                                ) : (
                                  <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                    {selectedPatient.emergencyContactRelation || "-"}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telefon</span>
                                {isEditing ? (
                                  <Input
                                    className="h-10"
                                    value={editValues?.emergencyContactPhone ?? selectedPatient.emergencyContactPhone ?? ""}
                                    onChange={(e) => handleEditChange("emergencyContactPhone", e.target.value)}
                                  />
                                ) : (
                                  <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                    {selectedPatient.emergencyContactPhone || "-"}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                  <TabsContent value="legal" className="space-y-4 text-sm animate-in fade-in-50 slide-in-from-bottom-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-900/60">
                      <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Dijital Sözleşmeler ve KVKK
                      </div>
                      <div className="space-y-3">
                        {patientContracts.filter(pc => pc.patientId === selectedPatient.id).length > 0 ? (
                          patientContracts
                            .filter(pc => pc.patientId === selectedPatient.id)
                            .map((pc) => {
                              const template = contractTemplates.find(t => t.id === pc.templateId);
                              return (
                                <div key={pc.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                        pc.status === "APPROVED" 
                                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" 
                                          : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                                      }`}>
                                        <div className="text-lg">
                                          {pc.status === "APPROVED" ? "✓" : "!"}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                                          {template?.title || "Bilinmeyen Sözleşme"}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                          Versiyon: {template?.version} • Oluşturulma: {format(parseISO(pc.createdAt), "d MMMM yyyy HH:mm", { locale: tr })}
                                        </div>
                                      </div>
                                    </div>
                                    <Badge 
                                      variant={pc.status === "APPROVED" ? "default" : "outline"}
                                      className={
                                        pc.status === "APPROVED" 
                                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300" 
                                          : "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300"
                                      }
                                    >
                                      {pc.status === "APPROVED" ? "Onaylandı" : "Bekliyor"}
                                    </Badge>
                                  </div>
                                  
                                  {pc.status === "APPROVED" && (
                                    <div className="mt-2 rounded-md bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-900">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <span className="font-semibold text-slate-700 dark:text-slate-300">Onay Tarihi:</span>
                                          <div className="mt-0.5">
                                            {pc.approvedAt ? format(parseISO(pc.approvedAt), "d MMMM yyyy HH:mm:ss", { locale: tr }) : "-"}
                                          </div>
                                        </div>
                                        <div>
                                          <span className="font-semibold text-slate-700 dark:text-slate-300">Onaylanan Cihaz:</span>
                                          <div className="mt-0.5">{pc.approvedByDevice || "-"}</div>
                                        </div>
                                        <div>
                                          <span className="font-semibold text-slate-700 dark:text-slate-300">IP Adresi:</span>
                                          <div className="mt-0.5 font-mono text-[10px]">{pc.approvedByIp || "-"}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex justify-end gap-2 pt-2">
                                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleViewContract(pc.templateId)}>
                                      Görüntüle
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleDownloadPDF(pc.templateId)}>
                                      PDF İndir
                                    </Button>
                                    {pc.status === "PENDING" && (
                                      <Button size="sm" className="h-8 bg-emerald-600 text-xs text-white hover:bg-emerald-700">
                                        Manuel Onayla
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                        ) : (
                          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-12 text-center">
                            <div className="mb-3 rounded-full bg-slate-100 p-3 dark:bg-slate-800">
                              <div className="text-xl text-slate-400">📄</div>
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sözleşme Bulunamadı</h3>
                            <p className="mt-1 text-xs text-slate-500">Bu hasta için oluşturulmuş herhangi bir sözleşme veya KVKK formu yok.</p>
                            <Button size="sm" variant="outline" className="mt-4 h-8 text-xs">
                              Yeni Sözleşme Oluştur
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

              <TabsContent value="medical" className="space-y-4 text-sm animate-in fade-in-50 slide-in-from-bottom-2">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-900/60">
                    <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tedavi ve Tıbbi Özet
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-slate-500">Tedavi Türü</span>
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              className="h-9 text-sm"
                              value={editValues?.treatment ?? selectedPatient.treatment ?? ""}
                              onChange={(e) =>
                                handleEditChange("treatment", e.target.value)
                              }
                            />
                            <Input
                              className="h-9 text-sm"
                              value={editValues?.package ?? selectedPatient.package ?? ""}
                              onChange={(e) =>
                                handleEditChange("package", e.target.value)
                              }
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                              {selectedPatient.treatment}
                            </div>
                            <div className="text-sm text-slate-500">
                              {selectedPatient.package}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-slate-500">Planlanan Dönem</span>
                        {isEditing ? (
                          <Input
                            className="h-9 w-full text-sm"
                            value={editValues?.arrivalMonth ?? selectedPatient.arrivalMonth ?? ""}
                            onChange={(e) =>
                              handleEditChange("arrivalMonth", e.target.value)
                            }
                          />
                        ) : (
                          <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                            {selectedPatient.arrivalMonth}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-900/60">
                    <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tıbbi Geçmiş
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-slate-500">Kronik Hastalıklar</span>
                        <div className="text-sm">
                          {isEditing ? (
                            <Input
                              className="h-9 text-sm"
                              value={
                                editValues?.chronicDiseases ??
                                selectedPatient.chronicDiseases ??
                                ""
                              }
                              onChange={(e) =>
                                handleEditChange("chronicDiseases", e.target.value)
                              }
                            />
                          ) : (
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {selectedPatient.chronicDiseases || "Belirtilmemiş"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-slate-500">Alerjiler</span>
                        <div className="text-sm">
                          {isEditing ? (
                            <Input
                              className="h-9 text-sm"
                              value={
                                editValues?.allergies ??
                                selectedPatient.allergies ??
                                ""
                              }
                              onChange={(e) =>
                                handleEditChange("allergies", e.target.value)
                              }
                            />
                          ) : (
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {selectedPatient.allergies || "Belirtilmemiş"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-slate-500">Doktor Notları</span>
                        <div className="whitespace-pre-wrap text-sm">
                          {isEditing ? (
                            <textarea
                              className="w-full rounded-md border border-slate-200 bg-white p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                              rows={3}
                              value={
                                editValues?.doctorNotes ??
                                selectedPatient.doctorNotes ??
                                ""
                              }
                              onChange={(e) =>
                                handleEditChange("doctorNotes", e.target.value)
                              }
                            />
                          ) : (
                            <span className="text-slate-700 dark:text-slate-300">
                              {selectedPatient.doctorNotes || "Henüz doktor notu girilmemiş."}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Tıbbi Dosya Kasası
                  </div>
                  {patientFiles[selectedPatient.id]?.length ? (
                    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {patientFiles[selectedPatient.id]!.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => handleOpenFilePreview(f.id)}
                          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                        >
                          <span className="truncate">{f.name}</span>
                          <span className="text-xs text-slate-400">Önizle</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="space-y-1 text-sm text-slate-500">
                    <div>- Röntgenler (Örn: panoramik film, CBCT)</div>
                    <div>- Öncesi / sonrası fotoğraflar</div>
                    <div>- Laboratuvar sonuçları</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sales" className="space-y-4 text-sm animate-in fade-in-50 slide-in-from-bottom-2">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-900/60">
                    <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Teklif ve Paket
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-slate-500">Teklif Edilen Paket</span>
                        <div className="text-sm">
                          {isEditing ? (
                            <Input
                              className="h-9 text-sm"
                              value={
                                editValues?.offerPackage ??
                                selectedPatient.offerPackage ??
                                ""
                              }
                              onChange={(e) =>
                                handleEditChange("offerPackage", e.target.value)
                              }
                            />
                          ) : (
                            <span className="text-base font-medium text-slate-900 dark:text-slate-100">
                              {selectedPatient.offerPackage || "-"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-slate-500">Anlaşılan Tutar</span>
                        <div className="text-sm">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Select
                                value={
                                  editValues?.agreedCurrency ||
                                  selectedPatient.agreedCurrency
                                }
                                onValueChange={(val) =>
                                  handleEditChange(
                                    "agreedCurrency",
                                    val as Patient["agreedCurrency"],
                                  )
                                }
                              >
                                <SelectTrigger className="h-9 w-24 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="EUR">EUR</SelectItem>
                                  <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                className="h-9 w-32 text-sm"
                                value={String(
                                  editValues?.agreedAmount ??
                                    selectedPatient.agreedAmount ??
                                    "",
                                )}
                                onChange={(e) =>
                                  handleEditChange(
                                    "agreedAmount",
                                    Number(e.target.value) || 0,
                                  )
                                }
                              />
                            </div>
                          ) : selectedPatient.agreedAmount > 0 ? (
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(
                                selectedPatient.agreedAmount,
                                selectedPatient.agreedCurrency,
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-500">Henüz netleşmedi</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-slate-500">Depozito Durumu</span>
                        <div className="font-medium">
                          {isEditing ? (
                            <Select
                              value={
                                editValues?.depositStatus ||
                                selectedPatient.depositStatus
                              }
                              onValueChange={(val) =>
                                handleEditChange(
                                  "depositStatus",
                                  val as DepositStatus,
                                )
                              }
                            >
                              <SelectTrigger className="h-9 w-40 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PAID">Ödendi</SelectItem>
                                <SelectItem value="PENDING">Bekleniyor</SelectItem>
                                <SelectItem value="NONE">Yok</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant={
                                selectedPatient.depositStatus === "PAID"
                                  ? "default"
                                  : selectedPatient.depositStatus === "PENDING"
                                  ? "secondary"
                                  : "outline"
                              }
                              className={
                                selectedPatient.depositStatus === "PAID"
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  : selectedPatient.depositStatus === "PENDING"
                                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                  : "bg-slate-100 text-slate-600"
                              }
                            >
                              {selectedPatient.depositStatus === "PAID"
                                ? "Ödendi"
                                : selectedPatient.depositStatus === "PENDING"
                                ? "Bekleniyor"
                                : "Yok"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-900/60">
                    <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Sözleşmeler ve Onaylar
                    </div>
                    <div className="space-y-3">
                      {selectedPatient.contracts.length > 0 ? (
                        selectedPatient.contracts.map((c) => (
                          <div key={c} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                            <span className="font-medium text-slate-700">{c}</span>
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                              Onaylandı
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-slate-500 italic">
                          Henüz dijital olarak onaylanmış sözleşme yok.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ops" className="space-y-4 text-sm animate-in fade-in-50 slide-in-from-bottom-2">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-900/60">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Uçuş Bilgileri
                      </div>
                      <Link href={`/dashboard/health-tourism/travel?patientId=${selectedPatient.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-2">
                          <Plane className="h-3 w-3" />
                          Uçuş & Transfer Planla
                        </Button>
                      </Link>
                    </div>
                    <div className="space-y-4">
                      {selectedPatient.flightArrivalTime || selectedPatient.flightCode || isEditing ? (
                        <>
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-slate-500">Varış Saati</span>
                            {isEditing ? (
                              <Input
                                className="h-9 w-full text-sm"
                                value={
                                  editValues?.flightArrivalTime ??
                                  selectedPatient.flightArrivalTime ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleEditChange(
                                    "flightArrivalTime",
                                    e.target.value,
                                  )
                                }
                              />
                            ) : (
                              <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                {selectedPatient.flightArrivalTime || "-"}
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-slate-500">Uçuş Kodu</span>
                            {isEditing ? (
                              <Input
                                className="h-9 w-full text-sm"
                                value={
                                  editValues?.flightCode ??
                                  selectedPatient.flightCode ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleEditChange("flightCode", e.target.value)
                                }
                              />
                            ) : (
                              <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                {selectedPatient.flightCode || "-"}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-500 italic">
                          Uçuş bilgisi henüz girilmemiş.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-900/60">
                    <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Konaklama
                    </div>
                    <div className="space-y-4">
                      {selectedPatient.hotel || isEditing ? (
                        <>
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-slate-500">Otel</span>
                            {isEditing ? (
                              <Input
                                className="h-9 w-full text-sm"
                                value={
                                  editValues?.hotel ?? selectedPatient.hotel ?? ""
                                }
                                onChange={(e) =>
                                  handleEditChange("hotel", e.target.value)
                                }
                              />
                            ) : (
                              <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                {selectedPatient.hotel || "-"}
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-slate-500">Oda Numarası</span>
                            {isEditing ? (
                              <Input
                                className="h-9 w-full text-sm"
                                value={
                                  editValues?.hotelRoomNumber ??
                                  selectedPatient.hotelRoomNumber ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleEditChange(
                                    "hotelRoomNumber",
                                    e.target.value,
                                  )
                                }
                              />
                            ) : (
                              <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                {selectedPatient.hotelRoomNumber || "-"}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-500 italic">
                          Konaklama bilgisi henüz girilmemiş.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-900/60">
                    <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Transfer
                    </div>
                    <div className="space-y-4">
                      {selectedPatient.transferDriverName ||
                      selectedPatient.transferDriverPhone ||
                      isEditing ? (
                        <>
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-slate-500">Şoför</span>
                            {isEditing ? (
                              <Input
                                className="h-9 w-full text-sm"
                                value={
                                  editValues?.transferDriverName ??
                                  selectedPatient.transferDriverName ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleEditChange(
                                    "transferDriverName",
                                    e.target.value,
                                  )
                                }
                              />
                            ) : (
                              <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                {selectedPatient.transferDriverName || "-"}
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-slate-500">Şoför İletişim</span>
                            {isEditing ? (
                              <Input
                                className="h-9 w-full text-sm"
                                value={
                                  editValues?.transferDriverPhone ??
                                  selectedPatient.transferDriverPhone ??
                                  ""
                                }
                                onChange={(e) =>
                                  handleEditChange(
                                    "transferDriverPhone",
                                    e.target.value,
                                  )
                                }
                              />
                            ) : (
                              <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                                {selectedPatient.transferDriverPhone || "-"}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-500 italic">
                          Transfer planı henüz oluşturulmamış.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-900/60">
                    <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Notlar ve Segmentler
                    </div>
                    <div className="space-y-4">
                      <div className="whitespace-pre-wrap text-sm">
                        {isEditing ? (
                          <textarea
                            className="w-full rounded-md border border-slate-200 bg-white p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                            rows={3}
                            value={editValues?.notes ?? selectedPatient.notes ?? ""}
                            onChange={(e) => handleEditChange("notes", e.target.value)}
                          />
                        ) : (
                          <span className="text-slate-700 dark:text-slate-300">
                            {selectedPatient.notes || "Henüz not eklenmemiş."}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedPatient.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-sm"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            <DialogFooter className="mt-auto border-t bg-slate-50/80 px-8 py-6 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex w-full flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="h-10 border-slate-200 px-6"
                    onClick={() => {
                      setSelectedPatient(null);
                      setIsEditing(false);
                      setEditValues(null);
                    }}
                  >
                    Kapat
                  </Button>
                  {isEditing && (
                    <Button
                      className="h-10 bg-emerald-600 px-6 text-white hover:bg-emerald-700 shadow-sm"
                      onClick={handleSavePatient}
                      disabled={!editValues}
                    >
                      Değişiklikleri Kaydet
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={whatsappTemplate}
                    onValueChange={(val) =>
                      setWhatsappTemplate(
                        val as "WELCOME" | "REMINDER" | "FLIGHT_INFO",
                      )
                    }
                  >
                    <SelectTrigger className="h-10 w-64 border-slate-200 bg-white shadow-sm">
                      <SelectValue placeholder="Mesaj şablonu seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WELCOME">
                        Hoş geldiniz mesajı
                      </SelectItem>
                      <SelectItem value="REMINDER">
                        Randevu hatırlatma
                      </SelectItem>
                      <SelectItem value="FLIGHT_INFO">
                        Uçuş bilgisi talebi
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    className="h-10 bg-emerald-600 px-4 text-white hover:bg-emerald-700 shadow-sm"
                    onClick={handleSendWhatsapp}
                    disabled={sendingWhatsapp}
                  >
                    {sendingWhatsapp ? "Gönderiliyor..." : "WhatsApp Gönder"}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                    onClick={handleOpenFilePicker}
                    disabled={uploadingFile}
                  >
                    {uploadingFile ? "Yükleniyor..." : "Dosya Yükle"}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                    onClick={handleCreateTask}
                    disabled={creatingTask}
                  >
                    {creatingTask ? "Oluşturuluyor..." : "Görev Ata"}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </div>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-black/95 border-none">
          <DialogHeader className="hidden">
            <DialogTitle>Görsel Önizleme</DialogTitle>
            <DialogDescription>Görsel detay önizlemesi</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col h-full">
            <div className="p-4 flex justify-between items-center text-white/80">
              <h3 className="font-medium">Görsel Önizleme</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-white/10 hover:text-white"
                onClick={() => setIsPreviewOpen(false)}
              >
                <span className="sr-only">Kapat</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-[75vh] object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
