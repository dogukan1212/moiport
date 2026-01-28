import { SubscriptionsService } from './subscriptions.service';
import type { Request } from 'express';
export declare class SubscriptionsController {
    private readonly service;
    constructor(service: SubscriptionsService);
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
    listPublicPlans(): Promise<{
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
    getInstallments(data: {
        bin: string;
        amount: number;
    }): Promise<number[] | {
        options: number[];
        brand: any;
        rates: any;
    }>;
    getMySubscription(tenantId: string): Promise<{
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
    initPaytr(tenantId: string, req: Request, data: {
        planCode: string;
        period: 'MONTHLY' | 'YEARLY';
        method?: 'CARD' | 'BANK_TRANSFER';
        promoCode?: string;
        installments?: number;
        billing?: {
            name?: string;
            email?: string;
            phone?: string;
            address?: string;
            taxNumber?: string;
        };
        card?: {
            number?: string;
            name?: string;
            expiry?: string;
            cvv?: string;
        };
    }): Promise<{
        error: string;
        token?: undefined;
    } | {
        token: string;
        error?: undefined;
    }>;
    paytrCallback(payload: any): Promise<"OK" | "PAYTR notification failed: bad hash" | {
        ok: boolean;
    }>;
    private getRequestIp;
    listAllPlans(): Promise<{
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
}
