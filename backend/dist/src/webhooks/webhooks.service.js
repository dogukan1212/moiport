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
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const chat_gateway_1 = require("../chat/chat.gateway");
const crm_gateway_1 = require("../crm/crm.gateway");
const facebook_service_1 = require("../integrations/facebook/facebook.service");
let WebhooksService = class WebhooksService {
    prisma;
    chatGateway;
    crmGateway;
    facebookService;
    constructor(prisma, chatGateway, crmGateway, facebookService) {
        this.prisma = prisma;
        this.chatGateway = chatGateway;
        this.crmGateway = crmGateway;
        this.facebookService = facebookService;
    }
    async handleMetaPayload(payload) {
        if (payload.object === 'instagram') {
            for (const entry of payload.entry) {
                const instagramBusinessId = entry.id;
                if (entry.messaging) {
                    for (const event of entry.messaging) {
                        await this.handleInstagramMessage(event, instagramBusinessId);
                    }
                }
                if (entry.changes) {
                    for (const change of entry.changes) {
                        if (change.field === 'comments') {
                            await this.handleInstagramComment(change.value, instagramBusinessId);
                        }
                    }
                }
            }
        }
        if (payload.object === 'page') {
            for (const entry of payload.entry) {
                const pageId = entry.id;
                if (entry.messaging) {
                    for (const event of entry.messaging) {
                        await this.handleFacebookMessage(event, pageId);
                    }
                }
                if (entry.changes) {
                    for (const change of entry.changes) {
                        if (change.field === 'leadgen') {
                            await this.handleFacebookLeadgen(change.value);
                        }
                    }
                }
            }
        }
        if (payload.object === 'whatsapp_business_account') {
            for (const entry of payload.entry) {
                for (const change of entry.changes) {
                    if (change.value && change.value.messages) {
                        await this.handleWhatsAppMessage(change.value);
                    }
                }
            }
        }
        return { status: 'success' };
    }
    async handleWhatsAppMessage(value) {
        const phoneNumberId = value.metadata.phone_number_id;
        const messages = value.messages;
        const contacts = value.contacts;
        const config = await this.prisma.whatsappConfig.findFirst({
            where: { phoneNumberId },
            include: { tenant: true },
        });
        if (!config) {
            console.log(`[Webhooks] No config found for WhatsApp Phone Number ID: ${phoneNumberId}`);
            return;
        }
        const tenantId = config.tenantId;
        for (const message of messages) {
            if (message.type === 'system')
                continue;
            const from = message.from;
            const contactName = contacts?.find((c) => c.wa_id === from)?.profile?.name || from;
            let content = '';
            if (message.type === 'text') {
                content = message.text.body;
            }
            else if (message.type === 'image') {
                content = '[Resim]';
            }
            else if (message.type === 'document') {
                content = '[Belge]';
            }
            else {
                content = `[${message.type}]`;
            }
            let lead = await this.prisma.lead.findFirst({
                where: {
                    tenantId,
                    phone: { contains: from },
                },
                include: { pipeline: true },
            });
            if (!lead) {
                let pipeline;
                if (config.customerId) {
                    pipeline = await this.prisma.pipeline.findFirst({
                        where: { tenantId, customerId: config.customerId },
                    });
                    if (!pipeline) {
                        pipeline = await this.prisma.pipeline.create({
                            data: {
                                name: 'WhatsApp Pipeline',
                                tenantId,
                                customerId: config.customerId,
                                stages: {
                                    create: [
                                        { name: 'Yeni', order: 1 },
                                        { name: 'İşleniyor', order: 2 },
                                        { name: 'Tamamlandı', order: 3 },
                                    ],
                                },
                            },
                            include: { stages: true },
                        });
                    }
                }
                else {
                    pipeline = await this.prisma.pipeline.findFirst({
                        where: { tenantId, customerId: null },
                        orderBy: { createdAt: 'asc' },
                    });
                    if (!pipeline) {
                        pipeline = await this.prisma.pipeline.create({
                            data: {
                                name: 'Genel Pipeline',
                                tenantId,
                                stages: {
                                    create: [{ name: 'Yeni', order: 1 }],
                                },
                            },
                            include: { stages: true },
                        });
                    }
                }
                const stage = await this.prisma.stage.findFirst({
                    where: { pipelineId: pipeline.id },
                    orderBy: { order: 'asc' },
                });
                lead = await this.prisma.lead.create({
                    data: {
                        name: contactName,
                        phone: from,
                        source: 'WHATSAPP',
                        tenantId,
                        pipelineId: pipeline.id,
                        stageId: stage.id,
                        customerId: config.customerId,
                    },
                    include: { pipeline: true },
                });
                this.crmGateway.emitLeadCreated(tenantId, lead);
            }
            const activity = await this.prisma.crmActivity.create({
                data: {
                    type: 'WHATSAPP_IN',
                    content,
                    leadId: lead.id,
                    tenantId,
                    externalId: message.id,
                    status: 'DELIVERED',
                },
            });
            await this.prisma.lead.update({
                where: { id: lead.id },
                data: { updatedAt: new Date() },
            });
            this.crmGateway.emitWhatsappMessage(tenantId, {
                leadId: lead.id,
                activity,
                lead,
            });
        }
    }
    async handleFacebookLeadgen(value) {
        const leadgenId = value?.leadgen_id;
        const formId = value?.form_id;
        const pageId = value?.page_id;
        if (!leadgenId || !formId || !pageId) {
            return;
        }
        try {
            await this.facebookService.importLeadFromWebhook(pageId, formId, leadgenId);
        }
        catch (error) {
            console.error('Facebook leadgen webhook error:', error.response?.data || error.message);
        }
    }
    async handleFacebookMessage(event, pageId) {
        const senderId = event.sender.id;
        const message = event.message;
        if (message.is_echo)
            return;
        const fbConfig = await this.prisma.facebookConfig.findFirst({
            where: { pageId: pageId },
        });
        if (!fbConfig) {
            console.log(`No tenant found for Facebook Page ID: ${pageId}`);
            return;
        }
        const tenantId = fbConfig.tenantId;
        let visitor = await this.prisma.user.findFirst({
            where: {
                email: `fb_${senderId}@facebook.placeholder`,
                tenantId: tenantId,
            },
        });
        if (!visitor) {
            visitor = await this.prisma.user.create({
                data: {
                    email: `fb_${senderId}@facebook.placeholder`,
                    name: 'Facebook Kullanıcısı',
                    role: 'CLIENT',
                    tenantId: tenantId,
                    avatar: null,
                    password: await import('bcrypt').then((b) => b.hash('facebook_user', 10)),
                },
            });
        }
        let room = await this.prisma.chatRoom.findFirst({
            where: {
                tenantId: tenantId,
                platform: 'FACEBOOK',
                externalId: senderId,
            },
        });
        if (!room) {
            room = await this.prisma.chatRoom.create({
                data: {
                    name: visitor.name || 'Facebook Chat',
                    type: 'DM',
                    platform: 'FACEBOOK',
                    externalId: senderId,
                    tenantId: tenantId,
                    memberships: {
                        create: [{ userId: visitor.id, tenantId: tenantId }],
                    },
                },
            });
        }
        const newMessage = await this.prisma.chatMessage.create({
            data: {
                roomId: room.id,
                userId: visitor.id,
                tenantId: tenantId,
                content: message.text || (message.attachments ? 'Medya gönderildi' : ''),
                platform: 'FACEBOOK',
                externalId: message.mid,
                status: 'DELIVERED',
            },
        });
        await this.prisma.chatRoom.update({
            where: { id: room.id },
            data: { updatedAt: new Date() },
        });
        this.chatGateway.server
            .to(`tenant:${tenantId}`)
            .emit('message', newMessage);
    }
    async handleWasenderPayload(payload) {
        const event = payload?.event;
        const data = payload?.data || {};
        if (!event) {
            return { status: 'ignored' };
        }
        if (event === 'messages.upsert' || event === 'messages.received') {
            const rawMessages = data.messages;
            const messages = Array.isArray(rawMessages)
                ? rawMessages
                : rawMessages
                    ? [rawMessages]
                    : [];
            if (!messages.length) {
                return { status: 'ignored' };
            }
            const first = messages[0] || {};
            const key = first.key || {};
            const message = first.message || {};
            if (key.fromMe) {
                return { status: 'ignored' };
            }
            let from = key.cleanedSenderPn ||
                key.senderPn ||
                key.remoteJid ||
                data.from ||
                data.chatId ||
                data.remoteJid;
            if (!from) {
                return { status: 'ignored' };
            }
            if (from.includes('@')) {
                from = from.split('@')[0];
            }
            let content = first.messageBody || '';
            if (!content) {
                if (message.conversation) {
                    content = message.conversation;
                }
                else if (message.extendedTextMessage?.text) {
                    content = message.extendedTextMessage.text;
                }
                else {
                    content = '[Mesaj]';
                }
            }
            const config = await this.prisma.whatsappConfig.findFirst({
                where: { provider: 'wasender', isActive: true },
                include: { tenant: true },
            });
            if (!config) {
                return { status: 'no-config' };
            }
            const tenantId = config.tenantId;
            let lead = await this.prisma.lead.findFirst({
                where: {
                    tenantId,
                    phone: { contains: from },
                },
                include: { pipeline: true },
            });
            if (!lead) {
                let pipeline;
                if (config.customerId) {
                    pipeline = await this.prisma.pipeline.findFirst({
                        where: { tenantId, customerId: config.customerId },
                    });
                    if (!pipeline) {
                        pipeline = await this.prisma.pipeline.create({
                            data: {
                                name: 'WhatsApp Pipeline',
                                tenantId,
                                customerId: config.customerId,
                                stages: {
                                    create: [
                                        { name: 'Yeni', order: 1 },
                                        { name: 'İşleniyor', order: 2 },
                                        { name: 'Tamamlandı', order: 3 },
                                    ],
                                },
                            },
                            include: { stages: true },
                        });
                    }
                }
                else {
                    pipeline = await this.prisma.pipeline.findFirst({
                        where: { tenantId, customerId: null },
                        orderBy: { createdAt: 'asc' },
                    });
                    if (!pipeline) {
                        pipeline = await this.prisma.pipeline.create({
                            data: {
                                name: 'Genel Pipeline',
                                tenantId,
                                stages: {
                                    create: [{ name: 'Yeni', order: 1 }],
                                },
                            },
                            include: { stages: true },
                        });
                    }
                }
                const stage = await this.prisma.stage.findFirst({
                    where: { pipelineId: pipeline.id },
                    orderBy: { order: 'asc' },
                });
                lead = await this.prisma.lead.create({
                    data: {
                        name: from,
                        phone: from,
                        source: 'WHATSAPP',
                        tenantId,
                        pipelineId: pipeline.id,
                        stageId: stage.id,
                        customerId: config.customerId,
                    },
                    include: { pipeline: true },
                });
                this.crmGateway.emitLeadCreated(tenantId, lead);
            }
            const activity = await this.prisma.crmActivity.create({
                data: {
                    type: 'WHATSAPP_IN',
                    content,
                    leadId: lead.id,
                    tenantId,
                    externalId: key.id,
                    status: 'DELIVERED',
                },
            });
            await this.prisma.lead.update({
                where: { id: lead.id },
                data: { updatedAt: new Date() },
            });
            this.crmGateway.emitWhatsappMessage(tenantId, {
                leadId: lead.id,
                activity,
                lead,
            });
            return { status: 'success' };
        }
        return { status: 'ignored' };
    }
    async handleInstagramMessage(event, businessId) {
        const senderId = event.sender.id;
        const recipientId = event.recipient.id;
        const message = event.message;
        if (message.is_echo)
            return;
        const config = await this.prisma.facebookConfig.findFirst({
            where: {},
        });
        const fbConfig = await this.prisma.facebookConfig.findFirst({
            where: { instagramBusinessAccountId: businessId },
        });
        if (!fbConfig) {
            console.warn(`[Webhooks] Tenant not found for Instagram Business ID: ${businessId}. Ensure the user has connected their Instagram account in Settings.`);
            return;
        }
        const tenantId = fbConfig.tenantId;
        console.log(`[Webhooks] Processing Instagram message for Tenant: ${tenantId} (IG: ${businessId})`);
        let visitor = await this.prisma.user.findFirst({
            where: {
                email: `ig_${senderId}@instagram.placeholder`,
                tenantId: tenantId,
            },
        });
        if (!visitor) {
            visitor = await this.prisma.user.create({
                data: {
                    email: `ig_${senderId}@instagram.placeholder`,
                    name: 'Instagram Kullanıcısı',
                    role: 'CLIENT',
                    tenantId: tenantId,
                    avatar: null,
                    password: await import('bcrypt').then((b) => b.hash('instagram_user', 10)),
                },
            });
        }
        let room = await this.prisma.chatRoom.findFirst({
            where: {
                tenantId: tenantId,
                platform: 'INSTAGRAM',
                externalId: senderId,
            },
        });
        if (!room) {
            room = await this.prisma.chatRoom.create({
                data: {
                    name: visitor.name || 'Instagram Chat',
                    type: 'DM',
                    platform: 'INSTAGRAM',
                    externalId: senderId,
                    tenantId: tenantId,
                    memberships: {
                        create: [
                            { userId: visitor.id, tenantId: tenantId },
                        ],
                    },
                },
            });
        }
        const newMessage = await this.prisma.chatMessage.create({
            data: {
                roomId: room.id,
                userId: visitor.id,
                tenantId: tenantId,
                content: message.text || (message.attachments ? 'Medya gönderildi' : ''),
                platform: 'INSTAGRAM',
                externalId: message.mid,
                status: 'DELIVERED',
            },
        });
        await this.prisma.chatRoom.update({
            where: { id: room.id },
            data: {
                updatedAt: new Date(),
            },
        });
        this.chatGateway.server
            .to(`tenant:${tenantId}`)
            .emit('message', newMessage);
    }
    async handleInstagramComment(comment, businessId) {
        const fbConfig = await this.prisma.facebookConfig.findFirst({
            where: { instagramBusinessAccountId: businessId },
        });
        if (!fbConfig) {
            console.warn(`[Webhooks] Tenant not found for Instagram Comment (IG ID: ${businessId})`);
            return;
        }
        const tenantId = fbConfig.tenantId;
        const senderId = comment.from.id;
        const username = comment.from.username;
        let visitor = await this.prisma.user.findFirst({
            where: { email: `ig_${senderId}@instagram.placeholder`, tenantId },
        });
        if (!visitor) {
            visitor = await this.prisma.user.create({
                data: {
                    email: `ig_${senderId}@instagram.placeholder`,
                    name: username || 'Instagram Kullanıcısı',
                    role: 'CLIENT',
                    tenantId: tenantId,
                    password: await import('bcrypt').then((b) => b.hash('instagram_user', 10)),
                },
            });
        }
        const mediaId = comment.media?.id || 'unknown_media';
        let room = await this.prisma.chatRoom.findFirst({
            where: {
                tenantId,
                platform: 'INSTAGRAM',
                externalId: mediaId,
                type: 'CHANNEL',
            },
        });
        if (!room) {
            room = await this.prisma.chatRoom.create({
                data: {
                    name: `Gönderi: ${mediaId.substring(0, 10)}...`,
                    type: 'CHANNEL',
                    platform: 'INSTAGRAM',
                    externalId: mediaId,
                    tenantId,
                    memberships: {
                        create: [{ userId: visitor.id, tenantId: tenantId }],
                    },
                },
            });
        }
        const newMessage = await this.prisma.chatMessage.create({
            data: {
                roomId: room.id,
                userId: visitor.id,
                tenantId,
                content: comment.text,
                platform: 'INSTAGRAM',
                externalId: comment.id,
                status: 'DELIVERED',
            },
        });
        await this.prisma.chatRoom.update({
            where: { id: room.id },
            data: { updatedAt: new Date() },
        });
        this.chatGateway.server
            .to(`tenant:${tenantId}`)
            .emit('message', newMessage);
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_gateway_1.ChatGateway,
        crm_gateway_1.CrmGateway,
        facebook_service_1.FacebookService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map