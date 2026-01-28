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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const webhooks_service_1 = require("./webhooks.service");
const facebook_service_1 = require("../integrations/facebook/facebook.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_1 = require("crypto");
let WebhooksController = class WebhooksController {
    webhooksService;
    facebookService;
    prisma;
    constructor(webhooksService, facebookService, prisma) {
        this.webhooksService = webhooksService;
        this.facebookService = facebookService;
        this.prisma = prisma;
    }
    async verifyMeta(mode, token, challenge) {
        console.log('Meta Webhook Verification:', { mode, token, challenge });
        const config = await this.facebookService.getSystemConfig();
        const verifyToken = config.facebookVerifyToken || process.env.META_VERIFY_TOKEN;
        console.log('Expected Token:', verifyToken);
        if (mode === 'subscribe' && token === verifyToken) {
            console.log('Verification successful, returning challenge:', challenge);
            return challenge;
        }
        if (mode === 'subscribe' && token === '3ebf6a77424ce953cd0c5d3e628e7567') {
            console.log('Verification successful (Hardcoded fallback), returning challenge:', challenge);
            return challenge;
        }
        console.log('Verification failed');
        return 'Verification failed';
    }
    async handleMetaPayload(payload) {
        console.log('Meta Webhook Payload:', JSON.stringify(payload, null, 2));
        return this.webhooksService.handleMetaPayload(payload);
    }
    async handleWasenderPayload(payload, signature) {
        const secret = process.env.WASENDER_WEBHOOK_SECRET;
        if (secret && signature !== secret) {
            return { status: 'unauthorized' };
        }
        return this.webhooksService.handleWasenderPayload(payload);
    }
    async handlePaytrLinkCallback(body) {
        const callbackId = String(body?.callback_id || '').trim();
        const merchantOid = String(body?.merchant_oid || '').trim();
        const status = String(body?.status || '').trim();
        const totalAmount = String(body?.total_amount || '').trim();
        const hash = String(body?.hash || '').trim();
        if (!callbackId) {
            return 'OK';
        }
        const payment = await this.prisma.invoicePayment.findFirst({
            where: { id: callbackId },
            select: { id: true, tenantId: true, invoiceId: true, status: true },
        });
        if (!payment) {
            return 'OK';
        }
        const config = await this.prisma.paytrConfig.findFirst({
            where: { tenantId: payment.tenantId },
            select: { merchantKey: true, merchantSalt: true, isActive: true },
        });
        if (!config?.isActive || !config.merchantKey || !config.merchantSalt) {
            return 'OK';
        }
        const hashStr = `${callbackId}${merchantOid}${config.merchantSalt}${status}${totalAmount}`;
        const expected = (0, crypto_1.createHmac)('sha256', config.merchantKey)
            .update(hashStr)
            .digest('base64');
        if (expected !== hash) {
            return 'PAYTR notification failed: bad hash';
        }
        if (payment.status === 'PAID') {
            return 'OK';
        }
        const rawCallback = (() => {
            try {
                return JSON.stringify(body);
            }
            catch {
                return null;
            }
        })();
        if (status === 'success') {
            await this.prisma.invoicePayment.update({
                where: { id: payment.id },
                data: {
                    status: 'PAID',
                    paytrMerchantOid: merchantOid || null,
                    paidAt: new Date(),
                    rawCallback,
                },
            });
            const invoice = await this.prisma.invoice.findFirst({
                where: { id: payment.invoiceId, tenantId: payment.tenantId },
                select: {
                    id: true,
                    status: true,
                    totalAmount: true,
                    currency: true,
                    customerId: true,
                    number: true,
                },
            });
            if (invoice && invoice.status !== 'PAID') {
                await this.prisma.invoice.update({
                    where: { id: invoice.id },
                    data: { status: 'PAID' },
                });
            }
            if (invoice) {
                const already = await this.prisma.transaction.findFirst({
                    where: {
                        tenantId: payment.tenantId,
                        invoiceId: invoice.id,
                        type: 'INCOME',
                        status: 'PAID',
                    },
                    select: { id: true },
                });
                if (!already) {
                    const cbAmount = Number(totalAmount);
                    const amount = Number.isFinite(cbAmount) && cbAmount > 0
                        ? cbAmount / 100
                        : Number(invoice.totalAmount || 0);
                    await this.prisma.transaction.create({
                        data: {
                            tenantId: payment.tenantId,
                            type: 'INCOME',
                            amount,
                            category: 'Invoice',
                            description: `PayTR: ${invoice.number}`,
                            status: 'PAID',
                            customerId: invoice.customerId,
                            invoiceId: invoice.id,
                            date: new Date(),
                        },
                    });
                }
            }
        }
        else {
            await this.prisma.invoicePayment.update({
                where: { id: payment.id },
                data: {
                    status: 'FAILED',
                    paytrMerchantOid: merchantOid || null,
                    rawCallback,
                },
            });
        }
        return 'OK';
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, auth_guard_1.Public)(),
    (0, common_1.Get)('meta'),
    __param(0, (0, common_1.Query)('hub.mode')),
    __param(1, (0, common_1.Query)('hub.verify_token')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "verifyMeta", null);
__decorate([
    (0, auth_guard_1.Public)(),
    (0, common_1.Post)('meta'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleMetaPayload", null);
__decorate([
    (0, auth_guard_1.Public)(),
    (0, common_1.Post)('wasender'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-webhook-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleWasenderPayload", null);
__decorate([
    (0, auth_guard_1.Public)(),
    (0, common_1.Post)('paytr/link'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handlePaytrLinkCallback", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService,
        facebook_service_1.FacebookService,
        prisma_service_1.PrismaService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map