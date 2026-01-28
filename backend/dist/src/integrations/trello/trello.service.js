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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrelloService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const prisma_service_1 = require("../../prisma/prisma.service");
let TrelloService = class TrelloService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    trelloErrorToMessage(error) {
        const status = error?.response?.status;
        const data = error?.response?.data;
        if (data && typeof data === 'object') {
            const msg = data.message || data.error || data.errors || undefined;
            if (msg)
                return String(msg);
        }
        if (typeof data === 'string' && data.trim())
            return data;
        if (status === 401)
            return 'Trello kimlik doğrulaması başarısız. API Key/Token kontrol edin.';
        if (status === 404)
            return 'Trello kaynağı bulunamadı (board/list id yanlış olabilir).';
        return String(error?.message || 'Trello isteği başarısız.');
    }
    async getActiveCredentials(tenantId) {
        let config = null;
        try {
            config = await this.prisma.trelloConfig.findFirst({
                where: { tenantId },
            });
        }
        catch (error) {
            const msg = String(error?.message || '');
            if (msg.toLowerCase().includes('no such table')) {
                throw new common_1.BadRequestException('Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.');
            }
            throw error;
        }
        const apiKey = String(config?.apiKey || '').trim();
        const token = String(config?.token || '').trim();
        const isActive = !!config?.isActive;
        if (!isActive) {
            throw new common_1.BadRequestException('Trello entegrasyonu aktif değil. Lütfen aktif edip kaydedin.');
        }
        if (!apiKey || !token) {
            throw new common_1.BadRequestException('Trello entegrasyonu için API Key ve Token girilmelidir.');
        }
        return { apiKey, token };
    }
    trelloApi() {
        return axios_1.default.create({
            baseURL: 'https://api.trello.com/1',
            timeout: 30_000,
        });
    }
    async testAuth(tenantId) {
        const { apiKey, token } = await this.getActiveCredentials(tenantId);
        const api = this.trelloApi();
        try {
            const res = await api.get('/members/me', {
                params: {
                    key: apiKey,
                    token,
                    fields: 'id,username,fullName',
                },
            });
            const data = res?.data || {};
            return {
                ok: true,
                member: {
                    id: data?.id || null,
                    username: data?.username || null,
                    fullName: data?.fullName || null,
                },
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(this.trelloErrorToMessage(error));
        }
    }
    async getConfig(tenantId) {
        let db = null;
        try {
            db = await this.prisma.trelloConfig.findFirst({ where: { tenantId } });
        }
        catch (error) {
            const msg = String(error?.message || '');
            if (msg.toLowerCase().includes('no such table')) {
                return { tenantId, apiKey: null, token: null, isActive: false };
            }
            throw error;
        }
        if (!db) {
            return { tenantId, apiKey: null, token: null, isActive: false };
        }
        return db;
    }
    async updateConfig(tenantId, data) {
        let existing = null;
        try {
            existing = await this.prisma.trelloConfig.findFirst({
                where: { tenantId },
            });
        }
        catch (error) {
            const msg = String(error?.message || '');
            if (msg.toLowerCase().includes('no such table')) {
                throw new common_1.BadRequestException('Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.');
            }
            throw error;
        }
        const isActive = typeof data.isActive === 'boolean'
            ? data.isActive
            : (existing?.isActive ?? false);
        const effectiveApiKey = String(data.apiKey !== undefined ? data.apiKey : existing?.apiKey || '').trim();
        const effectiveToken = String(data.token !== undefined ? data.token : existing?.token || '').trim();
        if (isActive && (!effectiveApiKey || !effectiveToken)) {
            throw new common_1.BadRequestException('Trello entegrasyonunu aktif etmek için API Key ve Token zorunludur.');
        }
        if (existing) {
            return this.prisma.trelloConfig.update({
                where: { id: existing.id },
                data: {
                    apiKey: data.apiKey !== undefined ? data.apiKey : existing.apiKey,
                    token: data.token !== undefined ? data.token : existing.token,
                    isActive,
                },
            });
        }
        return this.prisma.trelloConfig.create({
            data: {
                tenantId,
                apiKey: data.apiKey ?? null,
                token: data.token ?? null,
                isActive,
            },
        });
    }
    async listBoards(tenantId) {
        const { apiKey, token } = await this.getActiveCredentials(tenantId);
        const api = this.trelloApi();
        try {
            const res = await api.get('/members/me/boards', {
                params: {
                    key: apiKey,
                    token,
                    filter: 'open',
                    fields: 'name,url,closed',
                },
            });
            return Array.isArray(res.data) ? res.data : [];
        }
        catch (error) {
            throw new common_1.BadRequestException(this.trelloErrorToMessage(error));
        }
    }
    async listBoardLists(tenantId, boardId) {
        const { apiKey, token } = await this.getActiveCredentials(tenantId);
        const api = this.trelloApi();
        try {
            const res = await api.get(`/boards/${encodeURIComponent(boardId)}/lists`, {
                params: {
                    key: apiKey,
                    token,
                    fields: 'name,closed',
                },
            });
            return Array.isArray(res.data) ? res.data : [];
        }
        catch (error) {
            throw new common_1.BadRequestException(this.trelloErrorToMessage(error));
        }
    }
    isAllowedStatus(value) {
        const v = String(value || '').trim();
        if (!v)
            return false;
        if (v.length > 128)
            return false;
        if (v.toUpperCase() === 'ARCHIVED')
            return false;
        return true;
    }
    async importBoardToProject(tenantId, body) {
        const boardId = String(body?.boardId || '').trim();
        if (!boardId)
            throw new common_1.BadRequestException('boardId zorunludur.');
        const { apiKey, token } = await this.getActiveCredentials(tenantId);
        const api = this.trelloApi();
        let projectId = String(body?.projectId || '').trim() || null;
        if (projectId) {
            const project = await this.prisma.project.findFirst({
                where: { id: projectId, tenantId },
                select: { id: true },
            });
            if (!project)
                throw new common_1.NotFoundException('Proje bulunamadı.');
        }
        else {
            const customerId = String(body?.customerId || '').trim() || null;
            if (customerId) {
                const customer = await this.prisma.customer.findFirst({
                    where: { id: customerId, tenantId },
                    select: { id: true },
                });
                if (!customer)
                    throw new common_1.NotFoundException('Müşteri bulunamadı.');
                let boardName = '';
                try {
                    const boardRes = await api.get(`/boards/${encodeURIComponent(boardId)}`, {
                        params: { key: apiKey, token, fields: 'name' },
                    });
                    boardName = String(boardRes?.data?.name || '').trim();
                }
                catch (error) {
                    throw new common_1.BadRequestException(this.trelloErrorToMessage(error));
                }
                const projectName = String(body?.projectName || '').trim() ||
                    boardName ||
                    'Trello Projesi';
                const created = await this.prisma.project.create({
                    data: {
                        tenantId,
                        customerId,
                        name: projectName,
                        description: 'Trello import',
                        status: 'ACTIVE',
                    },
                    select: { id: true },
                });
                projectId = created.id;
            }
        }
        let lists = [];
        try {
            const listsRes = await api.get(`/boards/${encodeURIComponent(boardId)}/lists`, {
                params: { key: apiKey, token, fields: 'name,closed' },
            });
            lists = Array.isArray(listsRes.data) ? listsRes.data : [];
        }
        catch (error) {
            throw new common_1.BadRequestException(this.trelloErrorToMessage(error));
        }
        const activeLists = lists.filter((l) => !l?.closed);
        const listMap = {};
        for (const l of activeLists) {
            if (l?.id)
                listMap[l.id] = { id: l.id, name: String(l?.name || '') };
        }
        let cards = [];
        try {
            const cardsRes = await api.get(`/boards/${encodeURIComponent(boardId)}/cards`, {
                params: {
                    key: apiKey,
                    token,
                    filter: 'open',
                    fields: 'name,desc,idList,due,idMembers,labels',
                },
            });
            cards = Array.isArray(cardsRes.data) ? cardsRes.data : [];
        }
        catch (error) {
            throw new common_1.BadRequestException(this.trelloErrorToMessage(error));
        }
        const orderStep = 1024;
        const nextOrderByStatus = new Map();
        const nextOrder = (status) => {
            const cur = nextOrderByStatus.get(status) ?? orderStep;
            nextOrderByStatus.set(status, cur + orderStep);
            return cur;
        };
        const normalizeMapping = (listId) => {
            const mappedRaw = String(body?.listStatusMap?.[listId] || '').trim();
            const mappedLower = mappedRaw.toLowerCase();
            if (mappedLower.startsWith('assignee:')) {
                const assigneeId = mappedRaw.slice('assignee:'.length).trim();
                if (assigneeId && assigneeId !== 'unassigned') {
                    return { status: 'TODO', assigneeId };
                }
                return { status: 'TODO' };
            }
            if (mappedRaw && this.isAllowedStatus(mappedRaw))
                return { status: mappedRaw };
            return { status: 'TODO' };
        };
        const tasksToCreate = cards
            .filter((c) => c?.id && c?.idList && listMap[c.idList])
            .map((c) => {
            const mapping = normalizeMapping(String(c.idList));
            const status = mapping.status;
            const labels = Array.isArray(c.labels)
                ? c.labels.map((l) => ({
                    id: l?.id,
                    name: l?.name,
                    color: l?.color,
                }))
                : [];
            const members = Array.isArray(c.idMembers) ? c.idMembers : [];
            const dueDate = c?.due ? new Date(c.due) : null;
            return {
                tenantId,
                projectId: projectId ?? null,
                title: String(c.name || '').trim() || 'İsimsiz Kart',
                description: String(c.desc || '').trim() || null,
                status,
                assigneeId: mapping.assigneeId ?? null,
                order: nextOrder(status),
                dueDate,
                labels: labels.length ? JSON.stringify(labels) : null,
                members: members.length ? JSON.stringify(members) : null,
                memberCount: members.length,
            };
        });
        if (tasksToCreate.length === 0) {
            return {
                projectId: projectId ?? null,
                createdTaskCount: 0,
                skippedCardCount: cards.length,
                lists: activeLists.map((l) => ({ id: l.id, name: l.name })),
            };
        }
        const created = await this.prisma.task.createMany({
            data: tasksToCreate,
        });
        const listSummary = activeLists.map((l) => ({
            id: l.id,
            name: l.name,
            mappedStatus: this.isAllowedStatus(String(body?.listStatusMap?.[l.id] || ''))
                ? String(body?.listStatusMap?.[l.id])
                : null,
        }));
        return {
            projectId: projectId ?? null,
            createdTaskCount: created.count,
            skippedCardCount: cards.length - tasksToCreate.length,
            lists: listSummary,
        };
    }
};
exports.TrelloService = TrelloService;
exports.TrelloService = TrelloService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrelloService);
//# sourceMappingURL=trello.service.js.map