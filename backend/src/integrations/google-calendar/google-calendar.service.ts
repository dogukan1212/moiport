import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { URLSearchParams } from 'url';
import { PrismaService } from '../../prisma/prisma.service';

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

@Injectable()
export class GoogleCalendarService {
  constructor(private readonly prisma: PrismaService) {}

  private async getClientConfig() {
    const config = await this.prisma.systemConfig.findFirst();

    const clientId = String(config?.googleOAuthClientId || '').trim();
    const clientSecret = String(config?.googleOAuthClientSecret || '').trim();
    const redirectFromDb = String(config?.googleOAuthRedirectUri || '').trim();
    const redirectFromEnv = String(
      process.env.GOOGLE_OAUTH_REDIRECT_URI || '',
    ).trim();
    const defaultRedirect =
      'https://api.moiport.com/integrations/google-calendar/callback';

    const initialRedirect =
      redirectFromDb || redirectFromEnv || defaultRedirect;

    let redirectUri = initialRedirect;
    // Localhost kontrolü kaldırıldı - kullanıcı ne tanımladıysa o gitsin
    // if (
    //   redirectUri.startsWith('http://localhost') ||
    //   redirectUri.includes('kolayentegrasyon.com')
    // ) {
    //   redirectUri = defaultRedirect;
    // }

    const redirectSource = redirectFromDb
      ? 'db'
      : redirectFromEnv
        ? 'env'
        : 'default';
    console.log(
      '[GoogleCalendar] Using redirectUri:',
      redirectUri,
      '| Source:',
      redirectSource,
    );

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException(
        'Google entegrasyonu için geliştirici ayarları eksik. Lütfen sistem yöneticisi olarak admin panelinden Google ayarlarını yapılandırın.',
      );
    }

