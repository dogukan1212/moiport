"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const url_1 = require("url");
const prisma_service_1 = require("../../prisma/prisma.service");
let GoogleCalendarService = class GoogleCalendarService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getClientConfig() {
        const config = await this.prisma.systemConfig.findFirst();
        const clientId = String(config?.googleOAuthClientId || '').trim();
        const clientSecret = String(config?.googleOAuthClientSecret || '').trim();
        const redirectFromDb = String(config?.googleOAuthRedirectUri || '').trim();
        const redirectFromEnv = String(process.env.GOOGLE_OAUTH_REDIRECT_URI || '').trim();
        const defaultRedirect = 'https://api.moiport.com/integrations/google-calendar/callback';
        const initialRedirect = redirectFromEnv || redirectFromDb || defaultRedirect;
        const redirectUri = initialRedirect;
        const redirectSource = redirectFromDb
            ? 'db'
            : redirectFromEnv
                ? 'env'
                : 'default';
        console.log('[GoogleCalendar] Using redirectUri:', redirectUri, '| Source:', redirectSource);
        if (!clientId || !clientSecret || !redirectUri) {
            throw new common_1.BadRequestException('Google entegrasyonu için geliştirici ayarları eksik. Lütfen sistem yöneticisi olarak admin panelinden Google ayarlarını yapılandırın.');
        }
        return {
            clientId,
            clientSecret,
            redirectUri,
            isActive: !!config?.googleCalendarIsActive,
        };
    }
    async getConfig(tenantId) {
        console.log('--- GET CONFIG START ---', { tenantId });
        let db = null;
        try {
            db = await this.prisma.googleCalendarConfig.findFirst({
                where: { tenantId },
            });
            console.log('--- GET CONFIG DB RES ---', db);
        }
        catch (error) {
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
    async getAuthUrl(tenantId) {
        const { clientId, redirectUri } = await this.getClientConfig();
        const scope = [
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/calendar.readonly',
            'openid',
            'email',
            'profile',
        ].join(' ');
        const params = new url_1.URLSearchParams({
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
    async exchangeCode(tenantId, code) {
        console.log('--- GOOGLE CALENDAR EXCHANGE CODE START ---', {
            tenantId,
            codeLength: code?.length,
        });
        const { clientId, clientSecret, redirectUri } = await this.getClientConfig();
        if (!code || !code.trim()) {
            throw new common_1.BadRequestException('Google yetkilendirme kodu eksik.');
        }
        let tokenData;
        try {
            const body = new url_1.URLSearchParams({
                code: code.trim(),
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            });
            const res = await axios_1.default.post('https://oauth2.googleapis.com/token', body.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            tokenData = res.data;
        }
        catch (error) {
            console.error('Google OAuth token exchange error:', error?.response?.data || error?.message || error, '| Used Redirect URI:', redirectUri);
            const msg = error?.response?.data?.error_description ||
                error?.response?.data?.error ||
                error?.message;
            throw new common_1.BadRequestException(msg || 'Google ile yetkilendirme başarısız oldu.');
        }
        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;
        if (!accessToken) {
            throw new common_1.BadRequestException('Google erişim anahtarı alınamadı. Lütfen tekrar deneyin.');
        }
        const parseEmailFromIdToken = (idToken) => {
            try {
                if (!idToken)
                    return null;
                const parts = idToken.split('.');
                if (parts.length < 2)
                    return null;
                const payload = parts[1];
                const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
                const json = Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
                const data = JSON.parse(json);
                const email = typeof data.email === 'string' ? data.email.trim() : '';
                return email || null;
            }
            catch {
                return null;
            }
        };
        let email = parseEmailFromIdToken(tokenData.id_token);
        try {
            const me = await axios_1.default.get('https://openidconnect.googleapis.com/v1/userinfo', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            email = String(me.data?.email || '').trim() || email;
            console.log('--- GOOGLE USER INFO ---', { email, data: me.data });
        }
        catch (error) {
            console.error('--- GOOGLE USER INFO ERROR ---', error);
        }
        const expiresAt = typeof tokenData.expires_in === 'number'
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null;
        let existing = null;
        try {
            existing = await this.prisma.googleCalendarConfig.findFirst({
                where: { tenantId },
            });
        }
        catch (error) {
            const msg = String(error?.message || '');
            if (msg.toLowerCase().includes('no such table')) {
                throw new common_1.BadRequestException('Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.');
            }
            throw error;
        }
        const nextRefreshToken = refreshToken || existing?.refreshToken || null;
        const nextEmail = email || existing?.email || null;
        const isActive = true;
        if (existing) {
            console.log('--- UPDATING EXISTING CONFIG WITH isActive=TRUE ---');
            await this.prisma.googleCalendarConfig.update({
                where: { id: existing.id },
                data: {
                    email: nextEmail,
                    accessToken,
                    refreshToken: nextRefreshToken,
                    tokenExpiresAt: expiresAt,
                    isActive,
                },
            });
        }
        else {
            await this.prisma.googleCalendarConfig.create({
                data: {
                    tenantId,
                    email: nextEmail,
                    accessToken,
                    refreshToken: nextRefreshToken,
                    tokenExpiresAt: expiresAt,
                    isActive,
                },
            });
        }
        return this.getConfig(tenantId);
    }
    async getActiveCredentials(tenantId) {
        console.log('--- GET ACTIVE CREDENTIALS ---', { tenantId });
        const { clientId, clientSecret } = await this.getClientConfig();
        let config = null;
        try {
            config = await this.prisma.googleCalendarConfig.findFirst({
                where: { tenantId },
            });
            console.log('--- DB CONFIG ---', {
                id: config?.id,
                isActive: config?.isActive,
                hasAccess: !!config?.accessToken,
                hasRefresh: !!config?.refreshToken,
                expiresAt: config?.tokenExpiresAt,
            });
        }
        catch (error) {
            const msg = String(error?.message || '');
            if (msg.toLowerCase().includes('no such table')) {
                throw new common_1.BadRequestException('Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.');
            }
            throw error;
        }
        if (!config) {
            throw new common_1.BadRequestException('Google Calendar entegrasyonu için önce yetki vermelisiniz.');
        }
        if (!config.isActive) {
            throw new common_1.BadRequestException('Google Calendar entegrasyonu aktif değil. Lütfen ayarlardan aktifleştirin.');
        }
        let accessToken = String(config.accessToken || '').trim();
        const refreshToken = String(config.refreshToken || '').trim();
        const now = Date.now();
        const expiresAt = config.tokenExpiresAt
            ? new Date(config.tokenExpiresAt).getTime()
            : 0;
        const shouldRefresh = !!refreshToken &&
            (!accessToken || !expiresAt || expiresAt - now < 60_000);
        if (shouldRefresh) {
            try {
                const body = new url_1.URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token',
                });
                const res = await axios_1.default.post('https://oauth2.googleapis.com/token', body.toString(), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });
                const data = res.data;
                accessToken = data.access_token;
                const newExpiresAt = typeof data.expires_in === 'number'
                    ? new Date(Date.now() + data.expires_in * 1000)
                    : null;
                await this.prisma.googleCalendarConfig.update({
                    where: { id: config.id },
                    data: {
                        accessToken,
                        tokenExpiresAt: newExpiresAt,
                    },
                });
            }
            catch (error) {
                const msg = error?.response?.data?.error_description ||
                    error?.response?.data?.error ||
                    error?.message;
                throw new common_1.BadRequestException(msg || 'Google erişim anahtarı yenilenemedi.');
            }
        }
        if (!accessToken) {
            throw new common_1.BadRequestException('Google Calendar entegrasyonu için önce yetki vermelisiniz.');
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
            googleOAuthRedirectUri: config.googleOAuthRedirectUri ||
                process.env.GOOGLE_OAUTH_REDIRECT_URI ||
                'https://api.moiport.com/integrations/google-calendar/callback',
            googleCalendarIsActive: !!config.googleCalendarIsActive,
        };
    }
    async updateSystemConfig(data) {
        let config = await this.prisma.systemConfig.findFirst();
        if (!config) {
            config = await this.prisma.systemConfig.create({
                data: {},
            });
        }
        return this.prisma.systemConfig.update({
            where: { id: config.id },
            data: {
                googleOAuthClientId: data.googleOAuthClientId ?? config.googleOAuthClientId,
                googleOAuthClientSecret: data.googleOAuthClientSecret ?? config.googleOAuthClientSecret,
                googleOAuthRedirectUri: data.googleOAuthRedirectUri ?? config.googleOAuthRedirectUri,
                googleCalendarIsActive: typeof data.googleCalendarIsActive === 'boolean'
                    ? data.googleCalendarIsActive
                    : config.googleCalendarIsActive,
            },
        });
    }
    async testSystemConfig() {
        const { clientId, clientSecret, redirectUri, isActive } = await this.getClientConfig();
        return {
            ok: true,
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
            redirectUri,
            googleCalendarIsActive: isActive,
        };
    }
    async updateConfig(tenantId, data) {
        let existing = null;
        try {
            existing = await this.prisma.googleCalendarConfig.findFirst({
                where: { tenantId },
            });
        }
        catch (error) {
            const msg = String(error?.message || '');
            if (msg.toLowerCase().includes('no such table')) {
                throw new common_1.BadRequestException('Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.');
            }
            throw error;
        }
        if (!existing) {
            if (data.isActive) {
                throw new common_1.BadRequestException('Entegrasyonu aktif etmek için önce Google ile yetki vermelisiniz.');
            }
            return this.prisma.googleCalendarConfig.create({
                data: {
                    tenantId,
                    primaryCalendar: data.primaryCalendar ?? null,
                    isActive: !!data.isActive && false,
                },
            });
        }
        const nextIsActive = typeof data.isActive === 'boolean' ? data.isActive : existing.isActive;
        if (nextIsActive && !existing.refreshToken && !existing.accessToken) {
            console.warn('[GoogleCalendar] Warning: Activating without tokens');
        }
        return this.prisma.googleCalendarConfig.update({
            where: { id: existing.id },
            data: {
                primaryCalendar: data.primaryCalendar !== undefined
                    ? data.primaryCalendar
                    : existing.primaryCalendar,
                isActive: nextIsActive,
            },
        });
    }
    async testConnection(tenantId) {
        const { accessToken, email } = await this.getActiveCredentials(tenantId);
        try {
            const res = await axios_1.default.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    maxResults: 1,
                },
            });
            const items = Array.isArray(res.data?.items) ? res.data.items : [];
            return {
                ok: true,
                email,
                calendarCount: items.length,
            };
        }
        catch (error) {
            const msg = error?.response?.data?.error?.message ||
                error?.response?.data?.error ||
                error?.message;
            throw new common_1.BadRequestException(msg || 'Google Calendar bağlantısı doğrulanamadı.');
        }
    }
    async listEvents(tenantId, query) {
        const { accessToken, primaryCalendar } = await this.getActiveCredentials(tenantId);
        const calendarId = String(query?.calendarId || '').trim() ||
            String(primaryCalendar || '').trim() ||
            'primary';
        const timeMin = query?.timeMin && String(query.timeMin).trim()
            ? String(query.timeMin).trim()
            : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const timeMax = query?.timeMax && String(query.timeMax).trim()
            ? String(query.timeMax).trim()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const maxResultsRaw = typeof query?.maxResults === 'number' ? query.maxResults : 50;
        const maxResults = Number.isFinite(maxResultsRaw) && maxResultsRaw > 0
            ? Math.min(250, Math.floor(maxResultsRaw))
            : 50;
        const q = query?.q ? String(query.q).trim() : '';
        try {
            const res = await axios_1.default.get(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    timeMin,
                    timeMax,
                    singleEvents: true,
                    orderBy: 'startTime',
                    maxResults,
                    ...(q ? { q } : {}),
                },
            });
            const items = Array.isArray(res.data?.items) ? res.data.items : [];
            return {
                ok: true,
                calendarId,
                timeMin,
                timeMax,
                items: items.map((e) => ({
                    id: e?.id || null,
                    status: e?.status || null,
                    summary: e?.summary || null,
                    description: e?.description || null,
                    htmlLink: e?.htmlLink || null,
                    hangoutLink: e?.hangoutLink || null,
                    start: e?.start || null,
                    end: e?.end || null,
                    attendees: Array.isArray(e?.attendees)
                        ? e.attendees.map((a) => ({
                            email: a?.email || null,
                            responseStatus: a?.responseStatus || null,
                            organizer: !!a?.organizer,
                            self: !!a?.self,
                        }))
                        : [],
                })),
            };
        }
        catch (error) {
            const msg = error?.response?.data?.error?.message ||
                error?.response?.data?.error ||
                error?.message;
            throw new common_1.BadRequestException(msg || 'Google Calendar etkinlikleri alınamadı.');
        }
    }
    async createEvent(tenantId, body) {
        const summary = String(body?.summary || '').trim();
        const start = String(body?.start || '').trim();
        const end = String(body?.end || '').trim();
        const createMeetLink = body?.createMeetLink !== false;
        if (!summary) {
            throw new common_1.BadRequestException('Toplantı başlığı zorunludur.');
        }
        if (!start || !end) {
            throw new common_1.BadRequestException('Toplantı başlangıç ve bitiş zamanı zorunludur.');
        }
        const { accessToken, primaryCalendar } = await this.getActiveCredentials(tenantId);
        const calendarId = String(body?.calendarId || '').trim() ||
            String(primaryCalendar || '').trim() ||
            'primary';
        const timeZone = String(body?.timeZone || '').trim() || 'Europe/Istanbul';
        const attendees = Array.isArray(body?.attendees) && body.attendees.length > 0
            ? body.attendees
                .map((a) => ({
                email: String(a?.email || '').trim(),
            }))
                .filter((a) => a.email)
            : undefined;
        const eventBody = {
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
        if (createMeetLink) {
            eventBody.conferenceData = {
                createRequest: {
                    requestId: `${tenantId}-${Date.now()}`,
                },
            };
        }
        try {
            const hasAttendees = Array.isArray(attendees) && attendees.length > 0;
            const res = await axios_1.default.post(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, eventBody, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    conferenceDataVersion: 1,
                    ...(hasAttendees
                        ? { sendUpdates: 'all', sendNotifications: true }
                        : {}),
                },
            });
            const event = res.data || {};
            const hangoutLink = event.hangoutLink ||
                event.conferenceData?.entryPoints?.find((e) => e?.entryPointType === 'video')?.uri ||
                null;
            return {
                id: event.id || null,
                htmlLink: event.htmlLink || null,
                hangoutLink,
                start: event.start || null,
                end: event.end || null,
            };
        }
        catch (error) {
            const msg = error?.response?.data?.error?.message ||
                error?.response?.data?.error ||
                error?.message;
            throw new common_1.BadRequestException(msg || 'Google Calendar etkinliği oluşturulamadı.');
        }
    }
};
exports.GoogleCalendarService = GoogleCalendarService;
exports.GoogleCalendarService = GoogleCalendarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GoogleCalendarService);
//# sourceMappingURL=google-calendar.service.js.map