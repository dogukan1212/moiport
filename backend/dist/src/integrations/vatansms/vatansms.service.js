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
exports.VatansmsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const prisma_service_1 = require("../../prisma/prisma.service");
let VatansmsService = class VatansmsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    toErrorText(value) {
        if (typeof value === 'string')
            return value;
        if (value === null || value === undefined)
            return '';
        if (value instanceof Error)
            return value.message || 'Bilinmeyen hata';
        try {
            return JSON.stringify(value);
        }
        catch {
            return 'Bilinmeyen hata';
        }
    }
    isDbNotReadyError(error) {
        const msg = String(error?.message || '').toLowerCase();
        const code = String(error?.code || '').toUpperCase();
        return (msg.includes('no such table') ||
            msg.includes('does not exist in the current database') ||
            code === 'P2021' ||
            code === 'P2022');
    }
    async getConfig(tenantId) {
        let db = null;
        try {
            db = await this.prisma.vatansmsConfig.findFirst({
                where: { tenantId },
            });
        }
        catch (error) {
            if (this.isDbNotReadyError(error)) {
                return {
                    tenantId,
                    apiId: null,
                    apiKey: null,
                    sender: null,
                    messageType: 'normal',
                    messageContentType: 'bilgi',
                    isActive: false,
                };
            }
            throw error;
        }
        if (!db) {
            return {
                tenantId,
                apiId: null,
                apiKey: null,
                sender: null,
                messageType: 'normal',
                messageContentType: 'bilgi',
                isActive: false,
            };
        }
        return db;
    }
    async updateConfig(tenantId, data) {
        let existing = null;
        try {
            existing = await this.prisma.vatansmsConfig.findFirst({
                where: { tenantId },
            });
        }
        catch (error) {
            if (this.isDbNotReadyError(error)) {
                throw new common_1.BadRequestException('Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.');
            }
            throw error;
        }
        const messageType = (data.messageType && data.messageType.trim().toLowerCase()) ||
            existing?.messageType ||
            'normal';
        const messageContentType = (data.messageContentType &&
            data.messageContentType.trim().toLowerCase()) ||
            existing?.messageContentType ||
            'bilgi';
        const isActive = typeof data.isActive === 'boolean'
            ? data.isActive
            : (existing?.isActive ?? false);
        if (existing) {
            try {
                return await this.prisma.vatansmsConfig.update({
                    where: { id: existing.id },
                    data: {
                        apiId: data.apiId !== undefined ? data.apiId : existing.apiId,
                        apiKey: data.apiKey !== undefined ? data.apiKey : existing.apiKey,
                        sender: data.sender !== undefined ? data.sender : existing.sender,
                        messageType,
                        messageContentType,
                        isActive,
                    },
                });
            }
            catch (error) {
                if (this.isDbNotReadyError(error)) {
                    throw new common_1.BadRequestException('Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.');
                }
                throw error;
            }
        }
        try {
            return await this.prisma.vatansmsConfig.create({
                data: {
                    tenantId,
                    apiId: data.apiId ?? null,
                    apiKey: data.apiKey ?? null,
                    sender: data.sender ?? null,
                    messageType,
                    messageContentType,
                    isActive,
                },
            });
        }
        catch (error) {
            if (this.isDbNotReadyError(error)) {
                throw new common_1.BadRequestException('Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.');
            }
            throw error;
        }
    }
    normalizeTrGsm(phone) {
        const digits = String(phone || '').replace(/[^\d]/g, '');
        if (digits.length === 10 && digits.startsWith('5'))
            return digits;
        if (digits.length === 11 && digits.startsWith('0') && digits[1] === '5')
            return digits.slice(1);
        if (digits.length === 12 && digits.startsWith('90') && digits[2] === '5')
            return digits.slice(2);
        throw new common_1.BadRequestException('Telefon formatı geçersiz. Örnek: 5XXXXXXXXX veya 05XXXXXXXXX');
    }
    async sendSms(tenantId, to, message, overrides) {
        const config = await this.getConfig(tenantId);
        if (!config || !config.isActive) {
            throw new common_1.BadRequestException('VatanSMS entegrasyonu aktif değil');
        }
        const apiId = (typeof config.apiId === 'string' ? config.apiId : null) || undefined;
        const apiKey = (typeof config.apiKey === 'string' ? config.apiKey : null) || undefined;
        if (!apiId || !apiKey) {
            throw new common_1.BadRequestException('VatanSMS api_id/api_key eksik');
        }
        const sender = (overrides?.sender && overrides.sender.trim()) ||
            (typeof config.sender === 'string' ? config.sender : '') ||
            '';
        const normalizedPhone = this.normalizeTrGsm(to);
        const messageType = (overrides?.messageType && overrides.messageType.trim().toLowerCase()) ||
            (typeof config.messageType === 'string'
                ? config.messageType
                : 'normal') ||
            'normal';
        const messageContentType = (overrides?.messageContentType &&
            overrides.messageContentType.trim().toLowerCase()) ||
            (typeof config.messageContentType === 'string'
                ? config.messageContentType
                : 'bilgi') ||
            'bilgi';
        if (!message || message.trim().length === 0) {
            throw new common_1.BadRequestException('Mesaj içeriği zorunludur');
        }
        try {
            const payload = {
                api_id: apiId,
                api_key: apiKey,
                message_type: messageType,
                message,
                message_content_type: messageContentType,
                phones: [normalizedPhone],
            };
            if (sender)
                payload.sender = sender;
            const { data } = await axios_1.default.post('https://api.vatansms.net/api/v1/1toN', payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30_000,
            });
            return data;
        }
        catch (error) {
            const details = error?.response?.data ||
                error?.message ||
                'VatanSMS API çağrısı başarısız';
            throw new common_1.InternalServerErrorException(this.toErrorText(details));
        }
    }
};
exports.VatansmsService = VatansmsService;
exports.VatansmsService = VatansmsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VatansmsService);
//# sourceMappingURL=vatansms.service.js.map