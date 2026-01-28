'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Loader2, ExternalLink, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

type GoogleCalendarConfig = {
  tenantId: string;
  email: string | null;
  isActive: boolean;
  hasRefreshToken: boolean;
  primaryCalendar: string | null;
};

type GoogleCalendarEvent = {
  id: string | null;
  status: string | null;
  summary: string | null;
  description: string | null;
  htmlLink: string | null;
  hangoutLink: string | null;
  start: { dateTime?: string; date?: string } | null;
  end: { dateTime?: string; date?: string } | null;
  attendees: Array<{
    email: string | null;
    responseStatus: string | null;
    organizer: boolean;
    self: boolean;
  }>;
};

export default function CalendarPage() {
  const [config, setConfig] = useState<GoogleCalendarConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [testing, setTesting] = useState(false);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [month, setMonth] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => new Date());
  const router = useRouter();
  const isReady = !!config && config.isActive && config.hasRefreshToken;

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

  const range = useMemo(() => {
    const rangeStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const rangeEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return { rangeStart, rangeEnd };
  }, [month]);

  const fetchEvents = useCallback(async () => {
    if (!isReady) return;
    setLoadingEvents(true);
    try {
      const res = await api.get('/integrations/google-calendar/events', {
        params: {
          timeMin: range.rangeStart.toISOString(),
          timeMax: range.rangeEnd.toISOString(),
          maxResults: 250,
        },
      });
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      setEvents(items);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Etkinlikler alınamadı.';
      toast.error(msg);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [isReady, range.rangeEnd, range.rangeStart]);

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

  useEffect(() => {
    if (isReady) fetchEvents();
    else setEvents([]);
  }, [isReady, fetchEvents]);

  const getEventStartMs = (evt: GoogleCalendarEvent) => {
    const raw = evt.start?.dateTime || evt.start?.date || '';
    const d = raw ? new Date(raw) : null;
    if (!d || Number.isNaN(d.getTime())) return null;
    return d.getTime();
  };

  const eventsByDay = useMemo(() => {
    const map = new Map<string, GoogleCalendarEvent[]>();
    for (const evt of events) {
      const startRaw = evt.start?.dateTime || evt.start?.date || '';
      const d = startRaw ? new Date(startRaw) : null;
      if (!d || Number.isNaN(d.getTime())) continue;
      const key = format(d, 'yyyy-MM-dd');
      const arr = map.get(key) || [];
      arr.push(evt);
      map.set(key, arr);
    }
    for (const [key, arr] of map.entries()) {
      arr.sort((a, b) => {
        const aMs = getEventStartMs(a) ?? 0;
        const bMs = getEventStartMs(b) ?? 0;
        return aMs - bMs;
      });
      map.set(key, arr);
    }
    return map;
  }, [events]);

  const selectedKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const selectedEvents = selectedKey ? eventsByDay.get(selectedKey) || [] : [];

  const kpis = useMemo(() => {
    const now = Date.now();
    const next7 = now + 7 * 24 * 60 * 60 * 1000;
    const total = events.length;
    const upcoming7 = events.filter((e) => {
      const ms = getEventStartMs(e);
      return typeof ms === 'number' && ms >= now && ms < next7;
    }).length;
    const withMeet = events.filter((e) => !!e.hangoutLink).length;
    return { total, upcoming7, withMeet };
  }, [events]);

  const formatEventTime = (evt: GoogleCalendarEvent) => {
    const startRaw = evt.start?.dateTime || evt.start?.date || '';
    const endRaw = evt.end?.dateTime || evt.end?.date || '';
    const start = startRaw ? new Date(startRaw) : null;
    const end = endRaw ? new Date(endRaw) : null;
    if (!start || Number.isNaN(start.getTime())) return '';
    const startText = start.toLocaleString('tr-TR', {
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: evt.start?.dateTime ? '2-digit' : undefined,
      minute: evt.start?.dateTime ? '2-digit' : undefined,
    });
    if (!end || Number.isNaN(end.getTime())) return startText;
    const endText = end.toLocaleTimeString('tr-TR', {
      hour: evt.end?.dateTime ? '2-digit' : undefined,
      minute: evt.end?.dateTime ? '2-digit' : undefined,
    });
    return evt.start?.dateTime ? `${startText} - ${endText}` : startText;
  };

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-slate-500">Bu ayki etkinlik</div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {isReady ? kpis.total : '—'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">7 günde yaklaşan</div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {isReady ? kpis.upcoming7 : '—'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Meet toplantısı</div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {isReady ? kpis.withMeet : '—'}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
        <Card className="p-6 space-y-4">
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-500" />
              Takvim
            </CardTitle>
            <CardDescription>
              Etkinlikleri Google Calendar API üzerinden uygulama içinde görüntüleyin.
            </CardDescription>
          </CardHeader>

          {!isReady ? (
            <div className="rounded-lg border border-dashed border-amber-400 bg-amber-50 dark:bg-amber-900/10 p-4 flex flex-col gap-3">
              <div className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Google Calendar entegrasyonu hazır değil.
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300">
                Etkinlikleri görüntülemek için önce Ayarlar &gt; Google Calendar sekmesinden hesabı bağlayıp entegrasyonu aktif etmelisiniz.
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/dashboard/settings?tab=google-calendar')}
                >
                  Google Calendar Ayarlarına Git
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-6">
              <div className="rounded-lg border border-slate-200 dark:border-slate-800">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={month}
                  onMonthChange={setMonth}
                  modifiers={{
                    hasEvents: (date) => {
                      const key = format(date, 'yyyy-MM-dd');
                      return (eventsByDay.get(key)?.length || 0) > 0;
                    },
                    today: new Date(),
                  }}
                  modifiersClassNames={{
                    hasEvents:
                      'bg-indigo-50 dark:bg-indigo-500/15 text-slate-900 dark:text-slate-50',
                  }}
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {selectedDate ? selectedDate.toLocaleDateString('tr-TR') : 'Seçili gün'}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchEvents}
                      disabled={!isReady || loadingEvents}
                    >
                      {loadingEvents && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Yenile
                    </Button>
                    <Button type="button" variant="outline" size="sm" asChild>
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
                </div>

                {loadingEvents ? (
                  <div className="flex items-center justify-center min-h-[160px]">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                  </div>
                ) : selectedEvents.length === 0 ? (
                  <div className="text-sm text-slate-500 mt-3">Seçili günde etkinlik yok.</div>
                ) : (
                  <div className="space-y-3 mt-3">
                    {selectedEvents.map((evt) => (
                      <div
                        key={evt.id || `${evt.summary || 'event'}-${evt.start?.dateTime || evt.start?.date || ''}`}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                              {evt.summary || 'Başlıksız etkinlik'}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {formatEventTime(evt)}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {evt.hangoutLink && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={evt.hangoutLink} target="_blank" rel="noreferrer">
                                  <Video className="h-4 w-4 mr-1" />
                                  Meet
                                </a>
                              </Button>
                            )}
                            {evt.htmlLink && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={evt.htmlLink} target="_blank" rel="noreferrer">
                                  Aç
                                  <ExternalLink className="h-4 w-4 ml-1" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
