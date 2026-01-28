"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
const chat_gateway_1 = require("./chat.gateway");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const tenants_service_1 = require("../tenants/tenants.service");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatController = class ChatController {
    chatService;
    gateway;
    tenantsService;
    prisma;
    constructor(chatService, gateway, tenantsService, prisma) {
        this.chatService = chatService;
        this.gateway = gateway;
        this.tenantsService = tenantsService;
        this.prisma = prisma;
    }
    listRooms(tenantId, user, view, projectId) {
        return this.chatService.listRooms(tenantId, user, view, projectId);
    }
    async createRoom(tenantId, user, data) {
        const room = await this.chatService.createRoom(tenantId, user, data);
        this.gateway.emitRoomCreated(tenantId, room);
        return room;
    }
    listMessages(tenantId, user, roomId, cursor, limit) {
        return this.chatService.listMessages(tenantId, user, roomId, cursor, limit ? parseInt(limit) : 50);
    }
    async sendMessage(tenantId, user, roomId, body) {
        const msg = await this.chatService.sendMessage(tenantId, user, roomId, body.content, body.attachments);
        this.gateway.emitMessageCreated(tenantId, roomId, msg);
        return msg;
    }
    async syncRoom(tenantId, roomId) {
        const messages = await this.chatService.syncInstagramMessages(tenantId, roomId);
        if (messages && messages.length > 0) {
            for (const msg of messages) {
                this.gateway.emitMessageCreated(tenantId, roomId, msg);
            }
        }
        return { count: messages?.length || 0 };
    }
    async messageToTask(tenantId, user, messageId) {
        const task = await this.chatService.createTaskFromMessage(tenantId, user, messageId);
        this.gateway.emitMessageToTask(tenantId, task);
        return task;
    }
    async deleteMessage(tenantId, user, messageId) {
        const msg = await this.chatService.deleteMessage(tenantId, user, messageId);
        this.gateway.emitMessageDeleted(tenantId, msg.roomId, msg);
        return msg;
    }
    listUsers(tenantId, user) {
        return this.chatService.listUsers(tenantId, user);
    }
    async uploadFile(user, tenantId, file) {
        if (!file) {
            return { error: 'Dosya bulunamadı' };
        }
        if (user.role !== 'SUPER_ADMIN') {
            const fileSize = Number(file.size || 0);
            const isAllowed = await this.tenantsService.checkStorageLimit(tenantId, fileSize);
            if (!isAllowed) {
                const filePath = typeof file.path === 'string' ? file.path : String(file.path ?? '');
                if (filePath && fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                return {
                    error: `Depolama limitine ulaşıldı. Lütfen paketinizi yükseltin.`,
                };
            }
        }
        const rel = `/uploads/${tenantId}/${file.filename}`;
        return {
            url: rel,
            name: file.originalname,
            size: Number(file.size || 0),
            mime: file.mimetype,
        };
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('rooms'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Query)('view')),
    __param(3, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "listRooms", null);
__decorate([
    (0, common_1.Post)('rooms'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createRoom", null);
__decorate([
    (0, common_1.Get)('rooms/:id/messages'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Query)('cursor')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "listMessages", null);
__decorate([
    (0, common_1.Post)('rooms/:id/messages'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('rooms/:id/sync'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "syncRoom", null);
__decorate([
    (0, common_1.Post)('messages/:id/to-task'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "messageToTask", null);
__decorate([
    (0, common_1.Post)('messages/:id/delete'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (req, file, cb) => {
                try {
                    const rawTenantId = req.user?.tenantId;
                    const tenantId = typeof rawTenantId === 'string'
                        ? rawTenantId
                        : String(rawTenantId ?? '');
                    const dir = path.join(process.cwd(), 'uploads', tenantId || 'common');
                    fs.mkdirSync(dir, { recursive: true });
                    cb(null, dir);
                }
                catch (e) {
                    cb(e, undefined);
                }
            },
            filename: (req, file, cb) => {
                const originalName = String(file.originalname ?? '');
                const ext = path.extname(originalName);
                const base = path
                    .basename(originalName, ext)
                    .replace(/[^a-z0-9]+/gi, '-')
                    .toLowerCase();
                const stamp = Date.now();
                cb(null, `${base}-${stamp}${ext}`);
            },
        }),
        limits: { fileSize: 25 * 1024 * 1024 },
    })),
    __param(0, (0, user_decorator_1.GetUser)()),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "uploadFile", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('chat'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        chat_gateway_1.ChatGateway,
        tenants_service_1.TenantsService,
        prisma_service_1.PrismaService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map