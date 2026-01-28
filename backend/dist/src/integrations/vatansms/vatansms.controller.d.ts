import { VatansmsService } from './vatansms.service';
export declare class VatansmsController {
    private readonly vatansmsService;
    constructor(vatansmsService: VatansmsService);
    getConfig(tenantId: string): Promise<any>;
    updateConfig(tenantId: string, body: {
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
    send(tenantId: string, body: {
        to: string;
        message: string;
        sender?: string;
        messageType?: string;
        messageContentType?: string;
    }): Promise<{
        success: boolean;
        result: {
            [key: string]: any;
            status?: string | boolean;
            message?: string;
            id?: number | string;
        };
    }>;
}
