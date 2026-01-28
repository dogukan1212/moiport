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
var SocialMediaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialMediaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const schedule_1 = require("@nestjs/schedule");
let SocialMediaService = SocialMediaService_1 = class SocialMediaService {
    prisma;
    notificationsService;
    logger = new common_1.Logger(SocialMediaService_1.name);
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async create(tenantId, data) {
        return this.prisma.socialMediaPost.create({
            data: {
                content: data.content,
                type: data.type,
                platform: data.platform || 'INSTAGRAM',
                customerId: data.customerId,
                tenantId,
            },
        });
    }
    async findAll(tenantId, customerId) {
        return this.prisma.socialMediaPost.findMany({
            where: {
                tenantId,
                ...(customerId ? { customerId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: {
                customer: {
                    select: { name: true },
                },
            },
        });
    }
    async findOne(tenantId, id) {
        const post = await this.prisma.socialMediaPost.findFirst({
            where: { id, tenantId },
        });
        if (!post)
            throw new common_1.NotFoundException('İçerik bulunamadı.');
        return post;
    }
    async update(tenantId, id, data) {
        const post = await this.findOne(tenantId, id);
        return this.prisma.socialMediaPost.update({
            where: { id: post.id },
            data,
        });
    }
    async remove(tenantId, id) {
        const post = await this.findOne(tenantId, id);
        return this.prisma.socialMediaPost.delete({
            where: { id: post.id },
        });
    }
    async createPlan(tenantId, data) {
        const plan = await this.prisma.socialMediaPlan.create({
            data: {
                ...data,
                tenantId,
            },
        });
        await this.notifyAssignees(tenantId, plan);
        return plan;
    }
    async findAllPlans(tenantId, customerId) {
        return this.prisma.socialMediaPlan.findMany({
            where: {
                tenantId,
                ...(customerId ? { customerId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: {
                customer: { select: { id: true, name: true } },
                socialMediaManagerUser: {
                    select: { id: true, name: true, avatar: true },
                },
                designerUser: { select: { id: true, name: true, avatar: true } },
            },
        });
    }
    async findOnePlan(tenantId, id, user) {
        const plan = await this.prisma.socialMediaPlan.findFirst({
            where: {
                id,
                tenantId,
                ...(user?.role === 'CLIENT' && user?.customerId
                    ? { customerId: user.customerId }
                    : {}),
            },
            include: {
                customer: { select: { id: true, name: true } },
                socialMediaManagerUser: {
                    select: { id: true, name: true, avatar: true },
                },
                designerUser: { select: { id: true, name: true, avatar: true } },
            },
        });
        if (!plan)
            throw new common_1.NotFoundException('Plan bulunamadı.');
        return plan;
    }
    async updatePlan(tenantId, id, data) {
        const oldPlan = await this.findOnePlan(tenantId, id);
        const plan = await this.prisma.socialMediaPlan.update({
            where: { id },
            data,
        });
        if (data.socialMediaManagerId &&
            data.socialMediaManagerId !== oldPlan.socialMediaManagerId) {
            await this.notificationsService.create(tenantId, {
                userId: data.socialMediaManagerId,
                title: 'Yeni Görev Ataması',
                message: `${plan.brandName || 'Bir plan'} için Sosyal Medya Yöneticisi olarak atandınız.`,
                type: 'PLAN_ASSIGNMENT',
                referenceId: plan.id,
                referenceType: 'SOCIAL_MEDIA_PLAN',
            });
        }
        if (data.designerId && data.designerId !== oldPlan.designerId) {
            await this.notificationsService.create(tenantId, {
                userId: data.designerId,
                title: 'Yeni Görev Ataması',
                message: `${plan.brandName || 'Bir plan'} için Tasarımcı olarak atandınız.`,
                type: 'PLAN_ASSIGNMENT',
                referenceId: plan.id,
                referenceType: 'SOCIAL_MEDIA_PLAN',
            });
        }
        return plan;
    }
    async removePlan(tenantId, id) {
        await this.findOnePlan(tenantId, id);
        return this.prisma.socialMediaPlan.delete({
            where: { id },
        });
    }
    async notifyAssignees(tenantId, plan) {
        if (plan.socialMediaManagerId) {
            await this.notificationsService.create(tenantId, {
                userId: plan.socialMediaManagerId,
                title: 'Yeni Görev Ataması',
                message: `${plan.brandName || 'Bir plan'} için Sosyal Medya Yöneticisi olarak atandınız.`,
                type: 'PLAN_ASSIGNMENT',
                referenceId: plan.id,
                referenceType: 'SOCIAL_MEDIA_PLAN',
            });
        }
        if (plan.designerId) {
            await this.notificationsService.create(tenantId, {
                userId: plan.designerId,
                title: 'Yeni Görev Ataması',
                message: `${plan.brandName || 'Bir plan'} için Tasarımcı olarak atandınız.`,
                type: 'PLAN_ASSIGNMENT',
                referenceId: plan.id,
                referenceType: 'SOCIAL_MEDIA_PLAN',
            });
        }
    }
    async handleCron() {
        this.logger.debug('Running Social Media Plan Deadlines Check...');
        const plans = await this.prisma.socialMediaPlan.findMany({
            where: {
                OR: [
                    { briefStatus: { not: 'Tamamlandı' } },
                    { designStatus: { not: 'Tamamlandı' } },
                ],
            },
        });
        for (const plan of plans) {
            if (plan.briefDeadline && plan.briefStatus !== 'Tamamlandı') {
                await this.checkAndNotifyDeadline(plan, plan.briefDeadline, 'Brief', plan.socialMediaManagerId);
            }
            if (plan.presentationDeadline && plan.designStatus !== 'Tamamlandı') {
                await this.checkAndNotifyDeadline(plan, plan.presentationDeadline, 'Sunum', plan.socialMediaManagerId);
                await this.checkAndNotifyDeadline(plan, plan.presentationDeadline, 'Sunum', plan.designerId);
            }
        }
    }
    async checkAndNotifyDeadline(plan, deadline, type, userId) {
        if (!userId)
            return;
        const tenantId = typeof plan?.tenantId === 'string'
            ? plan.tenantId
            : String(plan?.tenantId ?? '');
        if (!tenantId)
            return;
        const now = new Date();
        const d = new Date(deadline);
        const diffTime = d.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            await this.notificationsService.create(tenantId, {
                userId,
                title: `${type} Teslim Tarihi Yaklaşıyor`,
                message: `${plan.brandName} için ${type} teslimine 1 gün kaldı!`,
                type: 'PLAN_REMINDER',
                referenceId: plan.id,
                referenceType: 'SOCIAL_MEDIA_PLAN',
            });
        }
        else if (diffDays === 0) {
            await this.notificationsService.create(tenantId, {
                userId,
                title: `${type} Teslim Tarihi Bugün`,
                message: `${plan.brandName} için ${type} teslimi bugün!`,
                type: 'PLAN_REMINDER',
                referenceId: plan.id,
                referenceType: 'SOCIAL_MEDIA_PLAN',
            });
        }
        else if (diffDays === -1) {
            await this.notificationsService.create(tenantId, {
                userId,
                title: `${type} Teslim Tarihi Geçti`,
                message: `${plan.brandName} için ${type} teslim tarihi dün doldu!`,
                type: 'PLAN_OVERDUE',
                referenceId: plan.id,
                referenceType: 'SOCIAL_MEDIA_PLAN',
            });
        }
    }
};
exports.SocialMediaService = SocialMediaService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_9AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SocialMediaService.prototype, "handleCron", null);
exports.SocialMediaService = SocialMediaService = SocialMediaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], SocialMediaService);
//# sourceMappingURL=social-media.service.js.map