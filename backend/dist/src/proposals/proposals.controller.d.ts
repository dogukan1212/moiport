import { ProposalsService } from './proposals.service';
export declare class ProposalsController {
    private readonly proposalsService;
    constructor(proposalsService: ProposalsService);
    create(tenantId: string, data: {
        title: string;
        content: string;
        customerId: string;
        status?: string;
        metadata?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        customerId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: string;
        metadata: string | null;
        content: string;
    }>;
    findAll(tenantId: string, customerId?: string): Promise<({
        customer: {
            name: string;
        };
    } & {
        id: string;
        tenantId: string;
        customerId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: string;
        metadata: string | null;
        content: string;
    })[]>;
    findOne(tenantId: string, id: string): Promise<{
        customer: {
            name: string;
        };
    } & {
        id: string;
        tenantId: string;
        customerId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: string;
        metadata: string | null;
        content: string;
    }>;
    update(tenantId: string, id: string, data: {
        title?: string;
        content?: string;
        status?: string;
        metadata?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        customerId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: string;
        metadata: string | null;
        content: string;
    }>;
    remove(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        customerId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: string;
        metadata: string | null;
        content: string;
    }>;
}
