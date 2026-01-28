import { PrismaService } from '../../prisma/prisma.service';
export declare class NetgsmService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toErrorText;
    getSystemConfig(): Promise<{
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
    updateSystemConfig(data: {
        netgsmUsercode?: string | null;
        netgsmPassword?: string | null;
        netgsmMsgheader?: string | null;
        netgsmIsActive?: boolean;
        registrationSmsVerificationEnabled?: boolean;
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
    getConfig(tenantId: string): Promise<any>;
    updateConfig(tenantId: string, data: {
        usercode?: string | null;
        password?: string | null;
        msgheader?: string | null;
        isActive?: boolean;
    }): Promise<{
        id: string;
        password: string | null;
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
        usercode: string | null;
        msgheader: string | null;
    }>;
    private normalizeTrGsm;
    sendSystemSms(to: string, message: string, overrides?: {
        msgheader?: string;
    }): Promise<{
        code: string;
        bulkId: string | undefined;
        raw: string;
    }>;
    sendSms(tenantId: string, to: string, message: string, overrides?: {
        msgheader?: string;
    }): Promise<{
        code: string;
        bulkId: string | undefined;
        raw: string;
    }>;
}
