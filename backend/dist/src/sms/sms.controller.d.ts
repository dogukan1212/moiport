import { SmsService } from './sms.service';
export declare class SmsController {
    private readonly smsService;
    constructor(smsService: SmsService);
    getSettings(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
        provider: string;
    } | {
        tenantId: string;
        provider: string;
        isActive: boolean;
        updatedAt: Date;
    }>;
    updateSettings(tenantId: string, body: {
        provider?: 'VATANSMS' | 'NETGSM';
        isActive?: boolean;
    }): Promise<{
        id: string;
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
        provider: string;
    }>;
    listTemplates(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string;
        key: string;
    }[]>;
    createTemplate(tenantId: string, body: {
        key: string;
        title: string;
        content: string;
        isActive?: boolean;
    }): Promise<{
        id: string;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string;
        key: string;
    }>;
    updateTemplate(tenantId: string, id: string, body: {
        key?: string;
        title?: string;
        content?: string;
        isActive?: boolean;
    }): Promise<{
        id: string;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string;
        key: string;
    } | null>;
    deleteTemplate(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        content: string;
        key: string;
    } | null>;
    listTriggers(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        event: string;
        enabled: boolean;
        recipientType: string;
        templateKey: string;
    }[]>;
    updateTrigger(tenantId: string, id: string, body: {
        enabled?: boolean;
        recipientType?: 'TASK_ASSIGNEE' | 'TASK_WATCHERS' | 'CUSTOMER_PHONE' | 'CUSTOMER_USERS';
        templateKey?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        event: string;
        enabled: boolean;
        recipientType: string;
        templateKey: string;
    } | null>;
    sendManual(tenantId: string, body: {
        to: string;
        message?: string;
        templateKey?: string;
        variables?: Record<string, any>;
    }): Promise<{
        success: boolean;
        providerMessageId: string | undefined;
    }>;
}
