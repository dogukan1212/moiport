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
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
let NotificationsGateway = class NotificationsGateway {
    jwtService;
    server;
    userSockets = new Map();
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
            if (!payload || !payload.sub) {
                client.disconnect();
                return;
            }
            const userId = typeof payload.sub === 'string'
                ? payload.sub
                : String(payload.sub ?? '');
            const socketId = client.id;
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, []);
            }
            this.userSockets.get(userId)?.push(socketId);
            client.data.userId = userId;
        }
        catch {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const userId = typeof client.data?.userId === 'string'
            ? client.data.userId
            : String(client.data?.userId ?? '');
        if (userId && this.userSockets.has(userId)) {
            const sockets = this.userSockets.get(userId);
            if (sockets) {
                const index = sockets.indexOf(client.id);
                if (index !== -1) {
                    sockets.splice(index, 1);
                }
                if (sockets.length === 0) {
                    this.userSockets.delete(userId);
                }
            }
        }
    }
    sendNotification(userId, notification) {
        const sockets = this.userSockets.get(userId);
        if (sockets && sockets.length > 0) {
            sockets.forEach((socketId) => {
                this.server.to(socketId).emit('notification', notification);
            });
        }
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
exports.NotificationsGateway = NotificationsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/notifications',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map