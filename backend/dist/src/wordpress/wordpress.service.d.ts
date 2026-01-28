import { PrismaService } from '../prisma/prisma.service';
export declare class WordpressService {
    private prisma;
    constructor(prisma: PrismaService);
    private parseGmtDateTime;
    private safeJsonStringify;
    findAll(tenantId: string): Promise<({
        customer: {
            id: string;
            email: string | null;
            name: string;
            tenantId: string;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        tenantId: string;
        customerId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        apiKey: string;
        siteUrl: string;
        lastSyncAt: Date | null;
        siteAnalysis: string | null;
    })[]>;
    findOne(tenantId: string, id: string): Promise<({
        customer: {
            id: string;
            email: string | null;
            name: string;
            tenantId: string;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        tenantId: string;
        customerId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        apiKey: string;
        siteUrl: string;
        lastSyncAt: Date | null;
        siteAnalysis: string | null;
    }) | null>;
    create(tenantId: string, data: any): Promise<{
        id: string;
        tenantId: string;
        customerId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        apiKey: string;
        siteUrl: string;
        lastSyncAt: Date | null;
        siteAnalysis: string | null;
    }>;
    update(tenantId: string, id: string, data: any): Promise<{
        id: string;
        tenantId: string;
        customerId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        apiKey: string;
        siteUrl: string;
        lastSyncAt: Date | null;
        siteAnalysis: string | null;
    }>;
    createPost(tenantId: string, siteId: string, data: any): Promise<any>;
    listPosts(tenantId: string, siteId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: string;
        content: string | null;
        deletedAt: Date | null;
        siteId: string;
        categories: string | null;
        tags: string | null;
        wpPostId: number;
        postUrl: string | null;
        featuredImageUrl: string | null;
        scheduledAt: Date | null;
        publishedAt: Date | null;
    }[]>;
    getKpi(tenantId: string, siteId: string): Promise<{
        total: number;
        drafts: number;
        published: number;
        scheduled: number;
        lastSentAt: Date | null;
    }>;
    updatePost(tenantId: string, siteId: string, postRecordId: string, data: any): Promise<any>;
    deletePost(tenantId: string, siteId: string, postRecordId: string): Promise<any>;
    getCategories(tenantId: string, siteId: string): Promise<any>;
    delete(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        customerId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        apiKey: string;
        siteUrl: string;
        lastSyncAt: Date | null;
        siteAnalysis: string | null;
    }>;
}
