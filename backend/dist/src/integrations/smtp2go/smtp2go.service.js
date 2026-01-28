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
exports.Smtp2goService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const nodemailer_1 = __importDefault(require("nodemailer"));
let Smtp2goService = class Smtp2goService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    normalizeEmail(value) {
        if (typeof value !== 'string')
            return '';
        return value.trim().toLowerCase();
    }
    async getSystemConfig() {
        let config = await this.prisma.systemConfig.findFirst();
        if (!config) {
            config = await this.prisma.systemConfig.create({
                data: {
                    smtp2goUsername: '',
                    smtp2goPassword: '',
                    smtp2goFromEmail: '',
                    smtp2goFromName: '',
                    smtp2goIsActive: false,
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
                smtp2goUsername: data.smtp2goUsername ?? null,
                smtp2goPassword: data.smtp2goPassword ?? null,
                smtp2goFromEmail: data.smtp2goFromEmail ?? null,
                smtp2goFromName: data.smtp2goFromName ?? null,
                smtp2goIsActive: typeof data.smtp2goIsActive === 'boolean'
                    ? data.smtp2goIsActive
                    : config.smtp2goIsActive,
            },
        });
    }
    async sendTestEmail(data) {
        const config = await this.getSystemConfig();
        if (!config.smtp2goIsActive) {
            throw new common_1.BadRequestException('SMTP2GO sistem ayarları aktif değil');
        }
        const username = String(config.smtp2goUsername || '').trim();
        const password = String(config.smtp2goPassword || '').trim();
        const fromEmail = this.normalizeEmail(config.smtp2goFromEmail);
        const fromName = String(config.smtp2goFromName || '').trim();
        if (!username || !password) {
            throw new common_1.BadRequestException('SMTP2GO username/password eksik');
        }
        if (!fromEmail) {
            throw new common_1.BadRequestException('Gönderici e-posta (From Email) zorunludur');
        }
        const to = this.normalizeEmail(data.to);
        if (!to || !to.includes('@')) {
            throw new common_1.BadRequestException('Test e-posta alıcısı geçersiz');
        }
        const subject = String(data.subject || 'SMTP2GO Test Mail').trim();
        const text = String(data.text ||
            'Bu e-posta SMTP2GO ayarlarının çalıştığını doğrulamak için gönderilmiştir.');
        try {
            const transporter = nodemailer_1.default.createTransport({
                host: 'mail.smtp2go.com',
                port: 587,
                secure: false,
                auth: {
                    user: username,
                    pass: password,
                },
            });
            const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
            const info = await transporter.sendMail({
                from,
                to,
                subject,
                text,
                html: data.html || undefined,
            });
            return {
                success: true,
                messageId: info.messageId,
                accepted: info.accepted,
                rejected: info.rejected,
                response: info.response,
            };
        }
        catch (error) {
            const code = String(error?.code || '')
                .trim()
                .toUpperCase();
            const responseCode = Number(error?.responseCode || 0);
            const message = String(error?.message || '');
            if (code === 'EAUTH' || responseCode === 535) {
                throw new common_1.BadRequestException('SMTP2GO giriş bilgileri hatalı (535). Username/Password kontrol edin.');
            }
            if (code === 'ECONNECTION' ||
                code === 'ECONNREFUSED' ||
                code === 'ETIMEDOUT' ||
                code === 'ENOTFOUND') {
                throw new common_1.BadRequestException('SMTP sunucusuna bağlanılamadı. Ağ/Firewall veya port engeli olabilir.');
            }
            throw new common_1.BadRequestException(message || 'Test e-postası gönderilemedi (bilinmeyen hata).');
        }
    }
    async sendEmail(data) {
        const config = await this.getSystemConfig();
        if (!config.smtp2goIsActive) {
            throw new common_1.BadRequestException('SMTP2GO sistem ayarları aktif değil');
        }
        const username = String(config.smtp2goUsername || '').trim();
        const password = String(config.smtp2goPassword || '').trim();
        const fromEmail = this.normalizeEmail(config.smtp2goFromEmail);
        const fromName = String(config.smtp2goFromName || '').trim();
        if (!username || !password) {
            throw new common_1.BadRequestException('SMTP2GO username/password eksik');
        }
        if (!fromEmail) {
            throw new common_1.BadRequestException('Gönderici e-posta (From Email) zorunludur');
        }
        const to = this.normalizeEmail(data.to);
        if (!to || !to.includes('@')) {
            throw new common_1.BadRequestException('E-posta alıcısı geçersiz');
        }
        const subject = String(data.subject || '').trim();
        const text = String(data.text || '');
        if (!subject) {
            throw new common_1.BadRequestException('E-posta konusu zorunludur');
        }
        if (!text) {
            throw new common_1.BadRequestException('E-posta içeriği zorunludur');
        }
        try {
            const transporter = nodemailer_1.default.createTransport({
                host: 'mail.smtp2go.com',
                port: 587,
                secure: false,
                auth: {
                    user: username,
                    pass: password,
                },
            });
            const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
            const info = await transporter.sendMail({
                from,
                to,
                subject,
                text,
                html: data.html || undefined,
            });
            return {
                success: true,
                messageId: info.messageId,
                accepted: info.accepted,
                rejected: info.rejected,
                response: info.response,
            };
        }
        catch (error) {
            const code = String(error?.code || '')
                .trim()
                .toUpperCase();
            const responseCode = Number(error?.responseCode || 0);
            const message = String(error?.message || '');
            if (code === 'EAUTH' || responseCode === 535) {
                throw new common_1.BadRequestException('SMTP2GO giriş bilgileri hatalı (535). Username/Password kontrol edin.');
            }
            if (code === 'ECONNECTION' ||
                code === 'ECONNREFUSED' ||
                code === 'ETIMEDOUT' ||
                code === 'ENOTFOUND') {
                throw new common_1.BadRequestException('SMTP sunucusuna bağlanılamadı. Ağ/Firewall veya port engeli olabilir.');
            }
            throw new common_1.BadRequestException(message || 'E-posta gönderilemedi (bilinmeyen hata).');
        }
    }
};
exports.Smtp2goService = Smtp2goService;
exports.Smtp2goService = Smtp2goService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], Smtp2goService);
//# sourceMappingURL=smtp2go.service.js.map