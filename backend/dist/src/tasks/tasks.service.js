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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tasks_gateway_1 = require("./tasks.gateway");
const notifications_service_1 = require("../notifications/notifications.service");
const schedule_1 = require("@nestjs/schedule");
const sms_service_1 = require("../sms/sms.service");
let TasksService = class TasksService {
    prisma;
    tasksGateway;
    notificationsService;
    smsService;
    constructor(prisma, tasksGateway, notificationsService, smsService) {
        this.prisma = prisma;
        this.tasksGateway = tasksGateway;
        this.notificationsService = notificationsService;
        this.smsService = smsService;
    }
    async handleCron() {
        if (!this.notificationsService)
            return;
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));
        const tasks = await this.prisma.task.findMany({
            where: {
                status: { not: 'DONE' },
                dueDate: {
                    gte: startOfToday,
                    lte: endOfTomorrow,
                },
                assigneeId: { not: null },
            },
            include: { assignee: true },
        });
        for (const task of tasks) {
            if (!task.assigneeId)
                continue;
            const alreadySent = await this.prisma.notification.findFirst({
                where: {
                    userId: task.assigneeId,
                    type: 'TASK_DUE',
                    referenceId: task.id,
                    createdAt: {
                        gte: startOfToday,
                    },
                },
            });
            if (!alreadySent) {
                await this.notificationsService.create(task.tenantId, {
                    userId: task.assigneeId,
                    title: 'Görev Zamanı Yaklaşıyor',
                    message: `${task.title} görevinin son tarihi yaklaşıyor (${task.dueDate?.toLocaleDateString('tr-TR')}).`,
                    type: 'TASK_DUE',
                    referenceId: task.id,
                    referenceType: 'TASK',
                });
            }
        }
    }
    async findAll(tenantId, projectId, user) {
        const where = {
            tenantId,
            ...(projectId ? { projectId } : {}),
        };
        if (user?.role === 'CLIENT' && user?.customerId) {
            where.project = {
                customerId: user.customerId,
            };
        }
        const tasks = await this.prisma.task.findMany({
            where,
            orderBy: {
                order: 'asc',
            },
            include: {
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (user?.role !== 'CLIENT') {
            const uniqueTasks = [];
            const mirrorGroups = new Map();
            for (const task of tasks) {
                if (!task.mirrorGroupId) {
                    uniqueTasks.push(task);
                }
                else {
                    const group = mirrorGroups.get(task.mirrorGroupId) || [];
                    group.push(task);
                    mirrorGroups.set(task.mirrorGroupId, group);
                }
            }
            for (const [_, groupTasks] of mirrorGroups) {
                if (groupTasks.length === 1) {
                    uniqueTasks.push(groupTasks[0]);
                }
                else {
                    const preferred = groupTasks.find((t) => t.status === 'BRANDS') ||
                        groupTasks.sort((a, b) => b.title.length - a.title.length)[0];
                    uniqueTasks.push(preferred);
                }
            }
            return uniqueTasks
                .sort((a, b) => a.order - b.order)
                .map((task) => this.mapTask(task));
        }
        return tasks.map((task) => this.mapTask(task));
    }
    async findOne(id, tenantId, user) {
        const where = { id, tenantId };
        if (user?.role === 'CLIENT' && user?.customerId) {
            where.project = {
                customerId: user.customerId,
            };
        }
        const task = await this.prisma.task.findFirst({
            where,
            include: {
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return task ? this.mapTask(task) : null;
    }
    async create(tenantId, data, user) {
        const preparedData = this.prepareDataForSave(data);
        if (user?.role === 'CLIENT' &&
            user?.customerId &&
            (!preparedData.projectId || preparedData.projectId === null)) {
            preparedData.status = 'BRANDS';
            const existing = await this.prisma.project.findFirst({
                where: { tenantId, customerId: user.customerId },
                select: { id: true, name: true },
            });
            let projectId = existing?.id || null;
            if (!projectId) {
                const created = await this.prisma.project.create({
                    data: {
                        tenantId,
                        customerId: user.customerId,
                        name: 'Genel',
                        description: 'Müşteri görevleri',
                        status: 'ACTIVE',
                    },
                });
                projectId = created.id;
            }
            preparedData.projectId = projectId;
        }
        const task = await this.prisma.task.create({
            data: {
                ...preparedData,
                tenantId,
            },
        });
        const mapped = await this.getTaskForRealtime(task.id, tenantId);
        this.tasksGateway?.emitTaskCreated(tenantId, mapped);
        const customerId = mapped?.project?.customerId;
        if (customerId) {
            this.tasksGateway?.emitTaskCreatedClient(tenantId, customerId, mapped);
        }
        if (task.assigneeId && this.notificationsService) {
            await this.notificationsService.create(tenantId, {
                userId: task.assigneeId,
                title: 'Yeni Görev Atandı',
                message: `Size yeni bir görev atandı: ${task.title}`,
                type: 'TASK_ASSIGNMENT',
                referenceId: task.id,
                referenceType: 'TASK',
            });
        }
        return mapped;
    }
    async update(id, tenantId, data, actorId) {
        const sendSmsOnCompletion = data?.sendSmsOnCompletion === true;
        const preparedData = this.prepareDataForSave(data);
        if (preparedData.status === 'DONE' && actorId) {
            try {
                const actor = await this.prisma.user.findFirst({
                    where: { id: actorId, tenantId },
                    select: { role: true },
                });
                if (actor?.role === 'CLIENT') {
                    delete preparedData.status;
                }
            }
            catch (e) {
                void e;
            }
        }
        const existing = await this.prisma.task.findFirst({
            where: { id, tenantId },
            select: {
                id: true,
                mirrorGroupId: true,
                assigneeId: true,
                title: true,
                members: true,
                description: true,
                comments: true,
                status: true,
                attachmentCount: true,
                checklistCompleted: true,
                checklistTotal: true,
            },
        });
        if (!existing)
            throw new common_1.NotFoundException('Görev bulunamadı.');
        const mirrorSyncData = this.getMirrorSyncData(preparedData);
        const ops = [];
        if (existing.mirrorGroupId && Object.keys(mirrorSyncData).length > 0) {
            ops.push(this.prisma.task.updateMany({
                where: { tenantId, mirrorGroupId: existing.mirrorGroupId },
                data: mirrorSyncData,
            }));
        }
        ops.push(this.prisma.task.update({
            where: { id: existing.id },
            data: preparedData,
        }));
        await this.prisma.$transaction(ops);
        if (preparedData.assigneeId &&
            preparedData.assigneeId !== existing.assigneeId &&
            this.notificationsService) {
            await this.notificationsService.create(tenantId, {
                userId: preparedData.assigneeId,
                title: 'Görev Size Atandı',
                message: `Bir görev size atandı: ${existing.title}`,
                type: 'TASK_ASSIGNMENT',
                referenceId: existing.id,
                referenceType: 'TASK',
            });
        }
        if (preparedData.members && this.notificationsService) {
            const oldMembers = existing.members
                ? JSON.parse(existing.members)
                : [];
            const newMembers = JSON.parse(preparedData.members);
            const addedMembers = newMembers.filter((id) => !oldMembers.includes(id));
            for (const userId of addedMembers) {
                if (userId === preparedData.assigneeId)
                    continue;
                await this.notificationsService.create(tenantId, {
                    userId,
                    title: 'Göreve Eklendiniz',
                    message: `Bir göreve üye olarak eklendiniz: ${existing.title}`,
                    type: 'TASK_ASSIGNMENT',
                    referenceId: existing.id,
                    referenceType: 'TASK',
                });
            }
        }
        if (preparedData.description &&
            preparedData.description !== existing.description &&
            this.notificationsService) {
            const oldDescription = existing.description || '';
            const newDescription = preparedData.description || '';
            if (newDescription.includes('@')) {
                const tenantUsers = await this.prisma.user.findMany({
                    where: { tenantId, isActive: true },
                    select: { id: true, name: true },
                });
                for (const user of tenantUsers) {
                    if (!user.name)
                        continue;
                    const mentionText = `@${user.name}`;
                    const isMentionedNow = newDescription.includes(mentionText);
                    const wasMentionedBefore = oldDescription.includes(mentionText);
                    if (isMentionedNow && !wasMentionedBefore) {
                        await this.notificationsService.create(tenantId, {
                            userId: user.id,
                            title: 'Görevde Sizden Bahsedildi',
                            message: `${existing.title} görevinde sizden bahsedildi.`,
                            type: 'TASK_MENTION',
                            referenceId: existing.id,
                            referenceType: 'TASK',
                        });
                    }
                }
            }
        }
        if (existing.mirrorGroupId && Object.keys(mirrorSyncData).length > 0) {
            const tasks = await this.prisma.task.findMany({
                where: { tenantId, mirrorGroupId: existing.mirrorGroupId },
                include: {
                    assignee: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    project: {
                        select: { customerId: true },
                    },
                },
            });
            const mapped = tasks.map((t) => this.mapTask(t));
            const uniqueMapped = [];
            const mirrorGroups = new Map();
            for (const t of mapped) {
                if (!t.mirrorGroupId) {
                    uniqueMapped.push(t);
                }
                else {
                    const group = mirrorGroups.get(t.mirrorGroupId) || [];
                    group.push(t);
                    mirrorGroups.set(t.mirrorGroupId, group);
                }
            }
            for (const [_, groupTasks] of mirrorGroups) {
                if (groupTasks.length === 1) {
                    uniqueMapped.push(groupTasks[0]);
                }
                else {
                    const preferred = groupTasks.find((t) => t.status === 'BRANDS') ||
                        groupTasks.sort((a, b) => b.title.length - a.title.length)[0];
                    uniqueMapped.push(preferred);
                }
            }
            this.tasksGateway?.emitTasksBulkUpdated(tenantId, uniqueMapped);
            const byCustomer = {};
            for (const mt of mapped) {
                const cid = mt?.project?.customerId;
                if (cid) {
                    (byCustomer[cid] ||= []).push(mt);
                }
            }
            for (const [cid, list] of Object.entries(byCustomer)) {
                this.tasksGateway?.emitTasksBulkUpdatedClient(tenantId, cid, list);
            }
            const current = mapped.find((t) => t.id === existing.id);
            return current || (await this.getTaskForRealtime(existing.id, tenantId));
        }
        if (preparedData.status &&
            preparedData.status === 'DONE' &&
            existing.status !== 'DONE' &&
            this.notificationsService) {
            const watchers = existing.members ? JSON.parse(existing.members) : [];
            if (existing.assigneeId && !watchers.includes(existing.assigneeId)) {
                watchers.push(existing.assigneeId);
            }
            for (const userId of watchers) {
                if (actorId && userId === actorId)
                    continue;
                await this.notificationsService.create(tenantId, {
                    userId,
                    title: 'Görev Tamamlandı',
                    message: `${existing.title} görevi tamamlandı.`,
                    type: 'TASK_COMPLETED',
                    referenceId: existing.id,
                    referenceType: 'TASK',
                });
            }
        }
        if (preparedData.status &&
            preparedData.status === 'DONE' &&
            existing.status !== 'DONE' &&
            sendSmsOnCompletion &&
            this.smsService) {
            await this.smsService.trySendEvent(tenantId, 'TASK_COMPLETED', {
                taskId: existing.id,
                actorId,
            });
        }
        if (preparedData.attachmentCount &&
            preparedData.attachmentCount > (existing.attachmentCount || 0) &&
            this.notificationsService) {
            const watchers = existing.members ? JSON.parse(existing.members) : [];
            if (existing.assigneeId && !watchers.includes(existing.assigneeId)) {
                watchers.push(existing.assigneeId);
            }
            for (const userId of watchers) {
                if (actorId && userId === actorId)
                    continue;
                await this.notificationsService.create(tenantId, {
                    userId,
                    title: 'Dosya Eklendi',
                    message: `${existing.title} görevine yeni bir dosya eklendi.`,
                    type: 'TASK_FILE_ADDED',
                    referenceId: existing.id,
                    referenceType: 'TASK',
                });
            }
        }
        if (preparedData.checklistCompleted !== undefined &&
            preparedData.checklistTotal !== undefined &&
            preparedData.checklistTotal > 0 &&
            preparedData.checklistCompleted === preparedData.checklistTotal &&
            existing.checklistCompleted !== existing.checklistTotal &&
            this.notificationsService) {
            const watchers = existing.members ? JSON.parse(existing.members) : [];
            if (existing.assigneeId && !watchers.includes(existing.assigneeId)) {
                watchers.push(existing.assigneeId);
            }
            for (const userId of watchers) {
                if (actorId && userId === actorId)
                    continue;
                await this.notificationsService.create(tenantId, {
                    userId,
                    title: 'Kontrol Listesi Tamamlandı',
                    message: `${existing.title} görevindeki kontrol listesi tamamlandı.`,
                    type: 'TASK_CHECKLIST_COMPLETED',
                    referenceId: existing.id,
                    referenceType: 'TASK',
                });
            }
        }
        if (preparedData.comments &&
            preparedData.comments !== existing.comments &&
            this.notificationsService) {
            try {
                const oldComments = existing.comments
                    ? JSON.parse(existing.comments)
                    : [];
                const newComments = JSON.parse(preparedData.comments);
                const addedComments = newComments.filter((nc) => !oldComments.some((oc) => oc.id === nc.id));
                if (addedComments.length > 0) {
                    const tenantUsers = await this.prisma.user.findMany({
                        where: { tenantId, isActive: true },
                        select: { id: true, name: true },
                    });
                    for (const comment of addedComments) {
                        const text = comment.text || '';
                        if (!text.includes('@'))
                            continue;
                        for (const user of tenantUsers) {
                            if (!user.name)
                                continue;
                            const mentionText = `@${user.name}`;
                            if (text.includes(mentionText)) {
                                if (comment.userId === user.id)
                                    continue;
                                await this.notificationsService.create(tenantId, {
                                    userId: user.id,
                                    title: 'Yorumda Sizden Bahsedildi',
                                    message: `${existing.title} görevindeki bir yorumda sizden bahsedildi.`,
                                    type: 'TASK_MENTION',
                                    referenceId: existing.id,
                                    referenceType: 'TASK',
                                });
                            }
                        }
                    }
                }
            }
            catch (e) {
                console.error('Error processing comment mentions:', e);
            }
        }
        const mapped = await this.getTaskForRealtime(existing.id, tenantId);
        this.tasksGateway?.emitTaskUpdated(tenantId, mapped);
        const customerId = mapped?.project?.customerId;
        if (customerId) {
            this.tasksGateway?.emitTaskUpdatedClient(tenantId, customerId, mapped);
        }
        return mapped;
    }
    mapTask(task) {
        return {
            ...task,
            labels: task.labels ? JSON.parse(task.labels) : [],
            checklist: task.checklist ? JSON.parse(task.checklist) : [],
            members: task.members ? JSON.parse(task.members) : [],
            watchers: task.watchers ? JSON.parse(task.watchers) : [],
            attachments: task.attachments ? JSON.parse(task.attachments) : [],
            comments: task.comments ? JSON.parse(task.comments) : [],
            activities: task.activities ? JSON.parse(task.activities) : [],
        };
    }
    prepareDataForSave(data) {
        const { id, tenantId, createdAt, updatedAt, assignee, tenant, project, sendSmsOnCompletion, ...rest } = data;
        const newData = { ...rest };
        if (newData.dueDate === '') {
            newData.dueDate = null;
        }
        else if (newData.dueDate &&
            typeof newData.dueDate === 'string' &&
            newData.dueDate.length === 10) {
            newData.dueDate = new Date(newData.dueDate).toISOString();
        }
        if (newData.coverColor === '') {
            newData.coverColor = null;
        }
        if (newData.projectId === '') {
            newData.projectId = null;
        }
        if (newData.assigneeId === '') {
            newData.assigneeId = null;
        }
        if (newData.labels && typeof newData.labels !== 'string')
            newData.labels = JSON.stringify(newData.labels);
        if (newData.checklist && typeof newData.checklist !== 'string')
            newData.checklist = JSON.stringify(newData.checklist);
        if (newData.members && typeof newData.members !== 'string')
            newData.members = JSON.stringify(newData.members);
        if (newData.watchers && typeof newData.watchers !== 'string')
            newData.watchers = JSON.stringify(newData.watchers);
        if (newData.attachments && typeof newData.attachments !== 'string')
            newData.attachments = JSON.stringify(newData.attachments);
        if (newData.comments && typeof newData.comments !== 'string')
            newData.comments = JSON.stringify(newData.comments);
        if (newData.activities && typeof newData.activities !== 'string')
            newData.activities = JSON.stringify(newData.activities);
        return newData;
    }
    getMirrorSyncData(preparedData) {
        const { status, order, mirrorGroupId, ...rest } = preparedData ?? {};
        return rest;
    }
    async updateOrder(tenantId, taskIds) {
        const results = await this.prisma.$transaction(taskIds.map((id, index) => this.prisma.task.updateMany({
            where: { id, tenantId },
            data: { order: index },
        })));
        this.tasksGateway?.emitTasksReordered(tenantId, taskIds);
        return {
            updatedCount: results.reduce((acc, r) => acc + r.count, 0),
        };
    }
    async updatePositions(tenantId, changes) {
        const list = Array.isArray(changes) ? changes : [];
        const byId = new Map();
        for (const c of list) {
            if (!c || typeof c.id !== 'string')
                continue;
            if (typeof c.status !== 'string')
                continue;
            const order = Number.isFinite(c.order) ? c.order : Number(c.order);
            if (!Number.isFinite(order))
                continue;
            byId.set(c.id, { id: c.id, status: c.status, order });
        }
        const normalized = Array.from(byId.values());
        if (normalized.length === 0) {
            return { updatedCount: 0, tasks: [] };
        }
        const results = await this.prisma.$transaction(normalized.map((c) => this.prisma.task.updateMany({
            where: { id: c.id, tenantId },
            data: { status: c.status, order: c.order },
        })));
        const ids = normalized.map((c) => c.id);
        const tasks = await this.prisma.task.findMany({
            where: { tenantId, id: { in: ids } },
            include: {
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                project: {
                    select: { customerId: true },
                },
            },
        });
        const mapped = tasks.map((t) => this.mapTask(t));
        this.tasksGateway?.emitTasksBulkUpdated(tenantId, mapped);
        const byCustomer = {};
        for (const mt of mapped) {
            const cid = mt?.project?.customerId;
            if (cid) {
                (byCustomer[cid] ||= []).push(mt);
            }
        }
        for (const [cid, list] of Object.entries(byCustomer)) {
            this.tasksGateway?.emitTasksBulkUpdatedClient(tenantId, cid, list);
        }
        return {
            updatedCount: results.reduce((acc, r) => acc + r.count, 0),
            tasks: mapped,
        };
    }
    async delete(id, tenantId) {
        const existing = await this.prisma.task.findFirst({
            where: { id, tenantId },
            select: { id: true },
        });
        if (!existing)
            throw new common_1.NotFoundException('Görev bulunamadı.');
        const task = await this.prisma.task.delete({
            where: { id: existing.id },
        });
        this.tasksGateway?.emitTaskDeleted(tenantId, existing.id);
        const mapped = this.mapTask(task);
        const customerId = mapped?.project?.customerId;
        if (customerId) {
            this.tasksGateway?.emitTaskDeletedClient(tenantId, customerId, existing.id);
        }
        return mapped;
    }
    async archiveTasksByProject(tenantId, projectId) {
        const tasks = await this.prisma.task.findMany({
            where: { tenantId, projectId },
            select: { id: true },
        });
        if (tasks.length === 0)
            return;
        await this.prisma.task.updateMany({
            where: { tenantId, projectId },
            data: {
                status: 'ARCHIVED',
                projectId: null,
            },
        });
        const updatedTasks = await this.prisma.task.findMany({
            where: {
                tenantId,
                id: { in: tasks.map((t) => t.id) },
            },
            include: {
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                project: {
                    select: { customerId: true },
                },
            },
        });
        const mapped = updatedTasks.map((t) => this.mapTask(t));
        this.tasksGateway?.emitTasksBulkUpdated(tenantId, mapped);
        const byCustomer = {};
        for (const mt of mapped) {
            const cid = mt?.project?.customerId;
            if (cid) {
                (byCustomer[cid] ||= []).push(mt);
            }
        }
        for (const [cid, list] of Object.entries(byCustomer)) {
            this.tasksGateway?.emitTasksBulkUpdatedClient(tenantId, cid, list);
        }
    }
    async getColumnWatchers(tenantId, userId, projectId) {
        const watchers = await this.prisma.columnWatcher.findMany({
            where: {
                tenantId,
                userId,
                ...(projectId ? { projectId } : { projectId: null }),
            },
        });
        return watchers.map((w) => w.columnId);
    }
    async toggleColumnWatcher(tenantId, userId, columnId, projectId) {
        console.log('toggleColumnWatcher called with:', {
            tenantId,
            userId,
            columnId,
            projectId,
        });
        try {
            const safeProjectId = projectId === undefined ? null : projectId;
            console.log('Searching for existing watcher with:', {
                tenantId,
                userId,
                columnId,
                projectId: safeProjectId,
            });
            const found = await this.prisma.columnWatcher.findFirst({
                where: {
                    tenantId,
                    userId,
                    columnId,
                    projectId: safeProjectId,
                },
            });
            console.log('Found existing:', found);
            if (found) {
                await this.prisma.columnWatcher.delete({
                    where: { id: found.id },
                });
                console.log('Deleted watcher');
                return { watching: false };
            }
            else {
                const newData = {
                    tenantId,
                    userId,
                    columnId,
                    projectId: safeProjectId,
                };
                console.log('Creating new watcher with:', newData);
                await this.prisma.columnWatcher.create({
                    data: newData,
                });
                console.log('Created watcher');
                return { watching: true };
            }
        }
        catch (error) {
            console.error('toggleColumnWatcher error details:', error);
            throw error;
        }
    }
    async getTaskForRealtime(taskId, tenantId) {
        const task = await this.prisma.task.findFirst({
            where: { id: taskId, tenantId },
            include: {
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                project: {
                    select: { customerId: true },
                },
            },
        });
        if (!task)
            throw new common_1.NotFoundException('Görev bulunamadı.');
        return this.mapTask(task);
    }
};
exports.TasksService = TasksService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_9AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksService.prototype, "handleCron", null);
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __param(2, (0, common_1.Optional)()),
    __param(3, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tasks_gateway_1.TasksGateway,
        notifications_service_1.NotificationsService,
        sms_service_1.SmsService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map