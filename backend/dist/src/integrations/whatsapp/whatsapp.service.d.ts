import { PrismaService } from '../../prisma/prisma.service';
export declare class WhatsappService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private ensureAiDir;
    private aiConfigPath;
    private readAiConfig;
    private writeAiConfig;
    getConfig(tenantId: string, user?: any): Promise<{
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
    updateConfig(tenantId: string, data: {
        phoneNumberId?: string | null;
        accessToken?: string | null;
        apiVersion?: string | null;
        provider?: string | null;
        twilioAccountSid?: string | null;
        isActive?: boolean;
        aiEnabled?: boolean;
        autoReplyEnabled?: boolean;
        autoReplyTemplates?: string | null;
    }, user?: any): Promise<any>;
    sendMessage(tenantId: string, to: string, message: string, attachments?: {
        url: string;
        type: string;
        name?: string;
    }[], user?: any): Promise<any>;
    sendTextMessage(tenantId: string, to: string, body: string): Promise<any>;
}
