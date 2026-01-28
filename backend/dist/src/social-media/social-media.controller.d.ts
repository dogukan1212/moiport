import { SocialMediaService } from './social-media.service';
export declare class SocialMediaController {
    private readonly socialMediaService;
    constructor(socialMediaService: SocialMediaService);
    create(tenantId: string, data: {
        content: string;
        type: string;
        customerId: string;
        platform?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        customerId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        platform: string;
        type: string;
        metadata: string | null;
        content: string;
    }>;
    createPlan(tenantId: string, data: any): Promise<{
        id: string;
        tenantId: string;
        customerId: string | null;
        createdAt: Date;
        updatedAt: Date;
        brandName: string | null;
        currentPlanEndDate: Date | null;
        newPlanStartDate: Date | null;
        briefDeadline: Date | null;
        presentationDeadline: Date | null;
        briefStatus: string;
        designStatus: string;
        socialMediaManager: string | null;
        designer: string | null;
        calendarUrl: string | null;
        socialMediaManagerId: string | null;
        designerId: string | null;
    }>;
    findAllPlans(tenantId: string, user: any, queryCustomerId?: string): Promise<({
        customer: {
            id: string;
            name: string;
        } | null;
        socialMediaManagerUser: {
            id: string;
            name: string | null;
            avatar: string | null;
        } | null;
        designerUser: {
            id: string;
            name: string | null;
            avatar: string | null;
        } | null;
    } & {
        id: string;
        tenantId: string;
        customerId: string | null;
        createdAt: Date;
        updatedAt: Date;
        brandName: string | null;
        currentPlanEndDate: Date | null;
        newPlanStartDate: Date | null;
        briefDeadline: Date | null;
        presentationDeadline: Date | null;
        briefStatus: string;
        designStatus: string;
        socialMediaManager: string | null;
        designer: string | null;
        calendarUrl: string | null;
        socialMediaManagerId: string | null;
        designerId: string | null;
    })[]>;
    findOnePlan(tenantId: string, user: any, id: string): Promise<{
        customer: {
            id: string;
            name: string;
        } | null;
        socialMediaManagerUser: {
            id: string;
            name: string | null;
            avatar: string | null;
        } | null;
        designerUser: {
            id: string;
            name: string | null;
            avatar: string | null;
        } | null;
    } & {
        id: string;
        tenantId: string;
        customerId: string | null;
        createdAt: Date;
        updatedAt: Date;
        brandName: string | null;
        currentPlanEndDate: Date | null;
        newPlanStartDate: Date | null;
        briefDeadline: Date | null;
        presentationDeadline: Date | null;
        briefStatus: string;
        designStatus: string;
        socialMediaManager: string | null;
        designer: string | null;
        calendarUrl: string | null;
        socialMediaManagerId: string | null;
        designerId: string | null;
    }>;
    updatePlan(tenantId: string, id: string, data: any): Promise<{
        id: string;
        tenantId: string;
        customerId: string | null;
        createdAt: Date;
        updatedAt: Date;
        brandName: string | null;
        currentPlanEndDate: Date | null;
        newPlanStartDate: Date | null;
        briefDeadline: Date | null;
        presentationDeadline: Date | null;
        briefStatus: string;
        designStatus: string;
        socialMediaManager: string | null;
        designer: string | null;
        calendarUrl: string | null;
        socialMediaManagerId: string | null;
        designerId: string | null;
    }>;
    removePlan(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        customerId: string | null;
        createdAt: Date;
        updatedAt: Date;
        brandName: string | null;
        currentPlanEndDate: Date | null;
        newPlanStartDate: Date | null;
        briefDeadline: Date | null;
        presentationDeadline: Date | null;
        briefStatus: string;
        designStatus: string;
        socialMediaManager: string | null;
        designer: string | null;
        calendarUrl: string | null;
        socialMediaManagerId: string | null;
        designerId: string | null;
    }>;
    findAll(tenantId: string, user: any, queryCustomerId?: string): Promise<({
        customer: {
            name: string;
        };
    } & {
        id: string;
        tenantId: string;
        customerId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        platform: string;
        type: string;
        metadata: string | null;
        content: string;
    })[]>;
    findOne(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        customerId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        platform: string;
        type: string;
        metadata: string | null;
        content: string;
    }>;
    update(tenantId: string, id: string, data: {
        content?: string;
        status?: string;
        platform?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        customerId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        platform: string;
        type: string;
        metadata: string | null;
        content: string;
    }>;
    remove(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        customerId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        platform: string;
        type: string;
        metadata: string | null;
        content: string;
    }>;
}
