import { PrismaService } from '../../prisma/prisma.service';
import { CrmService } from '../../crm/crm.service';
export declare class FacebookService {
    private prisma;
    private crmService;
    constructor(prisma: PrismaService, crmService: CrmService);
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
    updateSystemConfig(data: any): Promise<{
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
    getConfig(tenantId: string, user?: any): Promise<({
        mappings: ({
            pipeline: {
                id: string;
                name: string;
                tenantId: string;
                customerId: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            stage: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                pipelineId: string;
                order: number;
                color: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            pipelineId: string;
            stageId: string;
            facebookFormId: string | null;
            configId: string;
            facebookFormName: string | null;
            fieldMappings: string | null;
            assignedUserIds: string | null;
            defaultAssigneeId: string | null;
        })[];
    } & {
        id: string;
        tenantId: string;
        customerId: string | null;
        isActive: boolean;
        updatedAt: Date;
        accessToken: string | null;
        userAccessToken: string | null;
        pageId: string | null;
        pageName: string | null;
        instagramBusinessAccountId: string | null;
    }) | null>;
    updateConfig(tenantId: string, data: any, user?: any): Promise<{
        id: string;
        tenantId: string;
        customerId: string | null;
        isActive: boolean;
        updatedAt: Date;
        accessToken: string | null;
        userAccessToken: string | null;
        pageId: string | null;
        pageName: string | null;
        instagramBusinessAccountId: string | null;
    }>;
    getPages(accessToken: string): Promise<any>;
    getForms(pageId: string, accessToken: string): Promise<any>;
    getFormFields(formId: string, accessToken: string): Promise<any>;
    getInstagramConversations(igUserId: string, accessToken: string): Promise<any>;
    getInstagramMessages(conversationId: string, accessToken: string): Promise<any>;
    addMapping(tenantId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        pipelineId: string;
        stageId: string;
        facebookFormId: string | null;
        configId: string;
        facebookFormName: string | null;
        fieldMappings: string | null;
        assignedUserIds: string | null;
        defaultAssigneeId: string | null;
    }>;
    updateMapping(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        pipelineId: string;
        stageId: string;
        facebookFormId: string | null;
        configId: string;
        facebookFormName: string | null;
        fieldMappings: string | null;
        assignedUserIds: string | null;
        defaultAssigneeId: string | null;
    }>;
    deleteMapping(id: string): Promise<{
        id: string;
        createdAt: Date;
        pipelineId: string;
        stageId: string;
        facebookFormId: string | null;
        configId: string;
        facebookFormName: string | null;
        fieldMappings: string | null;
        assignedUserIds: string | null;
        defaultAssigneeId: string | null;
    }>;
    private importRecentLeadsForMapping;
    pollFacebookLeads(): Promise<void>;
    private createLeadFromFacebookPayload;
    importLeads(tenantId: string, mappingId: string): Promise<{
        importedCount: number;
    }>;
    importLeadFromWebhook(pageId: string, formId: string, leadgenId: string): Promise<{
        importedCount: number;
    }>;
    clearFacebookLeads(tenantId: string): Promise<{
        deletedCount: number;
    }>;
    testConnection(tenantId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    previewMessages(tenantId: string): Promise<any[]>;
    confirmSync(tenantId: string): Promise<{
        importedCount: number;
    }>;
    getAuthUrl(tenantId: string): Promise<string>;
    handleCallback(code: string, tenantId: string): Promise<any>;
}
