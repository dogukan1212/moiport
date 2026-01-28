import { OnModuleInit } from '@nestjs/common';
import { WebSearchService } from './web-search.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class AIService implements OnModuleInit {
    private readonly webSearchService;
    private readonly prisma;
    private readonly logger;
    private genAI;
    private model;
    constructor(webSearchService: WebSearchService, prisma: PrismaService);
    onModuleInit(): void;
    listAvailableModels(): Promise<void>;
    private getAiMonthlyLimit;
    private checkAiQuota;
    private tryGenerateContent;
    analyzeSector(tenantId: string, sector: string, customerUrl?: string, customerIg?: string, deepSearch?: boolean): Promise<{
        report: any;
    }>;
    generateSmartPrompt(tenantId: string, data: {
        sector: string;
        type: string;
        topic: string;
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
        sector: string;
        customerUrl?: string;
        customerIg?: string;
        type: string;
        topic: string;
        tone?: string;
        context?: string;
        deepSearch?: boolean;
        aiModel?: string;
        length?: 'SHORT' | 'MEDIUM' | 'LONG';
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
    testGemini(): Promise<{
        status: string;
        message: any;
    }>;
    generateSmartReplies(messages: string[]): Promise<string[]>;
}
