import { ServicesService } from './services.service';
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
    create(tenantId: string, data: {
        name: string;
        description?: string;
        basePrice?: number;
        billingCycle?: string;
    }): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        basePrice: number | null;
        billingCycle: string | null;
    }>;
    findAll(tenantId: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        basePrice: number | null;
        billingCycle: string | null;
    }[]>;
    findOne(tenantId: string, id: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        basePrice: number | null;
        billingCycle: string | null;
    }>;
    update(tenantId: string, id: string, data: {
        name?: string;
        description?: string;
        basePrice?: number;
        billingCycle?: string;
    }): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        basePrice: number | null;
        billingCycle: string | null;
    }>;
    remove(tenantId: string, id: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        basePrice: number | null;
        billingCycle: string | null;
    }>;
}
