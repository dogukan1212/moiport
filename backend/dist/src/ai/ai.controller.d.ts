import { AIService } from './ai.service';
import { PexelsService } from './pexels.service';
export declare class AIController {
    private readonly aiService;
    private readonly pexelsService;
    constructor(aiService: AIService, pexelsService: PexelsService);
    suggestImages(query: string, perPage?: number, locale?: string): Promise<import("./pexels.service").PexelsPhoto[]>;
    analyzeSector(tenantId: string, sector: string, customerUrl?: string, customerIg?: string, deepSearch?: boolean): Promise<{
        report: any;
    }>;
    generateSmartPrompt(tenantId: string, data: {
        sector: string;
        type: string;
        topic: string;
        context?: string;
        aiModel?: string;
    }): Promise<{
        prompt: any;
    }>;
    analyzeSite(tenantId: string, url: string, deepSearch?: boolean, siteId?: string): Promise<any>;
    suggestTitles(tenantId: string, data: {
        topic: string;
        context?: string;
        aiModel?: string;
    }): Promise<{
        titles: any;
    }>;
    generateContent(tenantId: string, data: {
        type: string;
        topic: string;
        sector: string;
        customerUrl?: string;
        customerIg?: string;
        context?: string;
        tone?: string;
        aiModel?: string;
    }): Promise<{
        content: string;
        tags: string[];
    }>;
    generateProposal(tenantId: string, data: {
        clientName: string;
        projectScope: string;
        sector: string;
        timeline?: string;
        goals?: string;
        deepSearch?: boolean;
        customerWebsite?: string;
        selectedServices?: any[];
        aiModel?: string;
    }): Promise<{
        proposal: any;
    }>;
    financeInsights(tenantId: string, data: {
        aiModel?: string;
        preferredCurrency?: string;
    }, options?: any, context?: any): Promise<{
        metrics: {
            currency: string;
            totals: {
                incomePaid: number;
                expensePaid: number;
                balance: number;
                receivables: number;
                receivableCount: number;
                mrr: number;
                monthlyFixedExpense: number;
            };
            months: string[];
            monthlyIncome: number[];
            monthlyExpense: number[];
            topExpenses: {
                label: string;
                amount: number;
            }[];
            overdueInvoices: {
                number: string;
                id: string;
                dueDate: Date;
                totalAmount: number;
            }[];
            upcomingDue: {
                number: string;
                id: string;
                dueDate: Date;
                totalAmount: number;
            }[];
        };
        insights: any;
    }>;
    financeQA(tenantId: string, data: {
        question: string;
        aiModel?: string;
        preferredCurrency?: string;
    }, options?: any, context?: any): Promise<{
        answer: any;
    }>;
    testConnection(): Promise<{
        status: string;
        message: any;
    }>;
    whatsappSmartReplies(tenantId: string, messages: string[], aiModel?: string): Promise<{
        replies: string[];
    }>;
}
