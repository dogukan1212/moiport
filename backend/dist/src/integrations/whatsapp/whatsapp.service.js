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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const prisma_service_1 = require("../../prisma/prisma.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let WhatsappService = class WhatsappService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    ensureAiDir() {
        const dir = path.join(process.cwd(), 'storage', 'whatsapp-ai');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        return dir;
    }
    aiConfigPath(tenantId, user) {
        const dir = this.ensureAiDir();
        const suffix = user?.role === 'CLIENT' && user?.customerId ? `_${user.customerId}` : '';
        return path.join(dir, `${tenantId}${suffix}.json`);
    }
    readAiConfig(tenantId, user) {
        try {
            const p = this.aiConfigPath(tenantId, user);
            if (!fs.existsSync(p)) {
                return {
                    aiEnabled: false,
                    autoReplyEnabled: false,
                    autoReplyTemplates: null,
                };
            }
            const raw = fs.readFileSync(p, 'utf-8');
            const json = JSON.parse(raw || '{}');
            return {
                aiEnabled: !!json.aiEnabled,
                autoReplyEnabled: !!json.autoReplyEnabled,
                autoReplyTemplates: typeof json.autoReplyTemplates === 'string'
                    ? json.autoReplyTemplates
                    : null,
            };
        }
        catch {
            return {
                aiEnabled: false,
                autoReplyEnabled: false,
                autoReplyTemplates: null,
            };
        }
    }
    writeAiConfig(tenantId, user, data) {
        const prev = this.readAiConfig(tenantId, user);
        const merged = {
            aiEnabled: typeof data.aiEnabled === 'boolean' ? data.aiEnabled : prev.aiEnabled,
            autoReplyEnabled: typeof data.autoReplyEnabled === 'boolean'
                ? data.autoReplyEnabled
                : prev.autoReplyEnabled,
            autoReplyTemplates: data.autoReplyTemplates !== undefined
                ? data.autoReplyTemplates
                : prev.autoReplyTemplates,
        };
        const p = this.aiConfigPath(tenantId, user);
        fs.writeFileSync(p, JSON.stringify(merged));
        return merged;
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
        let db = await this.prisma.whatsappConfig.findFirst({
            where,
        });
        if (!db && user?.role === 'CLIENT') {
            db = await this.prisma.whatsappConfig.findFirst({
                where: { tenantId, customerId: null },
            });
        }
        if (!db) {
            return {
                tenantId,
                customerId: user?.customerId ?? null,
                isActive: false,
                provider: 'meta',
                phoneNumberId: null,
                accessToken: null,
                apiVersion: 'v21.0',
                twilioAccountSid: null,
                aiEnabled: false,
                autoReplyEnabled: false,
                autoReplyTemplates: null,
            };
        }
        return db;
    }
    async updateConfig(tenantId, data, user) {
        const where = { tenantId };
        if (user?.role === 'CLIENT' && user?.customerId) {
            where.customerId = user.customerId;
        }
        else {
            where.customerId = null;
        }
        const existing = await this.prisma.whatsappConfig.findFirst({
            where,
        });
        const isActive = typeof data.isActive === 'boolean'
            ? data.isActive
            : (existing?.isActive ?? false);
        const provider = (data.provider && data.provider.trim().toLowerCase()) ||
            existing?.provider ||
            'meta';
        let saved;
        if (existing) {
            saved = await this.prisma.whatsappConfig.update({
                where: { id: existing.id },
                data: {
                    phoneNumberId: data.phoneNumberId !== undefined
                        ? data.phoneNumberId
                        : existing.phoneNumberId,
                    accessToken: data.accessToken !== undefined
                        ? data.accessToken
                        : existing.accessToken,
                    apiVersion: data.apiVersion !== undefined && data.apiVersion !== null
                        ? data.apiVersion
                        : (existing.apiVersion ?? 'v21.0'),
                    provider,
                    twilioAccountSid: data.twilioAccountSid !== undefined
                        ? data.twilioAccountSid
                        : existing.twilioAccountSid,
                    isActive,
                    aiEnabled: typeof data.aiEnabled === 'boolean'
                        ? data.aiEnabled
                        : (existing.aiEnabled ?? false),
                    autoReplyEnabled: typeof data.autoReplyEnabled === 'boolean'
                        ? data.autoReplyEnabled
                        : (existing.autoReplyEnabled ?? false),
                    autoReplyTemplates: data.autoReplyTemplates !== undefined
                        ? data.autoReplyTemplates
                        : existing.autoReplyTemplates,
                },
            });
        }
        else {
            saved = await this.prisma.whatsappConfig.create({
                data: {
                    tenantId,
                    customerId: user?.role === 'CLIENT' ? user.customerId : null,
                    phoneNumberId: data.phoneNumberId ?? null,
                    accessToken: data.accessToken ?? null,
                    apiVersion: data.apiVersion ?? 'v21.0',
                    provider,
                    twilioAccountSid: data.twilioAccountSid ?? null,
                    isActive,
                    aiEnabled: typeof data.aiEnabled === 'boolean' ? data.aiEnabled : false,
                    autoReplyEnabled: typeof data.autoReplyEnabled === 'boolean'
                        ? data.autoReplyEnabled
                        : false,
                    autoReplyTemplates: data.autoReplyTemplates ?? null,
                },
            });
        }
        return saved;
    }
    async sendMessage(tenantId, to, message, attachments, user) {
        const config = await this.getConfig(tenantId, user);
        if (!config || !config.isActive) {
            throw new common_1.InternalServerErrorException('WhatsApp API yapılandırması eksik');
        }
        let provider = (config.provider || '').toLowerCase();
        if (!provider && config.phoneNumberId && config.accessToken) {
            provider = 'meta';
        }
        else if (!provider && config.accessToken && !config.phoneNumberId) {
            provider = 'wasender';
        }
        else if (provider === 'meta' &&
            !config.phoneNumberId &&
            config.accessToken) {
            provider = 'wasender';
        }
        if (provider === 'meta') {
            const phoneNumberId = config.phoneNumberId;
            const accessToken = config.accessToken;
            const apiVersion = config.apiVersion || 'v21.0';
            if (!phoneNumberId || !accessToken) {
                throw new common_1.InternalServerErrorException('Meta WhatsApp Cloud API yapılandırması eksik');
            }
            const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
            const headers = {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            };
            let lastResponseData = null;
            if (message && message.trim()) {
                try {
                    const res = await axios_1.default.post(url, {
                        messaging_product: 'whatsapp',
                        to,
                        type: 'text',
                        text: { body: message },
                    }, { headers });
                    lastResponseData = res.data;
                }
                catch (error) {
                    console.error('Meta WhatsApp Text Error:', error.response?.data || error.message);
                    throw new common_1.InternalServerErrorException(`WhatsApp mesajı gönderilemedi: ${error.message}`);
                }
            }
            if (attachments && attachments.length > 0) {
                for (const att of attachments) {
                    const type = att.type.startsWith('image') ? 'image' : 'document';
                    const payload = {
                        messaging_product: 'whatsapp',
                        to,
                        type,
                    };
                    if (type === 'image') {
                        payload.image = { link: att.url };
                    }
                    else {
                        payload.document = { link: att.url, filename: att.name || 'Dosya' };
                    }
                    try {
                        const res = await axios_1.default.post(url, payload, { headers });
                        if (!lastResponseData)
                            lastResponseData = res.data;
                    }
                    catch (error) {
                        console.error('Meta WhatsApp Media Error:', error.response?.data || error.message);
                    }
                }
            }
            return { success: true, metaResponse: lastResponseData };
        }
        if (provider === 'infobip') {
            const sender = config.phoneNumberId;
            const apiKey = config.accessToken;
            const baseUrl = 'https://api.infobip.com';
            if (!sender || !apiKey) {
                throw new common_1.InternalServerErrorException('Infobip yapılandırması eksik');
            }
            const headers = {
                Authorization: `App ${apiKey}`,
                'Content-Type': 'application/json',
            };
            let lastResponseData = null;
            if (message && message.trim()) {
                const url = `${baseUrl}/whatsapp/1/message/text`;
                const payload = {
                    from: sender,
                    to,
                    content: { text: message },
                };
                try {
                    const res = await axios_1.default.post(url, payload, { headers });
                    lastResponseData = res.data;
                }
                catch (error) {
                    throw new common_1.InternalServerErrorException(`Infobip hatası: ${error.response?.data?.requestError?.serviceException?.message || error.message}`);
                }
            }
            if (attachments && attachments.length > 0) {
                for (const att of attachments) {
                    const isImage = (att.type || '').startsWith('image');
                    const url = `${baseUrl}/whatsapp/1/message/${isImage ? 'image' : 'document'}`;
                    const payload = {
                        from: sender,
                        to,
                        content: {
                            mediaUrl: att.url,
                        },
                    };
                    if (!isImage) {
                        payload.content.caption = att.name || 'Dosya';
                    }
                    try {
                        const res = await axios_1.default.post(url, payload, { headers });
                        if (!lastResponseData)
                            lastResponseData = res.data;
                    }
                    catch (error) {
                    }
                }
            }
            return { success: true, infobipResponse: lastResponseData };
        }
        const apiKey = config.accessToken;
        if (!apiKey) {
            throw new common_1.InternalServerErrorException('API anahtarı eksik.');
        }
        const url = 'https://www.wasenderapi.com/api/send-message';
        if (message) {
            try {
                const response = await axios_1.default.post(url, { to, text: message }, {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                });
                return response.data;
            }
            catch (error) {
                throw new common_1.InternalServerErrorException(`WasenderAPI hatası: ${error.message}`);
            }
        }
        return { success: true };
    }
    async sendTextMessage(tenantId, to, body) {
        return this.sendMessage(tenantId, to, body);
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map