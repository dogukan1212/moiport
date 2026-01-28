import { PrismaService } from '../../prisma/prisma.service';
export declare class PaytrService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
        paytrMerchantId?: string | null;
        paytrMerchantKey?: string | null;
        paytrMerchantSalt?: string | null;
        paytrIsActive?: boolean;
        paytrTestMode?: boolean;
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
        merchantId?: string | null;
        merchantKey?: string | null;
        merchantSalt?: string | null;
        isActive?: boolean;
    }): Promise<{
        id: string;
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
        merchantId: string | null;
        merchantKey: string | null;
        merchantSalt: string | null;
    }>;
}
