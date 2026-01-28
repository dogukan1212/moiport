import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(tenantId: string, user: any, limit?: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        title: string;
        userId: string;
        type: string;
        message: string;
        referenceId: string | null;
        referenceType: string | null;
        isRead: boolean;
    }[]>;
    getUnreadCount(tenantId: string, user: any): Promise<{
        count: number;
    }>;
    markAsRead(tenantId: string, user: any, id: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    markAllAsRead(tenantId: string, user: any): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
