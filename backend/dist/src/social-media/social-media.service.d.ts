import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class SocialMediaService {
    private prisma;
    private notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
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
    findAllPlans(tenantId: string, customerId?: string): Promise<({
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
    findOnePlan(tenantId: string, id: string, user?: any): Promise<{
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
    private notifyAssignees;
    handleCron(): Promise<void>;
    private checkAndNotifyDeadline;
}
