'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Mail, Loader2, Video, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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

export default function MeetingsPage() {
  const [config, setConfig] = useState<GoogleCalendarConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [creating, setCreating] = useState(false);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [listMode, setListMode] = useState<'all' | 'upcoming' | 'past'>('all');

  const [title, setTitle] = useState('Müşteri Toplantısı');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [timeZone, setTimeZone] = useState('Europe/Istanbul');
  const [attendeesRaw, setAttendeesRaw] = useState('');
  const [eventType, setEventType] = useState<'meeting' | 'note'>('meeting');

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

  const fetchEvents = useCallback(async () => {
    if (!isReady) return;
    setLoadingEvents(true);
    try {
      // Varsayılan: 6 ay öncesi ve 3 ay sonrası
      const timeMin = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
      const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const res = await api.get('/integrations/google-calendar/events', {
        params: { timeMin, timeMax, maxResults: 100 },
      });
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      setEvents(items);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Toplantılar alınamadı.';
      toast.error(msg);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [isReady]);

  useEffect(() => {
    if (isReady) fetchEvents();
    else setEvents([]);
  }, [isReady, fetchEvents]);

  const buildDateTime = (d: string, t: string) => {
    if (!d || !t) return null;
    const normalized = `${d}T${t}:00`;
    const dt = new Date(normalized);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString();
  };

  const formatEventTime = (evt: GoogleCalendarEvent) => {
    const startRaw = evt.start?.dateTime || evt.start?.date || '';
    const endRaw = evt.end?.dateTime || evt.end?.date || '';
    const startDate = startRaw ? new Date(startRaw) : null;
    const endDate = endRaw ? new Date(endRaw) : null;
    if (!startDate || Number.isNaN(startDate.getTime())) return '';
    const startText = startDate.toLocaleString('tr-TR', {
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: evt.start?.dateTime ? '2-digit' : undefined,
      minute: evt.start?.dateTime ? '2-digit' : undefined,
    });
    if (!endDate || Number.isNaN(endDate.getTime())) return startText;
    const endText = endDate.toLocaleTimeString('tr-TR', {
      hour: evt.end?.dateTime ? '2-digit' : undefined,
      minute: evt.end?.dateTime ? '2-digit' : undefined,
    });
    return evt.start?.dateTime ? `${startText} - ${endText}` : startText;
  };

  const getEventStartMs = (evt: GoogleCalendarEvent) => {
    const startRaw = evt.start?.dateTime || evt.start?.date || '';
    const d = startRaw ? new Date(startRaw) : null;
    if (!d || Number.isNaN(d.getTime())) return null;
    return d.getTime();
  };

  const filteredEvents = useMemo(() => {
    const now = Date.now();
    const base = events.filter((e) => {
      const ms = getEventStartMs(e);
      return typeof ms === 'number';
    });

    const filtered =
      listMode === 'upcoming'
        ? base.filter((e) => (getEventStartMs(e) as number) >= now)
        : listMode === 'past'
          ? base.filter((e) => (getEventStartMs(e) as number) < now)
          : base;

    const sorted = [...filtered].sort((a, b) => {
      const aMs = getEventStartMs(a) as number;
      const bMs = getEventStartMs(b) as number;
      if (listMode === 'past') return bMs - aMs;
      return aMs - bMs;
    });
    return sorted;
  }, [events, listMode]);

  const kpis = useMemo(() => {
    const now = Date.now();
    const total = events.length;
    const upcoming = events.filter((e) => {
      const ms = getEventStartMs(e);
      return typeof ms === 'number' && ms >= now;
    }).length;
    const past = total - upcoming;
    const withMeet = events.filter((e) => !!e.hangoutLink).length;
    return { total, upcoming, past, withMeet };
  }, [events]);

  const handleCreateMeeting = async () => {
    if (!config || !config.isActive) {
      toast.error('Önce Google Calendar entegrasyonunu Ayarlar → Google Calendar sekmesinden aktif etmelisiniz.');
      router.push('/dashboard/settings?tab=google-calendar');
      return;
    }

    if (!date || !startTime) {
      toast.error('Tarih ve başlangıç saatini doldurun.');
      return;
    }

    const startIso = buildDateTime(date, startTime);
    if (!startIso) {
      toast.error('Tarih veya saat formatı geçersiz.');
      return;
    }

    const duration = Number.isFinite(Number(durationMinutes)) ? Number(durationMinutes) : 30;
    const endDate = new Date(new Date(startIso).getTime() + duration * 60 * 1000);
    const endIso = endDate.toISOString();

    const emails = attendeesRaw
      .split(/[\n,;]/g)
      .map((e) => e.trim())
      .filter((e) => e.length > 3 && e.includes('@'));

    setCreating(true);
    try {
      const isMeeting = eventType === 'meeting';
      const res = await api.post('/integrations/google-calendar/events', {
        summary: title || (isMeeting ? 'Toplantı' : 'Etkinlik'),
        description: description || null,
        start: startIso,
        end: endIso,
        timeZone,
        attendees: isMeeting ? emails.map((email) => ({ email })) : [],
        createMeetLink: isMeeting,
      });

      const data = res.data || {};
      const link = data.hangoutLink || data.htmlLink || '';

      toast.success(isMeeting ? 'Google Meet toplantısı oluşturuldu.' : 'Etkinlik takvime eklendi.', {
        description: link || undefined,
      });
      fetchEvents();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Etkinlik oluşturulamadı.';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-8">
      <div>
        <h1 className="text-[28px] font-normal tracking-[-0.03em] text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-slate-900 dark:text-slate-50" />
          <span>Etkinlikler & Toplantılar</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-300 text-sm mt-2">
          Google Calendar üzerinden hızlı toplantılar planlayın veya kişisel etkinlikler oluşturun.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
             <Video className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Toplam</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{kpis.total}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
             <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Yaklaşan</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{kpis.upcoming}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
             <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Geçmiş</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{kpis.past}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 pb-8">
        <Card className="p-6 space-y-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              {eventType === 'meeting' ? (
                <Video className="h-5 w-5 text-indigo-500" />
              ) : (
                <Calendar className="h-5 w-5 text-indigo-500" />
              )}
              {eventType === 'meeting' ? 'Yeni Google Meet Toplantısı' : 'Yeni Etkinlik / Not'}
            </CardTitle>
            <CardDescription>
              {eventType === 'meeting'
                ? 'Başlık, tarih ve katılımcıları belirleyin. Google Calendar\'a eklenmiş bir Meet bağlantısı oluşturulur.'
                : 'Takviminize kişisel bir not, hatırlatma veya blok zaman ekleyin.'}
            </CardDescription>
          </CardHeader>

          {loadingConfig ? (
            <div className="flex items-center justify-center min-h-[120px]">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          ) : !config || !isReady ? (
            <div className="rounded-lg border border-dashed border-amber-400 bg-amber-50 dark:bg-amber-900/10 p-4 flex flex-col gap-3">
              <div className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Google Calendar entegrasyonu hazır değil.
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300">
                Toplantı oluşturabilmek için önce Ayarlar &gt; Google Calendar sekmesinden Google
                hesabı ile yetkilendirme yapıp entegrasyonu aktif etmeniz gerekir.
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
          ) : null}

          <div className="grid gap-4">
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
              <button
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  eventType === 'meeting'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-50'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                onClick={() => setEventType('meeting')}
              >
                Toplantı (Meet)
              </button>
              <button
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  eventType === 'note'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-50'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                onClick={() => setEventType('note')}
              >
                Kişisel Not / Etkinlik
              </button>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {eventType === 'meeting' ? 'Toplantı Başlığı' : 'Etkinlik Başlığı'}
              </label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Açıklama
              </label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Toplantı gündemi, Zoom dışı bağlantılar vb."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Tarih
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="date"
                    className="pl-9"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Başlangıç Saati
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="time"
                    className="pl-9"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Süre (dakika)
                </label>
                <Input
                  type="number"
                  min={10}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value) || 30)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Saat Dilimi
                </label>
                <select
                  className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-sm dark:bg-slate-900 dark:border-slate-700"
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                >
                  <option value="Europe/Istanbul">Europe/Istanbul (TR)</option>
                  <option value="Europe/Berlin">Europe/Berlin</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              {eventType === 'meeting' && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <Mail className="h-4 w-4 text-slate-500" />
                    Katılımcı E-postaları
                  </label>
                  <Textarea
                    rows={3}
                    value={attendeesRaw}
                    onChange={(e) => setAttendeesRaw(e.target.value)}
                    placeholder="ornek@domain.com, diger@domain.com"
                  />
                  <span className="text-[11px] text-slate-400">
                    Virgül veya satır sonu ile birden fazla e-posta girebilirsiniz.
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                className="bg-black text-white hover:bg-neutral-900"
                onClick={handleCreateMeeting}
                disabled={creating}
              >
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {eventType === 'meeting' ? 'Google Meet Toplantısı Oluştur' : 'Etkinliği Takvime Ekle'}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Mevcut Toplantılar
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="px-3 py-2 rounded-md border border-slate-200 bg-white text-sm dark:bg-slate-900 dark:border-slate-700"
                  value={listMode}
                  onChange={(e) => setListMode(e.target.value as 'all' | 'upcoming' | 'past')}
                  disabled={!isReady}
                >
                  <option value="all">Hepsi</option>
                  <option value="upcoming">Yaklaşan</option>
                  <option value="past">Geçmiş</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchEvents}
                  disabled={!isReady || loadingEvents}
                >
                  Yenile
                </Button>
              </div>
            </div>



            {!isReady ? (
              <div className="text-sm text-slate-500">
                Toplantıları görmek için Google Calendar entegrasyonunu aktif edin.
              </div>
            ) : loadingEvents ? (
              <div className="flex items-center justify-center min-h-[120px]">
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-sm text-slate-500">
                Bu aralıkta toplantı bulunamadı.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((evt) => (
                  <div
                    key={evt.id || `${evt.summary || 'event'}-${evt.start?.dateTime || evt.start?.date || ''}`}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                          {evt.summary || 'Başlıksız toplantı'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatEventTime(evt)}
                        </div>
                        {evt.attendees.length > 0 && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                            Katılımcılar: {evt.attendees.map((a) => a.email).filter(Boolean).join(', ')}
                          </div>
                        )}
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
        </Card>
      </div>
    </div>
  );
}
