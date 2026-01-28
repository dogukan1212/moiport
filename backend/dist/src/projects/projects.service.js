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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const chat_service_1 = require("../chat/chat.service");
const notifications_service_1 = require("../notifications/notifications.service");
const tasks_service_1 = require("../tasks/tasks.service");
let ProjectsService = class ProjectsService {
    prisma;
    chatService;
    tasksService;
    notificationsService;
    constructor(prisma, chatService, tasksService, notificationsService) {
        this.prisma = prisma;
        this.chatService = chatService;
        this.tasksService = tasksService;
        this.notificationsService = notificationsService;
    }
    async findAll(tenantId, user, customerId) {
        const where = { tenantId };
        if (user?.role === 'CLIENT' && user?.customerId) {
            where.customerId = user.customerId;
        }
        else if (customerId) {
            where.customerId = customerId;
        }
        const projects = await this.prisma.project.findMany({
            where,
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });
        const ids = projects.map((p) => p.id);
        if (ids.length === 0)
            return projects;
        const grouped = await this.prisma.task.groupBy({
            by: ['projectId', 'status'],
            where: {
                tenantId,
                projectId: { in: ids },
            },
            _count: { _all: true },
        });
        const map = new Map();
        for (const g of grouped) {
            if (!g.projectId)
                continue;
            const prev = map.get(g.projectId) || {
                TODO: 0,
                IN_PROGRESS: 0,
                REVIEW: 0,
                DONE: 0,
            };
            const key = String(g.status || '');
            prev[key] = (prev[key] || 0) + g._count._all;
            map.set(g.projectId, prev);
        }
        return projects.map((p) => ({
            ...p,
            tasksByStatus: map.get(p.id) || {
                TODO: 0,
                IN_PROGRESS: 0,
                REVIEW: 0,
                DONE: 0,
            },
        }));
    }
    async findOne(id, tenantId, user) {
        const where = { id, tenantId };
        if (user?.role === 'CLIENT' && user?.customerId) {
            where.customerId = user.customerId;
        }
        return this.prisma.project.findFirst({
            where,
            include: {
                customer: true,
                tasks: {
                    include: {
                        assignee: true,
                    },
                },
            },
        });
    }
    async create(tenantId, data, user) {
        const project = await this.prisma.project.create({
            data: {
                ...data,
                tenantId,
            },
        });
        try {
            if (project.customerId) {
                const customer = await this.prisma.customer.findFirst({
                    where: { id: project.customerId, tenantId },
                    select: { id: true, name: true },
                });
                const mirrorGroupId = global.crypto?.randomUUID?.() ||
                    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
                const checklist = [];
                const checklistStr = JSON.stringify(checklist);
                const agencyTitle = `${customer?.name || 'Müşteri'} ${project.name}`;
                await this.prisma.task.create({
                    data: {
                        tenantId,
                        projectId: project.id,
                        title: agencyTitle,
                        status: 'BRANDS',
                        order: 1024,
                        checklist: checklistStr,
                        checklistTotal: checklist.length,
                        checklistCompleted: 0,
                        mirrorGroupId,
                    },
                });
                await this.prisma.task.create({
                    data: {
                        tenantId,
                        projectId: project.id,
                        title: project.name,
                        status: 'TODO',
                        order: 1024,
                        checklist: checklistStr,
                        checklistTotal: checklist.length,
                        checklistCompleted: 0,
                        mirrorGroupId,
                    },
                });
            }
        }
        catch (e) {
            console.error('[ProjectsService] auto task create failed', e);
        }
        if (this.notificationsService) {
            const admins = await this.prisma.user.findMany({
                where: { tenantId, role: 'ADMIN', isActive: true },
                select: { id: true },
            });
            for (const admin of admins) {
                await this.notificationsService.create(tenantId, {
                    userId: admin.id,
                    title: 'Yeni Proje Oluşturuldu',
                    message: `${project.name} adlı proje oluşturuldu.`,
                    type: 'PROJECT_CREATED',
                    referenceId: project.id,
                    referenceType: 'PROJECT',
                });
            }
        }
        try {
            const base = (project.name || '').toLowerCase().trim();
            const slug = base
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            const roomName = `prj-${slug}`;
            await this.chatService.createRoom(tenantId, user, {
                name: roomName,
                type: 'PROJECT',
                projectId: project.id,
                isPrivate: true,
            });
        }
        catch (e) {
            void e;
        }
        return project;
    }
    async update(id, tenantId, data) {
        return this.prisma.project.update({
            where: { id, tenantId },
            data,
        });
    }
    async delete(id, tenantId) {
        await this.tasksService.archiveTasksByProject(tenantId, id);
        return this.prisma.project.delete({
            where: { id, tenantId },
        });
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_service_1.ChatService,
        tasks_service_1.TasksService,
        notifications_service_1.NotificationsService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map