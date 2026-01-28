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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_gateway_1 = require("./notifications.gateway");
let NotificationsService = class NotificationsService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async create(tenantId, data) {
        const notification = await this.prisma.notification.create({
            data: {
                tenantId,
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type,
                referenceId: data.referenceId,
                referenceType: data.referenceType,
            },
        });
        this.gateway.sendNotification(data.userId, notification);
        return notification;
    }
    async findAll(tenantId, userId, limit = 20) {
        return this.prisma.notification.findMany({
            where: {
                tenantId,
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });
    }
    async getUnreadCount(tenantId, userId) {
        const count = await this.prisma.notification.count({
            where: {
                tenantId,
                userId,
                isRead: false,
            },
        });
        return { count };
    }
    async markAsRead(tenantId, userId, id) {
        return this.prisma.notification.updateMany({
            where: {
                id,
                tenantId,
                userId,
            },
            data: {
                isRead: true,
            },
        });
    }
    async markAllAsRead(tenantId, userId) {
        return this.prisma.notification.updateMany({
            where: {
                tenantId,
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_gateway_1.NotificationsGateway])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map