import { PrismaService } from '../prisma/prisma.service';
import { TasksGateway } from './tasks.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { SmsService } from '../sms/sms.service';
export declare class TasksService {
    private prisma;
    private readonly tasksGateway?;
    private readonly notificationsService?;
    private readonly smsService?;
    constructor(prisma: PrismaService, tasksGateway?: TasksGateway | undefined, notificationsService?: NotificationsService | undefined, smsService?: SmsService | undefined);
    handleCron(): Promise<void>;
    findAll(tenantId: string, projectId?: string, user?: any): Promise<any[]>;
    findOne(id: string, tenantId: string, user?: any): Promise<any>;
    create(tenantId: string, data: any, user?: any): Promise<any>;
    update(id: string, tenantId: string, data: any, actorId?: string): Promise<any>;
    private mapTask;
    private prepareDataForSave;
    private getMirrorSyncData;
    updateOrder(tenantId: string, taskIds: string[]): Promise<{
        updatedCount: number;
    }>;
    updatePositions(tenantId: string, changes: Array<{
        id: string;
        status: string;
        order: number;
    }>): Promise<{
        updatedCount: number;
        tasks: any[];
    }>;
    delete(id: string, tenantId: string): Promise<any>;
    archiveTasksByProject(tenantId: string, projectId: string): Promise<void>;
    getColumnWatchers(tenantId: string, userId: string, projectId?: string): Promise<string[]>;
    toggleColumnWatcher(tenantId: string, userId: string, columnId: string, projectId?: string): Promise<{
        watching: boolean;
    }>;
    private getTaskForRealtime;
}
