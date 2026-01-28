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
var TasksGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const websockets_2 = require("@nestjs/websockets");
const websockets_3 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const socket_io_1 = require("socket.io");
let TasksGateway = TasksGateway_1 = class TasksGateway {
    jwtService;
    prisma;
    server;
    logger = new common_1.Logger(TasksGateway_1.name);
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
    }
    async handleConnection(client) {
        const token = client.handshake.auth?.token ||
            this.getBearerFromAuthorizationHeader(client.handshake.headers.authorization);
        if (!token) {
            this.logger.warn(`socket rejected: missing token (${client.id})`);
            client.disconnect(true);
            return;
        }
        try {
            const payload = await this.jwtService.verifyAsync(token);
            const tenantId = payload?.tenantId;
            const userId = payload?.sub;
            if (!tenantId || !userId) {
                this.logger.warn(`socket rejected: invalid payload (${client.id})`);
                client.disconnect(true);
                return;
            }
            const [tenant, user] = await Promise.all([
                this.prisma.tenant.findUnique({
                    where: { id: tenantId },
                    select: { id: true },
                }),
                this.prisma.user.findFirst({
                    where: { id: userId, tenantId },
                    select: { id: true, role: true, customerId: true },
                }),
            ]);
            if (!tenant || !user) {
                this.logger.warn(`socket rejected: tenant/user not found (${client.id})`);
                client.disconnect(true);
                return;
            }
            client.data.userId = userId;
            client.data.tenantId = tenantId;
            if (user.role === 'CLIENT' && user.customerId) {
                await client.join(this.getTenantClientRoom(tenantId, user.customerId));
            }
            else {
                await client.join(this.getTenantRoom(tenantId));
            }
            this.logger.log(`socket connected (${client.id}) tenant=${tenantId} user=${userId}`);
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            this.logger.warn(`socket rejected: verify failed (${client.id}) ${message}`);
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        const tenantId = client.data?.tenantId;
        const userId = client.data?.userId;
        this.logger.log(`socket disconnected (${client.id}) tenant=${tenantId} user=${userId}`);
    }
    emitTaskCreated(tenantId, task) {
        const ts = Date.now();
        this.server
            .to(this.getTenantRoom(tenantId))
            .emit('tasks:created', { task, ts });
    }
    emitTaskCreatedClient(tenantId, customerId, task) {
        const ts = Date.now();
        this.server
            .to(this.getTenantClientRoom(tenantId, customerId))
            .emit('tasks:created', { task, ts });
    }
    emitTaskUpdated(tenantId, task) {
        const ts = Date.now();
        this.server
            .to(this.getTenantRoom(tenantId))
            .emit('tasks:updated', { task, ts });
    }
    emitTaskUpdatedClient(tenantId, customerId, task) {
        const ts = Date.now();
        this.server
            .to(this.getTenantClientRoom(tenantId, customerId))
            .emit('tasks:updated', { task, ts });
    }
    emitTasksBulkUpdated(tenantId, tasks) {
        const ts = Date.now();
        this.server
            .to(this.getTenantRoom(tenantId))
            .emit('tasks:bulkUpdated', { tasks, ts });
    }
    emitTasksBulkUpdatedClient(tenantId, customerId, tasks) {
        const ts = Date.now();
        this.server
            .to(this.getTenantClientRoom(tenantId, customerId))
            .emit('tasks:bulkUpdated', { tasks, ts });
    }
    emitTaskDeleted(tenantId, taskId) {
        const ts = Date.now();
        this.server
            .to(this.getTenantRoom(tenantId))
            .emit('tasks:deleted', { taskId, ts });
    }
    emitTaskDeletedClient(tenantId, customerId, taskId) {
        const ts = Date.now();
        this.server
            .to(this.getTenantClientRoom(tenantId, customerId))
            .emit('tasks:deleted', { taskId, ts });
    }
    emitTasksReordered(tenantId, taskIds) {
        const ts = Date.now();
        this.server
            .to(this.getTenantRoom(tenantId))
            .emit('tasks:reordered', { taskIds, ts });
    }
    handleClientPositions(client, body) {
        const tenantId = client.data?.tenantId;
        if (!tenantId)
            return;
        const ts = Date.now();
        const origin = typeof body?.origin === 'string' ? body.origin : undefined;
        const list = Array.isArray(body?.changes) ? body.changes : [];
        const out = [];
        for (const c of list) {
            const id = typeof c?.id === 'string' ? c.id : undefined;
            const status = typeof c?.status === 'string' ? c.status : undefined;
            const order = Number.isFinite(c?.order) ? c.order : Number(c?.order);
            if (id && status && Number.isFinite(order)) {
                out.push({ id, status, order });
            }
        }
        if (out.length === 0)
            return;
        this.server
            .to(this.getTenantRoom(tenantId))
            .emit('tasks:positions', { changes: out, ts, origin });
    }
    getTenantRoom(tenantId) {
        return `tenant:${tenantId}`;
    }
    getTenantClientRoom(tenantId, customerId) {
        return `tenant-client:${tenantId}:${customerId}`;
    }
    getBearerFromAuthorizationHeader(header) {
        if (!header || typeof header !== 'string')
            return undefined;
        const m = header.match(/^Bearer\s+(.+)$/i);
        return m?.[1];
    }
};
exports.TasksGateway = TasksGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], TasksGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('tasks:positions:client'),
    __param(0, (0, websockets_3.ConnectedSocket)()),
    __param(1, (0, websockets_2.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], TasksGateway.prototype, "handleClientPositions", null);
exports.TasksGateway = TasksGateway = TasksGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: true, credentials: true },
        namespace: '/tasks',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], TasksGateway);
//# sourceMappingURL=tasks.gateway.js.map