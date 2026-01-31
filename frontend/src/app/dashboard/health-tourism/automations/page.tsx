"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Zap, 
  MessageCircle, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  ArrowRight, 
  Clock, 
  Mail, 
  Bell, 
  FileText,
  Activity,
  MoreHorizontal,
  Pencil,
  Trash2,
  MessageSquare,
  Send
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AutomationRule = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: {
    type: "STAGE_CHANGE" | "DATE_REACHED" | "NEW_LEAD" | "FORM_SUBMITTED";
    detail: string;
  };
  action: {
    type: "SEND_WHATSAPP" | "SEND_EMAIL" | "CREATE_TASK" | "UPDATE_FIELD" | "SEND_SMS" | "SEND_TELEGRAM";
    detail: string;
    recipient?: "CUSTOMER" | "STAFF" | "MANAGER";
  };
  stats: {
    runCount: number;
    lastRun: string;
  };
};

const initialRules: AutomationRule[] = [];

export default function HealthTourismAutomationsPage() {
  const [rules, setRules] = useState<AutomationRule[]>(initialRules);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formTriggerType, setFormTriggerType] = useState<string>("NEW_LEAD");
  const [formActionType, setFormActionType] = useState<string>("SEND_WHATSAPP");
  const [formRecipient, setFormRecipient] = useState<string>("CUSTOMER");

  const toggleRule = (id: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
    ));
    toast.success("Otomasyon durumu güncellendi.");
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
    toast.success("Otomasyon kuralı silindi.");
  };

  const openCreateDialog = () => {
    setEditingRuleId(null);
    setFormName("");
    setFormTriggerType("NEW_LEAD");
    setFormActionType("SEND_WHATSAPP");
    setFormRecipient("CUSTOMER");
    setIsCreateOpen(true);
  };

  const openEditDialog = (rule: AutomationRule) => {
    setEditingRuleId(rule.id);
    setFormName(rule.name);
    setFormTriggerType(rule.trigger.type);
    setFormActionType(rule.action.type);
    setFormRecipient(rule.action.recipient || "CUSTOMER");
    setIsCreateOpen(true);
  };

  const handleSaveRule = () => {
    if (!formName) {
      toast.error("Lütfen bir otomasyon adı girin.");
      return;
    }

    if (editingRuleId) {
      // Update existing rule
      setRules(rules.map(rule => {
        if (rule.id === editingRuleId) {
          return {
            ...rule,
            name: formName,
            trigger: {
              ...rule.trigger,
              type: formTriggerType as any,
              detail: getTriggerDetail(formTriggerType) // Basitçe güncellemek için
            },
            action: {
              ...rule.action,
              type: formActionType as any,
              detail: getActionDetail(formActionType), // Basitçe güncellemek için
              recipient: formRecipient as any
            }
          };
        }
        return rule;
      }));
      toast.success("Otomasyon kuralı güncellendi.");
    } else {
      // Create new rule
      const newRule: AutomationRule = {
        id: Math.random().toString(36).substr(2, 9),
        name: formName,
        description: "Yeni oluşturulan otomasyon kuralı.",
        isActive: true,
        trigger: {
          type: formTriggerType as any,
          detail: getTriggerDetail(formTriggerType)
        },
        action: {
          type: formActionType as any,
          detail: getActionDetail(formActionType),
          recipient: formRecipient as any
        },
        stats: {
          runCount: 0,
          lastRun: "-"
        }
      };
      setRules([newRule, ...rules]);
      toast.success("Yeni otomasyon kuralı oluşturuldu.");
    }
    setIsCreateOpen(false);
  };

  const handleUseTemplate = (template: { title: string, desc: string }) => {
    const newRule: AutomationRule = {
      id: Math.random().toString(36).substr(2, 9),
      name: template.title,
      description: template.desc,
      isActive: true,
      trigger: {
        type: "DATE_REACHED", // Şablon mantığına göre değişebilir, varsayılan
        detail: "Tarih Geldiğinde"
      },
      action: {
        type: "SEND_WHATSAPP", // Varsayılan
        detail: "Şablon Mesajı",
        recipient: "CUSTOMER"
      },
      stats: {
        runCount: 0,
        lastRun: "-"
      }
    };
    
    // Basit bir eşleştirme mantığı (daha gelişmiş yapılabilir)
    if (template.title.includes("Randevu")) {
      newRule.trigger.type = "DATE_REACHED";
      newRule.trigger.detail = "Randevudan 24 saat önce";
      newRule.action.type = "SEND_WHATSAPP";
      newRule.action.detail = "Randevu Hatırlatma Şablonu";
    } else if (template.title.includes("Doğum Günü")) {
      newRule.trigger.type = "DATE_REACHED";
      newRule.trigger.detail = "Doğum Gününde";
      newRule.action.type = "SEND_EMAIL";
      newRule.action.detail = "Doğum Günü Kutlama E-postası";
    } else if (template.title.includes("Geri Kazanım")) {
      newRule.trigger.type = "DATE_REACHED";
      newRule.trigger.detail = "30 gün işlem yoksa";
      newRule.action.type = "SEND_WHATSAPP";
      newRule.action.detail = "Nasılsınız Mesajı";
    }

    setRules([newRule, ...rules]);
    toast.success(`"${template.title}" şablonu kullanılarak kural oluşturuldu.`);
    // Opsiyonel: Oluşturduktan sonra düzenleme modunu açabiliriz
    // openEditDialog(newRule); 
  };

  const getTriggerDetail = (type: string) => {
    switch (type) {
      case "NEW_LEAD": return "Yeni Lead Geldiğinde";
      case "STAGE_CHANGE": return "Aşama Değiştiğinde";
      case "DATE_REACHED": return "Belirli Tarihte";
      case "FORM_SUBMITTED": return "Form Doldurulduğunda";
      default: return "";
    }
  };

  const getActionDetail = (type: string) => {
    switch (type) {
      case "SEND_WHATSAPP": return "WhatsApp Gönder";
      case "SEND_EMAIL": return "E-posta Gönder";
      case "SEND_SMS": return "SMS Gönder";
      case "SEND_TELEGRAM": return "Telegram Mesajı";
      case "CREATE_TASK": return "Görev Oluştur";
      default: return "";
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "NEW_LEAD": return <Plus className="h-4 w-4 text-blue-500" />;
      case "STAGE_CHANGE": return <Activity className="h-4 w-4 text-amber-500" />;
      case "DATE_REACHED": return <Clock className="h-4 w-4 text-purple-500" />;
      case "FORM_SUBMITTED": return <FileText className="h-4 w-4 text-emerald-500" />;
      default: return <Zap className="h-4 w-4 text-slate-500" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "SEND_WHATSAPP": return <MessageCircle className="h-4 w-4 text-emerald-600" />;
      case "SEND_SMS": return <MessageSquare className="h-4 w-4 text-sky-600" />;
      case "SEND_TELEGRAM": return <Send className="h-4 w-4 text-blue-500" />;
      case "SEND_EMAIL": return <Mail className="h-4 w-4 text-blue-600" />;
      case "CREATE_TASK": return <CheckCircle2 className="h-4 w-4 text-indigo-600" />;
      default: return <Zap className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Otomasyon Merkezi</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Tekrarlayan işleri otomatiğe bağlayın, hasta deneyimini standartlaştırın ve ekibinizin zamanını verimli kullanın.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <Button className="bg-[#00e676] text-black hover:bg-[#00c853]" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" /> Yeni Otomasyon
          </Button>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingRuleId ? "Otomasyon Kuralını Düzenle" : "Yeni Otomasyon Kuralı Oluştur"}</DialogTitle>
              <DialogDescription>
                Tetikleyici bir olay seçin ve gerçekleştiğinde yapılacak işlemi belirleyin.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Otomasyon Adı</Label>
                <Input 
                  id="name" 
                  placeholder="Örn: VIP Hasta Karşılama" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tetikleyici (Trigger)</Label>
                  <Select value={formTriggerType} onValueChange={setFormTriggerType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW_LEAD">Yeni Lead Geldiğinde</SelectItem>
                      <SelectItem value="STAGE_CHANGE">Aşama Değiştiğinde</SelectItem>
                      <SelectItem value="DATE_REACHED">Tarih Geldiğinde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Aksiyon (Action)</Label>
                  <Select value={formActionType} onValueChange={setFormActionType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEND_WHATSAPP">WhatsApp Gönder</SelectItem>
                      <SelectItem value="SEND_SMS">SMS Gönder</SelectItem>
                      <SelectItem value="SEND_TELEGRAM">Telegram Mesajı</SelectItem>
                      <SelectItem value="SEND_EMAIL">E-posta Gönder</SelectItem>
                      <SelectItem value="CREATE_TASK">Görev Oluştur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(formActionType.startsWith("SEND_") || formActionType === "CREATE_TASK") && (
                <div className="grid gap-2">
                  <Label>Alıcı (Kime)</Label>
                  <Select value={formRecipient} onValueChange={setFormRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Hasta / Müşteri</SelectItem>
                      <SelectItem value="STAFF">Atanan Personel</SelectItem>
                      <SelectItem value="MANAGER">Yönetici</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="rounded-lg border border-dashed border-slate-200 p-4 bg-slate-50 text-sm text-slate-500 text-center">
                {formTriggerType === "NEW_LEAD" && "Hangi kaynaktan veya ülkeden geldiğinde çalışacağını seçiniz."}
                {formTriggerType === "STAGE_CHANGE" && "Hangi aşamaya geçtiğinde çalışacağını seçiniz."}
                {formTriggerType === "DATE_REACHED" && "Hangi tarihte veya olaydan ne kadar süre sonra çalışacağını seçiniz."}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>İptal</Button>
              <Button onClick={handleSaveRule}>
                {editingRuleId ? "Güncelle" : "Oluştur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="rules">Aktif Kurallar</TabsTrigger>
          <TabsTrigger value="templates">Şablonlar</TabsTrigger>
          <TabsTrigger value="logs">İşlem Geçmişi</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id} className="transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-semibold">
                        {rule.name}
                      </CardTitle>
                      {rule.isActive ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-100">Pasif</Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {rule.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={rule.isActive}
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(rule)}>
                          <Pencil className="mr-2 h-4 w-4" /> Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => deleteRule(rule.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-2 flex items-center gap-4 rounded-lg border bg-slate-50/50 p-3 text-sm dark:bg-slate-900/50">
                    <div className="flex flex-1 items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm border dark:bg-slate-800">
                        {getTriggerIcon(rule.trigger.type)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700 dark:text-slate-200">EĞER</span>
                        <span className="text-xs text-slate-500">{rule.trigger.detail}</span>
                      </div>
                    </div>
                    
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                    
                    <div className="flex flex-1 items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm border dark:bg-slate-800">
                        {getActionIcon(rule.action.type)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700 dark:text-slate-200">YAP</span>
                        <span className="text-xs text-slate-500">{rule.action.detail}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      <span>{rule.stats.runCount} kez çalıştı</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Son çalışma: {rule.stats.lastRun}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Randevu Hatırlatma", desc: "Randevudan 24 saat önce WhatsApp gönder." },
              { title: "Doğum Günü Kutlaması", desc: "Hastanın doğum gününde e-posta gönder." },
              { title: "Lead Geri Kazanım", desc: "30 gün işlem görmeyen leade mesaj at." },
              { title: "Anket Gönderimi", desc: "Taburcu olduktan 3 gün sonra anket ilet." },
              { title: "Ödeme Hatırlatma", desc: "Ödeme tarihi yaklaşan hastalara bildirim." },
              { title: "Transfer Bilgilendirme", desc: "Uçuş günü şoför bilgilerini ilet." },
            ].map((template, i) => (
              <Card key={i} className="cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/10 transition-colors">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">{template.title}</CardTitle>
                  <CardDescription className="text-xs">{template.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleUseTemplate(template)}>
                    Şablonu Kullan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Son Aktiviteler</CardTitle>
              <CardDescription>Otomasyon sisteminin gerçekleştirdiği son 50 işlem.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Logs removed */}
                {rules.length === 0 && (
                  <div className="text-center text-sm text-slate-500 py-4">
                    Henüz bir işlem kaydı bulunmuyor.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
