"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight } from "lucide-react";

export default function PatientLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [passportId, setPassportId] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      router.push("/portal");
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="h-16 w-16 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-emerald-200">
            <span className="text-white text-2xl font-bold">H</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Health Tourism</h1>
          <p className="text-sm text-slate-500">Hasta Portalı Girişi</p>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle>Giriş Yap</CardTitle>
            <CardDescription>
              Size verilen pasaport numarası veya telefon numarası ile giriş yapın.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passport">Pasaport / Dosya No</Label>
                <Input 
                  id="passport" 
                  placeholder="Örn: P-12345" 
                  value={passportId}
                  onChange={(e) => setPassportId(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Giriş Yapılıyor...
                  </>
                ) : (
                  <>
                    Giriş Yap
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-400">
          Giriş yapmakta sorun mu yaşıyorsunuz? <br />
          <a href="#" className="text-emerald-600 hover:underline">Destek ekibiyle iletişime geçin</a>
        </p>
      </div>
    </div>
  );
}
