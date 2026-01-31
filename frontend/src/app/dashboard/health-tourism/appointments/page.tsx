"use client";

import { useState, useMemo, useEffect } from "react";
import {
  format,
  addDays,
  subDays,
  startOfDay,
  isSameDay,
  parseISO,
  differenceInMinutes,
  addMinutes,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
} from "date-fns";
import { tr } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  Plus,
  AlertTriangle,
  Info,
} from "lucide-react";

import { DndContext, useDraggable, useDroppable, type DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  doctors,
  rooms,
  initialAppointments,
  patients,
  type Appointment,
  type Doctor,
  type Room,
  type AppointmentStatus,
} from "../data";

// --- Draggable & Droppable Components ---

function DraggableAppointment({
  apt,
  style,
  children,
  onClick,
}: {
  apt: Appointment;
  style: React.CSSProperties;
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: apt.id,
    data: { apt },
  });

  const combinedStyle: React.CSSProperties = {
    ...style,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 50 : 10,
    opacity: isDragging ? 0.8 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={combinedStyle}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function DroppableSlot({
  id,
  children,
  onClick,
}: {
  id: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-[60px] border-b border-slate-100 transition-colors cursor-pointer relative",
        isOver ? "bg-slate-100 ring-2 ring-inset ring-slate-200" : "hover:bg-slate-50"
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default function AppointmentsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"DOCTOR" | "ROOM">("DOCTOR");
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Appointment Form State
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // YYYY-MM-DD
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [appointmentType, setAppointmentType] = useState("");
  const [notes, setNotes] = useState("");

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10, // 10px movement required to start drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Notification Check (1 hour before)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      appointments.forEach((apt) => {
        const aptTime = parseISO(apt.startTime);
        const diff = differenceInMinutes(aptTime, now);
        if (diff > 59 && diff <= 60) {
          toast.info(`Hatırlatma: ${apt.type} randevusuna 1 saat kaldı.`, {
            description: `Hasta: ${patients.find((p) => p.id === apt.patientId)?.name}`,
          });
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [appointments]);

  const resources = view === "DOCTOR" ? doctors : rooms;
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00 - 19:00

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) =>
      isSameDay(parseISO(apt.startTime), currentDate)
    );
  }, [appointments, currentDate]);

  const handlePrevDay = () => setCurrentDate((prev) => subDays(prev, 1));
  const handleNextDay = () => setCurrentDate((prev) => addDays(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  const checkConflict = (
    doctorId: string,
    roomId: string,
    start: Date,
    end: Date,
    excludeId?: string
  ) => {
    return appointments.some((apt) => {
      if (excludeId && apt.id === excludeId) return false;
      const aptStart = parseISO(apt.startTime);
      const aptEnd = parseISO(apt.endTime);

      // Check time overlap
      const isTimeOverlap = (start < aptEnd && end > aptStart);

      if (!isTimeOverlap) return false;

      // Check resource overlap
      if (apt.doctorId === doctorId) return true; // Doctor is busy
      if (apt.roomId === roomId) return true; // Room is busy

      return false;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const aptId = active.id as string;
    const overId = over.id as string; // "resourceId|HH:mm"

    // Parse overId
    const [resourceId, timeStr] = overId.split("|");
    
    // Find original appointment
    const apt = appointments.find(a => a.id === aptId);
    if (!apt) return;

    // Calculate new times
    const newDateStr = format(currentDate, "yyyy-MM-dd");
    const newStart = parseISO(`${newDateStr}T${timeStr}:00`);
    
    const oldStart = parseISO(apt.startTime);
    const oldEnd = parseISO(apt.endTime);
    const duration = differenceInMinutes(oldEnd, oldStart);
    
    const newEnd = addMinutes(newStart, duration);

    // Determine new Doctor/Room based on view
    const newDoctorId = view === "DOCTOR" ? resourceId : apt.doctorId;
    const newRoomId = view === "ROOM" ? resourceId : apt.roomId;

    // Check conflict
    if (checkConflict(newDoctorId, newRoomId, newStart, newEnd, aptId)) {
      toast.error("Bu alanda çakışma var, randevu taşınamadı.");
      return;
    }

    // Update appointment
    const updatedApt = {
      ...apt,
      doctorId: newDoctorId,
      roomId: newRoomId,
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString(),
    };

    setAppointments(prev => prev.map(a => a.id === aptId ? updatedApt : a));
    toast.success("Randevu taşındı.");
  };

  const handleCreateAppointment = () => {
    if (!selectedPatient || !selectedDoctor || !selectedRoom || !selectedDate || !startTime || !endTime) {
      toast.error("Lütfen tüm zorunlu alanları doldurunuz.");
      return;
    }

    const startDateTime = parseISO(`${selectedDate}T${startTime}:00`);
    const endDateTime = parseISO(`${selectedDate}T${endTime}:00`);

    if (startDateTime >= endDateTime) {
      toast.error("Bitiş saati başlangıç saatinden sonra olmalıdır.");
      return;
    }

    if (checkConflict(selectedDoctor, selectedRoom, startDateTime, endDateTime, selectedAppointmentId || undefined)) {
      toast.error("Seçilen saat aralığında doktor veya oda müsait değil.");
      return;
    }

    if (selectedAppointmentId) {
      // Edit mode
      const updatedAppointments = appointments.map((apt) =>
        apt.id === selectedAppointmentId
          ? {
              ...apt,
              patientId: selectedPatient,
              doctorId: selectedDoctor,
              roomId: selectedRoom,
              startTime: startDateTime.toISOString(),
              endTime: endDateTime.toISOString(),
              type: appointmentType || "Genel Kontrol",
              status: apt.status, // Keep status or update if needed
              notes: notes,
            }
          : apt
      );
      setAppointments(updatedAppointments);
      toast.success("Randevu güncellendi.");
    } else {
      // Create mode
      const newAppointment: Appointment = {
        id: Math.random().toString(36).substr(2, 9),
        patientId: selectedPatient,
        doctorId: selectedDoctor,
        roomId: selectedRoom,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        type: appointmentType || "Genel Kontrol",
        status: "PENDING",
        notes: notes,
      };
      setAppointments([...appointments, newAppointment]);
      toast.success("Randevu başarıyla oluşturuldu.");
    }

    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedPatient("");
    setSelectedDoctor("");
    setSelectedRoom("");
    setStartTime("09:00");
    setEndTime("10:00");
    setAppointmentType("");
    setNotes("");
    setSelectedAppointmentId(null);
  };

  const handleDeleteAppointment = () => {
    if (selectedAppointmentId) {
        setAppointments(appointments.filter(a => a.id !== selectedAppointmentId));
        toast.success("Randevu silindi.");
        setIsModalOpen(false);
        resetForm();
    }
  }

  const openModalForSlot = (resourceId: string, hour: number) => {
    resetForm();
    setSelectedDate(format(currentDate, "yyyy-MM-dd"));
    setStartTime(`${hour.toString().padStart(2, "0")}:00`);
    setEndTime(`${(hour + 1).toString().padStart(2, "0")}:00`);
    
    if (view === "DOCTOR") {
      setSelectedDoctor(resourceId);
      setSelectedRoom("");
    } else {
      setSelectedRoom(resourceId);
      setSelectedDoctor("");
    }
    
    setIsModalOpen(true);
  };

  const openModalForEdit = (apt: Appointment) => {
      setSelectedAppointmentId(apt.id);
      setSelectedPatient(apt.patientId);
      setSelectedDoctor(apt.doctorId);
      setSelectedRoom(apt.roomId);
      
      const start = parseISO(apt.startTime);
      const end = parseISO(apt.endTime);
      
      setSelectedDate(format(start, "yyyy-MM-dd"));
      setStartTime(format(start, "HH:mm"));
      setEndTime(format(end, "HH:mm"));
      setAppointmentType(apt.type);
      setNotes(apt.notes || "");
      
      setIsModalOpen(true);
  };

  // Helper to calculate position
  const getAppointmentStyle = (apt: Appointment) => {
    const start = parseISO(apt.startTime);
    const end = parseISO(apt.endTime);
    const startHour = getHours(start);
    const startMin = getMinutes(start);
    const durationMins = differenceInMinutes(end, start);

    // Grid starts at 8:00. Each hour is 60px height.
    const startOffset = (startHour - 8) * 60 + startMin;
    const height = durationMins; // 1 min = 1px

    return {
      top: startOffset,
      height: height,
    };
  };

  return (
    <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
      <div className="h-[calc(100vh-2rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-md p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevDay}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="w-32 text-center font-medium">
              {format(currentDate, "d MMMM yyyy", { locale: tr })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextDay}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Bugün
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-md">
            <button
              onClick={() => setView("DOCTOR")}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-sm transition-all",
                view === "DOCTOR"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              Doktor Görünümü
            </button>
            <button
              onClick={() => setView("ROOM")}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-sm transition-all",
                view === "ROOM"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              Oda Görünümü
            </button>
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetForm();
                setSelectedDate(format(currentDate, "yyyy-MM-dd"));
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Randevu
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                    {selectedAppointmentId ? "Randevu Düzenle" : "Yeni Randevu Oluştur"}
                </DialogTitle>
                <DialogDescription>
                  {selectedAppointmentId ? "Randevu detaylarını güncelleyin." : "Gerekli bilgileri girerek randevu oluşturun. Çakışma kontrolü otomatik yapılacaktır."}
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
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.country})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Tarih</Label>
                  <Input
                    type="date"
                    className="col-span-3"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Saat</Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                    <span>-</span>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Doktor</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Doktor seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} ({d.specialty})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Oda</Label>
                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Oda seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} ({r.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">İşlem</Label>
                  <Input
                    className="col-span-3"
                    placeholder="Örn: Saç Ekimi, Kontrol"
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                {selectedAppointmentId && (
                    <Button variant="destructive" onClick={handleDeleteAppointment} className="mr-auto">Sil</Button>
                )}
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
                <Button onClick={handleCreateAppointment}>
                    {selectedAppointmentId ? "Güncelle" : "Oluştur"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col">
        {/* Header Row */}
        <div className="flex border-b">
          <div className="w-16 border-r p-2 bg-slate-50"></div> {/* Time Col Header */}
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${resources.length}, 1fr)` }}>
            {resources.map((res) => (
              <div key={res.id} className="p-3 text-center border-r last:border-r-0 bg-slate-50 font-medium text-slate-700">
                {res.name}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto relative">
          <div className="flex min-h-[720px]"> {/* 12 hours * 60px = 720px */}
            {/* Time Column */}
            <div className="w-16 border-r flex flex-col bg-slate-50 z-10 sticky left-0">
              {hours.map((hour) => (
                <div key={hour} className="h-[60px] border-b text-xs text-slate-500 flex items-start justify-center pt-1">
                  {hour}:00
                </div>
              ))}
            </div>

            {/* Grid Columns */}
            <div className="flex-1 grid relative" style={{ gridTemplateColumns: `repeat(${resources.length}, 1fr)` }}>
              {/* Background Grid Lines */}
              {resources.map((res, colIndex) => (
                <div key={res.id} className="border-r last:border-r-0 relative">
                  {hours.map((hour) => (
                    <DroppableSlot
                      key={hour}
                      id={`${res.id}|${hour.toString().padStart(2, "0")}:00`}
                      onClick={() => openModalForSlot(res.id, hour)}
                    >
                      {/* Empty slot content */}
                    </DroppableSlot>
                  ))}

                  {/* Appointments for this resource */}
                  {filteredAppointments
                    .filter((apt) => (view === "DOCTOR" ? apt.doctorId === res.id : apt.roomId === res.id))
                    .map((apt) => {
                      const { top, height } = getAppointmentStyle(apt);
                      const patient = patients.find((p) => p.id === apt.patientId);
                      const start = parseISO(apt.startTime);
                      const end = parseISO(apt.endTime);
                      
                      return (
                        <DraggableAppointment
                          key={apt.id}
                          apt={apt}
                          style={{ top: `${top}px`, height: `${height}px`, position: "absolute", left: "4px", right: "4px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // If dragging recently occurred, this might still fire depending on dnd-kit config,
                            // but usually drag prevents click.
                            openModalForEdit(apt);
                          }}
                        >
                          <div className={cn(
                            "w-full h-full rounded-lg border shadow-sm p-2 overflow-hidden",
                            "bg-white border-l-4",
                            apt.status === "CONFIRMED" ? "border-l-emerald-500" : "border-l-amber-500"
                          )}>
                            <div className="flex flex-col h-full gap-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {format(start, "HH:mm")} - {format(end, "HH:mm")}
                                </span>
                                {patient?.chronicDiseases && (
                                  <AlertTriangle className="h-3 w-3 text-red-500" />
                                )}
                              </div>
                              <div className="font-medium text-xs text-slate-900 truncate">
                                {patient?.name}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate bg-slate-50 rounded px-1 w-fit">
                                {apt.type}
                              </div>
                            </div>
                          </div>
                        </DraggableAppointment>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </DndContext>
  );
}