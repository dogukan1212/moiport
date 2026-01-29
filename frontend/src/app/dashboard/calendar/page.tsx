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

      <div className="grid grid-cols-1 gap-8 pb-8">
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 xl:col-span-3">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={month}
                    onMonthChange={setMonth}
                    className="p-0"
                    classNames={{
                      month: "space-y-4 w-full",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      row: "flex w-full mt-2",
                      cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-slate-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 dark:[&:has([aria-selected])]:bg-slate-800",
                      day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors",
                      day_selected:
                        "bg-slate-900 text-slate-50 hover:bg-slate-900 hover:text-slate-50 focus:bg-slate-900 focus:text-slate-50 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50 dark:hover:text-slate-900 dark:focus:bg-slate-50 dark:focus:text-slate-900",
                      day_today: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50",
                      day_outside: "text-slate-500 opacity-50 dark:text-slate-400",
                      day_disabled: "text-slate-500 opacity-50 dark:text-slate-400",
                      day_range_middle:
                        "aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50",
                      day_hidden: "invisible",
                    }}
                    modifiers={{
                      hasEvents: (date) => {
                        const key = format(date, 'yyyy-MM-dd');
                        return (eventsByDay.get(key)?.length || 0) > 0;
                      },
                    }}
                    modifiersClassNames={{
                      hasEvents:
                        'font-bold text-indigo-600 dark:text-indigo-400 after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-indigo-600 after:rounded-full dark:after:bg-indigo-400',
                    }}
                  />
                </div>
              </div>

              <div className="lg:col-span-8 xl:col-span-9 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-6">
                  <div className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                    {selectedDate ? selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }) : 'Bir gün seçin'}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchEvents}
                      disabled={!isReady || loadingEvents}
                      className="h-9"
                    >
                      {loadingEvents && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Yenile
                    </Button>
                    <Button type="button" variant="outline" size="sm" asChild className="h-9">
                      <a
                        href="https://calendar.google.com/calendar/u/0/r/week"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center"
                      >
                        Google Calendar
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>

                {loadingEvents ? (
                  <div className="flex items-center justify-center min-h-[240px] border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : selectedEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[240px] border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-center p-8">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <CalendarIcon className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">Etkinlik Yok</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                      Seçili günde planlanmış bir etkinlik veya toplantı bulunmuyor.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedEvents.map((evt) => (
                      <div
                        key={evt.id || `${evt.summary || 'event'}-${evt.start?.dateTime || evt.start?.date || ''}`}
                        className="group relative flex flex-col sm:flex-row gap-4 sm:gap-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 sm:p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="flex flex-row sm:flex-col items-center sm:items-center gap-3 sm:gap-0 shrink-0 sm:w-16 pt-0 sm:pt-1">
                          <span className="text-xs font-medium text-slate-500 uppercase">
                            {evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Tüm Gün'}
                          </span>
                          {evt.end?.dateTime && (
                            <>
                              <div className="hidden sm:block w-px h-full bg-slate-200 dark:bg-slate-800 my-2" />
                              <span className="hidden sm:block text-xs text-slate-400">
                                {new Date(evt.end.dateTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="sm:hidden text-xs text-slate-400">- {new Date(evt.end.dateTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 py-0 sm:py-1">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                            <div>
                              <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50 truncate pr-4">
                                {evt.summary || 'Başlıksız Etkinlik'}
                              </h4>
                              {evt.description && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                  {evt.description}
                                </p>
                              )}
                              {evt.attendees && evt.attendees.length > 0 && (
                                <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                                  <div className="flex -space-x-2">
                                    {evt.attendees.slice(0, 3).map((att, i) => (
                                      <div key={i} className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-medium uppercase">
                                        {att.email?.[0]}
                                      </div>
                                    ))}
                                    {evt.attendees.length > 3 && (
                                      <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-medium text-slate-500">
                                        +{evt.attendees.length - 3}
                                      </div>
                                    )}
                                  </div>
                                  <span>{evt.attendees.length} katılımcı</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-2 shrink-0">
                              {evt.hangoutLink && (
                                <Button variant="default" size="sm" asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                                  <a href={evt.hangoutLink} target="_blank" rel="noreferrer">
                                    <Video className="h-3.5 w-3.5 mr-1.5" />
                                    Katıl
                                  </a>
                                </Button>
                              )}
                              {evt.htmlLink && (
                                <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200">
                                  <a href={evt.htmlLink} target="_blank" rel="noreferrer">
                                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                    Detay
                                  </a>
                                </Button>
                              )}
                            </div>
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
      </div>
    </div>
  );
}
