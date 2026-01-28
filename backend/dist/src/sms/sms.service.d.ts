import { PrismaService } from '../prisma/prisma.service';
import { VatansmsService } from '../integrations/vatansms/vatansms.service';
import { NetgsmService } from '../integrations/netgsm/netgsm.service';
type SmsProvider = 'VATANSMS' | 'NETGSM';
type SmsEvent = 'TASK_COMPLETED' | 'INVOICE_CREATED' | 'INVOICE_REMINDER' | 'INVOICE_OVERDUE' | 'PROPOSAL_CREATED' | 'PROPOSAL_UPDATED';
type SmsRecipientType = 'TASK_ASSIGNEE' | 'TASK_WATCHERS' | 'CUSTOMER_PHONE' | 'CUSTOMER_USERS';
export declare class SmsService {
    private readonly prisma;
    private readonly vatansmsService?;
    private readonly netgsmService?;
    private readonly logger;
    constructor(prisma: PrismaService, vatansmsService?: VatansmsService | undefined, netgsmService?: NetgsmService | undefined);
    private isNoSuchTableError;
    private renderTemplate;
    private ensureDefaults;
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
    updateSettings(tenantId: string, data: {
        provider?: SmsProvider;
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
    createTemplate(tenantId: string, data: {
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
    updateTemplate(tenantId: string, id: string, data: {
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
    updateTrigger(tenantId: string, id: string, data: {
        enabled?: boolean;
        recipientType?: SmsRecipientType;
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
    private sendViaProvider;
    sendManual(tenantId: string, data: {
        to: string;
        message?: string;
        templateKey?: string;
        variables?: Record<string, any>;
    }): Promise<{
        success: boolean;
        providerMessageId: string | undefined;
    }>;
    private formatDateTr;
    private resolveRecipientsForCustomer;
    private resolveTaskRecipients;
    trySendEvent(tenantId: string, event: SmsEvent, context: {
        taskId?: string;
        invoiceId?: string;
        proposalId?: string;
        actorId?: string;
    }): Promise<{
        skipped: boolean;
        reason: string;
        sent?: undefined;
        results?: undefined;
    } | {
        sent: number;
        results: any[];
        skipped?: undefined;
        reason?: undefined;
    }>;
}
export {};
