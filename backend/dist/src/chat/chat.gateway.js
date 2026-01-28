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
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const websockets_2 = require("@nestjs/websockets");
const websockets_3 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const socket_io_1 = require("socket.io");
const chat_service_1 = require("./chat.service");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    jwtService;
    prisma;
    chatService;
    server;
    logger = new common_1.Logger(ChatGateway_1.name);
    onlineUsers = new Map();
    constructor(jwtService, prisma, chatService) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.chatService = chatService;
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
            const tenantId = this.normalizeId(payload?.tenantId);
            const userId = this.normalizeId(payload?.sub ?? payload?.id);
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
                    select: { id: true, role: true },
                }),
            ]);
            if (!tenant || !user) {
                this.logger.warn(`socket rejected: tenant/user not found (${client.id})`);
                client.disconnect(true);
                return;
            }
            client.data.userId = userId;
            client.data.tenantId = tenantId;
            client.data.role = user.role;
            await client.join(this.getTenantRoom(tenantId));
            if (!this.onlineUsers.has(userId)) {
                this.onlineUsers.set(userId, new Set());
                this.server.emit('chat:user:online', { userId });
            }
            const userSockets = this.onlineUsers.get(userId);
            if (userSockets) {
                userSockets.add(client.id);
            }
            client.emit('chat:users:online', Array.from(this.onlineUsers.keys()));
            this.logger.log(`socket connected (${client.id}) tenant=${tenantId} user=${userId}`);
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            this.logger.warn(`socket rejected: verify failed (${client.id}) ${message}`);
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        const tenantId = this.normalizeId(client.data?.tenantId);
        const userId = this.normalizeId(client.data?.userId);
        this.logger.log(`socket disconnected (${client.id}) tenant=${tenantId} user=${userId}`);
    }
    async handleJoinRoom(client, body) {
        const tenantId = client.data?.tenantId;
        const userId = client.data?.userId;
        if (!tenantId || !userId)
            return;
        const roomId = typeof body?.roomId === 'string' ? body.roomId : undefined;
        if (!roomId)
            return;
        this.logger.log(`Socket ${client.id} joining room ${roomId}`);
        const room = await this.prisma.chatRoom.findFirst({
            where: { id: roomId, tenantId },
        });
        if (!room)
            return;
        const isAdmin = (client.data?.role || '').includes('ADMIN');
        if (!isAdmin && room.isPrivate) {
            const membership = await this.prisma.chatMembership.findFirst({
                where: { roomId, userId, tenantId },
            });
            if (!membership)
                return;
        }
        await client.join(this.getChatRoom(tenantId, roomId));
    }
    handleTyping(client, payload) {
        this.logger.log(`handleTyping called for room ${payload.roomId}`);
        const token = this.getBearerFromAuthorizationHeader(client.handshake.auth.token || client.handshake.headers.authorization);
        if (!token) {
            this.logger.warn(`handleTyping: No token found for socket ${client.id}`);
            return;
        }
        try {
            const decoded = this.jwtService.verify(token);
            const tenantId = this.normalizeId(decoded?.tenantId);
            const userId = this.normalizeId(decoded?.sub ?? decoded?.id);
            if (!tenantId || !userId) {
                return;
            }
            this.logger.warn(`### TYPING DEBUG ### Typing event from ${userId} in room ${payload.roomId}: ${payload.isTyping}`);
            const roomName = this.getChatRoom(tenantId, payload.roomId);
            this.logger.warn(`### TYPING DEBUG ### Broadcasting chat:typing to room ${roomName} excluding sender ${client.id}`);
            client.broadcast.to(roomName).emit('chat:typing', {
                userId,
                roomId: payload.roomId,
                isTyping: payload.isTyping,
            });
        }
        catch (e) {
            this.logger.error(`handleTyping error: ${e.message}`, e.stack);
        }
    }
    async handleRead(client, payload) {
        const token = this.getBearerFromAuthorizationHeader(client.handshake.auth.token || client.handshake.headers.authorization);
        if (!token)
            return;
        try {
            const decoded = this.jwtService.verify(token);
            const tenantId = this.normalizeId(decoded?.tenantId);
            const userId = this.normalizeId(decoded?.sub ?? decoded?.id);
            if (!tenantId || !userId) {
                return;
            }
            const user = {
                id: userId,
                userId,
                role: decoded?.role,
            };
            this.logger.log(`Read event from ${user.id} in room ${payload.roomId} for messages ${payload.messageIds.length}`);
            await this.chatService.markMessagesAsRead(tenantId, user, payload.roomId, payload.messageIds);
            const roomName = this.getChatRoom(tenantId, payload.roomId);
            this.logger.log(`Emitting chat:message:read to room ${roomName}`);
            this.server.to(roomName).emit('chat:message:read', {
                roomId: payload.roomId,
                messageIds: payload.messageIds,
                userId: user.id,
                status: 'READ',
            });
        }
        catch (e) {
            this.logger.error(e);
        }
    }
    async handleDelivered(client, payload) {
        this.logger.log(`handleDelivered called for room ${payload.roomId} messages: ${payload.messageIds?.length}`);
        const token = this.getBearerFromAuthorizationHeader(client.handshake.auth.token || client.handshake.headers.authorization);
        if (!token) {
            this.logger.warn(`handleDelivered: No token found for socket ${client.id}`);
            return;
        }
        try {
            const decoded = this.jwtService.verify(token);
            const tenantId = this.normalizeId(decoded?.tenantId);
            const userId = this.normalizeId(decoded?.sub ?? decoded?.id);
            if (!tenantId || !userId) {
                return;
            }
            const user = {
                id: userId,
                userId,
                role: decoded?.role,
            };
            this.logger.log(`Delivered event from ${user.id} in room ${payload.roomId} for messages ${payload.messageIds.length}`);
            await this.chatService.markMessagesAsDelivered(tenantId, user, payload.roomId, payload.messageIds);
            this.server
                .to(this.getChatRoom(tenantId, payload.roomId))
                .emit('chat:message:delivered', {
                roomId: payload.roomId,
                messageIds: payload.messageIds,
                userId: user.id,
            });
        }
        catch (e) {
            this.logger.error(`handleDelivered error: ${e.message}`, e.stack);
        }
    }
    async sendMessage(tenantId, user, roomId, content, attachments) {
        return this.chatService.sendMessage(tenantId, user, roomId, content, attachments);
    }
    emitMessageCreated(tenantId, roomId, message) {
        const ts = Date.now();
        this.server
            .to(this.getChatRoom(tenantId, roomId))
            .emit('chat:message:new', { message, ts });
    }
    emitMessageToTask(tenantId, task) {
        const ts = Date.now();
        this.server.to(this.getTenantRoom(tenantId)).emit('chat:message:to-task', {
            task,
            ts,
        });
    }
    emitMessageDeleted(tenantId, roomId, message) {
        const ts = Date.now();
        this.server
            .to(this.getChatRoom(tenantId, roomId))
            .emit('chat:message:deleted', { message, ts });
    }
    emitRoomCreated(tenantId, room) {
        this.server
            .to(this.getTenantRoom(tenantId))
            .emit('chat:room:created', { room });
    }
    getTenantRoom(tenantId) {
        return `tenant:${tenantId}`;
    }
    getChatRoom(tenantId, roomId) {
        return `chat:${tenantId}:${roomId}`;
    }
    normalizeId(value) {
        if (typeof value === 'string')
            return value;
        if (typeof value === 'number')
            return String(value);
        return undefined;
    }
    getBearerFromAuthorizationHeader(header) {
        if (!header || typeof header !== 'string')
            return undefined;
        const m = header.match(/^Bearer\s+(.+)$/i);
        return m ? m[1] : header;
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:join'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_3.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:typing'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_3.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:read'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_3.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:delivered'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_3.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleDelivered", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: true, credentials: true },
        namespace: '/chat',
    }),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_service_1.ChatService))),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService,
        chat_service_1.ChatService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map