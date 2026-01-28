'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Loader2, ExternalLink, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type GoogleCalendarConfig = {
  tenantId: string;
  email: string | null;
  isActive: boolean;
  hasRefreshToken: boolean;
  primaryCalendar: string | null;
};

export default function CalendarPage() {
  const [config, setConfig] = useState<GoogleCalendarConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [testing, setTesting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoadingConfig(true);
        const res = await api.get('/integrations/google-calendar/config');
        setConfig(res.data || null);
      } catch (error) {
        setConfig(null);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await api.get('/integrations/google-calendar/test');
      const email = res?.data?.email;
      const count = res?.data?.calendarCount;
      const parts: string[] = [];
      if (email) parts.push(`Hesap: ${email}`);
      if (typeof count === 'number') parts.push(`Takvim sayısı: ${count}`);
      toast.success('Google Calendar bağlantısı başarılı.', {
        description: parts.join(' • ') || undefined,
      });
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Google Calendar bağlantısı doğrulanamadı.';
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const isReady = !!config && config.isActive && config.hasRefreshToken;

  return (
    <div className="h-full flex flex-col gap-8">
      <div>
        <h1 className="text-[28px] font-normal tracking-[-0.03em] text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-slate-900 dark:text-slate-50" />
          <span>Takvim</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-300 text-sm mt-2">
          Ajansınızın Google Calendar entegrasyon durumunu görün ve toplantı planlama ekranına hızlı
          erişin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
        <Card className="p-6 space-y-4">
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-500" />
              Google Calendar Entegrasyonu
            </CardTitle>
            <CardDescription>
              Bağlı Google hesabı ve entegrasyon durumu hakkında özet bilgi.
            </CardDescription>
          </CardHeader>

          {loadingConfig ? (
            <div className="flex items-center justify-center min-h-[80px]">
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            </div>
          ) : config ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Bağlı Google hesabı</span>
                <span className="font-medium">
                  {config.email || 'Henüz hesap bağlanmamış'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Durum</span>
                <span
                  className={
                    isReady ? 'font-medium text-emerald-600' : 'font-medium text-amber-600'
                  }
                >
                  {isReady ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Varsayılan Takvim</span>
                <span className="font-medium">
                  {config.primaryCalendar || 'primary'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              Entegrasyon bilgisi alınamadı. Lütfen daha sonra tekrar deneyin.
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/settings?tab=google-calendar')}
            >
              Ayarları Aç
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Bağlantıyı Test Et
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-5 w-5 text-indigo-500" />
              Toplantı Planlama
            </CardTitle>
            <CardDescription>
              Google Meet ile yeni toplantılar oluşturmak için özel ekrana geçiş yapın.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Toplantılar ekranından ajans veya müşteri toplantılarınızı planlayabilir, Google
              Calendar takviminize ekleyebilir ve otomatik Meet bağlantısı oluşturabilirsiniz.
            </p>

            <div className="flex gap-2">
              <Button
                className="bg-black text-white hover:bg-neutral-900"
                onClick={() => router.push('/dashboard/meetings')}
              >
                Toplantı Oluşturma Ekranına Git
              </Button>
              <Button
                type="button"
                variant="outline"
                asChild
              >
                <a
                  href="https://calendar.google.com/calendar/u/0/r/week"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center"
                >
                  Google Calendar&apos;ı Aç
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

