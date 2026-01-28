import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(tenantId: string): Promise<{
        monthlyRevenue: number;
        activeProjects: number;
        pendingTasks: number;
        newCustomers: number;
        chartData: {
            month: string;
            value: number;
        }[];
    }>;
}
