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
exports.PaytrService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PaytrService = class PaytrService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSystemConfig() {
        let config = await this.prisma.systemConfig.findFirst();
        if (!config) {
            config = await this.prisma.systemConfig.create({
                data: {
                    paytrMerchantId: '',
                    paytrMerchantKey: '',
                    paytrMerchantSalt: '',
                    paytrIsActive: false,
                    paytrTestMode: true,
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
                paytrMerchantId: data.paytrMerchantId ?? null,
                paytrMerchantKey: data.paytrMerchantKey ?? null,
                paytrMerchantSalt: data.paytrMerchantSalt ?? null,
                paytrIsActive: typeof data.paytrIsActive === 'boolean'
                    ? data.paytrIsActive
                    : config.paytrIsActive,
                paytrTestMode: typeof data.paytrTestMode === 'boolean'
                    ? data.paytrTestMode
                    : config.paytrTestMode,
            },
        });
    }
    async getConfig(tenantId) {
        let db = null;
        try {
            db = await this.prisma.paytrConfig.findFirst({
                where: { tenantId },
            });
        }
        catch (error) {
            const msg = String(error?.message || '');
            if (msg.toLowerCase().includes('no such table')) {
                return {
                    tenantId,
                    merchantId: null,
                    merchantKey: null,
                    merchantSalt: null,
                    isActive: false,
                };
            }
            throw error;
        }
        if (!db) {
            return {
                tenantId,
                merchantId: null,
                merchantKey: null,
                merchantSalt: null,
                isActive: false,
            };
        }
        return db;
    }
    async updateConfig(tenantId, data) {
        let existing = null;
        try {
            existing = await this.prisma.paytrConfig.findFirst({
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
            return await this.prisma.paytrConfig.update({
                where: { id: existing.id },
                data: {
                    merchantId: data.merchantId !== undefined
                        ? data.merchantId
                        : existing.merchantId,
                    merchantKey: data.merchantKey !== undefined
                        ? data.merchantKey
                        : existing.merchantKey,
                    merchantSalt: data.merchantSalt !== undefined
                        ? data.merchantSalt
                        : existing.merchantSalt,
                    isActive,
                },
            });
        }
        return await this.prisma.paytrConfig.create({
            data: {
                tenantId,
                merchantId: data.merchantId ?? null,
                merchantKey: data.merchantKey ?? null,
                merchantSalt: data.merchantSalt ?? null,
                isActive,
            },
        });
    }
};
exports.PaytrService = PaytrService;
exports.PaytrService = PaytrService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaytrService);
//# sourceMappingURL=paytr.service.js.map