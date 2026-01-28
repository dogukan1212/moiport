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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const facebook_service_1 = require("../integrations/facebook/facebook.service");
const axios_1 = __importDefault(require("axios"));
let ChatService = class ChatService {
    prisma;
    facebookService;
    constructor(prisma, facebookService) {
        this.prisma = prisma;
        this.facebookService = facebookService;
    }
    async listRooms(tenantId, user, view, projectId) {
        const isAdmin = (user?.role || '').includes('ADMIN');
        let whereClause = { tenantId };
        if (isAdmin && view === 'all') {
        }
        else {
            const currentUserId = user?.userId || user?.id;
            const isClient = user?.role === 'CLIENT';
            const memberRoomIds = await this.prisma.chatMembership
                .findMany({
                where: { tenantId, userId: currentUserId },
                select: { roomId: true },
            })
                .then((rows) => rows.map((r) => r.roomId));
            if (isClient) {
                whereClause = {
                    tenantId,
                    id: { in: memberRoomIds },
                };
            }
            else {
                whereClause = {
                    tenantId,
                    OR: [{ isPrivate: false }, { id: { in: memberRoomIds } }],
                };
            }
        }
        if (projectId) {
            const brandFilter = { OR: [{ type: 'DM' }, { projectId }] };
            if (whereClause.AND) {
                whereClause.AND.push(brandFilter);
            }
            else {
                whereClause.AND = [brandFilter];
            }
        }
        const rooms = await this.prisma.chatRoom.findMany({
            where: whereClause,
            orderBy: { updatedAt: 'desc' },
            include: {
                memberships: {
                    select: {
                        userId: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });
        const currentUserId = user?.userId || user?.id;
        if (!currentUserId)
            return rooms;
        const roomIds = rooms.map((r) => r.id);
        if (roomIds.length === 0)
            return [];
        const unreadCounts = await this.prisma.chatMessage.groupBy({
            by: ['roomId'],
            where: {
                tenantId,
                roomId: { in: roomIds },
                userId: { not: currentUserId },
                status: { not: 'READ' },
            },
            _count: {
                id: true,
            },
        });
        return rooms.map((room) => {
            const c = unreadCounts.find((x) => x.roomId === room.id);
            return {
                ...room,
                unreadCount: c?._count.id || 0,
            };
        });
    }
    async createRoom(tenantId, user, data) {
        const type = data.type || 'CHANNEL';
        const isAdmin = (user?.role || '').includes('ADMIN');
        if (!isAdmin && type !== 'DM') {
            throw new common_1.ForbiddenException('Yeni oda açma yetkiniz yok.');
        }
        const isPrivate = !!data.isPrivate || type === 'DM';
        const members = Array.isArray(data.memberIds) ? data.memberIds : [];
        const desiredMemberIds = Array.from(new Set([user?.userId || user?.id, ...members]));
        if (type === 'DM' && desiredMemberIds.length >= 2) {
            const a = desiredMemberIds[0];
            const b = desiredMemberIds[1];
            const [rowsA, rowsB] = await Promise.all([
                this.prisma.chatMembership.findMany({
                    where: { tenantId, userId: a },
                    select: { roomId: true },
                }),
                this.prisma.chatMembership.findMany({
                    where: { tenantId, userId: b },
                    select: { roomId: true },
                }),
            ]);
            const setA = new Set(rowsA.map((r) => r.roomId));
            const commonIds = Array.from(new Set(rowsB.map((r) => r.roomId).filter((id) => setA.has(id))));
            if (commonIds.length > 0) {
                const existing = await this.prisma.chatRoom.findFirst({
                    where: { id: { in: commonIds }, tenantId, type: 'DM' },
                });
                if (existing) {
                    return this.prisma.chatRoom.findUnique({
                        where: { id: existing.id },
                        include: {
                            memberships: {
                                select: {
                                    userId: true,
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            email: true,
                                            avatar: true,
                                        },
                                    },
                                },
                            },
                        },
                    });
                }
            }
        }
        const room = await this.prisma.chatRoom.create({
            data: {
                name: data.name,
                type,
                isPrivate,
                projectId: data.projectId,
                tenantId,
            },
        });
        if (desiredMemberIds.length > 0) {
            const validUsers = await this.prisma.user.findMany({
                where: { id: { in: desiredMemberIds }, tenantId },
                select: { id: true },
            });
            const validIds = Array.from(new Set(validUsers.map((u) => u.id)));
            for (const uid of validIds) {
                try {
                    await this.prisma.chatMembership.create({
                        data: {
                            roomId: room.id,
                            userId: uid,
                            tenantId,
                        },
                    });
                }
                catch {
                }
            }
        }
        return this.prisma.chatRoom.findUnique({
            where: { id: room.id },
            include: {
                memberships: {
                    select: {
                        userId: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async listMessages(tenantId, user, roomId, cursor, limit = 50) {
        const room = await this.prisma.chatRoom.findFirst({
            where: { id: roomId, tenantId },
        });
        if (!room)
            throw new common_1.NotFoundException('Oda bulunamadı');
        const isAdmin = (user?.role || '').includes('ADMIN');
        if (!isAdmin && room.isPrivate) {
            const membership = await this.prisma.chatMembership.findFirst({
                where: { roomId, userId: user?.userId || user?.id, tenantId },
            });
            if (!membership)
                throw new common_1.ForbiddenException('Erişim yok');
        }
        const messages = await this.prisma.chatMessage.findMany({
            where: { roomId, tenantId },
            take: -limit,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: 'asc' },
        });
        return messages;
    }
    async sendMessage(tenantId, user, roomId, content, attachments) {
        const room = await this.prisma.chatRoom.findFirst({
            where: { id: roomId, tenantId },
        });
        if (!room)
            throw new common_1.NotFoundException('Oda bulunamadı');
        const isAdmin = (user?.role || '').includes('ADMIN');
        if (!isAdmin && room.isPrivate) {
            const membership = await this.prisma.chatMembership.findFirst({
                where: { roomId, userId: user?.userId || user?.id, tenantId },
            });
            if (!membership)
                throw new common_1.ForbiddenException('Erişim yok');
        }
        const msg = await this.prisma.chatMessage.create({
            data: {
                roomId,
                userId: user?.userId || user?.id,
                tenantId,
                content,
                attachments: attachments ? JSON.stringify(attachments) : undefined,
                status: 'SENT',
                platform: room.platform,
            },
            include: { user: true },
        });
        await this.prisma.chatRoom.update({
            where: { id: room.id },
            data: { updatedAt: new Date() },
        });
        if (room.platform === 'INSTAGRAM' && room.externalId) {
            try {
                await this.sendInstagramMessage(tenantId, room.externalId, content, room.type);
            }
            catch (err) {
                console.error('Failed to send IG message:', err);
                await this.prisma.chatMessage.update({
                    where: { id: msg.id },
                    data: { status: 'FAILED' },
                });
            }
        }
        return msg;
    }
    async syncInstagramMessages(tenantId, roomId) {
        const room = await this.prisma.chatRoom.findFirst({
            where: { id: roomId, tenantId },
        });
        if (!room || room.platform !== 'INSTAGRAM' || !room.externalId) {
            return [];
        }
        const config = await this.facebookService.getConfig(tenantId);
        if (!config || !config.accessToken || !config.instagramBusinessAccountId) {
            throw new common_1.NotFoundException('Instagram connection not configured');
        }
        const conversations = await this.facebookService.getInstagramConversations(config.instagramBusinessAccountId, config.accessToken);
        const conversation = conversations.find((c) => c.participants?.data?.some((p) => p.id === room.externalId));
        if (!conversation) {
            console.log('Conversation not found for user:', room.externalId);
            return [];
        }
        const conversationId = typeof conversation.id === 'string'
            ? conversation.id
            : String(conversation.id ?? '');
        if (!conversationId) {
            return [];
        }
        const igMessages = await this.facebookService.getInstagramMessages(conversationId, config.accessToken);
        const newMessages = [];
        for (const igMsg of igMessages.reverse()) {
            const exists = await this.prisma.chatMessage.findFirst({
                where: {
                    roomId,
                    externalId: igMsg.id,
                },
            });
            if (!exists) {
                let userId = null;
                if (igMsg.from.id === room.externalId) {
                    const u = await this.prisma.user.findFirst({
                        where: {
                            tenantId,
                            email: `ig_${igMsg.from.id}@instagram.placeholder`,
                        },
                    });
                    if (u)
                        userId = u.id;
                }
                else {
                    const admin = await this.prisma.user.findFirst({
                        where: { tenantId, role: { contains: 'ADMIN' } },
                    });
                    if (admin)
                        userId = admin.id;
                }
                if (userId) {
                    const created = await this.prisma.chatMessage.create({
                        data: {
                            roomId,
                            tenantId,
                            userId,
                            content: igMsg.message || (igMsg.attachments ? 'Attachment' : ''),
                            platform: 'INSTAGRAM',
                            externalId: igMsg.id,
                            status: 'READ',
                            createdAt: new Date(String(igMsg.created_time ?? '')),
                        },
                    });
                    newMessages.push(created);
                }
            }
        }
        return newMessages;
    }
    async sendInstagramMessage(tenantId, recipientId, content, roomType) {
        const config = await this.facebookService.getConfig(tenantId);
        if (!config || !config.accessToken)
            return;
        if (roomType === 'DM') {
            try {
                await axios_1.default.post(`https://graph.facebook.com/v21.0/me/messages`, {
                    recipient: { id: recipientId },
                    message: { text: content },
                }, {
                    params: { access_token: config.accessToken },
                });
            }
            catch (e) {
                console.error('Failed to send IG DM', e.response?.data);
            }
        }
        else if (roomType === 'CHANNEL') {
            try {
                await axios_1.default.post(`https://graph.facebook.com/v21.0/${recipientId}/comments`, {
                    message: content,
                }, {
                    params: { access_token: config.accessToken },
                });
            }
            catch (e) {
                console.error('Failed to post IG Comment', e.response?.data);
            }
        }
    }
    async createTaskFromMessage(tenantId, user, messageId) {
        const msg = await this.prisma.chatMessage.findFirst({
            where: { id: messageId, tenantId },
            include: { room: true, user: true },
        });
        if (!msg)
            throw new common_1.NotFoundException('Mesaj bulunamadı');
        const room = msg.room;
        const isAdmin = (user?.role || '').includes('ADMIN');
        if (!isAdmin && room.isPrivate) {
            const membership = await this.prisma.chatMembership.findFirst({
                where: { roomId: room.id, userId: user?.userId || user?.id, tenantId },
            });
            if (!membership)
                throw new common_1.ForbiddenException('Erişim yok');
        }
        const title = (msg.content || '').slice(0, 64) || 'Sohbetten Görev';
        const task = await this.prisma.task.create({
            data: {
                title,
                description: msg.content,
                status: 'TODO',
                tenantId,
                projectId: room.projectId || undefined,
            },
        });
        return task;
    }
    async deleteMessage(tenantId, user, messageId) {
        const msg = await this.prisma.chatMessage.findFirst({
            where: { id: messageId, tenantId },
            include: { room: true },
        });
        if (!msg)
            throw new common_1.NotFoundException('Mesaj bulunamadı');
        const room = msg.room;
        const isAdmin = (user?.role || '').includes('ADMIN');
        if (!isAdmin && room.isPrivate) {
            const membership = await this.prisma.chatMembership.findFirst({
                where: { roomId: room.id, userId: user?.userId || user?.id, tenantId },
            });
            if (!membership)
                throw new common_1.ForbiddenException('Erişim yok');
        }
        const currentUserId = user?.userId || user?.id;
        if (!isAdmin && msg.userId !== currentUserId) {
            throw new common_1.ForbiddenException('Sadece kendi mesajınızı silebilirsiniz');
        }
        const updated = await this.prisma.chatMessage.update({
            where: { id: msg.id },
            data: { deletedAt: new Date() },
        });
        return updated;
    }
    async listUsers(tenantId, user) {
        const where = { tenantId, isActive: true };
        if (user?.role === 'CLIENT') {
            where.OR = [
                { role: { in: ['ADMIN', 'STAFF', 'SUPER_ADMIN', 'HR'] } },
                { id: user.userId || user.id },
            ];
        }
        const users = await this.prisma.user.findMany({
            where,
            select: { id: true, name: true, email: true, role: true, avatar: true },
            orderBy: { name: 'asc' },
        });
        return users;
    }
    async markMessagesAsRead(tenantId, user, roomId, messageIds) {
        if (!messageIds.length)
            return;
        const room = await this.prisma.chatRoom.findFirst({
            where: { id: roomId, tenantId },
        });
        if (!room)
            return;
        await this.prisma.chatMessage.updateMany({
            where: {
                id: { in: messageIds },
                roomId,
                tenantId,
                userId: { not: user.userId || user.id },
                status: { not: 'READ' },
            },
            data: { status: 'READ' },
        });
        return messageIds;
    }
    async markMessagesAsDelivered(tenantId, user, roomId, messageIds) {
        if (!messageIds.length)
            return;
        const room = await this.prisma.chatRoom.findFirst({
            where: { id: roomId, tenantId },
        });
        if (!room)
            return;
        await this.prisma.chatMessage.updateMany({
            where: {
                id: { in: messageIds },
                roomId,
                tenantId,
                status: 'SENT',
            },
            data: { status: 'DELIVERED' },
        });
        return messageIds;
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => facebook_service_1.FacebookService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        facebook_service_1.FacebookService])
], ChatService);
//# sourceMappingURL=chat.service.js.map