"use client";

import Link from "next/link";
import { Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExpiredPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4 text-center">
      <div className="flex flex-col items-center max-w-md space-y-8">
        <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full"></div>
            <div className="relative bg-zinc-900 p-6 rounded-2xl border border-amber-500/20">
                <Clock className="w-16 h-16 text-amber-500" />
            </div>
        </div>
        
        <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">Abonelik Süreniz Doldu</h1>
            <p className="text-zinc-400">
            Mevcut paketinizin kullanım süresi sona ermiştir. Kesintisiz hizmet almaya devam etmek için lütfen aboneliğinizi yenileyin.
            </p>
        </div>

        <div className="w-full space-y-4">
            <Link href="/dashboard/subscriptions" className="w-full block">
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white h-14 text-lg rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]">
                    <RefreshCw className="mr-2 w-5 h-5" /> Aboneliği Yenile
                </Button>
            </Link>
            
            <div className="pt-4">
                <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                    Farklı bir hesapla giriş yap
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
