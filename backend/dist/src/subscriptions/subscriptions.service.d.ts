import { PrismaService } from '../prisma/prisma.service';
type Period = 'MONTHLY' | 'YEARLY';
export declare class SubscriptionsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private getBackendUrl;
    private getFrontendUrl;
    private getPaytrSystemConfig;
    findPlans(): Promise<{
        activeCount: any;
        price: string;
        period: string;
        features: any;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        maxUsers: number | null;
        maxStorage: number | null;
        description: string | null;
        code: string;
        monthlyPrice: number;
        yearlyPrice: number | null;
        isPopular: boolean;
    }[]>;
    private ensurePlanDefinitions;
    getTenantSubscription(tenantId: string): Promise<{
        planDetail: any;
        paymentMethod: {
            provider: string;
            last4: string | null;
            brand: string | null;
            expiry: string | null;
        } | null;
        subscriptionPlan: string | null;
        subscriptionStatus: string | null;
        subscriptionEndsAt: Date | null;
        maxUsers: number | null;
        maxStorage: number | null;
        autoRenew: boolean;
    } | null>;
    createPlan(data: {
        code: string;
        name: string;
        description?: string;
        monthlyPrice: number;
        yearlyPrice?: number;
        isPopular?: boolean;
        maxUsers?: number;
        maxStorage?: number;
        features?: string[];
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        maxUsers: number | null;
        maxStorage: number | null;
        description: string | null;
        code: string;
        monthlyPrice: number;
        yearlyPrice: number | null;
        isPopular: boolean;
        features: string | null;
    }>;
    updatePlan(code: string, data: Partial<{
        name: string;
        description: string;
        monthlyPrice: number;
        yearlyPrice: number;
        isPopular: boolean;
        maxUsers: number;
        maxStorage: number;
        features: string[];
    }>): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        maxUsers: number | null;
        maxStorage: number | null;
        description: string | null;
        code: string;
        monthlyPrice: number;
        yearlyPrice: number | null;
        isPopular: boolean;
        features: string | null;
    }>;
    private addMonths;
    private addYears;
    initPaytrPayment(tenantId: string, userIp: string, planCode: string, period: Period, method?: 'CARD' | 'BANK_TRANSFER', promoCode?: string, installments?: number, billing?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
        taxNumber?: string;
    }, card?: {
        number?: string;
        name?: string;
        expiry?: string;
        cvv?: string;
    }): Promise<{
        error: string;
        token?: undefined;
    } | {
        token: string;
        error?: undefined;
    }>;
    handlePaytrCallback(payload: any): Promise<"OK" | "PAYTR notification failed: bad hash" | {
        ok: boolean;
    }>;
    handleAutoRenewals(): Promise<void>;
    getPaytrInstallments(bin: string, _amount: number): Promise<number[] | {
        options: number[];
        brand: any;
        rates: any;
    }>;
}
export {};
