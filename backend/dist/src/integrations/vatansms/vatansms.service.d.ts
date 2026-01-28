import { PrismaService } from '../../prisma/prisma.service';
type VatansmsSendResponse = {
    status?: string | boolean;
    message?: string;
    id?: number | string;
    [key: string]: any;
};
export declare class VatansmsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toErrorText;
    private isDbNotReadyError;
    getConfig(tenantId: string): Promise<any>;
    updateConfig(tenantId: string, data: {
        apiId?: string | null;
        apiKey?: string | null;
        sender?: string | null;
        messageType?: string | null;
        messageContentType?: string | null;
        isActive?: boolean;
    }): Promise<{
        id: string;
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
        sender: string | null;
        apiId: string | null;
        apiKey: string | null;
        messageType: string;
        messageContentType: string;
    }>;
    private normalizeTrGsm;
    sendSms(tenantId: string, to: string, message: string, overrides?: {
        sender?: string;
        messageType?: string;
        messageContentType?: string;
    }): Promise<VatansmsSendResponse>;
}
export {};
