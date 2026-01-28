"use client";

import Link from "next/link";
import { AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4 text-center">
      <div className="flex flex-col items-center max-w-md space-y-6">
        <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
            <div className="relative bg-zinc-900 p-6 rounded-2xl border border-red-500/20">
                <Lock className="w-16 h-16 text-red-500" />
            </div>
        </div>
        
        <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Hesabınız Askıya Alındı</h1>
            <p className="text-zinc-400">
            Bu hesaba erişim geçici olarak durdurulmuştur. Ödenmemiş faturalar veya kullanım politikası ihlalleri nedeniyle bu işlem yapılmış olabilir.
            </p>
        </div>

        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left w-full">
            <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-sm font-medium text-red-200">Ne yapmalıyım?</p>
                    <p className="text-xs text-red-200/60">
                        Lütfen sistem yöneticisi ile veya destek ekibi ile iletişime geçin.
                    </p>
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
            <Link href="/dashboard/subscriptions" className="w-full">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-base">
                    Ödeme Bilgilerini Güncelle
                </Button>
            </Link>
            
            <div className="flex gap-4 w-full">
                <Link href="/login" className="w-full">
                    <Button variant="outline" className="w-full border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white">
                        Çıkış Yap
                    </Button>
                </Link>
                <Link href="mailto:destek@moiport.com" className="w-full">
                    <Button variant="outline" className="w-full border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white">
                        Destek
                    </Button>
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
