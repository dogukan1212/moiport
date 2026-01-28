import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
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
