import { PrismaService } from '../../prisma/prisma.service';
export declare class ParasutService {
    private prisma;
    constructor(prisma: PrismaService);
    private getBaseUrl;
    private getApiBaseUrl;
    private getOAuthConfig;
    private buildState;
    private parseState;
    getConfig(tenantId: string, user?: any): Promise<{
        id: string;
        tenantId: string;
        customerId: string | null;
        isActive: boolean;
        updatedAt: Date;
        accessToken: string | null;
        expiresAt: Date | null;
        companyId: string | null;
        refreshToken: string | null;
        tokenType: string | null;
        scope: string | null;
    } | null>;
    updateConfig(tenantId: string, data: {
        companyId?: string | null;
        isActive?: boolean;
    }, user?: any): Promise<{
        id: string;
        tenantId: string;
        customerId: string | null;
        isActive: boolean;
        updatedAt: Date;
        accessToken: string | null;
        expiresAt: Date | null;
        companyId: string | null;
        refreshToken: string | null;
        tokenType: string | null;
        scope: string | null;
    }>;
    disconnect(tenantId: string, user?: any): Promise<{
        id: string;
        tenantId: string;
        customerId: string | null;
        isActive: boolean;
        updatedAt: Date;
        accessToken: string | null;
        expiresAt: Date | null;
        companyId: string | null;
        refreshToken: string | null;
        tokenType: string | null;
        scope: string | null;
    } | null>;
    getAuthUrl(tenantId: string, user?: any): Promise<string>;
    handleCallback(code: string, state: string): Promise<{
        id: string;
        tenantId: string;
        customerId: string | null;
        isActive: boolean;
        updatedAt: Date;
        accessToken: string | null;
        expiresAt: Date | null;
        companyId: string | null;
        refreshToken: string | null;
        tokenType: string | null;
        scope: string | null;
    }>;
    private refreshAccessToken;
    private ensureAccessToken;
    getMe(tenantId: string, user?: any): Promise<any>;
}
