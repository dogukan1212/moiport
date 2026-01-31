"use client";

import { useState, useMemo } from "react";
import {
  format,
  parseISO,
  differenceInDays,
  addDays,
  isSameDay,
  isBefore,
  isAfter,
} from "date-fns";
import { tr } from "date-fns/locale";
import {
  Hotel as HotelIcon,
  BedDouble,
  Calendar,
  Clock,
  MapPin,
  MoreVertical,
  Plus,
  User,
  Users,
  CheckCircle2,
  LogOut,
  LogIn,
  AlertCircle,
  CreditCard,
  Wifi,
  Coffee,
  Utensils,
  Car,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  hotels,
  initialAccommodations,
  patients,
  type Accommodation,
  type Hotel,
  type AccommodationStatus,
} from "../data";

export default function AccommodationPage() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>(initialAccommodations);
  const [hotelsList, setHotelsList] = useState<Hotel[]>(hotels);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

  // New Hotel Form State
  const [newHotelName, setNewHotelName] = useState("");
  const [newHotelStars, setNewHotelStars] = useState(4);
  const [newHotelLocation, setNewHotelLocation] = useState("");
  const [newHotelTotalCapacity, setNewHotelTotalCapacity] = useState(100);
  const [newHotelContractedRooms, setNewHotelContractedRooms] = useState(10);
  const [newHotelAmenities, setNewHotelAmenities] = useState(""); // Comma separated string

  // Modal Form State
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedHotel, setSelectedHotel] = useState("");
  const [roomType, setRoomType] = useState<"SINGLE" | "DOUBLE" | "SUITE">("SINGLE");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [companionCount, setCompanionCount] = useState(0);

  // Metrics Calculation
  const metrics = useMemo(() => {
    const today = new Date();
    const active = accommodations.filter(
      (a) => a.status === "CHECKED_IN"
    ).length;
    
    const pendingCheckIn = accommodations.filter((a) => {
        const d = parseISO(a.checkInDate);
        return isSameDay(d, today) && a.status === "CHECK_IN_PENDING";
    }).length;

    const pendingCheckOut = accommodations.filter((a) => {
        const d = parseISO(a.checkOutDate);
        return isSameDay(d, today) && (a.status === "CHECKED_IN" || a.status === "CHECK_OUT_PENDING");
    }).length;

    const totalContracted = hotelsList.reduce((acc, h) => acc + h.contractedRooms, 0);
    const totalOccupied = accommodations.filter(a => a.status === "CHECKED_IN").length;
    const occupancyRate = totalContracted > 0 ? Math.round((totalOccupied / totalContracted) * 100) : 0;

    return { active, pendingCheckIn, pendingCheckOut, occupancyRate, totalContracted, totalOccupied };
  }, [accommodations, hotelsList]);

  const handleCreateHotel = () => {
    if (!newHotelName || !newHotelLocation) {
        toast.error("Otel adı ve konumu zorunludur.");
        return;
    }

    const newHotel: Hotel = {
        id: Math.random().toString(36).substr(2, 9),
        name: newHotelName,
        stars: newHotelStars,
        location: newHotelLocation,
        totalCapacity: newHotelTotalCapacity,
        contractedRooms: newHotelContractedRooms,
        occupiedRooms: 0,
        amenities: newHotelAmenities.split(",").map(s => s.trim()).filter(Boolean),
        images: ["/hotel-1.jpg"], // Placeholder image
    };

    setHotelsList([...hotelsList, newHotel]);
    setIsHotelModalOpen(false);
    toast.success("Yeni otel eklendi.");
    resetHotelForm();
  };

  const resetHotelForm = () => {
    setNewHotelName("");
    setNewHotelStars(4);
    setNewHotelLocation("");
    setNewHotelTotalCapacity(100);
    setNewHotelContractedRooms(10);
    setNewHotelAmenities("");
  };

  const handleCreateAccommodation = () => {
    if (!selectedPatient || !selectedHotel || !checkInDate || !checkOutDate) {
      toast.error("Lütfen zorunlu alanları doldurunuz.");
      return;
    }

    const newAcc: Accommodation = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: selectedPatient,
      hotelId: selectedHotel,
      roomType,
      checkInDate: new Date(checkInDate).toISOString(),
      checkOutDate: new Date(checkOutDate).toISOString(),
      roomNumber,
      companionCount,
      status: "CHECK_IN_PENDING",
      extras: [],
    };

    setAccommodations([...accommodations, newAcc]);
    setIsModalOpen(false);
    toast.success("Konaklama kaydı oluşturuldu.");
    resetForm();
  };

  const resetForm = () => {
    setSelectedPatient("");
    setSelectedHotel("");
    setRoomType("SINGLE");
    setCheckInDate("");
    setCheckOutDate("");
    setRoomNumber("");
    setCompanionCount(0);
  };

  const getPatientName = (id: string) => patients.find((p) => p.id === id)?.name || "Bilinmeyen Hasta";

  const getTimelineProgress = (acc: Accommodation) => {
    const start = parseISO(acc.checkInDate);
    const end = parseISO(acc.checkOutDate);
    const now = new Date();
    const totalDuration = differenceInDays(end, start);
    const elapsed = differenceInDays(now, start);
    
    if (elapsed < 0) return 0;
    if (elapsed > totalDuration) return 100;
    return (elapsed / totalDuration) * 100;
  };

  const getStatusBadge = (status: AccommodationStatus) => {
    switch (status) {
      case "CHECKED_IN":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Otelde</Badge>;
      case "CHECK_IN_PENDING":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Giriş Bekliyor</Badge>;
      case "CHECK_OUT_PENDING":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Çıkış Yapacak</Badge>;
      case "CHECKED_OUT":
        return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">Ayrıldı</Badge>;
      default:
        return <Badge variant="outline">İptal</Badge>;
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-6 p-4">
      {/* Header & Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Konaklayanlar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active}</div>
            <p className="text-xs text-muted-foreground">Şu an otelde olan misafirler</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-in Bekleyenler</CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingCheckIn}</div>
            <p className="text-xs text-muted-foreground">Bugün giriş yapacaklar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-out Yapacaklar</CardTitle>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingCheckOut}</div>
            <p className="text-xs text-muted-foreground">Bugün ayrılacaklar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doluluk Oranı</CardTitle>
            <HotelIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{metrics.occupancyRate}</div>
            <Progress value={metrics.occupancyRate} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalOccupied} / {metrics.totalContracted} anlaşmalı oda
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Otel & Oda Yönetimi</h2>
          <p className="text-muted-foreground">
            Anlaşmalı oteller, oda atamaları ve konaklama süreçlerini yönetin.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Dialog open={isHotelModalOpen} onOpenChange={setIsHotelModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" onClick={resetHotelForm}>
                        <HotelIcon className="mr-2 h-4 w-4" /> Yeni Otel Ekle
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Yeni Otel Ekle</DialogTitle>
                        <DialogDescription>
                            Sisteme yeni bir anlaşmalı otel tanımlayın.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Otel Adı</Label>
                            <Input 
                                className="col-span-3" 
                                value={newHotelName}
                                onChange={(e) => setNewHotelName(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Yıldız</Label>
                            <Select value={newHotelStars.toString()} onValueChange={(v) => setNewHotelStars(Number(v))}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3">3 Yıldız</SelectItem>
                                    <SelectItem value="4">4 Yıldız</SelectItem>
                                    <SelectItem value="5">5 Yıldız</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Konum</Label>
                            <Input 
                                className="col-span-3" 
                                placeholder="İlçe, Şehir"
                                value={newHotelLocation}
                                onChange={(e) => setNewHotelLocation(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Anlaşmalı Oda</Label>
                            <Input 
                                type="number"
                                className="col-span-3" 
                                value={newHotelContractedRooms}
                                onChange={(e) => setNewHotelContractedRooms(Number(e.target.value))}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Özellikler</Label>
                            <Input 
                                className="col-span-3" 
                                placeholder="Virgülle ayırın (WiFi, Kahvaltı...)"
                                value={newHotelAmenities}
                                onChange={(e) => setNewHotelAmenities(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsHotelModalOpen(false)}>İptal</Button>
                        <Button onClick={handleCreateHotel}>Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button onClick={resetForm} className="bg-[#00e676] text-black hover:bg-[#00c853]">
                        <Plus className="mr-2 h-4 w-4" /> Yeni Konaklama
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Yeni Konaklama Kaydı</DialogTitle>
                        <DialogDescription>
                            Hasta için otel ve oda rezervasyonu oluşturun.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Hasta</Label>
                            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Hasta seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    {patients.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Otel</Label>
                            <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Otel seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hotelsList.map((h) => (
                                        <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Oda Tipi</Label>
                            <Select value={roomType} onValueChange={(v: any) => setRoomType(v)}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SINGLE">Single</SelectItem>
                                    <SelectItem value="DOUBLE">Double</SelectItem>
                                    <SelectItem value="SUITE">Suite</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Giriş/Çıkış</Label>
                            <div className="col-span-3 flex gap-2">
                                <Input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} />
                                <Input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Oda No</Label>
                            <Input 
                                className="col-span-3" 
                                placeholder="Henüz belli değilse boş bırakın"
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                            />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Refakatçi</Label>
                            <Input 
                                type="number"
                                className="col-span-3" 
                                value={companionCount}
                                onChange={(e) => setCompanionCount(Number(e.target.value))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
                        <Button onClick={handleCreateAccommodation}>Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {hotelsList.map((hotel) => {
                const hotelAccommodations = accommodations.filter(a => a.hotelId === hotel.id);
                
                return (
                    <Card key={hotel.id} className="flex flex-col h-full overflow-hidden border-t-4 border-t-emerald-500 shadow-md">
                        <CardHeader className="bg-slate-50 pb-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {hotel.name}
                                        <Badge variant="secondary" className="text-xs font-normal">
                                            {hotel.stars} Yıldız
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-1 mt-1">
                                        <MapPin className="h-3 w-3" /> {hotel.location}
                                    </CardDescription>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-slate-700">
                                        {hotelAccommodations.filter(a => a.status === 'CHECKED_IN').length}
                                        <span className="text-sm font-normal text-muted-foreground">/{hotel.contractedRooms}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">Dolu Oda</div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {hotel.amenities.slice(0, 3).map((amenity, i) => (
                                    <Badge key={i} variant="outline" className="bg-white text-[10px] text-slate-500 border-slate-200">
                                        {amenity}
                                    </Badge>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0">
                            <ScrollArea className="h-[400px]">
                                <div className="divide-y divide-slate-100">
                                    {hotelAccommodations.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground text-sm">
                                            Bu otelde aktif konaklama yok.
                                        </div>
                                    ) : (
                                        hotelAccommodations.map((acc) => {
                                            const patient = patients.find(p => p.id === acc.patientId);
                                            const progress = getTimelineProgress(acc);
                                            
                                            return (
                                                <div key={acc.id} className="p-4 hover:bg-slate-50 transition-colors group">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                                <User className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-sm text-slate-900">
                                                                    {patient?.name}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                                    <span className="flex items-center gap-1">
                                                                        <BedDouble className="h-3 w-3" />
                                                                        {acc.roomType}
                                                                    </span>
                                                                    {acc.roomNumber && (
                                                                        <Badge variant="outline" className="h-4 px-1 text-[10px]">
                                                                            Oda: {acc.roomNumber}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {getStatusBadge(acc.status)}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-xs text-slate-500">
                                                            <span>Giriş: {format(parseISO(acc.checkInDate), "d MMM", { locale: tr })}</span>
                                                            <span>Çıkış: {format(parseISO(acc.checkOutDate), "d MMM", { locale: tr })}</span>
                                                        </div>
                                                        <div className="relative pt-1">
                                                            <Progress value={progress} className="h-1.5" />
                                                        </div>
                                                        <div className="flex items-center justify-between pt-1">
                                                            {acc.companionCount > 0 && (
                                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                                    <Users className="h-3 w-3" /> +{acc.companionCount} Refakatçi
                                                                </div>
                                                            )}
                                                            <div className="flex gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button size="icon" variant="ghost" className="h-6 w-6" title="Süreyi Uzat">
                                                                    <Clock className="h-3 w-3" />
                                                                </Button>
                                                                <Button size="icon" variant="ghost" className="h-6 w-6" title="Ekstra Ekle">
                                                                    <CreditCard className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="bg-slate-50 p-3 border-t text-xs text-muted-foreground flex justify-between">
                            <span className="flex items-center gap-1">
                                <Wifi className="h-3 w-3" /> Free WiFi
                            </span>
                            <span className="flex items-center gap-1">
                                <Coffee className="h-3 w-3" /> Kahvaltı Dahil
                            </span>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
      </div>
    </div>
  );
}