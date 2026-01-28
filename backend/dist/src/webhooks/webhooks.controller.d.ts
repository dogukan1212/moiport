import { WebhooksService } from './webhooks.service';
import { FacebookService } from '../integrations/facebook/facebook.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class WebhooksController {
    private readonly webhooksService;
    private readonly facebookService;
    private readonly prisma;
    constructor(webhooksService: WebhooksService, facebookService: FacebookService, prisma: PrismaService);
    verifyMeta(mode: string, token: string, challenge: string): Promise<string>;
    handleMetaPayload(payload: any): Promise<{
        status: string;
    }>;
    handleWasenderPayload(payload: any, signature?: string): Promise<{
        status: string;
    }>;
    handlePaytrLinkCallback(body: any): Promise<"OK" | "PAYTR notification failed: bad hash">;
}
