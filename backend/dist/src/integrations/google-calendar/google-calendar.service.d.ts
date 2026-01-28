import { PrismaService } from '../../prisma/prisma.service';
export declare class GoogleCalendarService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getClientConfig;
    getConfig(tenantId: string): Promise<{
        tenantId: string;
        email: any;
        isActive: boolean;
        hasRefreshToken: boolean;
        primaryCalendar: any;
    }>;
    getAuthUrl(tenantId: string): Promise<string>;
    exchangeCode(tenantId: string, code: string): Promise<{
        tenantId: string;
        email: any;
        isActive: boolean;
        hasRefreshToken: boolean;
        primaryCalendar: any;
    }>;
    private getActiveCredentials;
    getSystemConfig(): Promise<{
        googleOAuthClientId: string;
        googleOAuthClientSecret: string;
        googleOAuthRedirectUri: string;
        googleCalendarIsActive: boolean;
    }>;
    updateSystemConfig(data: {
        googleOAuthClientId?: string | null;
        googleOAuthClientSecret?: string | null;
        googleOAuthRedirectUri?: string | null;
        googleCalendarIsActive?: boolean;
    }): Promise<{
        id: string;
        updatedAt: Date;
        facebookAppId: string | null;
        facebookAppSecret: string | null;
        facebookVerifyToken: string | null;
        paytrMerchantId: string | null;
        paytrMerchantKey: string | null;
        paytrMerchantSalt: string | null;
        paytrIsActive: boolean;
        paytrTestMode: boolean;
        netgsmUsercode: string | null;
        netgsmPassword: string | null;
        netgsmMsgheader: string | null;
        netgsmIsActive: boolean;
        registrationSmsVerificationEnabled: boolean;
        smtp2goUsername: string | null;
        smtp2goPassword: string | null;
        smtp2goFromEmail: string | null;
        smtp2goFromName: string | null;
        smtp2goIsActive: boolean;
        googleOAuthClientId: string | null;
        googleOAuthClientSecret: string | null;
        googleOAuthRedirectUri: string | null;
        googleCalendarIsActive: boolean;
    }>;
    testSystemConfig(): Promise<{
        ok: boolean;
        hasClientId: boolean;
        hasClientSecret: boolean;
        redirectUri: string;
        googleCalendarIsActive: boolean;
    }>;
    updateConfig(tenantId: string, data: {
        primaryCalendar?: string | null;
        isActive?: boolean;
    }): Promise<{
        id: string;
        email: string | null;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        accessToken: string | null;
        refreshToken: string | null;
        tokenExpiresAt: Date | null;
        primaryCalendar: string | null;
    }>;
    testConnection(tenantId: string): Promise<{
        ok: boolean;
        email: any;
        calendarCount: any;
    }>;
    listEvents(tenantId: string, query?: {
        calendarId?: string | null;
        timeMin?: string | null;
        timeMax?: string | null;
        maxResults?: number | null;
        q?: string | null;
    }): Promise<{
        ok: boolean;
        calendarId: string;
        timeMin: string;
        timeMax: string;
        items: any;
    }>;
    createEvent(tenantId: string, body: {
        calendarId?: string | null;
        summary: string;
        description?: string | null;
        start: string;
        end: string;
        timeZone?: string | null;
        attendees?: Array<{
            email: string;
        }>;
        createMeetLink?: boolean;
    }): Promise<{
        id: any;
        htmlLink: any;
        hangoutLink: any;
        start: any;
        end: any;
    }>;
}
