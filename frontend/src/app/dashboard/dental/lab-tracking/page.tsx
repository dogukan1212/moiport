"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  MoreHorizontal,
  FileText,
  Trash2,
  Edit,
  Phone,
  Upload,
  Image as ImageIcon,
  X,
  Eye,
  Send,
  Download,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// --- Types & Mock Data ---

type LabStatus = "PENDING" | "PREPARED" | "SENT" | "IN_PROGRESS" | "SHIPPED" | "COMPLETED" | "CANCELLED" | "REVIEWED";

interface LabAttachment {
  id: string;
  name: string;
  url: string;
  type: "image" | "document";
  date: string;
}

interface LabTimelineEvent {
  date: string;
  status: LabStatus;
  note?: string;
  user?: string;
}

interface LabOrder {
  id: string;
  patientName: string;
  patientPhone?: string;
  labName: string;
  treatmentType: string;
  toothNumbers: string;
  status: LabStatus;
  orderDate: string;
  dueDate: string;
  price?: number;
  notes?: string;
  cargoTrackingNo?: string;
  attachments: LabAttachment[];
  timeline: LabTimelineEvent[];
}

const MOCK_ORDERS: LabOrder[] = [
  {
    id: "LAB-001",
    patientName: "Ahmet Yılmaz",
    patientPhone: "555 123 45 67",
    labName: "Elit Dental Laboratuvarı",
    treatmentType: "Zirkonyum Kaplama",
    toothNumbers: "11, 21",
    status: "IN_PROGRESS",
    orderDate: "2024-01-28",
    dueDate: "2024-02-04",
    price: 3500,
    notes: "A2 renginde olacak, hasta doğal görünüm istiyor.",
    attachments: [
      { id: "1", name: "agiz_ici_1.jpg", url: "https://placehold.co/400", type: "image", date: "2024-01-28" },
    ],
    timeline: [
      { date: "2024-01-28", status: "PENDING", note: "İş emri oluşturuldu", user: "Dr. Ali" },
      { date: "2024-01-29", status: "SENT", note: "Laboratuvara gönderildi", user: "Asistan Ayşe" },
      { date: "2024-01-30", status: "IN_PROGRESS", note: "Laboratuvar işleme başladı", user: "Sistem" },
    ],
  },
  {
    id: "LAB-002",
    patientName: "Ayşe Demir",
    patientPhone: "532 987 65 43",
    labName: "ProTech Lab",
    treatmentType: "Porselen Lamine",
    toothNumbers: "13, 12, 11, 21, 22, 23",
    status: "SENT",
    orderDate: "2024-01-30",
    dueDate: "2024-02-06",
    price: 12000,
    attachments: [],
    timeline: [
      { date: "2024-01-30", status: "PENDING", note: "İş emri oluşturuldu", user: "Dr. Ali" },
      { date: "2024-01-30", status: "SENT", note: "Kurye teslim aldı", user: "Asistan Ayşe" },
    ],
  },
  {
    id: "LAB-003",
    patientName: "Mehmet Öz",
    labName: "Elit Dental Laboratuvarı",
    treatmentType: "Gece Plağı",
    toothNumbers: "Tüm Çene",
    status: "COMPLETED",
    orderDate: "2024-01-20",
    dueDate: "2024-01-20",
    price: 1500,
    notes: "Sert plak isteniyor.",
    cargoTrackingNo: "YURTICI-123456",
    attachments: [],
    timeline: [
      { date: "2024-01-15", status: "PENDING", note: "İş emri oluşturuldu", user: "Dr. Ali" },
      { date: "2024-01-15", status: "SENT", note: "Gönderildi", user: "Asistan Ayşe" },
      { date: "2024-01-18", status: "SHIPPED", note: "Kargoya verildi", user: "Sistem" },
      { date: "2024-01-20", status: "COMPLETED", note: "Teslim alındı", user: "Dr. Ali" },
    ],
  },
];

