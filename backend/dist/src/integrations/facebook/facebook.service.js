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
exports.FacebookService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const axios_1 = __importDefault(require("axios"));
const crm_service_1 = require("../../crm/crm.service");
let FacebookService = class FacebookService {
    prisma;
    crmService;
    constructor(prisma, crmService) {
        this.prisma = prisma;
        this.crmService = crmService;
    }
    async getSystemConfig() {
        let config = await this.prisma.systemConfig.findFirst();
        if (!config) {
            config = await this.prisma.systemConfig.create({
                data: {
                    facebookAppId: '',
                    facebookAppSecret: '',
                    facebookVerifyToken: 'ajans_verify_token',
                },
            });
        }
        return config;
    }
    async updateSystemConfig(data) {
        const config = await this.getSystemConfig();
        return this.prisma.systemConfig.update({
            where: { id: config.id },
            data: {
                facebookAppId: data.facebookAppId,
                facebookAppSecret: data.facebookAppSecret,
                facebookVerifyToken: data.facebookVerifyToken,
            },
        });
    }
    async getConfig(tenantId, user) {
        const where = { tenantId };
        if (user?.role === 'CLIENT' && user?.customerId) {
            where.customerId = user.customerId;
        }
        else if (user) {
            where.customerId = null;
        }
        if (!user)
            where.customerId = null;
        return this.prisma.facebookConfig.findFirst({
            where,
            include: { mappings: { include: { pipeline: true, stage: true } } },
        });
    }
    async updateConfig(tenantId, data, user) {
        const where = { tenantId };
        if (user?.role === 'CLIENT' && user?.customerId) {
            where.customerId = user.customerId;
        }
        else {
            where.customerId = null;
        }
        const existing = await this.prisma.facebookConfig.findFirst({
            where,
        });
        const isActive = typeof data.isActive === 'boolean'
            ? data.isActive
            : (existing?.isActive ?? false);
        if (data.pageId && data.accessToken) {
            try {
                console.log(`Subscribing app to page ${data.pageId}...`);
                await axios_1.default.post(`https://graph.facebook.com/v21.0/${data.pageId}/subscribed_apps`, {
                    subscribed_fields: [
                        'messages',
                        'messaging_postbacks',
                        'messaging_optins',
                        'message_deliveries',
                        'message_reads',
                        'feed',
                        'leadgen',
                    ],
                }, {
                    params: { access_token: data.accessToken },
                });
                console.log(`Page ${data.pageId} subscribed successfully.`);
            }
            catch (error) {
                console.error('Page subscription failed:', error.response?.data || error.message);
            }
        }
        if (existing) {
            return this.prisma.facebookConfig.update({
                where: { id: existing.id },
                data: {
                    accessToken: data.accessToken !== undefined
                        ? data.accessToken
                        : existing.accessToken,
                    userAccessToken: data.userAccessToken !== undefined
                        ? data.userAccessToken
                        : existing.userAccessToken,
                    pageId: data.pageId !== undefined ? data.pageId : existing.pageId,
                    pageName: data.pageName !== undefined ? data.pageName : existing.pageName,
                    instagramBusinessAccountId: data.instagramBusinessAccountId !== undefined
                        ? data.instagramBusinessAccountId
                        : existing.instagramBusinessAccountId,
                    isActive,
                },
            });
        }
        return this.prisma.facebookConfig.create({
            data: {
                tenantId,
                customerId: user?.role === 'CLIENT' ? user.customerId : null,
                accessToken: data.accessToken ?? null,
                userAccessToken: data.userAccessToken ?? null,
                pageId: data.pageId ?? null,
                pageName: data.pageName ?? null,
                instagramBusinessAccountId: data.instagramBusinessAccountId ?? null,
                isActive,
            },
        });
    }
    async getPages(accessToken) {
        try {
            const response = await axios_1.default.get('https://graph.facebook.com/v21.0/me/accounts', {
                params: {
                    access_token: accessToken,
                    fields: 'id,name,access_token,instagram_business_account',
                },
            });
            return response.data.data;
        }
        catch (error) {
            console.error('Facebook getPages Error:', error.response?.data || error.message);
            if (error.response?.status === 400) {
                throw new common_1.BadRequestException(error.response.data?.error?.message || 'Facebook sayfaları alınamadı');
            }
            throw error;
        }
    }
    async getForms(pageId, accessToken) {
        try {
            const response = await axios_1.default.get(`https://graph.facebook.com/v21.0/${pageId}/leadgen_forms`, {
                params: { access_token: accessToken },
            });
            return response.data.data;
        }
        catch (error) {
            console.error('Facebook getForms Error:', error.response?.data || error.message);
            if (error.response?.status === 400) {
                throw new common_1.BadRequestException(error.response.data?.error?.message || 'Facebook formları alınamadı');
            }
            throw error;
        }
    }
    async getFormFields(formId, accessToken) {
        try {
            const response = await axios_1.default.get(`https://graph.facebook.com/v21.0/${formId}`, {
                params: { access_token: accessToken, fields: 'questions' },
            });
            return response.data?.questions || [];
        }
        catch (error) {
            console.error('Facebook getFormFields Error:', error.response?.data || error.message);
            if (error.response?.status === 400) {
                throw new common_1.BadRequestException(error.response.data?.error?.message ||
                    'Facebook form alanları alınamadı');
            }
            throw error;
        }
    }
    async getInstagramConversations(igUserId, accessToken) {
        try {
            const response = await axios_1.default.get(`https://graph.facebook.com/v21.0/${igUserId}/conversations`, {
                params: {
                    platform: 'instagram',
                    access_token: accessToken,
                    fields: 'id,updated_time,participants',
                },
            });
            return response.data.data;
        }
        catch (error) {
            console.error('Instagram getConversations Error:', error.response?.data || error.message);
            throw error;
        }
    }
    async getInstagramMessages(conversationId, accessToken) {
        try {
            const response = await axios_1.default.get(`https://graph.facebook.com/v21.0/${conversationId}/messages`, {
                params: {
                    access_token: accessToken,
                    fields: 'id,created_time,message,from,to,attachments',
                    limit: 20,
                },
            });
            return response.data.data;
        }
        catch (error) {
            console.error('Instagram getMessages Error:', error.response?.data || error.message);
            throw error;
        }
    }
    async addMapping(tenantId, data) {
        const config = await this.prisma.facebookConfig.findFirst({
            where: { tenantId },
        });
        if (!config) {
            throw new common_1.NotFoundException('Facebook configuration not found');
        }
        return this.prisma.facebookLeadMapping.create({
            data: {
                configId: config.id,
                facebookFormId: data.facebookFormId,
                facebookFormName: data.facebookFormName,
                pipelineId: data.pipelineId,
                stageId: data.stageId,
                defaultAssigneeId: data.defaultAssigneeId,
                fieldMappings: data.fieldMappings
                    ? JSON.stringify(data.fieldMappings)
                    : null,
                assignedUserIds: data.assignedUserIds
                    ? JSON.stringify(data.assignedUserIds)
                    : null,
            },
        });
    }
    async updateMapping(id, data) {
        return this.prisma.facebookLeadMapping.update({
            where: { id },
            data: {
                facebookFormId: data.facebookFormId,
                facebookFormName: data.facebookFormName,
                pipelineId: data.pipelineId,
                stageId: data.stageId,
                defaultAssigneeId: data.defaultAssigneeId,
                fieldMappings: data.fieldMappings
                    ? JSON.stringify(data.fieldMappings)
                    : undefined,
                assignedUserIds: data.assignedUserIds
                    ? JSON.stringify(data.assignedUserIds)
                    : undefined,
            },
        });
    }
    async deleteMapping(id) {
        return this.prisma.facebookLeadMapping.delete({
            where: { id },
        });
    }
    async importRecentLeadsForMapping(mapping) {
        if (!mapping?.facebookFormId || !mapping?.config?.accessToken) {
            return { importedCount: 0 };
        }
        const accessToken = mapping.config.accessToken;
        const formId = mapping.facebookFormId;
        let importedCount = 0;
        let url = `https://graph.facebook.com/v21.0/${formId}/leads`;
        let page = 0;
        while (url && page < 1) {
            const response = await axios_1.default.get(url, {
                params: {
                    access_token: accessToken,
                    limit: 100,
                    fields: 'created_time,field_data',
                },
            });
            const leads = response.data.data || [];
            for (const fbLead of leads) {
                const tenantId = typeof mapping.config?.tenantId === 'string'
                    ? mapping.config.tenantId
                    : String(mapping.config?.tenantId ?? '');
                if (!tenantId) {
                    continue;
                }
                const created = await this.createLeadFromFacebookPayload(tenantId, mapping, fbLead);
                if (created)
                    importedCount += 1;
            }
            url = response.data.paging?.next || null;
            page += 1;
        }
        return { importedCount };
    }
    async pollFacebookLeads() {
        const configs = await this.prisma.facebookConfig.findMany({
            where: {
                accessToken: { not: null },
                pageId: { not: null },
            },
            include: { mappings: true },
        });
        if (configs.length === 0)
            return;
        let totalImported = 0;
        for (const config of configs) {
            const mappings = (config.mappings || []).filter((m) => !!m.facebookFormId);
            if (mappings.length === 0)
                continue;
            for (const mapping of mappings) {
                const result = await this.importRecentLeadsForMapping({
                    ...mapping,
                    config,
                });
                totalImported += result.importedCount;
            }
        }
        if (totalImported > 0) {
            console.log(`[FacebookService] Periodic lead sync imported ${totalImported} leads`);
        }
    }
    async createLeadFromFacebookPayload(tenantId, mapping, fbLead) {
        const fieldData = fbLead.field_data || [];
        const normalizeKey = (value) => value.toLowerCase().replace(/\s+/g, ' ').trim();
        const getFieldValue = (keys) => {
            const lowered = keys.map((k) => normalizeKey(k));
            const match = fieldData.find((f) => {
                const key = normalizeKey(String(f.name || ''));
                return lowered.some((k) => key === k || key.includes(k));
            });
            return match?.values?.[0] || '';
        };
        const normalizePhone = (value) => value ? value.replace(/\D/g, '') : '';
        const normalizeEmail = (value) => value.trim().toLowerCase();
        const fullName = getFieldValue([
            'full_name',
            'full name',
            'ad soyad',
            'ad_soyad',
            'isim soyisim',
            'name',
        ]);
        const firstName = getFieldValue(['first_name', 'first name', 'ad', 'isim']);
        const lastName = getFieldValue([
            'last_name',
            'last name',
            'soyad',
            'soyisim',
            'surname',
        ]);
        const emailRaw = getFieldValue(['email', 'e-mail', 'mail']);
        const phoneRaw = getFieldValue([
            'phone_number',
            'phone number',
            'phone',
            'telefon',
            'tel',
            'mobile',
        ]);
        const company = getFieldValue([
            'company',
            'company_name',
            'firma',
            'şirket',
            'sirket',
        ]);
        const note = getFieldValue([
            'note',
            'not',
            'mesaj',
            'message',
            'aciklama',
            'açıklama',
            'description',
        ]);
        const name = fullName ||
            [firstName, lastName].filter(Boolean).join(' ').trim() ||
            (fbLead.id ? `Facebook Lead ${fbLead.id}` : 'Facebook Lead');
        const email = emailRaw ? normalizeEmail(String(emailRaw)) : '';
        const phone = phoneRaw ? normalizePhone(String(phoneRaw)) : '';
        const existingByLeadId = fbLead.id
            ? await this.prisma.crmActivity.findFirst({
                where: {
                    tenantId,
                    content: { contains: `Facebook Lead ID: ${fbLead.id}` },
                },
                select: { id: true },
            })
            : null;
        if (existingByLeadId)
            return false;
        const nameForDedupe = name && name !== 'Facebook Lead' ? name : '';
        const duplicateLead = email || phone || nameForDedupe
            ? await this.prisma.lead.findFirst({
                where: {
                    tenantId,
                    source: 'FACEBOOK',
                    facebookFormId: mapping.facebookFormId,
                    OR: [
                        email ? { email } : undefined,
                        phone ? { phone } : undefined,
                        nameForDedupe ? { name: nameForDedupe } : undefined,
                    ].filter(Boolean),
                },
                select: { id: true },
            })
            : null;
        if (duplicateLead)
            return false;
        const lead = await this.crmService.createLead(tenantId, {
            name,
            email: email || undefined,
            phone: phone || undefined,
            company: company || undefined,
            source: 'FACEBOOK',
            pipelineId: mapping.pipelineId,
            stageId: mapping.stageId,
            assigneeId: mapping.defaultAssigneeId,
            facebookFormId: mapping.facebookFormId,
            createdAt: fbLead.created_time,
        });
        const allData = fieldData
            .map((f) => `${f.name}: ${f.values.join(', ')}`)
            .join('\n');
        const meta = [
            fbLead.id ? `Facebook Lead ID: ${fbLead.id}` : '',
            note ? `Not: ${note}` : '',
        ]
            .filter(Boolean)
            .join('\n');
        await this.crmService.addActivity(tenantId, lead.id, null, {
            type: 'NOTE',
            content: `Facebook Form Verileri:\n${meta ? `${meta}\n` : ''}${allData}`,
            createdAt: fbLead.created_time,
        });
        return true;
    }
    async importLeads(tenantId, mappingId) {
        const mapping = await this.prisma.facebookLeadMapping.findFirst({
            where: {
                id: mappingId,
                config: { tenantId },
            },
            include: {
                config: true,
            },
        });
        if (!mapping || !mapping.config) {
            throw new common_1.NotFoundException('Facebook mapping not found');
        }
        if (!mapping.facebookFormId) {
            throw new common_1.BadRequestException('Mapping has no Facebook form selected');
        }
        if (!mapping.config.accessToken) {
            throw new common_1.BadRequestException('Facebook page access token is not configured');
        }
        const accessToken = mapping.config.accessToken;
        const formId = mapping.facebookFormId;
        let importedCount = 0;
        let url = `https://graph.facebook.com/v21.0/${formId}/leads`;
        let page = 0;
        while (url && page < 5) {
            const response = await axios_1.default.get(url, {
                params: {
                    access_token: accessToken,
                    limit: 100,
                    fields: 'created_time,field_data',
                },
            });
            const leads = response.data.data || [];
            for (const fbLead of leads) {
                const created = await this.createLeadFromFacebookPayload(tenantId, mapping, fbLead);
                if (created)
                    importedCount += 1;
            }
            url = response.data.paging?.next || null;
            page += 1;
        }
        return { importedCount };
    }
    async importLeadFromWebhook(pageId, formId, leadgenId) {
        const mapping = await this.prisma.facebookLeadMapping.findFirst({
            where: {
                facebookFormId: formId,
                config: { pageId },
            },
            include: { config: true },
        });
        if (!mapping || !mapping.config?.accessToken) {
            return { importedCount: 0 };
        }
        const response = await axios_1.default.get(`https://graph.facebook.com/v21.0/${leadgenId}`, {
            params: {
                access_token: mapping.config.accessToken,
                fields: 'created_time,field_data',
            },
        });
        const created = await this.createLeadFromFacebookPayload(mapping.config.tenantId, mapping, response.data);
        return { importedCount: created ? 1 : 0 };
    }
    async clearFacebookLeads(tenantId) {
        const deleted = await this.prisma.lead.deleteMany({
            where: { tenantId, source: 'FACEBOOK' },
        });
        return { deletedCount: deleted.count };
    }
    async testConnection(tenantId) {
        const config = await this.prisma.facebookConfig.findFirst({
            where: { tenantId },
        });
        if (!config || !config.accessToken || !config.instagramBusinessAccountId) {
            throw new common_1.BadRequestException('Instagram connection not fully configured');
        }
        try {
            const response = await axios_1.default.get(`https://graph.facebook.com/v21.0/${config.instagramBusinessAccountId}`, {
                params: {
                    access_token: config.accessToken,
                    fields: 'id,username,name,profile_picture_url',
                },
            });
            return { success: true, data: response.data };
        }
        catch (error) {
            console.error('Test connection failed:', error.response?.data || error.message);
            throw new common_1.BadRequestException('Connection failed: ' +
                (error.response?.data?.error?.message || error.message));
        }
    }
    async previewMessages(tenantId) {
        console.log(`[FacebookService] previewMessages started for tenant: ${tenantId}`);
        const config = await this.prisma.facebookConfig.findFirst({
            where: { tenantId },
        });
        if (!config || !config.accessToken || !config.instagramBusinessAccountId) {
            console.warn(`[FacebookService] Missing config for tenant: ${tenantId}`);
            throw new common_1.BadRequestException('Instagram connection not fully configured');
        }
        try {
            console.log(`[FacebookService] Fetching conversations for IG Account: ${config.instagramBusinessAccountId}`);
            let conversations = [];
            try {
                conversations = await this.getInstagramConversations(config.instagramBusinessAccountId, config.accessToken);
            }
            catch (e) {
                console.error('Failed to fetch conversations:', e.response?.data || e.message);
                if (e.response?.data?.error?.code === 190 ||
                    e.response?.data?.error?.code === 10) {
                    throw new common_1.BadRequestException('Facebook oturumu süresi dolmuş veya izinler eksik. Lütfen tekrar giriş yapın.');
                }
                if (e.response?.data?.error?.code === 3 ||
                    e.response?.data?.error?.code === 100) {
                    throw new common_1.BadRequestException("Erişim reddedildi. Canlı Modda (Live Mode) bu izni kullanmak için 'App Review' (Uygulama İncelemesi) gereklidir. ÇÖZÜM: Facebook Developers panelinden uygulamanızı 'Development' (Geliştirme) moduna alın. Geliştirme modunda inceleme gerekmeden çalışır.");
                }
                if (e.response?.status === 400) {
                    throw new common_1.BadRequestException('Instagram konuşmaları alınamadı. İzinleri kontrol edin.');
                }
                throw e;
            }
            if (!conversations ||
                !Array.isArray(conversations) ||
                conversations.length === 0) {
                return [];
            }
            const recentConversations = conversations.slice(0, 5);
            const previews = [];
            for (const conv of recentConversations) {
                try {
                    const conversationId = typeof conv.id === 'string' ? conv.id : String(conv.id ?? '');
                    if (!conversationId) {
                        continue;
                    }
                    const messages = await this.getInstagramMessages(conversationId, config.accessToken);
                    if (messages.length > 0) {
                        const lastMsg = messages[0];
                        const participants = conv.participants?.data || [];
                        const other = participants.find((p) => p.id !== config.instagramBusinessAccountId);
                        const senderId = lastMsg.from ? lastMsg.from.id : 'system';
                        previews.push({
                            conversationId: conv.id,
                            updatedAt: conv.updated_time,
                            lastMessage: {
                                id: lastMsg.id,
                                content: lastMsg.message || (lastMsg.attachments ? 'Media' : ''),
                                createdAt: lastMsg.created_time,
                                senderId: senderId,
                            },
                            participant: other
                                ? {
                                    id: other.id,
                                    username: other.username,
                                }
                                : { id: 'unknown', username: 'Unknown' },
                        });
                    }
                }
                catch (msgError) {
                    console.error(`Failed to fetch messages for conversation ${conv.id}:`, msgError.response?.data || msgError.message);
                }
            }
            return previews;
        }
        catch (error) {
            console.error('Preview messages failed:', error.response?.data || error.message);
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.BadRequestException('Mesajlar alınırken hata oluştu: ' +
                (error.response?.data?.error?.message || error.message));
        }
    }
    async confirmSync(tenantId) {
        const config = await this.prisma.facebookConfig.findFirst({
            where: { tenantId },
        });
        if (!config || !config.accessToken || !config.instagramBusinessAccountId) {
            throw new common_1.BadRequestException('Instagram connection not fully configured');
        }
        const conversations = await this.getInstagramConversations(config.instagramBusinessAccountId, config.accessToken);
        const recentConversations = conversations.slice(0, 10);
        let importedCount = 0;
        for (const conv of recentConversations) {
            const participants = conv.participants?.data || [];
            const other = participants.find((p) => p.id !== config.instagramBusinessAccountId);
            if (!other)
                continue;
            let user = await this.prisma.user.findFirst({
                where: { tenantId, email: `ig_${other.id}@instagram.placeholder` },
            });
            if (!user) {
                user = await this.prisma.user.create({
                    data: {
                        tenantId,
                        email: `ig_${other.id}@instagram.placeholder`,
                        name: other.username || 'Instagram User',
                        role: 'CLIENT',
                        password: await import('bcrypt').then((b) => b.hash('instagram_user', 10)),
                    },
                });
            }
            let room = await this.prisma.chatRoom.findFirst({
                where: {
                    tenantId,
                    platform: 'INSTAGRAM',
                    externalId: other.id,
                },
            });
            if (!room) {
                room = await this.prisma.chatRoom.create({
                    data: {
                        tenantId,
                        name: user.name || 'Instagram Chat',
                        type: 'DM',
                        platform: 'INSTAGRAM',
                        externalId: other.id,
                        memberships: {
                            create: [{ userId: user.id, tenantId }],
                        },
                    },
                });
            }
            const conversationId = typeof conv.id === 'string' ? conv.id : String(conv.id ?? '');
            if (!conversationId) {
                continue;
            }
            const messages = await this.getInstagramMessages(conversationId, config.accessToken);
            for (const igMsg of messages.reverse()) {
                const exists = await this.prisma.chatMessage.findFirst({
                    where: { roomId: room.id, externalId: igMsg.id },
                });
                if (!exists) {
                    let senderUserId = user.id;
                    if (igMsg.from.id === config.instagramBusinessAccountId) {
                        const admin = await this.prisma.user.findFirst({
                            where: { tenantId, role: { contains: 'ADMIN' } },
                        });
                        if (admin)
                            senderUserId = admin.id;
                    }
                    await this.prisma.chatMessage.create({
                        data: {
                            roomId: room.id,
                            tenantId,
                            userId: senderUserId,
                            content: igMsg.message || (igMsg.attachments ? 'Attachment' : ''),
                            platform: 'INSTAGRAM',
                            externalId: igMsg.id,
                            status: 'READ',
                            createdAt: new Date(String(igMsg.created_time ?? '')),
                        },
                    });
                    importedCount++;
                }
            }
        }
        return { importedCount };
    }
    async getAuthUrl(tenantId) {
        const config = await this.getSystemConfig();
        if (!config.facebookAppId) {
            throw new Error('Facebook App ID not configured by system admin');
        }
        const backendUrl = process.env.BACKEND_URL || 'https://api.kolayentegrasyon.com';
        const redirectUri = `${backendUrl}/integrations/facebook/callback`;
        const scope = [
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_ads',
            'leads_retrieval',
            'pages_manage_metadata',
            'pages_messaging',
            'instagram_basic',
            'instagram_manage_messages',
            'instagram_manage_comments',
        ].join(',');
        const state = tenantId;
        return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${config.facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
    }
    async handleCallback(code, tenantId) {
        const config = await this.getSystemConfig();
        const backendUrl = process.env.BACKEND_URL || 'https://api.kolayentegrasyon.com';
        const redirectUri = `${backendUrl}/integrations/facebook/callback`;
        const tokenResponse = await axios_1.default.get('https://graph.facebook.com/v21.0/oauth/access_token', {
            params: {
                client_id: config.facebookAppId,
                client_secret: config.facebookAppSecret,
                redirect_uri: redirectUri,
                code: code,
            },
        });
        const userAccessToken = tokenResponse.data.access_token;
        const longLivedResponse = await axios_1.default.get('https://graph.facebook.com/v21.0/oauth/access_token', {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: config.facebookAppId,
                client_secret: config.facebookAppSecret,
                fb_exchange_token: userAccessToken,
            },
        });
        const finalToken = longLivedResponse.data.access_token;
        const existingConfig = await this.prisma.facebookConfig.findFirst({
            where: { tenantId },
        });
        let pageAccessToken = undefined;
        let instagramBusinessAccountId = undefined;
        if (existingConfig?.pageId) {
            try {
                const pages = await this.getPages(String(finalToken ?? ''));
                const page = pages.find((p) => p.id === existingConfig.pageId);
                if (page) {
                    pageAccessToken = page.access_token;
                    if (page.instagram_business_account) {
                        instagramBusinessAccountId = page.instagram_business_account.id;
                    }
                }
            }
            catch (e) {
                console.error('Failed to refresh page token during callback:', e);
            }
        }
        await this.updateConfig(tenantId, {
            userAccessToken: finalToken,
            accessToken: pageAccessToken,
            instagramBusinessAccountId: instagramBusinessAccountId,
            isActive: true,
        });
        return finalToken;
    }
};
exports.FacebookService = FacebookService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FacebookService.prototype, "pollFacebookLeads", null);
exports.FacebookService = FacebookService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        crm_service_1.CrmService])
], FacebookService);
//# sourceMappingURL=facebook.service.js.map