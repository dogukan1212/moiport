import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { CrmGateway } from '../crm/crm.gateway';
import { FacebookService } from '../integrations/facebook/facebook.service';
export declare class WebhooksService {
    private prisma;
    private chatGateway;
    private crmGateway;
    private facebookService;
    constructor(prisma: PrismaService, chatGateway: ChatGateway, crmGateway: CrmGateway, facebookService: FacebookService);
    handleMetaPayload(payload: any): Promise<{
        status: string;
    }>;
    private handleWhatsAppMessage;
    private handleFacebookLeadgen;
    private handleFacebookMessage;
    handleWasenderPayload(payload: any): Promise<{
        status: string;
    }>;
    private handleInstagramMessage;
    private handleInstagramComment;
}
