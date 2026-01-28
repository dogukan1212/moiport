import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
export declare class NotificationsService {
    private prisma;
    private gateway;
    constructor(prisma: PrismaService, gateway: NotificationsGateway);
    create(tenantId: string, data: {
        userId: string;
        title: string;
        message: string;
        type: string;
        referenceId?: string;
        referenceType?: string;
    }): Promise<{
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
    }>;
    findAll(tenantId: string, userId: string, limit?: number): Promise<{
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
    getUnreadCount(tenantId: string, userId: string): Promise<{
        count: number;
    }>;
    markAsRead(tenantId: string, userId: string, id: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    markAllAsRead(tenantId: string, userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
