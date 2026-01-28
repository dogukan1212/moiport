import { WordpressService } from './wordpress.service';
import type { Response } from 'express';
export declare class WordpressController {
    private readonly wordpressService;
    constructor(wordpressService: WordpressService);
    downloadPlugin(res: Response): void | Response<any, Record<string, any>>;
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
    getCategories(tenantId: string, id: string): Promise<any>;
    getKpi(tenantId: string, id: string): Promise<{
        total: number;
        drafts: number;
        published: number;
        scheduled: number;
        lastSentAt: Date | null;
    }>;
    listPosts(tenantId: string, id: string): Promise<{
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
    createPost(tenantId: string, id: string, data: any): Promise<any>;
    updatePost(tenantId: string, id: string, postId: string, data: any): Promise<any>;
    deletePost(tenantId: string, id: string, postId: string): Promise<any>;
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
    remove(tenantId: string, id: string): Promise<{
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
