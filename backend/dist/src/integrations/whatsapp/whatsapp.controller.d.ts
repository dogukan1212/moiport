import { WhatsappService } from './whatsapp.service';
import { CrmService } from '../../crm/crm.service';
export declare class WhatsappController {
    private readonly whatsappService;
    private readonly crmService;
    constructor(whatsappService: WhatsappService, crmService: CrmService);
    getConfig(tenantId: string, user: any): Promise<{
        id: string;
        tenantId: string;
        customerId: string | null;
        isActive: boolean;
        updatedAt: Date;
        accessToken: string | null;
        phoneNumberId: string | null;
        apiVersion: string | null;
        provider: string;
        twilioAccountSid: string | null;
        aiEnabled: boolean;
        autoReplyEnabled: boolean;
        autoReplyTemplates: string | null;
    } | {
        tenantId: string;
        customerId: any;
        isActive: boolean;
        provider: string;
        phoneNumberId: null;
        accessToken: null;
        apiVersion: string;
        twilioAccountSid: null;
        aiEnabled: boolean;
        autoReplyEnabled: boolean;
        autoReplyTemplates: null;
    }>;
    updateConfig(tenantId: string, body: {
        provider?: string | null;
        phoneNumberId?: string | null;
        accessToken?: string | null;
        apiVersion?: string | null;
        twilioAccountSid?: string | null;
        isActive?: boolean;
        aiEnabled?: boolean;
        autoReplyEnabled?: boolean;
        autoReplyTemplates?: string | null;
    }, user: any): Promise<any>;
    sendMessage(tenantId: string, user: any, body: {
        leadId?: string;
        to?: string;
        message: string;
        attachments?: {
            url: string;
            type: string;
            name?: string;
        }[];
    }): Promise<{
        success: boolean;
        result: any;
    }>;
}
