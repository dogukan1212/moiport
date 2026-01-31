"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Calendar,
  ClipboardList,
  Image as ImageIcon,
  FileText,
  LayoutGrid,
  Mail,
  Phone,
  Plus,
  User,
  Users,
  Wallet,
  Folder,
  ArrowRight,
  X,
  Eye,
} from "lucide-react";

interface DentalPatient {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  medicalHistory?: string | null;
  createdAt?: string;
}

const genderOptions = [
  { value: "MALE", label: "Erkek" },
  { value: "FEMALE", label: "Kadın" },
  { value: "OTHER", label: "Diğer" },
];

function calculateAge(birthDate?: string | null) {
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

export default function DentalPatientsPage() {
  const [patients, setPatients] = useState<DentalPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [contactFilter, setContactFilter] = useState<string>("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<DentalPatient | null>(
    null,
  );
  const [editingPatient, setEditingPatient] = useState<DentalPatient | null>(
    null,
  );
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [patientMedia, setPatientMedia] = useState<
    Record<string, { id: string; name: string; url: string }[]>
  >({});
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    fullName: "",
    phone: "",
    email: "",
    birthDate: "",
    gender: "",
    medicalHistory: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/dental/patients");
        const list: DentalPatient[] = res.data || [];
        setPatients(list);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            "Hasta listesi yüklenirken bir hata oluştu.",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedPatient) return;

    const fetchPatientMedia = async () => {
      try {
        const rootResponse = await api.get("/storage/content");
        const folders = rootResponse.data.folders || [];
        const folderName = `Patient-${selectedPatient.id}`;
        const folder = folders.find((f: any) => f.name === folderName);

        if (folder) {
          const contentResponse = await api.get(
            `/storage/content?folderId=${folder.id}`,
          );
          const files = contentResponse.data.files || [];

          const mediaFilesPromises = files.map(async (file: any) => {
            try {
              const response = await api.get(
                `/storage/file/${file.id}/preview`,
                { responseType: "blob" },
              );
              const blobUrl = URL.createObjectURL(response.data);

              return {
                id: file.id,
                name: file.name,
                url: blobUrl,
              };
            } catch {
              return null;
            }
          });

          const resolvedFiles = (await Promise.all(mediaFilesPromises)).filter(
            Boolean,
          ) as { id: string; name: string; url: string }[];

          setPatientMedia((prev) => ({
            ...prev,
            [selectedPatient.id]: resolvedFiles,
          }));
        } else {
          setPatientMedia((prev) => ({
            ...prev,
            [selectedPatient.id]: [],
          }));
        }
      } catch {
      }
    };

    fetchPatientMedia();
  }, [selectedPatient]);

  const filteredPatients = useMemo(() => {
    let result = patients;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        [
          p.fullName,
          p.phone || "",
          p.email || "",
          p.medicalHistory || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }

    if (genderFilter !== "all") {
      result = result.filter((p) => (p.gender || "") === genderFilter);
    }

    if (contactFilter === "missing") {
      result = result.filter((p) => !p.phone && !p.email);
    } else if (contactFilter === "has") {
      result = result.filter((p) => p.phone || p.email);
    }

    return result;
  }, [patients, search, genderFilter, contactFilter]);

  const totalPatients = patients.length;
  const withPhone = patients.filter((p) => p.phone && p.phone.trim()).length;
  const withEmail = patients.filter((p) => p.email && p.email.trim()).length;
  const missingContact = patients.filter(
    (p) => !p.phone && !p.email,
  ).length;

  const openCreateDialog = () => {
    setEditingPatient(null);
    setFormValues({
      fullName: "",
      phone: "",
      email: "",
      birthDate: "",
      gender: "",
      medicalHistory: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (patient: DentalPatient) => {
    setEditingPatient(patient);
    setFormValues({
      fullName: patient.fullName || "",
      phone: patient.phone || "",
      email: patient.email || "",
      birthDate: patient.birthDate
        ? patient.birthDate.substring(0, 10)
        : "",
      gender: patient.gender || "",
      medicalHistory: patient.medicalHistory || "",
    });
    setIsDialogOpen(true);
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formValues.fullName.trim()) {
      toast.error("Ad soyad zorunludur.");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        fullName: formValues.fullName.trim(),
        phone: formValues.phone.trim() || null,
        email: formValues.email.trim() || null,
        gender: formValues.gender || null,
        medicalHistory: formValues.medicalHistory.trim() || null,
      };

      if (formValues.birthDate) {
        payload.birthDate = new Date(formValues.birthDate).toISOString();
      } else {
        payload.birthDate = null;
      }

      if (editingPatient) {
        const res = await api.patch(
          `/dental/patients/${editingPatient.id}`,
          payload,
        );
        setPatients((prev) =>
          prev.map((p) => (p.id === editingPatient.id ? res.data : p)),
        );
        setSelectedPatient(res.data);
        toast.success("Hasta bilgileri güncellendi.");
      } else {
        const res = await api.post("/dental/patients", payload);
        setPatients((prev) => [res.data, ...prev]);
        setSelectedPatient(res.data);
        toast.success("Yeni hasta oluşturuldu.");
      }

      setIsDialogOpen(false);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Kayıt sırasında bir hata oluştu.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (patient: DentalPatient) => {
    const ok = window.confirm(
      `"${patient.fullName}" kaydını silmek istediğinize emin misiniz?`,
    );
    if (!ok) return;
    try {
      await api.delete(`/dental/patients/${patient.id}`);
      setPatients((prev) => prev.filter((p) => p.id !== patient.id));
      if (selectedPatient?.id === patient.id) {
        setSelectedPatient(null);
      }
      toast.success("Hasta kaydı silindi.");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Hasta silinirken bir hata oluştu.",
      );
    }
  };

  const handleOpenMediaPicker = () => {
    if (!selectedPatient) {
      toast.error("Önce bir hasta seçin.");
      return;
    }
    if (mediaInputRef.current) {
      mediaInputRef.current.click();
    }
  };

  const handleMediaChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedPatient) return;
    setUploadingMedia(true);

    try {
      const folderName = `Patient-${selectedPatient.id}`;
      let folderId: string;

      const rootResponse = await api.get("/storage/content");
      const folders = rootResponse.data.folders || [];
      const existingFolder = folders.find((f: any) => f.name === folderName);

      if (existingFolder) {
        folderId = existingFolder.id;
      } else {
        const createResponse = await api.post("/storage/folder", {
          name: folderName,
          parentId: null,
        });
        folderId = createResponse.data.id;
      }

      const mediaFiles = Array.from(files);
      const uploadedMedia: { id: string; name: string; url: string }[] = [];

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
          const fileUrl = URL.createObjectURL(file);

          if (uploaded.id || fileUrl) {
            uploadedMedia.push({
              id: uploaded.id || Math.random().toString(),
              name: uploaded.name || file.name,
              url: fileUrl,
            });
          }
        } catch {
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
        toast.error("Görseller yüklenirken bir hata oluştu.");
      }
    } catch {
      toast.error("Görseller yüklenirken bir hata oluştu.");
    } finally {
      setUploadingMedia(false);
      e.target.value = "";
    }
  };

  const handleMediaPreview = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Hasta Yönetimi
            </h1>
            <Badge
              variant="outline"
              className="border-emerald-300 bg-emerald-50 text-[11px] font-semibold text-emerald-800"
            >
              Diş Kliniği
            </Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Klinik hastalarınızı, iletişim bilgilerini ve tıbbi özetlerini tek
            ekrandan yönetin. Diş şeması, görüntüleme ve laboratuvar
            modülleriyle entegre çalışır.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-64">
            <Input
              placeholder="Hasta ara (ad, telefon, e-posta, not)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-3"
            />
          </div>
          <Button
            onClick={openCreateDialog}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Hasta
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Users className="h-4 w-4 text-emerald-500" />
              Toplam Hasta
            </CardDescription>
            <CardTitle className="text-2xl">{totalPatients}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Kliniğinizde kayıtlı tüm hastalar.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Phone className="h-4 w-4 text-sky-500" />
              Telefonu Olan
            </CardDescription>
            <CardTitle className="text-2xl">{withPhone}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Direkt aranabilecek hasta sayısı.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Mail className="h-4 w-4 text-indigo-500" />
              E-postası Olan
            </CardDescription>
            <CardTitle className="text-2xl">{withEmail}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Dijital bilgilendirme yapılabilecek hastalar.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <AlertCircleIcon className="h-4 w-4 text-amber-500" />
              Eksik İletişim
            </CardDescription>
            <CardTitle className="text-2xl">{missingContact}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Telefon ve e-posta bilgisi olmayan hastalar.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-base">
                  Hasta Listesi ve Filtreler
                </CardTitle>
                <CardDescription>
                  Kayıtları cinsiyet ve iletişim durumuna göre filtreleyin.
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${
                      genderFilter === "all"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setGenderFilter("all")}
                  >
                    Tümü
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${
                      genderFilter === "FEMALE"
                        ? "border-rose-500 bg-rose-50 text-rose-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setGenderFilter("FEMALE")}
                  >
                    Kadın
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${
                      genderFilter === "MALE"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setGenderFilter("MALE")}
                  >
                    Erkek
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${
                      contactFilter === "all"
                        ? "border-slate-200 text-slate-600 bg-slate-50"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setContactFilter("all")}
                  >
                    Tüm İletişimler
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${
                      contactFilter === "has"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setContactFilter("has")}
                  >
                    İletişimi Olan
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${
                      contactFilter === "missing"
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setContactFilter("missing")}
                  >
                    Eksik İletişim
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {loading
                ? "Hasta listesi yükleniyor..."
                : `${filteredPatients.length} hasta listeleniyor${
                    filteredPatients.length !== patients.length
                      ? ` (${patients.length} toplam içinde filtrelenmiş)`
                      : ""
                  }.`}
              {error && (
                <span className="ml-3 font-medium text-red-600">{error}</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredPatients.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-sm text-slate-500">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                  <User className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-700">
                    Henüz eşleşen hasta kaydı yok
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Arama kriterlerini temizleyebilir veya yeni bir hasta
                    oluşturabilirsiniz.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
                <div className="hidden grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4 border-b bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
                  <div>Hasta</div>
                  <div>İletişim</div>
                  <div>Tıbbi Özet</div>
                  <div className="text-right">İşlemler</div>
                </div>
                <div className="divide-y divide-slate-100">
                  {filteredPatients.map((patient) => {
                    const isSelected = selectedPatient?.id === patient.id;
                    const age = calculateAge(patient.birthDate);
                    const genderLabel =
                      patient.gender === "MALE"
                        ? "Erkek"
                        : patient.gender === "FEMALE"
                        ? "Kadın"
                        : patient.gender === "OTHER"
                        ? "Diğer"
                        : null;

                    return (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setIsSummaryOpen(true);
                        }}
                        className={`flex w-full flex-col gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 md:grid md:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,0.8fr)] md:items-center ${
                          isSelected ? "bg-emerald-50/60" : "bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                            {patient.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">
                                {patient.fullName}
                              </span>
                              {genderLabel && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                  {genderLabel}
                                  {age !== null ? ` • ${age} yaş` : ""}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500">
                              {patient.createdAt && (
                                <>
                                  Kayıt tarihi:{" "}
                                  {new Date(
                                    patient.createdAt,
                                  ).toLocaleDateString("tr-TR")}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs text-slate-600">
                          {patient.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <a
                                href={`tel:${patient.phone}`}
                                className="hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {patient.phone}
                              </a>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600">
                              <Phone className="h-3 w-3" />
                              <span>Telefon bilgisi eklenmemiş</span>
                            </div>
                          )}
                          {patient.email ? (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <a
                                href={`mailto:${patient.email}`}
                                className="hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {patient.email}
                              </a>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400">
                              <Mail className="h-3 w-3" />
                              <span>E-posta eklenmemiş</span>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-slate-600">
                          {patient.medicalHistory ? (
                            <span>
                              {patient.medicalHistory.length > 80
                                ? `${patient.medicalHistory.substring(
                                    0,
                                    80,
                                  )}...`
                                : patient.medicalHistory}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              Tıbbi geçmiş notu girilmemiş
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(patient);
                            }}
                          >
                            <User className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(patient);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <Dialog
        open={isSummaryOpen && !!selectedPatient}
        onOpenChange={(open) => {
          if (!open) {
            setIsSummaryOpen(false);
          }
        }}
      >
        <DialogContent className="!max-w-[95vw] lg:!max-w-[90vw] w-full max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Hasta Özeti</DialogTitle>
            <CardDescription>
              Temel bilgiler, tıbbi özet ve hızlı diş modülü kısayolları.
            </CardDescription>
          </DialogHeader>
          {selectedPatient && (
            <Tabs defaultValue="summary" className="mt-4">
              <TabsList className="mb-3 grid w-full h-auto grid-cols-2 lg:grid-cols-5 gap-2">
                <TabsTrigger value="summary">Özet</TabsTrigger>
                <TabsTrigger value="media">Görseller</TabsTrigger>
                <TabsTrigger value="imaging">Görüntüleme</TabsTrigger>
                <TabsTrigger value="lab">Laboratuvar</TabsTrigger>
                <TabsTrigger value="finance">Finansman</TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="mt-0">
                <ScrollArea className="h-[60vh] pr-1">
                  <div className="space-y-4 pt-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-base font-semibold text-emerald-800">
                          {selectedPatient.fullName
                            .split(" ")
                            .map((p) => p.charAt(0).toUpperCase())
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-slate-900">
                              {selectedPatient.fullName}
                            </h2>
                            {selectedPatient.gender && (
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {selectedPatient.gender === "MALE"
                                  ? "Erkek"
                                  : selectedPatient.gender === "FEMALE"
                                  ? "Kadın"
                                  : "Diğer"}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {selectedPatient.birthDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(
                                  selectedPatient.birthDate,
                                ).toLocaleDateString("tr-TR")}
                              </span>
                            )}
                            {calculateAge(selectedPatient.birthDate) !==
                              null && (
                              <span>
                                {calculateAge(selectedPatient.birthDate)} yaş
                              </span>
                            )}
                            {selectedPatient.createdAt && (
                              <span className="flex items-center gap-1">
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                Kayıt:{" "}
                                {new Date(
                                  selectedPatient.createdAt,
                                ).toLocaleDateString("tr-TR")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/dental/charting?patientId=${selectedPatient.id}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <LayoutGrid className="h-3.5 w-3.5 text-emerald-600" />
                            Diş Şeması
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(selectedPatient)}
                        >
                          Bilgileri Düzenle
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-3 text-xs text-slate-600">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span className="font-medium text-slate-700">
                            Telefon
                          </span>
                        </div>
                        <div>
                          {selectedPatient.phone ? (
                            <a
                              href={`tel:${selectedPatient.phone}`}
                              className="hover:underline"
                            >
                              {selectedPatient.phone}
                            </a>
                          ) : (
                            <span className="text-amber-600">
                              Eksik, eklenmesi önerilir
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span className="font-medium text-slate-700">
                            E-posta
                          </span>
                        </div>
                        <div>
                          {selectedPatient.email ? (
                            <a
                              href={`mailto:${selectedPatient.email}`}
                              className="hover:underline"
                            >
                              {selectedPatient.email}
                            </a>
                          ) : (
                            <span className="text-slate-400">
                              Henüz eklenmemiş
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <FileText className="h-3 w-3 text-slate-400" />
                        <span className="font-semibold">
                          Tıbbi Geçmiş / Notlar
                        </span>
                      </div>
                      <div className="rounded-md bg-slate-50 p-3 text-slate-700">
                        {selectedPatient.medicalHistory
                          ? selectedPatient.medicalHistory
                          : "Bu hasta için henüz tıbbi geçmiş veya not girilmemiş."}
                      </div>
                    </div>

                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="media" className="mt-0">
                <ScrollArea className="h-[60vh] pr-1">
                  <div className="space-y-3 pt-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-700">
                        <ImageIcon className="h-3 w-3 text-sky-500" />
                        <span className="font-semibold">
                          Before / After ve Diğer Görseller
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={mediaInputRef}
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={handleMediaChange}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={handleOpenMediaPicker}
                          disabled={uploadingMedia}
                        >
                          {uploadingMedia ? (
                            "Yükleniyor..."
                          ) : (
                            <>
                              <ImageIcon className="mr-1 h-3 w-3" />
                              Görsel Yükle
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {(!patientMedia[selectedPatient.id] ||
                        patientMedia[selectedPatient.id].length === 0) && (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 py-8">
                          <ImageIcon className="mb-2 h-6 w-6 text-slate-300" />
                          <p className="text-[11px] font-medium text-slate-600">
                            Henüz görsel eklenmemiş
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            Before/After veya röntgen görsellerini buraya
                            yükleyebilirsiniz.
                          </p>
                        </div>
                      )}
                      {patientMedia[selectedPatient.id] &&
                        patientMedia[selectedPatient.id].map((media) => (
                          <button
                            key={media.id}
                            type="button"
                            onClick={() => handleMediaPreview(media.url)}
                            className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                          >
                            <img
                              src={media.url}
                              alt={media.name}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                className="h-7 w-7 rounded-full bg-white/90 text-slate-900 hover:bg-white"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1 pt-2">
                              <p className="truncate text-[10px] font-medium text-white">
                                {media.name}
                              </p>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="imaging" className="mt-0">
                <ScrollArea className="max-h-[60vh] pr-1">
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <FileText className="mb-3 h-10 w-10 text-slate-200" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      Görüntüleme Kayıtları
                    </h3>
                    <p className="mt-1 mb-4 max-w-[250px] text-xs text-slate-500">
                      Bu hastaya ait röntgen ve görüntüleme arşivine buradan
                      ulaşabilirsiniz.
                    </p>
                    <Link href="/dashboard/dental/imaging">
                      <Button variant="outline" size="sm">
                        Görüntüleme Modülüne Git{" "}
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="lab" className="mt-0">
                <ScrollArea className="max-h-[60vh] pr-1">
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <ClipboardList className="mb-3 h-10 w-10 text-slate-200" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      Laboratuvar İş Emirleri
                    </h3>
                    <p className="mt-1 mb-4 max-w-[250px] text-xs text-slate-500">
                      Protez ve laboratuvar süreçlerini buradan takip
                      edebilirsiniz.
                    </p>
                    <Link href="/dashboard/dental/lab-tracking">
                      <Button variant="outline" size="sm">
                        Laboratuvar Modülüne Git{" "}
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="finance" className="mt-0">
                <ScrollArea className="h-[60vh] pr-1">
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Wallet className="mb-3 h-10 w-10 text-slate-200" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      Finansal Hareketler
                    </h3>
                    <p className="mt-1 mb-4 max-w-[250px] text-xs text-slate-500">
                      Ödemeler, borçlar ve taksit planlarını buradan
                      yönetebilirsiniz.
                    </p>
                    <Link href="/dashboard/dental/finance">
                      <Button variant="outline" size="sm">
                        Finansman Modülüne Git{" "}
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden border-none bg-black/95 p-0">
          {previewUrl && (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-4 py-3 text-white/80">
                <span className="text-sm font-medium">Görsel Önizleme</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-white/10 hover:text-white"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-1 items-center justify-center bg-black">
                <img
                  src={previewUrl}
                  alt="Hasta görseli"
                  className="max-h-[70vh] w-auto object-contain"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPatient ? "Hasta Bilgilerini Düzenle" : "Yeni Hasta Oluştur"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Ad Soyad</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formValues.fullName}
                onChange={handleChange}
                placeholder="Örn: Ayşe Yılmaz"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formValues.phone}
                  onChange={handleChange}
                  placeholder="+90 5XX XXX XX XX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formValues.email}
                  onChange={handleChange}
                  placeholder="ornek@klinik.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Doğum Tarihi</Label>
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={formValues.birthDate}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Cinsiyet</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formValues.gender}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      gender: e.target.value,
                    }))
                  }
                >
                  <option value="">Seçilmedi</option>
                  {genderOptions.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalHistory">Tıbbi Geçmiş / Notlar</Label>
              <Textarea
                id="medicalHistory"
                name="medicalHistory"
                value={formValues.medicalHistory}
                onChange={handleChange}
                rows={3}
                placeholder="Örn: Alerjiler, kronik hastalıklar veya dikkat edilmesi gereken notlar..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AlertCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        className="stroke-current"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M12 7v6"
        className="stroke-current"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.5" r="0.8" className="fill-current" />
    </svg>
  );
}