const LABS = [
  "Elit Dental Laboratuvarı",
  "ProTech Lab",
  "DentArt Studio",
  "Vizyon Diş Deposu",
];

const TREATMENTS = [
  "Zirkonyum Kaplama",
  "Porselen Lamine",
  "Metal Destekli Porselen",
  "E-Max Kaplama",
  "Total Protez",
  "Parsiyel Protez",
  "Gece Plağı",
  "İmplant Üstü Protez",
  "Ortodontik Plak",
];

// --- Helper Components ---

const StatusBadge = ({ status }: { status: LabStatus }) => {
  const styles = {
    PENDING: "bg-slate-100 text-slate-700 border-slate-200",
    PREPARED: "bg-indigo-50 text-indigo-700 border-indigo-200",
    SENT: "bg-blue-50 text-blue-700 border-blue-200",
    IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
    SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
    REVIEWED: "bg-teal-50 text-teal-700 border-teal-200",
  };

  const labels = {
    PENDING: "Bekliyor",
    PREPARED: "Hazırlandı",
    SENT: "Gönderildi",
    IN_PROGRESS: "İşlemde",
    SHIPPED: "Kargoda",
    COMPLETED: "Tamamlandı",
    CANCELLED: "İptal",
    REVIEWED: "İncelendi",
  };

  const icons = {
    PENDING: Clock,
    PREPARED: FileText,
    SENT: Send,
    IN_PROGRESS: Clock,
    SHIPPED: Package,
    COMPLETED: CheckCircle2,
    CANCELLED: AlertCircle,
    REVIEWED: Eye,
  };

  const Icon = icons[status];

  return (
    <Badge
      variant="outline"
      className={`${styles[status]} flex w-fit items-center gap-1.5 px-2.5 py-0.5`}
    >
      <Icon className="h-3.5 w-3.5" />
      {labels[status]}
    </Badge>
  );
};

