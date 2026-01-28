import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(tenantId: string) {
    // 1. Calculate Monthly Revenue
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyRevenue = await this.prisma.transaction.aggregate({
      where: {
        tenantId,
        type: 'INCOME',
        status: 'PAID',
        date: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // 2. Active Projects
    const activeProjects = await this.prisma.project.count({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
    });

    // 3. Pending Tasks (TODO or IN_PROGRESS)
    const pendingTasks = await this.prisma.task.count({
      where: {
        tenantId,
        status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] },
      },
    });

    // 4. New Customers (Customers created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newCustomers = await this.prisma.customer.count({
      where: {
        tenantId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // 5. Monthly Revenue Chart Data (Last 6 months)
    const chartData: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const revenue = await this.prisma.transaction.aggregate({
        where: {
          tenantId,
          type: 'INCOME',
          status: 'PAID',
          date: {
            gte: start,
            lte: end,
          },
        },
        _sum: {
          amount: true,
        },
      });

      chartData.push({
        month: start.toLocaleString('tr-TR', { month: 'short' }),
        value: revenue._sum.amount || 0,
      });
    }

    return {
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      activeProjects,
      pendingTasks,
      newCustomers,
      chartData,
    };
  }
}
