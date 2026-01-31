"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  FileText, 
  MapPin, 
  MessageCircle, 
  ChevronRight, 
  Bell, 
  User, 
  Plane,
  Home,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function PortalDashboard() {
  const [activeTab, setActiveTab] = useState("home");

  // Mock Data
  const patientName = "Ahmet Yılmaz";
  const treatment = "Saç Ekimi (FUE)";
  const nextEvent = {
    title: "VIP Transfer - Otel",
    time: "Bugün, 14:30",
    status: "CONFIRMED"
  };

  const timeline = [
    { time: "09:30", title: "İstanbul'a Varış", status: "completed" },
    { time: "10:15", title: "Havalimanı Karşılama", status: "completed" },
    { time: "14:30", title: "Otele Transfer", status: "upcoming" },
    { time: "16:00", title: "Dr. Muayenesi", status: "upcoming" },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white p-6 pb-4 sticky top-0 z-10 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              AY
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Merhaba, {patientName.split(" ")[0]}</h1>
              <p className="text-xs text-slate-500">Hoş geldiniz</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-slate-600" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full" />
          </Button>
        </div>

        {/* Next Event Card */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg shadow-slate-200">
          <div className="flex items-center justify-between mb-2">
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 text-[10px]">
              SIRADAKİ ADIM
            </Badge>
            <span className="text-xs text-slate-300">{nextEvent.time}</span>
          </div>
          <h3 className="font-semibold text-lg">{nextEvent.title}</h3>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <div className="flex -space-x-2">
              <div className="h-6 w-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[8px]">
                TR
              </div>
            </div>
            <span>Transfer ekibi yolda</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-6 pb-20">
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-white border-slate-100 shadow-sm active:scale-95 transition-transform cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-slate-700">Belgelerim</span>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-100 shadow-sm active:scale-95 transition-transform cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-slate-700">Asistanım</span>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-100 shadow-sm active:scale-95 transition-transform cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-slate-700">Transfer</span>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-100 shadow-sm active:scale-95 transition-transform cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-slate-700">Takvim</span>
              </CardContent>
            </Card>
          </div>

          {/* Today's Timeline */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Plane className="h-4 w-4 text-slate-500" />
              Bugünün Akışı
            </h3>
            <div className="relative pl-4 border-l-2 border-slate-200 space-y-6">
              {timeline.map((item, i) => (
                <div key={i} className="relative pl-6">
                  <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white ${
                    item.status === 'completed' ? 'bg-emerald-500' : 
                    item.status === 'upcoming' ? 'bg-slate-300' : 'bg-amber-500'
                  }`} />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500">{item.time}</span>
                    <span className={`text-sm font-medium ${item.status === 'completed' ? 'text-slate-900 line-through opacity-60' : 'text-slate-900'}`}>
                      {item.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100">
            <h4 className="font-semibold text-emerald-800 text-sm mb-1">Ameliyat Hazırlığı</h4>
            <p className="text-xs text-emerald-600 leading-relaxed">
              Yarın sabah 08:00'deki operasyonunuz için bu akşam 22:00'den sonra yeme-içmeyi kesmeniz gerekmektedir.
            </p>
          </div>

        </div>
      </ScrollArea>

      {/* Bottom Nav */}
      <div className="bg-white border-t border-slate-100 p-3 flex items-center justify-around pb-6">
        <Button variant="ghost" size="icon" className="flex flex-col gap-1 h-auto text-emerald-600">
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">Ana Sayfa</span>
        </Button>
        <Button variant="ghost" size="icon" className="flex flex-col gap-1 h-auto text-slate-400">
          <Calendar className="h-5 w-5" />
          <span className="text-[10px] font-medium">Takvim</span>
        </Button>
        <div className="relative -top-6">
          <Button className="h-12 w-12 rounded-full bg-emerald-600 shadow-lg shadow-emerald-200 hover:bg-emerald-700 p-0 flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-white" />
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="flex flex-col gap-1 h-auto text-slate-400">
          <FileText className="h-5 w-5" />
          <span className="text-[10px] font-medium">Dosyalar</span>
        </Button>
        <Button variant="ghost" size="icon" className="flex flex-col gap-1 h-auto text-slate-400">
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">Profil</span>
        </Button>
      </div>
    </div>
  );
}