    return {
      clientId,
      clientSecret,
      redirectUri,
      isActive: !!config?.googleCalendarIsActive,
    };
  }

  async getConfig(tenantId: string) {
    let db: any = null;
    try {
      db = await this.prisma.googleCalendarConfig.findFirst({
        where: { tenantId },
      });
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.toLowerCase().includes('no such table')) {
        return {
          tenantId,
          email: null,
          isActive: false,
          hasRefreshToken: false,
          primaryCalendar: null,
        };
      }
      throw error;
    }

    if (!db) {
      return {
        tenantId,
        email: null,
        isActive: false,
        hasRefreshToken: false,
        primaryCalendar: null,
      };
    }

    return {
      tenantId,
      email: db.email,
      isActive: !!db.isActive,
      hasRefreshToken: !!db.refreshToken,
      primaryCalendar: db.primaryCalendar,
    };
  }

  async getAuthUrl(tenantId: string) {
    const { clientId, redirectUri } = await this.getClientConfig();
    const scope = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      scope,
      state: tenantId,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(tenantId: string, code: string) {
    const { clientId, clientSecret, redirectUri } =
      await this.getClientConfig();

    if (!code || !code.trim()) {
      throw new BadRequestException('Google yetkilendirme kodu eksik.');
    }

    let tokenData: GoogleTokenResponse;
    try {
      const body = new URLSearchParams({
        code: code.trim(),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      const res = await axios.post(
        'https://oauth2.googleapis.com/token',
        body.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      tokenData = res.data;
    } catch (error: any) {
      console.error(
        'Google OAuth token exchange error:',
        error?.response?.data || error?.message || error,
        '| Used Redirect URI:',
        redirectUri,
      );
      const msg =
        error?.response?.data?.error_description ||
        error?.response?.data?.error ||
        error?.message;
      throw new BadRequestException(
        msg || 'Google ile yetkilendirme başarısız oldu.',
      );
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    if (!accessToken) {
      throw new BadRequestException(
        'Google erişim anahtarı alınamadı. Lütfen tekrar deneyin.',
      );
    }

    let email: string | null = null;
    try {
      const me = await axios.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      email = String(me.data?.email || '').trim() || null;
    } catch {
      email = null;
    }

    const expiresAt =
      typeof tokenData.expires_in === 'number'
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null;

    let existing: any = null;
    try {
      existing = await this.prisma.googleCalendarConfig.findFirst({
        where: { tenantId },
      });
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.toLowerCase().includes('no such table')) {
        throw new BadRequestException(
          'Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.',
        );
      }
      throw error;
    }

    const nextRefreshToken = refreshToken || existing?.refreshToken || null;
    const isActive = !!(nextRefreshToken || accessToken);

    if (existing) {
      await this.prisma.googleCalendarConfig.update({
        where: { id: existing.id },
        data: {
          email,
          accessToken,
          refreshToken: nextRefreshToken,
          tokenExpiresAt: expiresAt,
          isActive,
        },
      });
    } else {
      await this.prisma.googleCalendarConfig.create({
        data: {
          tenantId,
          email,
          accessToken,
          refreshToken: nextRefreshToken,
          tokenExpiresAt: expiresAt,
          isActive,
        },
      });
    }

    return this.getConfig(tenantId);
  }

  private async getActiveCredentials(tenantId: string) {
    const { clientId, clientSecret } = await this.getClientConfig();

    let config: any = null;
    try {
      config = await this.prisma.googleCalendarConfig.findFirst({
        where: { tenantId },
      });
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.toLowerCase().includes('no such table')) {
        throw new BadRequestException(
          'Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.',
        );
      }
      throw error;
    }

    if (!config) {
      throw new BadRequestException(
        'Google Calendar entegrasyonu için önce yetki vermelisiniz.',
      );
    }

    if (!config.isActive) {
      throw new BadRequestException(
        'Google Calendar entegrasyonu aktif değil. Lütfen ayarlardan aktifleştirin.',
      );
    }

    let accessToken = String(config.accessToken || '').trim();
    const refreshToken = String(config.refreshToken || '').trim();

    const now = Date.now();
    const expiresAt = config.tokenExpiresAt
      ? new Date(config.tokenExpiresAt).getTime()
      : 0;

    const shouldRefresh =
      !!refreshToken &&
      (!accessToken || !expiresAt || expiresAt - now < 60_000);

    if (shouldRefresh) {
      try {
        const body = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        });
        const res = await axios.post(
          'https://oauth2.googleapis.com/token',
          body.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        );
        const data = res.data as GoogleTokenResponse;
        accessToken = data.access_token;
        const newExpiresAt =
          typeof data.expires_in === 'number'
            ? new Date(Date.now() + data.expires_in * 1000)
            : null;

        await this.prisma.googleCalendarConfig.update({
          where: { id: config.id },
          data: {
            accessToken,
            tokenExpiresAt: newExpiresAt,
          },
        });
      } catch (error: any) {
        const msg =
          error?.response?.data?.error_description ||
          error?.response?.data?.error ||
          error?.message;
        throw new BadRequestException(
          msg || 'Google erişim anahtarı yenilenemedi.',
        );
      }
    }

    if (!accessToken) {
      throw new BadRequestException(
        'Google Calendar entegrasyonu için önce yetki vermelisiniz.',
      );
    }

    return {
      accessToken,
      email: config.email || null,
      primaryCalendar: config.primaryCalendar || null,
    };
  }

  async getSystemConfig() {
    let config = await this.prisma.systemConfig.findFirst();
    if (!config) {
      config = await this.prisma.systemConfig.create({
        data: {},
      });
    }
    return {
      googleOAuthClientId: config.googleOAuthClientId || '',
      googleOAuthClientSecret: config.googleOAuthClientSecret || '',
      googleOAuthRedirectUri:
        config.googleOAuthRedirectUri ||
        process.env.GOOGLE_OAUTH_REDIRECT_URI ||
        'https://api.moiport.com/integrations/google-calendar/callback',
      googleCalendarIsActive: !!config.googleCalendarIsActive,
    };
  }

  async updateSystemConfig(data: {
    googleOAuthClientId?: string | null;
    googleOAuthClientSecret?: string | null;
    googleOAuthRedirectUri?: string | null;
    googleCalendarIsActive?: boolean;
  }) {
    let config = await this.prisma.systemConfig.findFirst();
    if (!config) {
      config = await this.prisma.systemConfig.create({
        data: {},
      });
    }

    return this.prisma.systemConfig.update({
      where: { id: config.id },
      data: {
        googleOAuthClientId:
          data.googleOAuthClientId ?? config.googleOAuthClientId,
        googleOAuthClientSecret:
          data.googleOAuthClientSecret ?? config.googleOAuthClientSecret,
        googleOAuthRedirectUri:
          data.googleOAuthRedirectUri ?? config.googleOAuthRedirectUri,
        googleCalendarIsActive:
          typeof data.googleCalendarIsActive === 'boolean'
            ? data.googleCalendarIsActive
            : config.googleCalendarIsActive,
      },
    });
  }

  async testSystemConfig() {
    const { clientId, clientSecret, redirectUri, isActive } =
      await this.getClientConfig();
    return {
      ok: true,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      redirectUri,
      googleCalendarIsActive: isActive,
    };
  }

  async updateConfig(
    tenantId: string,
    data: { primaryCalendar?: string | null; isActive?: boolean },
  ) {
    let existing: any = null;
    try {
      existing = await this.prisma.googleCalendarConfig.findFirst({
        where: { tenantId },
      });
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.toLowerCase().includes('no such table')) {
        throw new BadRequestException(
          'Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.',
        );
      }
      throw error;
    }

    if (!existing) {
      if (data.isActive) {
        throw new BadRequestException(
          'Entegrasyonu aktif etmek için önce Google ile yetki vermelisiniz.',
        );
      }
      return this.prisma.googleCalendarConfig.create({
        data: {
          tenantId,
          primaryCalendar: data.primaryCalendar ?? null,
          isActive: !!data.isActive && false,
        },
      });
    }

    const nextIsActive =
      typeof data.isActive === 'boolean' ? data.isActive : existing.isActive;

    if (nextIsActive && !existing.refreshToken && !existing.accessToken) {
      throw new BadRequestException(
        'Entegrasyonu aktif etmek için önce Google ile yetki vermelisiniz.',
      );
    }

    return this.prisma.googleCalendarConfig.update({
      where: { id: existing.id },
      data: {
        primaryCalendar:
          data.primaryCalendar !== undefined
            ? data.primaryCalendar
            : existing.primaryCalendar,
        isActive: nextIsActive,
      },
    });
  }

  async testConnection(tenantId: string) {
    const { accessToken, email } = await this.getActiveCredentials(tenantId);
    try {
      const res = await axios.get(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            maxResults: 1,
          },
        },
      );
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      return {
        ok: true,
        email,
        calendarCount: items.length,
      };
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.error ||
        error?.message;
      throw new BadRequestException(
        msg || 'Google Calendar bağlantısı doğrulanamadı.',
      );
    }
  }

  async createEvent(
    tenantId: string,
    body: {
      calendarId?: string | null;
      summary: string;
      description?: string | null;
      start: string;
      end: string;
      timeZone?: string | null;
      attendees?: Array<{ email: string }>;
    },
  ) {
    const summary = String(body?.summary || '').trim();
    const start = String(body?.start || '').trim();
    const end = String(body?.end || '').trim();

    if (!summary) {
      throw new BadRequestException('Toplantı başlığı zorunludur.');
    }
    if (!start || !end) {
      throw new BadRequestException(
        'Toplantı başlangıç ve bitiş zamanı zorunludur.',
      );
    }

    const { accessToken, primaryCalendar } =
      await this.getActiveCredentials(tenantId);

    const calendarId =
      String(body?.calendarId || '').trim() ||
      String(primaryCalendar || '').trim() ||
      'primary';

    const timeZone = String(body?.timeZone || '').trim() || 'Europe/Istanbul';

    const attendees =
      Array.isArray(body?.attendees) && body.attendees.length > 0
        ? body.attendees
            .map((a) => ({
              email: String(a?.email || '').trim(),
            }))
            .filter((a) => a.email)
        : undefined;

    const eventBody: any = {
      summary,
      description: body?.description || undefined,
      start: {
        dateTime: start,
        timeZone,
      },
      end: {
        dateTime: end,
        timeZone,
      },
    };

    if (attendees && attendees.length > 0) {
      eventBody.attendees = attendees;
    }

    eventBody.conferenceData = {
      createRequest: {
        requestId: `${tenantId}-${Date.now()}`,
      },
    };

    try {
      const res = await axios.post(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
          calendarId,
        )}/events`,
        eventBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            conferenceDataVersion: 1,
          },
        },
      );

      const event = res.data || {};
      const hangoutLink =
        event.hangoutLink ||
        event.conferenceData?.entryPoints?.find(
          (e: any) => e?.entryPointType === 'video',
        )?.uri ||
        null;

      return {
        id: event.id || null,
        htmlLink: event.htmlLink || null,
        hangoutLink,
        start: event.start || null,
        end: event.end || null,
      };
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.error ||
        error?.message;
      throw new BadRequestException(
        msg || 'Google Calendar etkinliği oluşturulamadı.',
      );
    }
  }
}
