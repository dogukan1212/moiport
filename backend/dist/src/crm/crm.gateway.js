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
var CrmGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
let CrmGateway = CrmGateway_1 = class CrmGateway {
    jwtService;
    server;
    logger = new common_1.Logger(CrmGateway_1.name);
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    async handleConnection(client) {
        try {
            const rawToken = client.handshake.auth?.token || client.handshake.headers.authorization;
            const token = typeof rawToken === 'string'
                ? rawToken.split(' ')[1] || rawToken
                : undefined;
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.decode(token);
            if (!payload || !payload.tenantId) {
                client.disconnect();
                return;
            }
            const tenantId = payload.tenantId;
            const role = payload.role;
            const customerId = payload.customerId;
            client.data.tenantId = tenantId;
            client.data.role = role;
            client.data.customerId = customerId;
            if (role === 'CLIENT' && customerId) {
                await client.join(`tenant-client:${tenantId}:${customerId}`);
                this.logger.log(`Client connected to CRM (CLIENT): ${client.id} Tenant=${tenantId} Customer=${customerId}`);
            }
            else {
                await client.join(`tenant:${tenantId}`);
                this.logger.log(`Client connected to CRM: ${client.id} (Tenant: ${tenantId})`);
            }
        }
        catch {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        void client;
    }
    emitLeadCreated(tenantId, lead) {
        this.server.to(`tenant:${tenantId}`).emit('lead:created', lead);
        const customerId = lead?.customerId ?? lead?.pipeline?.customerId;
        if (customerId) {
            this.server
                .to(`tenant-client:${tenantId}:${customerId}`)
                .emit('lead:created', lead);
        }
    }
    emitLeadUpdated(tenantId, lead) {
        this.server.to(`tenant:${tenantId}`).emit('lead:updated', lead);
        const customerId = lead?.customerId ?? lead?.pipeline?.customerId;
        if (customerId) {
            this.server
                .to(`tenant-client:${tenantId}:${customerId}`)
                .emit('lead:updated', lead);
        }
    }
    emitLeadMoved(tenantId, lead) {
        this.server.to(`tenant:${tenantId}`).emit('lead:moved', lead);
        const customerId = lead?.customerId ?? lead?.pipeline?.customerId;
        if (customerId) {
            this.server
                .to(`tenant-client:${tenantId}:${customerId}`)
                .emit('lead:moved', lead);
        }
    }
    emitLeadDeleted(tenantId, leadId) {
        this.server.to(`tenant:${tenantId}`).emit('lead:deleted', { id: leadId });
    }
    emitWhatsappMessage(tenantId, data) {
        this.server.to(`tenant:${tenantId}`).emit('whatsapp:message', data);
        const customerId = data?.lead?.customerId ?? data?.lead?.pipeline?.customerId;
        if (customerId) {
            this.server
                .to(`tenant-client:${tenantId}:${customerId}`)
                .emit('whatsapp:message', data);
        }
    }
};
exports.CrmGateway = CrmGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], CrmGateway.prototype, "server", void 0);
exports.CrmGateway = CrmGateway = CrmGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: true,
            credentials: true,
        },
        namespace: '/crm',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], CrmGateway);
//# sourceMappingURL=crm.gateway.js.map