export default function DentalLabTrackingPage() {
  const [orders, setOrders] = useState<LabOrder[]>(MOCK_ORDERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LabStatus | "ALL">("ALL");
  const [labFilter, setLabFilter] = useState<string>("ALL");
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [shippingInput, setShippingInput] = useState("");
  const [showShippingInput, setShowShippingInput] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<LabOrder>>({
    status: "PENDING",
    orderDate: new Date().toISOString().split('T')[0],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.treatmentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      const matchesLab = labFilter === "ALL" || order.labName === labFilter;

      return matchesSearch && matchesStatus && matchesLab;
    });
  }, [orders, searchTerm, statusFilter, labFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: orders.length,
      active: orders.filter(o => ["SENT", "IN_PROGRESS", "SHIPPED"].includes(o.status)).length,
      completed: orders.filter(o => o.status === "COMPLETED").length,
      pending: orders.filter(o => o.status === "PENDING").length,
    };
  }, [orders]);

  // Handlers
  const handleCreateOrder = () => {
    if (!newOrder.patientName || !newOrder.labName || !newOrder.treatmentType) {
      toast.error("Lütfen zorunlu alanları doldurun.");
      return;
    }

    const order: LabOrder = {
      id: `LAB-${String(orders.length + 1).padStart(3, '0')}`,
      patientName: newOrder.patientName,
      labName: newOrder.labName,
      treatmentType: newOrder.treatmentType,
      toothNumbers: newOrder.toothNumbers || "Belirtilmedi",
      status: "PENDING",
      orderDate: newOrder.orderDate || new Date().toISOString().split('T')[0],
      dueDate: newOrder.dueDate || "",
      price: newOrder.price,
      notes: newOrder.notes,
      patientPhone: newOrder.patientPhone,
      attachments: [],
      timeline: [
        { date: new Date().toISOString().split('T')[0], status: "PENDING", note: "İş emri oluşturuldu", user: "Sistem" }
      ]
    };

    setOrders([order, ...orders]);
    setIsCreateOpen(false);
    setNewOrder({ status: "PENDING", orderDate: new Date().toISOString().split('T')[0] });
    toast.success("İş emri oluşturuldu.");
  };

  const handleDeleteOrder = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm("Bu iş emrini silmek istediğinize emin misiniz?")) {
      setOrders(orders.filter(o => o.id !== id));
      if (selectedOrder?.id === id) setIsDetailOpen(false);
      toast.success("İş emri silindi.");
    }
  };

  const handleStatusChange = (id: string, newStatus: LabStatus, note?: string) => {
    // If shipping, include the tracking number in the update
    let updatedNote = note;
    let extraUpdates = {};

    if (newStatus === 'SHIPPED' && shippingInput) {
      updatedNote = `${note} (Takip No: ${shippingInput})`;
      extraUpdates = { cargoTrackingNo: shippingInput };
    }

    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        return {
          ...o,
          status: newStatus,
          ...extraUpdates,
          timeline: [
            { 
              date: new Date().toISOString().split('T')[0], 
              status: newStatus, 
              note: updatedNote || `Durum güncellendi: ${newStatus}`,
              user: "Kullanıcı" 
            },
            ...o.timeline
          ]
        };
      }
      return o;
    }));
    
    // Update selected order if open
    if (selectedOrder?.id === id) {
      setSelectedOrder(prev => prev ? {
        ...prev,
        status: newStatus,
        ...extraUpdates,
        timeline: [
          { 
            date: new Date().toISOString().split('T')[0], 
            status: newStatus, 
            note: updatedNote || `Durum güncellendi: ${newStatus}`,
            user: "Kullanıcı" 
          },
          ...prev.timeline
        ]
      } : null);
    }
    
    setShowShippingInput(false);
    setShippingInput("");
    toast.success("Durum güncellendi.");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && selectedOrder) {
      const file = files[0];
      const newAttachment: LabAttachment = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: URL.createObjectURL(file), // Local preview
        type: file.type.startsWith("image/") ? "image" : "document",
        date: new Date().toISOString().split('T')[0],
      };

      // Auto-update status logic: If PENDING -> PREPARED
      let newStatus = selectedOrder.status;
      let timelineEvent: LabTimelineEvent | null = {
        date: new Date().toISOString().split('T')[0],
        status: selectedOrder.status,
        note: `Dosya eklendi: ${file.name}`,
        user: "Kullanıcı"
      };

      if (selectedOrder.status === 'PENDING') {
        newStatus = 'PREPARED';
        timelineEvent = {
          date: new Date().toISOString().split('T')[0],
          status: 'PREPARED',
          note: `Dosyalar yüklendi, gönderime hazır: ${file.name}`,
          user: "Kullanıcı"
        };
        toast.success("Dosya eklendi ve durum 'Hazırlandı' olarak güncellendi.");
      } else {
        toast.success("Dosya eklendi.");
      }

      const updatedOrder = {
        ...selectedOrder,
        status: newStatus,
        attachments: [...selectedOrder.attachments, newAttachment],
        timeline: [timelineEvent, ...selectedOrder.timeline]
      };
      
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
      setSelectedOrder(updatedOrder);
    }
  };

  const handleRowClick = (order: LabOrder) => {
    // Systematic update: If doctor views a SHIPPED order, mark as REVIEWED/RECEIVED
    if (order.status === 'SHIPPED') {
      const updatedOrder = {
        ...order,
        status: 'REVIEWED' as LabStatus,
        timeline: [
          {
            date: new Date().toISOString().split('T')[0],
            status: 'REVIEWED' as LabStatus,
            note: "Hekim tarafından görüntülendi ve teslim alındı.",
            user: "Hekim"
          },
          ...order.timeline
        ]
      };
      setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
      setSelectedOrder(updatedOrder);
      toast.success("İş emri hekim tarafından görüntülendi (Durum: İncelendi)");
    } else {
      setSelectedOrder(order);
    }
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Laboratuvar Takibi
          </h1>
          <p className="mt-2 text-slate-500">
            Diş laboratuvarlarına gönderilen iş emirlerini, durumlarını ve teslimatlarını yönetin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white">
            <Filter className="mr-2 h-4 w-4" />
            Raporlar
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni İş Emri
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Aktif İş Emirleri</CardDescription>
            <CardTitle className="text-2xl">{stats.active}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Şu an laboratuvarda veya yolda</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Bekleyen Gönderimler</CardDescription>
            <CardTitle className="text-2xl">{stats.pending}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Kurye bekleniyor</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Tamamlanan (Bu Ay)</CardDescription>
            <CardTitle className="text-2xl">{stats.completed}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Teslim alınan işler</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-slate-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Toplam Kayıt</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Tüm zamanlar</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="İş emri ara (Hasta, İşlem, ID)..."
                className="pl-9 w-full md:max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Durum Filtresi" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                    <SelectItem value="PENDING">Bekliyor</SelectItem>
                    <SelectItem value="PREPARED">Hazırlandı</SelectItem>
                    <SelectItem value="SENT">Gönderildi</SelectItem>
                    <SelectItem value="IN_PROGRESS">İşlemde</SelectItem>
                    <SelectItem value="SHIPPED">Kargoda</SelectItem>
                    <SelectItem value="REVIEWED">İncelendi</SelectItem>
                    <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                  </SelectContent>
              </Select>
              <Select value={labFilter} onValueChange={setLabFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Laboratuvar Seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Laboratuvarlar</SelectItem>
                  {LABS.map(lab => (
                    <SelectItem key={lab} value={lab}>{lab}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[100px]">İş Emri No</TableHead>
                <TableHead>Hasta</TableHead>
                <TableHead>İşlem & Dişler</TableHead>
                <TableHead>Laboratuvar</TableHead>
                <TableHead>Tarihler</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Kayıt bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow 
                    key={order.id} 
                    className="group cursor-pointer hover:bg-slate-50/50"
                    onClick={() => handleRowClick(order)}
                  >
                    <TableCell className="font-medium text-blue-600">{order.id}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{order.patientName}</div>
                      {order.patientPhone && (
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {order.patientPhone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{order.treatmentType}</div>
                      <div className="text-xs text-slate-500">Diş No: {order.toothNumbers}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-700">{order.labName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1 text-slate-500">
                          <CalendarIcon className="h-3 w-3" />
                          <span>Gön: {new Date(order.orderDate).toLocaleDateString('tr-TR')}</span>
                        </div>
                        {order.dueDate && (
                          <div className={`flex items-center gap-1 font-medium ${
                            new Date(order.dueDate) < new Date() && order.status !== 'COMPLETED' 
                              ? "text-red-600" 
                              : "text-emerald-600"
                          }`}>
                            <Clock className="h-3 w-3" />
                            <span>Tes: {new Date(order.dueDate).toLocaleDateString('tr-TR')}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-slate-700"
                          onClick={(e) => { e.stopPropagation(); handleRowClick(order); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-red-600" 
                          onClick={(e) => handleDeleteOrder(order.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Order Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni İş Emri Oluştur</DialogTitle>
            <DialogDescription>
              Laboratuvara gönderilecek yeni bir protez veya işlem kaydı oluşturun.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hasta Adı Soyadı</Label>
                <Input 
                  placeholder="Örn: Ahmet Yılmaz" 
                  value={newOrder.patientName || ""}
                  onChange={(e) => setNewOrder({...newOrder, patientName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon (Opsiyonel)</Label>
                <Input 
                  placeholder="0555..." 
                  value={newOrder.patientPhone || ""}
                  onChange={(e) => setNewOrder({...newOrder, patientPhone: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label>Laboratuvar</Label>
                <Select onValueChange={(v) => setNewOrder({...newOrder, labName: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {LABS.map(lab => (
                      <SelectItem key={lab} value={lab}>{lab}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>İşlem Türü</Label>
                <Select onValueChange={(v) => setNewOrder({...newOrder, treatmentType: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {TREATMENTS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Diş Numaraları</Label>
              <Input 
                placeholder="Örn: 11, 12, 21 veya Tüm Üst Çene" 
                value={newOrder.toothNumbers || ""}
                onChange={(e) => setNewOrder({...newOrder, toothNumbers: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gönderim Tarihi</Label>
                <Input 
                  type="date" 
                  value={newOrder.orderDate}
                  onChange={(e) => setNewOrder({...newOrder, orderDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Tahmini Teslim</Label>
                <Input 
                  type="date"
                  value={newOrder.dueDate || ""}
                  onChange={(e) => setNewOrder({...newOrder, dueDate: e.target.value})}
                />
              </div>
            </div>

             <div className="space-y-2">
              <Label>Notlar & Renk Bilgisi</Label>
              <Textarea 
                placeholder="Örn: A2 renk, doğal form, opak..." 
                value={newOrder.notes || ""}
                onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>İptal</Button>
            <Button onClick={handleCreateOrder} className="bg-emerald-600 hover:bg-emerald-700 text-white">Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          {selectedOrder && (
            <>
              <DialogHeader className="px-6 py-4 border-b bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DialogTitle className="text-xl">{selectedOrder.patientName}</DialogTitle>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  <div className="text-sm text-slate-500">
                    ID: {selectedOrder.id}
                  </div>
                </div>
                <DialogDescription className="mt-1">
                  {selectedOrder.treatmentType} • {selectedOrder.toothNumbers} • {selectedOrder.labName}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto">
                <Tabs defaultValue="details" className="w-full">
                  <div className="px-6 border-b">
                    <TabsList className="w-full justify-start h-12 bg-transparent p-0">
                      <TabsTrigger value="details" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-full px-4">
                        Detaylar & İşlemler
                      </TabsTrigger>
                      <TabsTrigger value="attachments" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-full px-4">
                        Dosyalar ({selectedOrder.attachments.length})
                      </TabsTrigger>
                      <TabsTrigger value="timeline" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none h-full px-4">
                        Geçmiş
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-6">
                    <TabsContent value="details" className="mt-0 space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-slate-900">İş Emri Bilgileri</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-slate-500">Hasta:</div>
                            <div className="font-medium">{selectedOrder.patientName}</div>
                            
                            <div className="text-slate-500">Laboratuvar:</div>
                            <div className="font-medium">{selectedOrder.labName}</div>
                            
                            <div className="text-slate-500">İşlem:</div>
                            <div className="font-medium">{selectedOrder.treatmentType}</div>
                            
                            <div className="text-slate-500">Diş No:</div>
                            <div className="font-medium">{selectedOrder.toothNumbers}</div>
                            
                            <div className="text-slate-500">Fiyat:</div>
                            <div className="font-medium">{selectedOrder.price ? `${selectedOrder.price} TL` : '-'}</div>
                          </div>

                          <Separator />

                          <div className="space-y-2">
                            <Label className="text-slate-500 text-xs">Notlar</Label>
                            <div className="p-3 bg-slate-50 rounded-md text-sm text-slate-700 min-h-[80px]">
                              {selectedOrder.notes || "Not eklenmemiş."}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-slate-900">Hızlı İşlemler</h3>
                          <div className="grid gap-3">
                            {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'PREPARED') && (
                              <Button 
                                className="w-full bg-blue-600 hover:bg-blue-700" 
                                onClick={() => handleStatusChange(selectedOrder.id, 'SENT', 'Manuel olarak gönderildi işaretlendi')}
                              >
                                <Send className="mr-2 h-4 w-4" /> Laboratuvara Gönderildi İşaretle
                              </Button>
                            )}
                            
                            {(selectedOrder.status === 'SENT' || selectedOrder.status === 'IN_PROGRESS') && (
                              !showShippingInput ? (
                                <Button 
                                  className="w-full bg-purple-600 hover:bg-purple-700"
                                  onClick={() => setShowShippingInput(true)}
                                >
                                  <Package className="mr-2 h-4 w-4" /> Kargoya Verildi / Yolda
                                </Button>
                              ) : (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Kargo Takip Numarası</Label>
                                    <Input 
                                      value={shippingInput}
                                      onChange={(e) => setShippingInput(e.target.value)}
                                      placeholder="Takip no giriniz..."
                                      className="bg-white h-8 text-sm"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => setShowShippingInput(false)}
                                    >
                                      İptal
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      className="bg-purple-600 hover:bg-purple-700 text-white"
                                      onClick={() => handleStatusChange(selectedOrder.id, 'SHIPPED', 'Kargoya verildi')}
                                    >
                                      Kaydet
                                    </Button>
                                  </div>
                                </div>
                              )
                            )}

                            {(selectedOrder.status === 'SHIPPED' || selectedOrder.status === 'REVIEWED') && (
                              <Button 
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => handleStatusChange(selectedOrder.id, 'COMPLETED', 'Teslim alındı ve kontrol edildi')}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Teslim Alındı (Tamamla)
                              </Button>
                            )}

                            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                              <Upload className="mr-2 h-4 w-4" /> Görsel / Dosya Ekle
                            </Button>
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              onChange={handleFileUpload}
                              accept="image/*,.pdf"
                            />
                          </div>

                          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-amber-800 text-xs">
                            <div className="font-semibold mb-1 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Durum Bilgisi
                            </div>
                            Mevcut durum: <strong>
                              {selectedOrder.status === 'PENDING' ? 'Hazırlanıyor (Dosya Bekliyor)' : 
                               selectedOrder.status === 'PREPARED' ? 'Hazırlandı (Gönderime Hazır)' :
                               selectedOrder.status === 'SENT' ? 'Laboratuvara İletildi' : 
                               selectedOrder.status === 'REVIEWED' ? 'Hekim İnceledi' :
                               selectedOrder.status}
                            </strong>. 
                            {selectedOrder.status === 'PENDING' && " İş emrini göndermeden önce gerekli görselleri eklemeniz önerilir."}
                            {selectedOrder.status === 'PREPARED' && " Tüm dosyalar tamam, laboratuvara gönderebilirsiniz."}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="attachments" className="mt-0">
                      {selectedOrder.attachments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                          <ImageIcon className="h-10 w-10 mb-3 opacity-50" />
                          <p>Henüz dosya yüklenmemiş.</p>
                          <Button variant="link" onClick={() => fileInputRef.current?.click()}>
                            Dosya Yükle
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {selectedOrder.attachments.map((file) => (
                            <div key={file.id} className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                              {file.type === 'image' ? (
                                <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <FileText className="h-8 w-8 text-slate-400" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate">
                                {file.name}
                              </div>
                            </div>
                          ))}
                          <button 
                            className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg hover:bg-slate-50 transition-colors aspect-square"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Plus className="h-6 w-6 text-slate-400" />
                            <span className="text-xs text-slate-500 mt-1">Yeni Ekle</span>
                          </button>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="timeline" className="mt-0">
                      <div className="space-y-6 pl-2">
                        {selectedOrder.timeline.map((event, idx) => (
                          <div key={idx} className="relative pl-6 pb-6 border-l last:pb-0 border-slate-200">
                            <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-white" />
                            <div className="flex flex-col gap-1">
                              <div className="text-sm font-semibold text-slate-900">
                                {event.status === 'PENDING' ? 'Oluşturuldu' : 
                                 event.status === 'SENT' ? 'Gönderildi' :
                                 event.status === 'IN_PROGRESS' ? 'İşleme Alındı' :
                                 event.status === 'SHIPPED' ? 'Kargolandı' :
                                 event.status === 'COMPLETED' ? 'Tamamlandı' : event.status}
                              </div>
                              <div className="text-xs text-slate-500">
                                {new Date(event.date).toLocaleDateString('tr-TR')} • {event.user || 'Sistem'}
                              </div>
                              {event.note && (
                                <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded mt-1">
                                  {event.note}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
              <DialogFooter className="px-6 py-4 border-t bg-slate-50/50">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Kapat</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
