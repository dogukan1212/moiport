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
exports.NetgsmService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const prisma_service_1 = require("../../prisma/prisma.service");
let NetgsmService = class NetgsmService {
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
    async getSystemConfig() {
        let config = await this.prisma.systemConfig.findFirst();
        if (!config) {
            config = await this.prisma.systemConfig.create({
                data: {
                    netgsmUsercode: '',
                    netgsmPassword: '',
                    netgsmMsgheader: '',
                    netgsmIsActive: false,
                    registrationSmsVerificationEnabled: false,
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
                netgsmUsercode: data.netgsmUsercode ?? null,
                netgsmPassword: data.netgsmPassword ?? null,
                netgsmMsgheader: data.netgsmMsgheader ?? null,
                netgsmIsActive: typeof data.netgsmIsActive === 'boolean'
                    ? data.netgsmIsActive
                    : config.netgsmIsActive,
                registrationSmsVerificationEnabled: typeof data.registrationSmsVerificationEnabled === 'boolean'
                    ? data.registrationSmsVerificationEnabled
                    : config.registrationSmsVerificationEnabled,
            },
        });
    }
    async getConfig(tenantId) {
        let db = null;
        try {
            db = await this.prisma.netgsmConfig.findFirst({
                where: { tenantId },
            });
        }
        catch (error) {
            const msg = String(error?.message || '');
            if (msg.toLowerCase().includes('no such table')) {
                return {
                    tenantId,
                    usercode: null,
                    password: null,
                    msgheader: null,
                    isActive: false,
                };
            }
            throw error;
        }
        if (!db) {
            return {
                tenantId,
                usercode: null,
                password: null,
                msgheader: null,
                isActive: false,
            };
        }
        return db;
    }
    async updateConfig(tenantId, data) {
        let existing = null;
        try {
            existing = await this.prisma.netgsmConfig.findFirst({
                where: { tenantId },
            });
        }
        catch (error) {
            const msg = String(error?.message || '');
            if (msg.toLowerCase().includes('no such table')) {
                throw new common_1.BadRequestException('Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.');
            }
            throw error;
        }
        const isActive = typeof data.isActive === 'boolean'
            ? data.isActive
            : (existing?.isActive ?? false);
        if (existing) {
            return await this.prisma.netgsmConfig.update({
                where: { id: existing.id },
                data: {
                    usercode: data.usercode !== undefined ? data.usercode : existing.usercode,
                    password: data.password !== undefined ? data.password : existing.password,
                    msgheader: data.msgheader !== undefined ? data.msgheader : existing.msgheader,
                    isActive,
                },
            });
        }
        return await this.prisma.netgsmConfig.create({
            data: {
                tenantId,
                usercode: data.usercode ?? null,
                password: data.password ?? null,
                msgheader: data.msgheader ?? null,
                isActive,
            },
        });
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
    async sendSystemSms(to, message, overrides) {
        const config = await this.getSystemConfig();
        if (!config || !config.netgsmIsActive) {
            throw new common_1.BadRequestException('NetGSM sistem ayarları aktif değil');
        }
        const usercode = String(config.netgsmUsercode || '').trim();
        const password = String(config.netgsmPassword || '').trim();
        const msgheader = (overrides?.msgheader && overrides.msgheader.trim()) ||
            String(config.netgsmMsgheader || '').trim() ||
            '';
        const effectiveMsgheader = msgheader || usercode || '';
        if (!usercode || !password) {
            throw new common_1.BadRequestException('NetGSM sistem usercode/password eksik');
        }
        if (!message || message.trim().length === 0) {
            throw new common_1.BadRequestException('Mesaj içeriği zorunludur');
        }
        const normalizedPhone = this.normalizeTrGsm(to);
        try {
            const sendRequest = async (msgheaderCandidate) => {
                const params = {
                    usercode,
                    password,
                    gsmno: `90${normalizedPhone}`,
                    message,
                    dil: 'TR',
                };
                if (msgheaderCandidate)
                    params.msgheader = msgheaderCandidate;
                const { data } = await axios_1.default.get('https://api.netgsm.com.tr/sms/send/get', {
                    params,
                    timeout: 30_000,
                });
                const text = String(data ?? '').trim();
                if (!text) {
                    throw new common_1.InternalServerErrorException('NetGSM boş yanıt döndü');
                }
                const parts = text.split(/\s+/);
                const code = parts[0];
                const bulkId = parts[1];
                return { code, bulkId, raw: text };
            };
            const attemptHeaders = [];
            const tryHeaders = [];
            if (effectiveMsgheader)
                tryHeaders.push(effectiveMsgheader);
            const numeric = (effectiveMsgheader || '').replace(/[^\d]/g, '');
            if (numeric && numeric === effectiveMsgheader) {
                if (numeric.length === 10) {
                    tryHeaders.push(`0${numeric}`);
                }
                else if (numeric.length === 11 && numeric.startsWith('0')) {
                    tryHeaders.push(numeric.slice(1));
                }
            }
            const uniqueTryHeaders = Array.from(new Set(tryHeaders.map((h) => h.trim()).filter(Boolean)));
            if (uniqueTryHeaders.length === 0)
                uniqueTryHeaders.push('');
            let lastResult = null;
            for (const headerCandidate of uniqueTryHeaders) {
                attemptHeaders.push(headerCandidate || '(boş)');
                const r = await sendRequest(headerCandidate || undefined);
                lastResult = r;
                if (r.code === '00' || r.code === '0') {
                    return { code: r.code, bulkId: r.bulkId, raw: r.raw };
                }
                if (r.code !== '40') {
                    break;
                }
            }
            const code = String(lastResult?.code || '').trim();
            const bulkId = lastResult?.bulkId;
            const text = lastResult?.raw || '';
            if (code !== '00' && code !== '0') {
                if (code === '40') {
                    throw new common_1.BadRequestException(`NetGSM: Mesaj başlığı (msgheader) sistemde tanımlı değil veya geçersiz. Denenen başlıklar: ${attemptHeaders.join(', ')}`);
                }
                if (code === '30') {
                    throw new common_1.BadRequestException('NetGSM: Geçersiz kullanıcı adı/şifre veya API erişimi/IP kısıtı problemi.');
                }
                throw new common_1.InternalServerErrorException(text);
            }
            return { code, bulkId, raw: text };
        }
        catch (error) {
            const msg = this.toErrorText(error?.response?.data || error?.message || error);
            if (error instanceof common_1.BadRequestException)
                throw error;
            if (error instanceof common_1.InternalServerErrorException)
                throw error;
            throw new common_1.InternalServerErrorException(msg);
        }
    }
    async sendSms(tenantId, to, message, overrides) {
        const config = await this.getConfig(tenantId);
        if (!config || !config.isActive) {
            throw new common_1.BadRequestException('NetGSM entegrasyonu aktif değil');
        }
        const usercode = (typeof config.usercode === 'string' ? config.usercode : null) ||
            undefined;
        const password = (typeof config.password === 'string' ? config.password : null) ||
            undefined;
        const msgheader = (overrides?.msgheader && overrides.msgheader.trim()) ||
            (typeof config.msgheader === 'string' ? config.msgheader : '') ||
            '';
        const effectiveMsgheader = msgheader || usercode || '';
        if (!usercode || !password) {
            throw new common_1.BadRequestException('NetGSM usercode/password eksik');
        }
        if (!message || message.trim().length === 0) {
            throw new common_1.BadRequestException('Mesaj içeriği zorunludur');
        }
        const normalizedPhone = this.normalizeTrGsm(to);
        try {
            const sendRequest = async (msgheaderCandidate) => {
                const params = {
                    usercode,
                    password,
                    gsmno: `90${normalizedPhone}`,
                    message,
                    dil: 'TR',
                };
                if (msgheaderCandidate)
                    params.msgheader = msgheaderCandidate;
                const { data } = await axios_1.default.get('https://api.netgsm.com.tr/sms/send/get', {
                    params,
                    timeout: 30_000,
                });
                const text = String(data ?? '').trim();
                if (!text) {
                    throw new common_1.InternalServerErrorException('NetGSM boş yanıt döndü');
                }
                const parts = text.split(/\s+/);
                const code = parts[0];
                const bulkId = parts[1];
                return { code, bulkId, raw: text };
            };
            const attemptHeaders = [];
            const tryHeaders = [];
            if (effectiveMsgheader)
                tryHeaders.push(effectiveMsgheader);
            const numeric = (effectiveMsgheader || '').replace(/[^\d]/g, '');
            if (numeric && numeric === effectiveMsgheader) {
                if (numeric.length === 10) {
                    tryHeaders.push(`0${numeric}`);
                }
                else if (numeric.length === 11 && numeric.startsWith('0')) {
                    tryHeaders.push(numeric.slice(1));
                }
            }
            const uniqueTryHeaders = Array.from(new Set(tryHeaders.map((h) => h.trim()).filter(Boolean)));
            if (uniqueTryHeaders.length === 0)
                uniqueTryHeaders.push('');
            let lastResult = null;
            for (const headerCandidate of uniqueTryHeaders) {
                attemptHeaders.push(headerCandidate || '(boş)');
                const r = await sendRequest(headerCandidate || undefined);
                lastResult = r;
                if (r.code === '00' || r.code === '0') {
                    return { code: r.code, bulkId: r.bulkId, raw: r.raw };
                }
                if (r.code !== '40') {
                    break;
                }
            }
            const code = String(lastResult?.code || '').trim();
            const bulkId = lastResult?.bulkId;
            const text = lastResult?.raw || '';
            if (code !== '00' && code !== '0') {
                if (code === '40') {
                    throw new common_1.BadRequestException(`NetGSM: Mesaj başlığı (msgheader) sistemde tanımlı değil veya geçersiz. Denenen başlıklar: ${attemptHeaders.join(', ')}`);
                }
                if (code === '30') {
                    throw new common_1.BadRequestException('NetGSM: Geçersiz kullanıcı adı/şifre veya API erişimi/IP kısıtı problemi.');
                }
                throw new common_1.InternalServerErrorException(text);
            }
            return { code, bulkId, raw: text };
        }
        catch (error) {
            const details = error?.response?.data ||
                error?.message ||
                'NetGSM API çağrısı başarısız';
            throw new common_1.InternalServerErrorException(this.toErrorText(details));
        }
    }
};
exports.NetgsmService = NetgsmService;
exports.NetgsmService = NetgsmService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NetgsmService);
//# sourceMappingURL=netgsm.service.js.map