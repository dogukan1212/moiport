import { TasksService } from './tasks.service';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    getColumnWatchers(tenantId: string, userId: string, projectId?: string): Promise<string[]>;
    toggleColumnWatcher(tenantId: string, userId: string, body: {
        columnId: string;
        projectId?: string;
    }): Promise<{
        watching: boolean;
    }>;
    findAll(tenantId: string, user: any, projectId?: string): Promise<any[]>;
    findOne(id: string, tenantId: string, user: any): Promise<any>;
    create(tenantId: string, user: any, data: any): Promise<any>;
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
    update(id: string, tenantId: string, userId: string, data: any): Promise<any>;
    remove(id: string, tenantId: string): Promise<any>;
}
