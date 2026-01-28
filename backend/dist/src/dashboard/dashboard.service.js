"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats(tenantId) {
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
        const activeProjects = await this.prisma.project.count({
            where: {
                tenantId,
                status: 'ACTIVE',
            },
        });
        const pendingTasks = await this.prisma.task.count({
            where: {
                tenantId,
                status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] },
            },
        });
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newCustomers = await this.prisma.customer.count({
            where: {
                tenantId,
                createdAt: { gte: thirtyDaysAgo },
            },
        });
        const chartData = [];
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
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map