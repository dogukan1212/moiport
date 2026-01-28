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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
let SubscriptionsService = class SubscriptionsService {
    prisma;
    logger = new common_1.Logger('SubscriptionsService');
    constructor(prisma) {
        this.prisma = prisma;
    }
    getBackendUrl() {
        return process.env.BACKEND_URL || 'https://api.kolayentegrasyon.com';
    }
    getFrontendUrl() {
        return process.env.FRONTEND_URL || 'https://moiport.com';
    }
    async getPaytrSystemConfig() {
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
    async findPlans() {
        await this.ensurePlanDefinitions();
        let plans = await this.prisma.plan.findMany({
            orderBy: { monthlyPrice: 'asc' },
        });
        if (plans.length === 0) {
            plans = await this.prisma.$transaction(async (tx) => {
                const p1 = await tx.plan.create({
                    data: {
                        code: 'STARTER',
                        name: 'Başlangıç',
                        description: 'Küçük ekipler ve yeni başlayanlar için.',
                        monthlyPrice: 299,
                        yearlyPrice: 2990,
                        isPopular: false,
                        maxUsers: 5,
                        maxStorage: 1024,
                        features: JSON.stringify([
                            '3 Proje',
                            '5 Kullanıcı',
                            'Temel Raporlama',
                            '1GB Depolama',
                        ]),
                    },
                });
                const p2 = await tx.plan.create({
                    data: {
                        code: 'PRO',
                        name: 'Profesyonel',
                        description: 'Büyüyen ajanslar ve profesyoneller için.',
                        monthlyPrice: 499,
                        yearlyPrice: 4990,
                        isPopular: true,
                        maxUsers: 20,
                        maxStorage: 100 * 1024,
                        features: JSON.stringify([
                            'Sınırsız Proje',
                            '20 Kullanıcı',
                            'Gelişmiş Raporlama',
                            'Sosyal Medya Yönetimi',
                        ]),
                    },
                });
                const p3 = await tx.plan.create({
                    data: {
                        code: 'ENTERPRISE',
                        name: 'Kurumsal',
                        description: 'Büyük ölçekli organizasyonlar için tam kontrol.',
                        monthlyPrice: 1499,
                        yearlyPrice: 14990,
                        isPopular: false,
                        maxUsers: 100,
                        maxStorage: 500 * 1024,
                        features: JSON.stringify([
                            'Sınırsız Her Şey',
                            'Özel Entegrasyonlar',
                            'Yapay Zeka Asistanı',
                            '7/24 Canlı Destek',
                        ]),
                    },
                });
                return [p1, p2, p3];
            });
        }
        const counts = await this.prisma.tenant.groupBy({
            by: ['subscriptionPlan'],
            _count: { _all: true },
        });
        const countMap = counts.reduce((acc, c) => {
            acc[c.subscriptionPlan || ''] = c._count._all;
            return acc;
        }, {});
        return plans.map((p) => ({
            ...p,
            activeCount: countMap[p.code] || 0,
            price: `₺${p.monthlyPrice}`,
            period: '/aylık',
            features: p.features ? JSON.parse(p.features) : [],
        }));
    }
    async ensurePlanDefinitions() {
        const defs = [
            {
                code: 'STARTER',
                name: 'Başlangıç',
                description: 'Küçük ekipler ve yeni başlayanlar için temel paket.',
                monthlyPrice: 1495,
                yearlyPrice: 14950,
                isPopular: false,
                maxUsers: 5,
                maxStorage: 1024,
                features: [
                    'Görevler ve Projeler',
                    'Sohbet (Chat)',
                    'AI Teklifler ve AI İçerik (sınırlı)',
                    'Finans: Genel Bakış ve Faturalar',
                    'İK: Ekip Yönetimi',
                    'Rol bazlı erişim',
                    '5 Kullanıcı',
                    '1GB Depolama',
                    'E-posta destek',
                ],
            },
            {
                code: 'PRO',
                name: 'Profesyonel',
                description: 'Büyüyen ajanslar ve profesyoneller için kapsamlı paket.',
                monthlyPrice: 2495,
                yearlyPrice: 24950,
                isPopular: true,
                maxUsers: 20,
                maxStorage: 100 * 1024,
                features: [
                    'CRM, WhatsApp, Instagram ve Müşteri Yönetimi',
                    'Görevler ve Görev Raporları',
                    'Projeler',
                    'Sohbet (Chat)',
                    'Sosyal Medya Planları',
                    'AI Teklifler ve AI İçerik',
                    'Finans: Gelir/Gider, Düzenli İşlemler, Faturalar',
                    'İK: Ekip, Bordro & Maaşlar, Sözleşme & Evrak, İzinler',
                    'Gelişmiş raporlama',
                    'Rol bazlı erişim',
                    '20 Kullanıcı',
                    '100GB Depolama',
                    'Öncelikli destek',
                ],
            },
            {
                code: 'ENTERPRISE',
                name: 'Kurumsal',
                description: 'Büyük ölçekli organizasyonlar için tam kontrol.',
                monthlyPrice: 7495,
                yearlyPrice: 74950,
                isPopular: false,
                maxUsers: 100,
                maxStorage: 500 * 1024,
                features: [
                    'Sınırsız modül ve özellikler',
                    'Özel entegrasyonlar ve API erişimi',
                    'Yapay Zeka Asistanı',
                    'Gelişmiş güvenlik ve denetim',
                    'CRM, WhatsApp, Instagram, Müşteri Yönetimi',
                    'Görevler, Raporlar ve Projeler',
                    'Sohbet (Chat), Sosyal Medya Planları',
                    'Finans: Tüm modüller',
                    'İK: Tüm modüller',
                    '100+ Kullanıcı',
                    '500GB Depolama',
                    '7/24 Canlı Destek',
                ],
            },
        ];
        for (const d of defs) {
            const existing = await this.prisma.plan.findFirst({
                where: { code: d.code },
            });
            if (existing) {
                await this.prisma.plan.update({
                    where: { code: d.code },
                    data: {
                        name: d.name,
                        description: d.description,
                        monthlyPrice: d.monthlyPrice,
                        yearlyPrice: d.yearlyPrice,
                        isPopular: d.isPopular,
                        maxUsers: d.maxUsers,
                        maxStorage: d.maxStorage,
                        features: JSON.stringify(d.features),
                    },
                });
            }
            else {
                await this.prisma.plan.create({
                    data: {
                        code: d.code,
                        name: d.name,
                        description: d.description,
                        monthlyPrice: d.monthlyPrice,
                        yearlyPrice: d.yearlyPrice,
                        isPopular: d.isPopular,
                        maxUsers: d.maxUsers,
                        maxStorage: d.maxStorage,
                        features: JSON.stringify(d.features),
                    },
                });
            }
        }
    }
    async getTenantSubscription(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                subscriptionPlan: true,
                subscriptionStatus: true,
                subscriptionEndsAt: true,
                maxUsers: true,
                maxStorage: true,
                autoRenew: true,
            },
        });
        if (!tenant)
            return null;
        let planDetail = null;
        if (tenant.subscriptionPlan) {
            planDetail = await this.prisma.plan.findFirst({
                where: { code: tenant.subscriptionPlan },
            });
        }
        const paymentMethod = await this.prisma.paymentMethod.findFirst({
            where: { tenantId, provider: 'PAYTR', isDefault: true },
            select: { brand: true, last4: true, expiry: true, provider: true },
        });
        return { ...tenant, planDetail, paymentMethod };
    }
    async createPlan(data) {
        return this.prisma.plan.create({
            data: {
                code: data.code,
                name: data.name,
                description: data.description,
                monthlyPrice: data.monthlyPrice,
                yearlyPrice: data.yearlyPrice,
                isPopular: !!data.isPopular,
                maxUsers: data.maxUsers,
                maxStorage: data.maxStorage,
                features: data.features ? JSON.stringify(data.features) : undefined,
            },
        });
    }
    async updatePlan(code, data) {
        return this.prisma.plan.update({
            where: { code },
            data: {
                name: data.name,
                description: data.description,
                monthlyPrice: data.monthlyPrice,
                yearlyPrice: data.yearlyPrice,
                isPopular: data.isPopular,
                maxUsers: data.maxUsers,
                maxStorage: data.maxStorage,
                features: Array.isArray(data.features)
                    ? JSON.stringify(data.features)
                    : undefined,
            },
        });
    }
    addMonths(date, months) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + months);
        return d;
    }
    addYears(date, years) {
        const d = new Date(date);
        d.setFullYear(d.getFullYear() + years);
        return d;
    }
    async initPaytrPayment(tenantId, userIp, planCode, period, method, promoCode, installments, billing, card) {
        const paytrCfg = await this.getPaytrSystemConfig();
        if (!paytrCfg.paytrIsActive ||
            !paytrCfg.paytrMerchantId ||
            !paytrCfg.paytrMerchantKey ||
            !paytrCfg.paytrMerchantSalt) {
            throw new common_1.BadRequestException('PayTR sistem ayarları eksik veya pasif');
        }
        const plan = await this.prisma.plan.findFirst({
            where: { code: planCode },
        });
        if (!plan) {
            return { error: 'Plan bulunamadı' };
        }
        let amount = period === 'MONTHLY'
            ? plan.monthlyPrice
            : plan.yearlyPrice || plan.monthlyPrice * 12;
        if ((method || 'CARD') === 'BANK_TRANSFER') {
            amount = Math.round(amount * 0.95);
        }
        let promoDiscount = 0;
        if (promoCode) {
            const code = promoCode.trim().toUpperCase();
            if (code === 'WELCOME10') {
                promoDiscount = Math.round(amount * 0.1);
            }
            else if (code === 'TRIAL50') {
                const count = await this.prisma.subscriptionPayment.count({
                    where: { tenantId, status: { in: ['PAID'] } },
                });
                if (count === 0) {
                    promoDiscount = Math.round(amount * 0.5);
                }
            }
            amount = Math.max(0, amount - promoDiscount);
        }
        const payment = await this.prisma.subscriptionPayment.create({
            data: {
                tenantId,
                planCode,
                amount,
                period,
                status: 'PENDING',
                provider: 'PAYTR',
                providerReference: JSON.stringify({
                    method: method || 'CARD',
                    promoCode: promoCode || null,
                    promoDiscount,
                    installments: installments || null,
                    billing: billing || null,
                    card: card && card.number
                        ? {
                            last4: (card.number || '').slice(-4),
                            expiry: card.expiry || null,
                        }
                        : null,
                }),
            },
        });
        if (billing) {
            await this.prisma.tenant.update({
                where: { id: tenantId },
                data: {
                    name: billing.name || undefined,
                    email: billing.email || undefined,
                    phone: billing.phone || undefined,
                    address: billing.address || undefined,
                },
            });
        }
        const merchantOid = payment.id;
        const paytrAmount = Math.round(Number(amount || 0) * 100);
        const email = String(billing?.email || '').trim();
        const userName = String(billing?.name || '').trim();
        const userPhone = String(billing?.phone || '').trim();
        const userAddress = String(billing?.address || '').trim();
        if (!email) {
            throw new common_1.BadRequestException('E-posta zorunludur');
        }
        if (!userName) {
            throw new common_1.BadRequestException('İsim zorunludur');
        }
        if (!userPhone) {
            throw new common_1.BadRequestException('Telefon zorunludur');
        }
        if (!userAddress) {
            throw new common_1.BadRequestException('Adres zorunludur');
        }
        const basket = Buffer.from(JSON.stringify([[`${plan.name} (${period})`, String(paytrAmount), 1]])).toString('base64');
        const noInstallment = '0';
        const maxInstallment = '12';
        const currency = 'TL';
        const testMode = paytrCfg.paytrTestMode ? '1' : '0';
        const hashStr = String(paytrCfg.paytrMerchantId) +
            String(userIp || '') +
            merchantOid +
            email +
            String(paytrAmount) +
            basket +
            noInstallment +
            maxInstallment +
            currency +
            testMode;
        const paytrToken = (0, crypto_1.createHmac)('sha256', String(paytrCfg.paytrMerchantKey))
            .update(`${hashStr}${String(paytrCfg.paytrMerchantSalt)}`)
            .digest('base64');
        const callbackUrl = `${this.getBackendUrl()}/subscriptions/paytr/callback`;
        const okUrl = `${this.getFrontendUrl()}/dashboard/subscriptions?paytr=success`;
        const failUrl = `${this.getFrontendUrl()}/dashboard/subscriptions?paytr=failed`;
        const body = new URLSearchParams();
        body.set('merchant_id', String(paytrCfg.paytrMerchantId));
        body.set('user_ip', String(userIp || ''));
        body.set('merchant_oid', merchantOid);
        body.set('email', email);
        body.set('payment_amount', String(paytrAmount));
        body.set('paytr_token', paytrToken);
        body.set('user_basket', basket);
        body.set('debug_on', '1');
        body.set('no_installment', noInstallment);
        body.set('max_installment', maxInstallment);
        body.set('user_name', userName);
        body.set('user_address', userAddress);
        body.set('user_phone', userPhone);
        body.set('merchant_ok_url', okUrl);
        body.set('merchant_fail_url', failUrl);
        body.set('timeout_limit', '30');
        body.set('currency', currency);
        body.set('test_mode', testMode);
        body.set('callback_url', callbackUrl);
        if (installments &&
            Number.isFinite(Number(installments)) &&
            Number(installments) > 0) {
            body.set('installment_count', String(installments));
        }
        try {
            const res = await axios_1.default.post('https://www.paytr.com/odeme/api/get-token', body, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 30000,
            });
            if (res.data?.status !== 'success' || !res.data?.token) {
                const reason = res.data?.reason ||
                    res.data?.err_msg ||
                    res.data?.message ||
                    'unknown_error';
                await this.prisma.subscriptionPayment.update({
                    where: { id: payment.id },
                    data: { status: 'FAILED', errorMessage: String(reason) },
                });
                throw new common_1.BadRequestException(`PayTR token alınamadı: ${reason}`);
            }
            const token = String(res.data.token);
            await this.prisma.subscriptionPayment.update({
                where: { id: payment.id },
                data: { providerToken: token },
            });
            return { token };
        }
        catch (e) {
            const msg = String(e?.response?.data?.reason ||
                e?.response?.data?.message ||
                e?.message ||
                '');
            this.logger.warn(`PAYTR init failed: ${msg}`);
            throw e instanceof common_1.BadRequestException
                ? e
                : new common_1.BadRequestException(`PayTR token alınamadı: ${msg}`);
        }
    }
    async handlePaytrCallback(payload) {
        const merchantOid = String(payload?.merchant_oid || '').trim();
        const status = String(payload?.status || '').trim();
        const totalAmount = String(payload?.total_amount || '').trim();
        const hash = String(payload?.hash || '').trim();
        if (!merchantOid) {
            return 'OK';
        }
        const payment = await this.prisma.subscriptionPayment.findFirst({
            where: { id: merchantOid },
        });
        if (!payment) {
            return 'OK';
        }
        const paytrCfg = await this.getPaytrSystemConfig();
        if (!paytrCfg.paytrIsActive ||
            !paytrCfg.paytrMerchantKey ||
            !paytrCfg.paytrMerchantSalt) {
            return 'OK';
        }
        const hashStr = `${merchantOid}${String(paytrCfg.paytrMerchantSalt)}${status}${totalAmount}`;
        const expected = (0, crypto_1.createHmac)('sha256', String(paytrCfg.paytrMerchantKey))
            .update(hashStr)
            .digest('base64');
        if (expected !== hash) {
            return 'PAYTR notification failed: bad hash';
        }
        if (payment.status === 'PAID') {
            return 'OK';
        }
        if (status !== 'success') {
            await this.prisma.subscriptionPayment.update({
                where: { id: payment.id },
                data: {
                    status: 'FAILED',
                    errorMessage: String(payload?.failed_reason_msg ||
                        payload?.failed_reason_code ||
                        payload?.error ||
                        'failed'),
                },
            });
            return 'OK';
        }
        const cardToken = payload?.card_token || payload?.paytr_card_token;
        const last4 = payload?.last4;
        const brand = payload?.brand;
        const expiry = payload?.expiry;
        await this.prisma.subscriptionPayment.update({
            where: { id: payment.id },
            data: { status: 'PAID', paidAt: new Date() },
        });
        if (cardToken) {
            const existingPm = await this.prisma.paymentMethod.findFirst({
                where: { tenantId: payment.tenantId, provider: 'PAYTR' },
            });
            if (existingPm) {
                await this.prisma.paymentMethod.update({
                    where: { id: existingPm.id },
                    data: {
                        paytrUserId: cardToken,
                        last4,
                        brand,
                        expiry,
                        isDefault: true,
                    },
                });
            }
            else {
                await this.prisma.paymentMethod.create({
                    data: {
                        tenantId: payment.tenantId,
                        provider: 'PAYTR',
                        paytrUserId: cardToken,
                        last4,
                        brand,
                        expiry,
                        isDefault: true,
                    },
                });
            }
        }
        const plan = await this.prisma.plan.findFirst({
            where: { code: payment.planCode },
        });
        if (!plan)
            return { ok: true };
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: payment.tenantId },
        });
        if (!tenant)
            return { ok: true };
        const now = new Date();
        const endsAt = payment.period === 'YEARLY'
            ? this.addYears(now, 1)
            : this.addMonths(now, 1);
        if (tenant.subscriptionStatus === 'TRIAL' &&
            tenant.subscriptionEndsAt &&
            tenant.subscriptionEndsAt > now) {
            const diffMs = tenant.subscriptionEndsAt.getTime() - now.getTime();
            const extraDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            endsAt.setDate(endsAt.getDate() + extraDays);
        }
        await this.prisma.tenant.update({
            where: { id: tenant.id },
            data: {
                subscriptionPlan: plan.code,
                subscriptionStatus: 'ACTIVE',
                subscriptionEndsAt: endsAt,
                maxUsers: plan.maxUsers ?? tenant.maxUsers,
                maxStorage: plan.maxStorage ?? tenant.maxStorage,
            },
        });
        return 'OK';
    }
    async handleAutoRenewals() {
        const today = new Date();
        const upcoming = new Date(today);
        upcoming.setDate(upcoming.getDate() + 3);
        const tenants = await this.prisma.tenant.findMany({
            where: {
                autoRenew: true,
                subscriptionEndsAt: { lte: upcoming },
                subscriptionStatus: { in: ['ACTIVE'] },
            },
            select: { id: true, subscriptionPlan: true },
        });
        for (const t of tenants) {
            if (!t.subscriptionPlan)
                continue;
            const plan = await this.prisma.plan.findFirst({
                where: { code: t.subscriptionPlan },
            });
            if (!plan)
                continue;
            const pm = await this.prisma.paymentMethod.findFirst({
                where: { tenantId: t.id, provider: 'PAYTR', isDefault: true },
            });
            if (!pm || !pm.paytrUserId) {
                await this.prisma.tenant.update({
                    where: { id: t.id },
                    data: { subscriptionStatus: 'PAST_DUE' },
                });
                continue;
            }
            const payment = await this.prisma.subscriptionPayment.create({
                data: {
                    tenantId: t.id,
                    planCode: plan.code,
                    amount: plan.monthlyPrice,
                    period: 'MONTHLY',
                    status: 'PENDING',
                    provider: 'PAYTR',
                },
            });
            const success = true;
            if (success) {
                await this.prisma.subscriptionPayment.update({
                    where: { id: payment.id },
                    data: { status: 'PAID', paidAt: new Date() },
                });
                const now = new Date();
                const endsAt = this.addMonths(now, 1);
                await this.prisma.tenant.update({
                    where: { id: t.id },
                    data: {
                        subscriptionStatus: 'ACTIVE',
                        subscriptionEndsAt: endsAt,
                    },
                });
            }
            else {
                await this.prisma.subscriptionPayment.update({
                    where: { id: payment.id },
                    data: { status: 'FAILED', errorMessage: 'charge_failed' },
                });
                await this.prisma.tenant.update({
                    where: { id: t.id },
                    data: { subscriptionStatus: 'PAST_DUE' },
                });
            }
        }
    }
    async getPaytrInstallments(bin, _amount) {
        void _amount;
        const defaults = [1, 2, 3, 6, 9, 12];
        const b = (bin || '').replace(/\D/g, '').slice(0, 8);
        const paytrCfg = await this.getPaytrSystemConfig();
        if (!paytrCfg.paytrIsActive ||
            !paytrCfg.paytrMerchantId ||
            !paytrCfg.paytrMerchantKey ||
            !paytrCfg.paytrMerchantSalt) {
            return defaults;
        }
        try {
            const hashStrBin = `${b}${String(paytrCfg.paytrMerchantId)}${String(paytrCfg.paytrMerchantSalt)}`;
            const paytrTokenBin = (0, crypto_1.createHmac)('sha256', String(paytrCfg.paytrMerchantKey))
                .update(hashStrBin)
                .digest('base64');
            const binRes = await axios_1.default.post('https://www.paytr.com/odeme/api/bin-detail', {
                merchant_id: String(paytrCfg.paytrMerchantId),
                bin_number: b,
                paytr_token: paytrTokenBin,
            }, { timeout: 20000 });
            const brand = binRes.data?.status === 'success'
                ? binRes.data?.brand || 'none'
                : 'none';
            const requestId = Date.now().toString();
            const hashStrRates = `${String(paytrCfg.paytrMerchantId)}${requestId}${String(paytrCfg.paytrMerchantSalt)}`;
            const paytrTokenRates = (0, crypto_1.createHmac)('sha256', String(paytrCfg.paytrMerchantKey))
                .update(hashStrRates)
                .digest('base64');
            const ratesRes = await axios_1.default.post('https://www.paytr.com/odeme/taksit-oranlari', {
                merchant_id: String(paytrCfg.paytrMerchantId),
                request_id: requestId,
                paytr_token: paytrTokenRates,
            }, { timeout: 90000 });
            if (ratesRes.data?.status !== 'success') {
                return defaults;
            }
            const maxInst = Number(ratesRes.data?.max_inst_non_bus) || 12;
            const rates = ratesRes.data?.rates || {};
            const brandRates = brand && rates ? rates[brand] || rates[brand?.toLowerCase?.()] : null;
            let options = [];
            if (brand === 'none' || !brandRates) {
                options = Array.from({ length: Math.min(maxInst, 12) }, (_, i) => i + 1);
            }
            else {
                const brandRatesObj = brandRates && typeof brandRates === 'object' ? brandRates : {};
                const keys = Object.keys(brandRatesObj);
                const nums = keys
                    .map((k) => Number(k))
                    .filter((n) => Number.isFinite(n) && n >= 2 && n <= maxInst);
                options = [1, ...nums].sort((a, b) => a - b);
            }
            return {
                options: options.length ? options : defaults,
                brand,
                rates: brandRates && typeof brandRates === 'object' ? brandRates : {},
            };
        }
        catch (e) {
            this.logger.warn(`PAYTR installments fetch failed: ${e?.message || ''}`);
            return defaults;
        }
    }
};
exports.SubscriptionsService = SubscriptionsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionsService.prototype, "handleAutoRenewals", null);
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map