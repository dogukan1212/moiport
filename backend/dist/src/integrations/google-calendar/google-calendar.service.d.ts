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
        updatedAt: Date;
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
        updatedAt: Date;
        isActive: boolean;
        email: string | null;
        accessToken: string | null;
        refreshToken: string | null;
        tokenExpiresAt: Date | null;
        primaryCalendar: string | null;
        createdAt: Date;
        tenantId: string;
    }>;
    testConnection(tenantId: string): Promise<{
        ok: boolean;
        email: any;
        calendarCount: any;
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
    }): Promise<{
        id: any;
        htmlLink: any;
        hangoutLink: any;
        start: any;
        end: any;
    }>;
}
