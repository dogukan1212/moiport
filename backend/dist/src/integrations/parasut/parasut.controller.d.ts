import { ParasutService } from './parasut.service';
export declare class ParasutController {
    private readonly parasutService;
    constructor(parasutService: ParasutService);
    getConfig(tenantId: string, user: any): Promise<{
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
    updateConfig(tenantId: string, body: {
        companyId?: string | null;
        isActive?: boolean;
    }, user: any): Promise<{
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
    disconnect(tenantId: string, user: any): Promise<{
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
    getAuthUrl(tenantId: string, user: any): Promise<{
        url: string;
    }>;
    handleCallback(code: string, state: string, res: any): Promise<any>;
    getMe(tenantId: string, user: any): Promise<any>;
}
