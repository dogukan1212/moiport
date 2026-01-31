"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  Send,
  ShieldCheck,
  History,
  FileSignature,
  PenTool,
  Globe,
  ChevronRight,
  ChevronLeft,
  Variable,
  RefreshCw,
  Edit3
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  patients,
  contractTemplates,
  patientContracts,
  type ContractTemplate,
  type PatientContract,
  type Patient,
} from "../data";

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState("library");
  const [templates, setTemplates] = useState<ContractTemplate[]>(contractTemplates);
  const [contracts, setContracts] = useState<PatientContract[]>(patientContracts);
  
  // Template Editor State
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Contract Creation Wizard State
  const [isCreateContractOpen, setIsCreateContractOpen] = useState(false);
  const [creationStep, setCreationStep] = useState<1 | 2>(1);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [customContent, setCustomContent] = useState<string>(""); // For the "Preview & Edit" step

  // Preview & Audit State
  const [previewContent, setPreviewContent] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [auditContract, setAuditContract] = useState<PatientContract | null>(null);

  // Helper to get patient/template
  const getPatient = (id: string) => patients.find((p) => p.id === id);
  const getTemplate = (id: string) => templates.find((t) => t.id === id);

  // --- Logic: Generate Contract Content ---
  const generateContractContent = (template: ContractTemplate, patient: Patient) => {
    let content = template.content;
    const today = format(new Date(), "d MMMM yyyy", { locale: tr });

    const replacements: Record<string, string> = {
      "{{hasta_adi}}": patient.name,
      "{{pasaport_no}}": patient.passportNumber || "Belirtilmemiş",
      "{{telefon}}": patient.phone,
      "{{tarih}}": today,
      "{{tedavi_adi}}": patient.treatment,
      "{{tedavi_tarihi}}": patient.flightArrivalTime ? patient.flightArrivalTime.split("•")[0].trim() : "Planlanıyor",
      "{{toplam_tutar}}": patient.agreedAmount.toString(),
      "{{para_birimi}}": patient.agreedCurrency,
    };

    Object.entries(replacements).forEach(([key, value]) => {
      content = content.replaceAll(key, value);
    });

    return content;
  };

  // --- Handlers: Contract Creation Wizard ---
  const handleWizardNext = () => {
    if (!selectedPatientId || !selectedTemplateId) {
        toast.error("Lütfen bir hasta ve şablon seçin.");
        return;
    }
    const patient = getPatient(selectedPatientId);
    const template = getTemplate(selectedTemplateId);

    if (patient && template) {
        const generated = generateContractContent(template, patient);
        setCustomContent(generated);
        setCreationStep(2);
    }
  };

  const handleApproveContract = (contractId: string) => {
    setContracts(prev => prev.map(c => c.id === contractId ? {
      ...c,
      status: 'APPROVED',
      approvedAt: new Date().toISOString(),
      approvedByIp: '192.168.1.1', // Mock IP
      approvedByDevice: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' // Mock Device
    } : c));
    toast.success("Sözleşme başarıyla onaylandı.");
  };

  const handleCreateContract = () => {
    const newContract: PatientContract = {
        id: `PC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        patientId: selectedPatientId,
        templateId: selectedTemplateId,
        status: "PENDING",
        generatedContent: customContent, // Store the custom edited content
        createdAt: new Date().toISOString(),
    };

    setContracts([newContract, ...contracts]);
    toast.success("Sözleşme başarıyla oluşturuldu.");
    
    // Reset and close
    setIsCreateContractOpen(false);
    setCreationStep(1);
    setSelectedPatientId("");
    setSelectedTemplateId("");
    setCustomContent("");
    
    // Switch to Pending tab to show the user where it went
    setActiveTab("pending");
  };

  // --- Handlers: Template Management ---
  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;
    
    if (templates.find(t => t.id === selectedTemplate.id)) {
        setTemplates(templates.map(t => t.id === selectedTemplate.id ? selectedTemplate : t));
        toast.success("Şablon güncellendi.");
    } else {
        setTemplates([...templates, { ...selectedTemplate, id: Math.random().toString(36).substr(2, 9) }]);
        toast.success("Yeni şablon oluşturuldu.");
    }
    setIsTemplateModalOpen(false);
  };

  const insertVariable = (variable: string) => {
    if (!selectedTemplate) return;
    const textArea = document.getElementById("template-editor") as HTMLTextAreaElement;
    if (textArea) {
        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;
        const text = selectedTemplate.content;
        const newText = text.substring(0, start) + variable + text.substring(end);
        setSelectedTemplate({ ...selectedTemplate, content: newText });
        // Focus back to text area would be nice but requires ref
    } else {
        setSelectedTemplate({ ...selectedTemplate, content: selectedTemplate.content + variable });
    }
  };

  // --- Handlers: Preview ---
  const handlePreview = (contract: PatientContract) => {
    // Use stored generated content if available (for custom edits), otherwise regenerate
    if (contract.generatedContent) {
        setPreviewContent(contract.generatedContent);
    } else {
        const template = getTemplate(contract.templateId);
        const patient = getPatient(contract.patientId);
        if (template && patient) {
            setPreviewContent(generateContractContent(template, patient));
        }
    }
    setIsPreviewOpen(true);
  };

  const handlePrintPreview = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Sözleşme Önizleme</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; font-weight: bold; font-size: 18px; }
            .content { white-space: pre-wrap; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature-box { border-top: 1px solid #000; padding-top: 10px; width: 200px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="content">${previewContent}</div>
          <div class="footer">
            <div class="signature-box">
                <p>Hasta İmzası</p>
                <p>(Dijital Onay)</p>
            </div>
            <div class="signature-box">
                <p>Klinik Yetkilisi</p>
            </div>
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSendReminder = (contractId: string) => {
    toast.success("Hastaya hatırlatma bildirimi (SMS/Email) gönderildi.");
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-6 p-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Legal & KVKK Motoru</h1>
          <p className="text-muted-foreground">
            Sözleşme şablonları, dijital onaylar ve denetim izi (audit log) yönetimi.
          </p>
        </div>
        <div className="flex gap-2">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" onClick={() => {
                setCreationStep(1);
                setIsCreateContractOpen(true);
            }}>
                <FileSignature className="mr-2 h-4 w-4" /> Sözleşme Oluştur
            </Button>
            <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => {
                setSelectedTemplate({
                    id: "",
                    title: "Yeni Şablon",
                    type: "DIGER",
                    language: "TR",
                    content: "",
                    version: "1.0",
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
                setIsTemplateModalOpen(true);
            }}>
            <Plus className="mr-2 h-4 w-4" /> Yeni Şablon Tanımla
            </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="library">Sözleşme Kütüphanesi</TabsTrigger>
          <TabsTrigger value="pending">
            Bekleyen Onaylar
            {contracts.filter(c => c.status === 'PENDING').length > 0 && (
                <Badge className="ml-2 h-5 px-1.5 bg-amber-500 hover:bg-amber-600">{contracts.filter(c => c.status === 'PENDING').length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archive">İmzalı Arşiv</TabsTrigger>
        </TabsList>

        {/* --- Contract Library --- */}
        <TabsContent value="library" className="mt-6 space-y-4 flex-1 overflow-auto">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover:border-indigo-500 transition-all cursor-pointer group shadow-sm hover:shadow-md" onClick={() => {
                  setSelectedTemplate(template);
                  setIsTemplateModalOpen(true);
              }}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                        {template.title}
                    </CardTitle>
                    <div className="flex flex-col gap-1 items-end">
                        <Badge variant="outline">{template.type}</Badge>
                        <Badge variant="secondary" className="text-[10px] bg-slate-100">
                            <Globe className="h-3 w-3 mr-1" /> {template.language}
                        </Badge>
                    </div>
                  </div>
                  <CardDescription>v{template.version}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500 line-clamp-3 font-mono bg-slate-50 p-2 rounded border border-slate-100 group-hover:border-indigo-100 transition-colors">
                    {template.content}
                  </p>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground pt-0 flex justify-between">
                  <span>{format(parseISO(template.updatedAt), "d MMM yyyy", { locale: tr })}</span>
                  <span className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                    Düzenle <ChevronRight className="h-3 w-3 ml-1" />
                  </span>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* --- Pending Approvals --- */}
        <TabsContent value="pending" className="mt-6 flex-1 overflow-auto">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Onay Bekleyen Sözleşmeler
              </CardTitle>
              <CardDescription>
                Aşağıdaki hastaların operasyon öncesi yasal dokümanlarını onaylaması gerekmektedir.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <div className="space-y-4">
                {contracts.filter(c => c.status === 'PENDING').map(contract => {
                    const patient = getPatient(contract.patientId);
                    const template = getTemplate(contract.templateId);
                    return (
                        <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-slate-50 transition-colors shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">{patient?.name}</h4>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <span>{template?.title}</span>
                                        <Badge variant="outline" className="text-[10px] h-5">{template?.language}</Badge>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">Oluşturulma: {format(parseISO(contract.createdAt), "d MMM HH:mm", { locale: tr })}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100">
                                    Bekliyor
                                </Badge>
                                <Button size="sm" variant="outline" onClick={() => handlePreview(contract)}>
                                    <Eye className="h-4 w-4 mr-2" /> Önizle
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleSendReminder(contract.id)}>
                                    <Send className="h-4 w-4 mr-2" /> Hatırlat
                                </Button>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApproveContract(contract.id)}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Onayla
                                </Button>
                            </div>
                        </div>
                    );
                })}
                {contracts.filter(c => c.status === 'PENDING').length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                        <CheckCircle2 className="h-12 w-12 text-slate-300 mb-2" />
                        <p className="font-medium">Bekleyen onay bulunmamaktadır.</p>
                        <p className="text-sm">Tüm sözleşmeler imzalandı veya arşivlendi.</p>
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Signed Archive --- */}
        <TabsContent value="archive" className="mt-6 flex-1 overflow-auto">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                İmzalı & Onaylı Arşiv
              </CardTitle>
              <CardDescription>
                Yasal geçerliliği olan, zaman damgası ve IP bilgisi ile loglanmış dokümanlar.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <div className="space-y-4">
                {contracts.filter(c => c.status === 'APPROVED').map(contract => {
                    const patient = getPatient(contract.patientId);
                    const template = getTemplate(contract.templateId);
                    return (
                        <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-slate-50 transition-colors shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <FileSignature className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">{patient?.name}</h4>
                                    <p className="text-sm text-slate-500">{template?.title}</p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                        <History className="h-3 w-3" />
                                        <span>Onay: {format(parseISO(contract.approvedAt!), "d MMM yyyy HH:mm", { locale: tr })}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50" onClick={() => setAuditContract(contract)}>
                                    <ShieldCheck className="h-4 w-4 mr-2" /> Audit Log
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handlePreview(contract)}>
                                    <Download className="h-4 w-4 mr-2" /> PDF İndir
                                </Button>
                            </div>
                        </div>
                    );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- Contract Creation Wizard Modal --- */}
      <Dialog open={isCreateContractOpen} onOpenChange={setIsCreateContractOpen}>
        <DialogContent className={cn("transition-all duration-300", creationStep === 2 ? "max-w-4xl" : "max-w-md")}>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    {creationStep === 1 ? (
                        <>
                            <FileSignature className="h-5 w-5 text-emerald-600" />
                            Sözleşme Oluştur - Adım 1/2
                        </>
                    ) : (
                        <>
                            <Edit3 className="h-5 w-5 text-indigo-600" />
                            Önizleme ve Düzenleme - Adım 2/2
                        </>
                    )}
                </DialogTitle>
                <DialogDescription>
                    {creationStep === 1 
                        ? "Sözleşme oluşturulacak hasta ve şablonu seçin." 
                        : "Sözleşme metnini son kez kontrol edin ve gerekiyorsa düzenleyin."}
                </DialogDescription>
            </DialogHeader>

            {creationStep === 1 && (
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Hasta Seçin</label>
                        <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Hasta Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {patients.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        <span className="flex items-center justify-between w-full gap-2">
                                            <span>{p.name}</span>
                                            <Badge variant="secondary" className="text-[10px]">{p.country}</Badge>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Şablon Seçin</label>
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Şablon Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.filter(t => t.isActive).map(t => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.title} ({t.language}) - v{t.version}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedPatientId && selectedTemplateId && (
                            <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>
                                    Seçilen hastanın dili <b>{getPatient(selectedPatientId)?.language}</b>. 
                                    Şablon dili: <b>{getTemplate(selectedTemplateId)?.language}</b>.
                                    {getPatient(selectedPatientId)?.language !== "Türkçe" && getTemplate(selectedTemplateId)?.language === "TR" && (
                                        <span className="block font-semibold mt-1">Dil uyuşmazlığı olabilir, dikkat edin.</span>
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {creationStep === 2 && (
                <div className="space-y-4 py-4">
                     <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded flex items-center gap-2 border border-amber-200">
                        <AlertTriangle className="h-4 w-4" />
                        Bu alanda yapacağınız değişiklikler sadece bu sözleşme için geçerli olacaktır. Şablon bozulmaz.
                    </div>
                    <Textarea 
                        className="min-h-[400px] font-serif text-sm leading-relaxed p-6"
                        value={customContent}
                        onChange={(e) => setCustomContent(e.target.value)}
                    />
                </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
                {creationStep === 1 ? (
                    <>
                        <Button variant="outline" onClick={() => setIsCreateContractOpen(false)}>İptal</Button>
                        <Button onClick={handleWizardNext} className="bg-indigo-600 hover:bg-indigo-700">
                            İleri <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <>
                         <Button variant="outline" onClick={() => setCreationStep(1)}>
                            <ChevronLeft className="mr-2 h-4 w-4" /> Geri
                        </Button>
                        <Button onClick={handleCreateContract} className="bg-emerald-600 hover:bg-emerald-700">
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Sözleşmeyi Oluştur
                        </Button>
                    </>
                )}
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Template Editor Modal --- */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <PenTool className="h-5 w-5 text-indigo-600" />
                    Şablon Düzenleyici
                </DialogTitle>
                <DialogDescription>
                    Sözleşme şablonunu ve dinamik değişkenleri yapılandırın.
                </DialogDescription>
            </DialogHeader>
            {selectedTemplate && (
                <div className="flex-1 flex flex-col gap-4 py-4 overflow-hidden">
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-6 space-y-2">
                            <label className="text-sm font-medium">Şablon Başlığı</label>
                            <Input 
                                value={selectedTemplate.title} 
                                onChange={(e) => setSelectedTemplate({...selectedTemplate, title: e.target.value})}
                            />
                        </div>
                        <div className="col-span-3 space-y-2">
                            <label className="text-sm font-medium">Tür</label>
                            <Select 
                                value={selectedTemplate.type} 
                                onValueChange={(val: any) => setSelectedTemplate({...selectedTemplate, type: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="KVKK">KVKK</SelectItem>
                                    <SelectItem value="ONAM">Onam Formu</SelectItem>
                                    <SelectItem value="HIZMET">Hizmet Sözleşmesi</SelectItem>
                                    <SelectItem value="DIGER">Diğer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-3 space-y-2">
                            <label className="text-sm font-medium">Dil</label>
                            <Select 
                                value={selectedTemplate.language} 
                                onValueChange={(val: any) => setSelectedTemplate({...selectedTemplate, language: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TR">Türkçe (TR)</SelectItem>
                                    <SelectItem value="EN">İngilizce (EN)</SelectItem>
                                    <SelectItem value="DE">Almanca (DE)</SelectItem>
                                    <SelectItem value="AR">Arapça (AR)</SelectItem>
                                    <SelectItem value="FR">Fransızca (FR)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex gap-4 overflow-hidden">
                        {/* Main Editor */}
                        <div className="flex-1 flex flex-col gap-2">
                             <label className="text-sm font-medium flex justify-between items-center">
                                <span>Metin İçeriği</span>
                                <Badge variant="outline" className="text-xs font-normal">
                                    Markdown desteklenmez, düz metin kullanın.
                                </Badge>
                            </label>
                            <Textarea 
                                id="template-editor"
                                className="flex-1 font-mono text-sm leading-relaxed p-4 resize-none"
                                value={selectedTemplate.content}
                                onChange={(e) => setSelectedTemplate({...selectedTemplate, content: e.target.value})}
                            />
                        </div>

                        {/* Sidebar: Variables */}
                        <div className="w-64 flex flex-col gap-2 bg-slate-50 p-4 rounded-lg border">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Variable className="h-4 w-4 text-indigo-600" />
                                Değişkenler
                            </label>
                            <p className="text-xs text-muted-foreground mb-2">
                                Tıklayarak metne ekleyebilirsiniz.
                            </p>
                            <ScrollArea className="flex-1 pr-2">
                                <div className="space-y-2">
                                    {[
                                        { key: "{{hasta_adi}}", label: "Hasta Adı" },
                                        { key: "{{pasaport_no}}", label: "Pasaport No" },
                                        { key: "{{telefon}}", label: "Telefon" },
                                        { key: "{{tedavi_adi}}", label: "Tedavi Adı" },
                                        { key: "{{tedavi_tarihi}}", label: "Tedavi Tarihi" },
                                        { key: "{{toplam_tutar}}", label: "Tutar" },
                                        { key: "{{para_birimi}}", label: "Para Birimi" },
                                        { key: "{{tarih}}", label: "Bugünün Tarihi" },
                                    ].map((v) => (
                                        <button
                                            key={v.key}
                                            onClick={() => insertVariable(v.key)}
                                            className="w-full text-left text-xs bg-white border hover:border-indigo-500 hover:text-indigo-600 p-2 rounded transition-colors flex items-center justify-between group"
                                        >
                                            <span className="font-mono text-slate-500 group-hover:text-indigo-600">{v.key}</span>
                                            <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>İptal</Button>
                <Button onClick={handleSaveTemplate} className="bg-indigo-600 hover:bg-indigo-700">Kaydet</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Preview Modal --- */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Sözleşme Önizleme</DialogTitle>
            </DialogHeader>
            <div className="bg-white p-8 rounded-lg border font-serif whitespace-pre-wrap text-sm leading-relaxed shadow-sm min-h-[500px]">
                {previewContent}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Kapat</Button>
                <Button onClick={handlePrintPreview}>
                    <Download className="mr-2 h-4 w-4" /> Yazdır / PDF
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Audit Log Modal --- */}
      <Dialog open={!!auditContract} onOpenChange={(open) => !open && setAuditContract(null)}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    Denetim İzi (Audit Log)
                </DialogTitle>
                <DialogDescription>
                    Bu belgenin yasal onay kanıtları aşağıdadır.
                </DialogDescription>
            </DialogHeader>
            {auditContract && (
                <div className="space-y-4 py-4">
                    <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">İşlem ID:</span>
                            <span className="font-mono">{auditContract.id}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Hasta:</span>
                            <span className="font-medium">{getPatient(auditContract.patientId)?.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Onay Zamanı:</span>
                            <span className="font-medium">{format(parseISO(auditContract.approvedAt!), "d MMM yyyy HH:mm:ss", { locale: tr })}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">IP Adresi:</span>
                            <span className="font-mono bg-slate-200 px-1 rounded">{auditContract.approvedByIp}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Cihaz:</span>
                            <span>{auditContract.approvedByDevice}</span>
                        </div>
                        <div className="pt-2 mt-2 border-t flex justify-center">
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Hukuki Geçerlilik Doğrulandı
                            </Badge>
                        </div>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
