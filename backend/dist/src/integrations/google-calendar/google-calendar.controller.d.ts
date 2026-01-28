import { GoogleCalendarService } from './google-calendar.service';
export declare class GoogleCalendarController {
    private readonly googleService;
    constructor(googleService: GoogleCalendarService);
    getSystemConfig(): Promise<{
        googleOAuthClientId: string;
        googleOAuthClientSecret: string;
        googleOAuthRedirectUri: string;
        googleCalendarIsActive: boolean;
    }>;
    updateSystemConfig(body: {
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
    getConfig(tenantId: string): Promise<{
        tenantId: string;
        email: any;
        isActive: boolean;
        hasRefreshToken: boolean;
        primaryCalendar: any;
    }>;
    getAuthUrl(tenantId: string): Promise<{
        url: string;
    }>;
    handleCallback(code: string, state: string, res: any): Promise<any>;
    exchangeCode(tenantId: string, body: {
        code: string;
    }): Promise<{
        tenantId: string;
        email: any;
        isActive: boolean;
        hasRefreshToken: boolean;
        primaryCalendar: any;
    }>;
    updateConfig(tenantId: string, body: {
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
