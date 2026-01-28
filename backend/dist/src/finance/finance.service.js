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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var FinanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
const bcrypt = __importStar(require("bcrypt"));
const notifications_service_1 = require("../notifications/notifications.service");
const sms_service_1 = require("../sms/sms.service");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
let FinanceService = FinanceService_1 = class FinanceService {
    prisma;
    notifications;
    smsService;
    logger = new common_1.Logger(FinanceService_1.name);
    constructor(prisma, notifications, smsService) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.smsService = smsService;
    }
    toPaytrCurrency(currency) {
        const c = String(currency || '')
            .trim()
            .toUpperCase();
        if (c === 'TRY' || c === 'TL')
            return 'TL';
        if (c === 'USD' || c === 'EUR' || c === 'GBP')
            return c;
        return 'TL';
    }
    getBackendUrl() {
        return process.env.BACKEND_URL || 'https://api.kolayentegrasyon.com';
    }
    async findAll(tenantId, user) {
        const where = { tenantId };
        if (user?.role === 'CLIENT' && user?.customerId) {
            where.customerId = user.customerId;
        }
        return this.prisma.transaction.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                customer: { select: { name: true } },
                invoice: { select: { number: true } },
                payroll: { select: { period: true, user: { select: { name: true } } } },
            },
        });
    }
    async create(tenantId, data) {
        return this.prisma.transaction.create({
            data: {
                ...data,
                tenantId,
            },
        });
    }
    async update(id, tenantId, data) {
        return this.prisma.transaction.update({
            where: { id, tenantId },
            data,
        });
    }
    async remove(id, tenantId) {
        return this.prisma.transaction.delete({
            where: { id, tenantId },
        });
    }
    async getStats(tenantId, user) {
        const where = { tenantId };
        if (user?.role === 'CLIENT' && user?.customerId) {
            where.customerId = user.customerId;
        }
        const transactions = await this.prisma.transaction.findMany({
            where,
        });
        const income = transactions
            .filter((r) => r.type === 'INCOME' && r.status === 'PAID')
            .reduce((acc, curr) => acc + curr.amount, 0);
        const expense = transactions
            .filter((r) => r.type === 'EXPENSE' && r.status === 'PAID')
            .reduce((acc, curr) => acc + curr.amount, 0);
        const pendingIncome = transactions
            .filter((r) => r.type === 'INCOME' && r.status === 'PENDING')
            .reduce((acc, curr) => acc + curr.amount, 0);
        const pendingExpense = transactions
            .filter((r) => r.type === 'EXPENSE' && r.status === 'PENDING')
            .reduce((acc, curr) => acc + curr.amount, 0);
        const invoiceWhere = { tenantId, status: { in: ['SENT', 'OVERDUE'] } };
        if (user?.role === 'CLIENT' && user?.customerId) {
            invoiceWhere.customerId = user.customerId;
        }
        const unpaidInvoices = await this.prisma.invoice.aggregate({
            where: invoiceWhere,
            _sum: { totalAmount: true },
        });
        const recurringWhere = { tenantId, type: 'INCOME', isActive: true };
        if (user?.role === 'CLIENT' && user?.customerId) {
            recurringWhere.customerId = user.customerId;
        }
        const recurringIncome = await this.prisma.recurringTransaction.aggregate({
            where: recurringWhere,
            _sum: { amount: true },
        });
        return {
            totalIncome: income,
            totalExpense: expense,
            pendingIncome,
            pendingExpense,
            balance: income - expense,
            receivables: unpaidInvoices._sum.totalAmount || 0,
            monthlyRecurringRevenue: recurringIncome._sum.amount || 0,
        };
    }
    async findAllRecurring(tenantId, user) {
        const where = { tenantId };
        if (user?.role === 'CLIENT' && user?.customerId) {
            where.customerId = user.customerId;
        }
        return this.prisma.recurringTransaction.findMany({
            where,
            include: { customer: { select: { name: true } } },
        });
    }
    async createRecurring(tenantId, data) {
        const nextRunDateValue = new Date(String(data?.nextRunDate ?? ''));
        const recurring = await this.prisma.recurringTransaction.create({
            data: {
                ...data,
                tenantId,
                nextRunDate: nextRunDateValue,
            },
        });
        await this.processRecurringTransaction(recurring);
        return recurring;
    }
    async toggleRecurring(id, tenantId) {
        const recurring = await this.prisma.recurringTransaction.findUnique({
            where: { id, tenantId },
        });
        if (!recurring)
            return null;
        const updated = await this.prisma.recurringTransaction.update({
            where: { id },
            data: { isActive: !recurring.isActive },
        });
        if (updated.isActive) {
            await this.processRecurringTransaction(updated);
        }
        return updated;
    }
    async updateRecurring(id, tenantId, data) {
        const { nextRunDate, ...rest } = data;
        const nextRunDateValue = nextRunDate !== undefined && nextRunDate !== null
            ? new Date(String(nextRunDate))
            : undefined;
        const updated = await this.prisma.recurringTransaction.update({
            where: { id, tenantId },
            data: {
                ...rest,
                nextRunDate: nextRunDateValue,
            },
        });
        await this.processRecurringTransaction(updated);
        return updated;
    }
    async removeRecurring(id, tenantId) {
        return this.prisma.recurringTransaction.delete({
            where: { id, tenantId },
        });
    }
    async processRecurringTransaction(item) {
        if (!item.isActive)
            return;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const itemNextRunDate = new Date(String(item?.nextRunDate ?? ''));
        if (itemNextRunDate <= today) {
            await this.prisma.transaction.create({
                data: {
                    tenantId: item.tenantId,
                    type: item.type,
                    category: item.category,
                    description: item.description || `Düzenli İşlem: ${item.category}`,
                    amount: item.amount,
                    date: new Date(),
                    status: 'PAID',
                    customerId: item.customerId,
                },
            });
            const nextDate = new Date(String(item?.nextRunDate ?? ''));
            if (item.interval === 'DAILY')
                nextDate.setDate(nextDate.getDate() + 1);
            if (item.interval === 'WEEKLY')
                nextDate.setDate(nextDate.getDate() + 7);
            if (item.interval === 'MONTHLY')
                nextDate.setMonth(nextDate.getMonth() + 1);
            if (item.interval === 'YEARLY')
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            await this.prisma.recurringTransaction.update({
                where: { id: item.id },
                data: { nextRunDate: nextDate },
            });
        }
    }
    async findAllInvoices(tenantId, user) {
        const where = { tenantId };
        if (user?.role === 'CLIENT' && user?.customerId) {
            where.customerId = user.customerId;
        }
        return this.prisma.invoice.findMany({
            where,
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                items: true,
            },
            orderBy: { issueDate: 'desc' },
        });
    }
    async createInvoice(tenantId, data) {
        const { items, ...invoiceData } = data;
        const normalizedItems = Array.isArray(items) ? items : [];
        if (!invoiceData.customerId) {
            throw new common_1.BadRequestException('Müşteri seçimi zorunludur');
        }
        const taxRate = Number.isFinite(Number(invoiceData.taxRate))
            ? Number(invoiceData.taxRate)
            : 0;
        const subTotal = normalizedItems.reduce((acc, item) => acc + Number(item?.quantity || 0) * Number(item?.unitPrice || 0), 0);
        const taxAmount = subTotal * (taxRate / 100);
        const totalAmount = subTotal + taxAmount;
        const itemsWithTotals = normalizedItems.map((item) => ({
            ...item,
            quantity: Number(item?.quantity || 0),
            unitPrice: Number(item?.unitPrice || 0),
            totalPrice: Number.isFinite(Number(item?.totalPrice)) &&
                Number(item?.totalPrice) > 0
                ? Number(item.totalPrice)
                : Number(item?.quantity || 0) * Number(item?.unitPrice || 0),
        }));
        const created = await this.prisma.invoice.create({
            data: {
                ...invoiceData,
                amount: subTotal,
                taxRate,
                taxAmount,
                totalAmount,
                tenantId,
                issueDate: new Date(String(invoiceData?.issueDate ?? '')),
                dueDate: new Date(String(invoiceData?.dueDate ?? '')),
                items: {
                    create: itemsWithTotals,
                },
            },
            include: { items: true },
        });
        if (this.smsService) {
            await this.smsService.trySendEvent(tenantId, 'INVOICE_CREATED', {
                invoiceId: created.id,
            });
        }
        return created;
    }
    async updateInvoice(id, tenantId, data) {
        const existing = await this.prisma.invoice.findFirst({
            where: { id, tenantId },
            include: { items: true },
        });
        if (!existing) {
            return null;
        }
        const { items, ...invoiceData } = data;
        const normalizedItems = Array.isArray(items) ? items : [];
        const taxRate = Number.isFinite(Number(invoiceData.taxRate))
            ? Number(invoiceData.taxRate)
            : 0;
        const subTotal = normalizedItems.reduce((acc, item) => acc + Number(item?.quantity || 0) * Number(item?.unitPrice || 0), 0);
        const taxAmount = subTotal * (taxRate / 100);
        const totalAmount = subTotal + taxAmount;
        const itemsWithTotals = normalizedItems.map((item) => ({
            ...item,
            quantity: Number(item?.quantity || 0),
            unitPrice: Number(item?.unitPrice || 0),
            totalPrice: Number.isFinite(Number(item?.totalPrice)) &&
                Number(item?.totalPrice) > 0
                ? Number(item.totalPrice)
                : Number(item?.quantity || 0) * Number(item?.unitPrice || 0),
        }));
        return this.prisma.invoice.update({
            where: { id: existing.id },
            data: {
                ...invoiceData,
                amount: subTotal,
                taxRate,
                taxAmount,
                totalAmount,
                issueDate: new Date(String(invoiceData?.issueDate ?? '')),
                dueDate: new Date(String(invoiceData?.dueDate ?? '')),
                items: {
                    deleteMany: { invoiceId: existing.id },
                    create: itemsWithTotals,
                },
            },
            include: {
                customer: { select: { name: true } },
                items: true,
            },
        });
    }
    async removeInvoice(id, tenantId) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id, tenantId },
        });
        if (!invoice) {
            return null;
        }
        return this.prisma.invoice.delete({
            where: { id: invoice.id },
        });
    }
    async remindInvoice(id, tenantId, options) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id, tenantId },
            include: {
                customer: {
                    select: { id: true, name: true, phone: true },
                },
            },
        });
        if (!invoice) {
            return null;
        }
        const admins = await this.prisma.user.findMany({
            where: { tenantId, role: 'ADMIN' },
            select: { id: true },
        });
        const clientUsers = await this.prisma.user.findMany({
            where: { tenantId, role: 'CLIENT', customerId: invoice.customerId },
            select: { id: true },
        });
        const title = 'Fatura Hatırlatması';
        const message = `#${invoice.number} (${invoice.customer?.name ?? '-'}) vadesi ${invoice.dueDate.toLocaleDateString('tr-TR')} tarihinde.`;
        for (const u of [...admins, ...clientUsers]) {
            await this.notifications.create(tenantId, {
                userId: u.id,
                title,
                message,
                type: 'INVOICE_REMINDER',
                referenceId: invoice.id,
                referenceType: 'INVOICE',
            });
        }
        if (this.smsService) {
            if (options?.forceSms) {
                const paymentLink = await this.createInvoicePaymentLink(invoice.id, tenantId, {
                    reuseExisting: true,
                });
                const phones = new Set();
                if (invoice.customer?.phone)
                    phones.add(invoice.customer.phone);
                if (phones.size === 0) {
                    const users = await this.prisma.user.findMany({
                        where: { tenantId, role: 'CLIENT', customerId: invoice.customerId },
                        select: { phone: true },
                    });
                    for (const u of users) {
                        if (u.phone)
                            phones.add(u.phone);
                    }
                }
                const uniquePhones = Array.from(phones)
                    .map((p) => String(p).trim())
                    .filter((p) => p.length > 0);
                if (uniquePhones.length > 0) {
                    const dueDate = (() => {
                        try {
                            return invoice.dueDate.toLocaleDateString('tr-TR');
                        }
                        catch {
                            return '';
                        }
                    })();
                    await Promise.all(uniquePhones.map((to) => this.smsService.sendManual(tenantId, {
                        to,
                        message: `${invoice.number} faturasının vadesi ${dueDate} tarihinde. Ödeme: ${paymentLink?.url || ''}`,
                    })));
                }
            }
            else {
                await this.smsService.trySendEvent(tenantId, 'INVOICE_REMINDER', {
                    invoiceId: invoice.id,
                });
            }
        }
        return { ok: true };
    }
    async getInvoicePaymentLink(invoiceId, tenantId, user) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, tenantId },
            select: { id: true, customerId: true, status: true },
        });
        if (!invoice) {
            return null;
        }
        if (user?.role === 'CLIENT' && user?.customerId) {
            if (invoice.customerId !== user.customerId) {
                return null;
            }
        }
        const payment = await this.prisma.invoicePayment.findFirst({
            where: {
                tenantId,
                invoiceId,
                status: 'PENDING',
                paytrLinkUrl: { not: null },
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                amount: true,
                currency: true,
                paytrLinkUrl: true,
                createdAt: true,
            },
        });
        if (!payment)
            return null;
        return {
            id: payment.id,
            url: payment.paytrLinkUrl,
            status: payment.status,
        };
    }
    async createInvoicePaymentLink(invoiceId, tenantId, options) {
        if (options?.reuseExisting) {
            const existing = await this.prisma.invoicePayment.findFirst({
                where: {
                    tenantId,
                    invoiceId,
                    status: 'PENDING',
                    paytrLinkUrl: { not: null },
                },
                orderBy: { createdAt: 'desc' },
                select: { id: true, paytrLinkUrl: true },
            });
            if (existing?.paytrLinkUrl) {
                return { id: existing.id, url: existing.paytrLinkUrl };
            }
        }
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, tenantId },
            include: {
                customer: { select: { id: true, name: true, email: true } },
            },
        });
        if (!invoice) {
            throw new common_1.BadRequestException('Fatura bulunamadı');
        }
        if (invoice.status === 'PAID') {
            throw new common_1.BadRequestException('Fatura zaten ödendi');
        }
        if (!invoice.customer?.email) {
            throw new common_1.BadRequestException('PayTR tahsilat linki için müşterinin e-posta adresi gerekli');
        }
        const config = await this.prisma.paytrConfig.findFirst({
            where: { tenantId },
        });
        if (!config?.isActive ||
            !config.merchantId ||
            !config.merchantKey ||
            !config.merchantSalt) {
            throw new common_1.BadRequestException('PayTR ayarları eksik veya pasif');
        }
        const payment = await this.prisma.invoicePayment.create({
            data: {
                tenantId,
                invoiceId: invoice.id,
                amount: invoice.totalAmount,
                currency: invoice.currency || 'TRY',
                status: 'PENDING',
                provider: 'PAYTR',
            },
        });
        const name = `Fatura ${invoice.number}`;
        const priceInt = Math.round(Number(invoice.totalAmount || 0) * 100);
        const price = String(priceInt);
        const currency = this.toPaytrCurrency(invoice.currency || 'TRY');
        const maxInstallment = '12';
        const linkType = 'collection';
        const lang = 'tr';
        const required = `${name}${price}${currency}${maxInstallment}${linkType}${lang}`;
        const token = (0, crypto_1.createHmac)('sha256', config.merchantKey)
            .update(`${required}${config.merchantSalt}`)
            .digest('base64');
        const callbackLink = `${this.getBackendUrl()}/webhooks/paytr/link`;
        const body = new URLSearchParams();
        body.set('merchant_id', String(config.merchantId));
        body.set('paytr_token', token);
        body.set('name', name);
        body.set('price', price);
        body.set('currency', currency);
        body.set('max_installment', maxInstallment);
        body.set('link_type', linkType);
        body.set('lang', lang);
        body.set('email', String(invoice.customer.email));
        body.set('callback_link', callbackLink);
        body.set('callback_id', payment.id);
        body.set('debug_on', '1');
        try {
            const res = await axios_1.default.post('https://www.paytr.com/odeme/api/link/create', body, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 20000,
            });
            if (res.data?.status !== 'success') {
                const reason = res.data?.reason ||
                    res.data?.err_msg ||
                    res.data?.message ||
                    'unknown_error';
                await this.prisma.invoicePayment.update({
                    where: { id: payment.id },
                    data: { status: 'FAILED', rawCallback: JSON.stringify(res.data) },
                });
                throw new common_1.BadRequestException(`PayTR link oluşturma hatası: ${reason}`);
            }
            const linkId = String(res.data?.id ?? res.data?.link_id ?? '');
            const linkUrl = String(res.data?.link ?? res.data?.url ?? res.data?.link_url ?? '');
            await this.prisma.invoicePayment.update({
                where: { id: payment.id },
                data: {
                    paytrLinkId: linkId || null,
                    paytrLinkUrl: linkUrl || null,
                },
            });
            if (invoice.status === 'DRAFT') {
                await this.prisma.invoice.update({
                    where: { id: invoice.id },
                    data: { status: 'SENT' },
                });
            }
            if (!linkUrl) {
                throw new common_1.BadRequestException('PayTR link oluşturuldu ama URL alınamadı');
            }
            return { id: payment.id, url: linkUrl };
        }
        catch (e) {
            const msg = String(e?.response?.data?.reason ||
                e?.response?.data?.message ||
                e?.message ||
                '');
            this.logger.warn(`PayTR link create failed: ${msg}`);
            throw e instanceof common_1.BadRequestException
                ? e
                : new common_1.BadRequestException(`PayTR link oluşturma hatası: ${msg}`);
        }
    }
    async getEmployees(tenantId) {
        return this.prisma.user.findMany({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                salary: true,
                iban: true,
                startDate: true,
                isActive: true,
            },
        });
    }
    async getEmployeeDetails(userId, tenantId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, tenantId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                salary: true,
                iban: true,
                startDate: true,
                isActive: true,
                createdAt: true,
                tckn: true,
                address: true,
                birthDate: true,
                jobTitle: true,
                department: true,
                emergencyContactName: true,
                emergencyContactPhone: true,
                bankName: true,
                bankBranch: true,
                bankAccountNumber: true,
                maritalStatus: true,
                childrenCount: true,
                bloodType: true,
                educationLevel: true,
                contractType: true,
                socialSecurityNumber: true,
                taxNumber: true,
                weeklyHours: true,
                probationMonths: true,
                confidentialityYears: true,
                nonCompeteMonths: true,
                penaltyAmount: true,
                equipmentList: true,
                benefits: true,
                performancePeriod: true,
            },
        });
        if (!user) {
            return null;
        }
        const payrolls = await this.prisma.payroll.findMany({
            where: { tenantId, userId },
            orderBy: { period: 'desc' },
        });
        const advances = await this.prisma.employeeAdvance.findMany({
            where: { tenantId, userId },
            orderBy: { date: 'desc' },
        });
        return {
            user,
            payrolls,
            advances,
        };
    }
    async updateEmployeeFinancials(userId, tenantId, data) {
        const existingUser = await this.prisma.user.findFirst({
            where: { id: userId, tenantId },
            select: { id: true, email: true },
        });
        if (!existingUser) {
            throw new common_1.BadRequestException('Personel bulunamadı');
        }
        const updateData = {
            salary: data.salary,
            iban: data.iban,
            startDate: data.startDate ? new Date(String(data.startDate)) : undefined,
            phone: data.phone,
            address: data.address,
            tckn: data.tckn,
            birthDate: data.birthDate ? new Date(String(data.birthDate)) : undefined,
            jobTitle: data.jobTitle,
            department: data.department,
            emergencyContactName: data.emergencyContactName,
            emergencyContactPhone: data.emergencyContactPhone,
            bankName: data.bankName,
            bankBranch: data.bankBranch,
            bankAccountNumber: data.bankAccountNumber,
            maritalStatus: data.maritalStatus,
            childrenCount: data.childrenCount,
            bloodType: data.bloodType,
            educationLevel: data.educationLevel,
            contractType: data.contractType,
            socialSecurityNumber: data.socialSecurityNumber,
            taxNumber: data.taxNumber,
            weeklyHours: data.weeklyHours,
            probationMonths: data.probationMonths,
            confidentialityYears: data.confidentialityYears,
            nonCompeteMonths: data.nonCompeteMonths,
            penaltyAmount: data.penaltyAmount,
            equipmentList: data.equipmentList,
            benefits: data.benefits,
            performancePeriod: data.performancePeriod,
        };
        if (typeof data.email === 'string') {
            const nextEmail = data.email.trim().toLowerCase();
            if (!nextEmail || !nextEmail.includes('@')) {
                throw new common_1.BadRequestException('Geçerli bir e-posta girin');
            }
            if (nextEmail !== existingUser.email) {
                const other = await this.prisma.user.findUnique({
                    where: { email: nextEmail },
                    select: { id: true },
                });
                if (other && other.id !== existingUser.id) {
                    throw new common_1.BadRequestException('Bu e-posta adresi zaten kullanılıyor');
                }
                updateData.email = nextEmail;
            }
        }
        if (typeof data.newPassword === 'string') {
            const nextPassword = data.newPassword;
            if (nextPassword.trim()) {
                if (nextPassword.length < 6) {
                    throw new common_1.BadRequestException('Şifre en az 6 karakter olmalı');
                }
                updateData.password = await bcrypt.hash(nextPassword, 10);
            }
        }
        return this.prisma.user.update({
            where: { id: userId, tenantId },
            data: updateData,
        });
    }
    async terminateEmployee(userId, tenantId) {
        const user = await this.prisma.user.update({
            where: { id: userId, tenantId },
            data: {
                isActive: false,
            },
        });
        if (!user.salary || user.salary <= 0) {
            return user;
        }
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                payrollPaymentDay: true,
            },
        });
        const paymentDay = tenant?.payrollPaymentDay ?? 15;
        const today = new Date();
        const paymentDate = new Date(today);
        paymentDate.setHours(0, 0, 0, 0);
        if (today.getDate() <= paymentDay) {
            paymentDate.setDate(paymentDay);
        }
        else {
            paymentDate.setMonth(paymentDate.getMonth() + 1);
            paymentDate.setDate(paymentDay);
        }
        const periodDate = new Date(paymentDate);
        periodDate.setMonth(periodDate.getMonth() - 1);
        const period = periodDate.toISOString().slice(0, 7);
        let payroll = await this.prisma.payroll.findFirst({
            where: { tenantId, userId, period },
        });
        if (!payroll) {
            const advances = await this.prisma.employeeAdvance.findMany({
                where: { tenantId, userId, isDeducted: false },
            });
            const totalAdvance = advances.reduce((acc, curr) => acc + curr.amount, 0);
            const baseSalary = user.salary || 0;
            const netSalary = baseSalary - totalAdvance;
            payroll = await this.prisma.payroll.create({
                data: {
                    period,
                    baseSalary,
                    deductions: totalAdvance,
                    netSalary,
                    userId,
                    tenantId,
                    status: 'PENDING',
                },
            });
            if (advances.length > 0) {
                await this.prisma.employeeAdvance.updateMany({
                    where: { id: { in: advances.map((a) => a.id) } },
                    data: { isDeducted: true },
                });
            }
        }
        const existingTransaction = await this.prisma.transaction.findFirst({
            where: { tenantId, payrollId: payroll.id },
        });
        if (!existingTransaction) {
            await this.prisma.transaction.create({
                data: {
                    tenantId,
                    type: 'EXPENSE',
                    category: 'Maaş',
                    description: `Maaş Ödemesi - ${user.name} - ${period}`,
                    amount: payroll.netSalary,
                    date: paymentDate,
                    status: 'PENDING',
                    payrollId: payroll.id,
                },
            });
        }
        return user;
    }
    async createAdvance(tenantId, data) {
        const advance = await this.prisma.employeeAdvance.create({
            data: {
                ...data,
                tenantId,
                date: new Date(),
            },
            include: { user: { select: { name: true } } },
        });
        await this.prisma.transaction.create({
            data: {
                tenantId,
                type: 'EXPENSE',
                category: 'Personel Avansı',
                description: `${advance.user.name} - Personel Avansı`,
                amount: parseFloat(String(data?.amount ?? 0)),
                date: new Date(),
                status: 'PAID',
            },
        });
        return advance;
    }
    async getPayrolls(tenantId) {
        return this.prisma.payroll.findMany({
            where: { tenantId },
            include: { user: { select: { name: true } } },
            orderBy: { period: 'desc' },
        });
    }
    async getPayrollSettings(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                payrollCalculationStartDay: true,
                payrollCalculationEndDay: true,
                payrollPaymentDay: true,
                payrollExpenseVisibilityDaysBefore: true,
                payrollAutoGenerate: true,
            },
        });
        const defaults = {
            calculationStartDay: 1,
            calculationEndDay: 30,
            paymentDay: 15,
            expenseVisibilityDaysBefore: 7,
            autoGenerate: true,
        };
        if (!tenant) {
            return defaults;
        }
        return {
            calculationStartDay: tenant.payrollCalculationStartDay ?? defaults.calculationStartDay,
            calculationEndDay: tenant.payrollCalculationEndDay ?? defaults.calculationEndDay,
            paymentDay: tenant.payrollPaymentDay ?? defaults.paymentDay,
            expenseVisibilityDaysBefore: tenant.payrollExpenseVisibilityDaysBefore ??
                defaults.expenseVisibilityDaysBefore,
            autoGenerate: tenant.payrollAutoGenerate ?? defaults.autoGenerate,
        };
    }
    async updatePayrollSettings(tenantId, data) {
        const toInt = (value) => {
            const n = Number(value);
            if (!Number.isFinite(n)) {
                return null;
            }
            return Math.round(n);
        };
        const clamp = (n, min, max) => {
            if (n < min)
                return min;
            if (n > max)
                return max;
            return n;
        };
        const calculationStartDayRaw = toInt(data.calculationStartDay);
        const calculationEndDayRaw = toInt(data.calculationEndDay);
        const paymentDayRaw = toInt(data.paymentDay);
        const visibilityDaysRaw = toInt(data.expenseVisibilityDaysBefore);
        const calculationStartDay = calculationStartDayRaw != null ? clamp(calculationStartDayRaw, 1, 31) : 1;
        const calculationEndDay = calculationEndDayRaw != null
            ? clamp(calculationEndDayRaw, calculationStartDay, 31)
            : 30;
        const paymentDay = paymentDayRaw != null ? clamp(paymentDayRaw, 1, 31) : 15;
        const expenseVisibilityDaysBefore = visibilityDaysRaw != null ? clamp(visibilityDaysRaw, 0, 31) : 7;
        const autoGenerate = typeof data.autoGenerate === 'boolean'
            ? data.autoGenerate
            : data.autoGenerate === 'true'
                ? true
                : data.autoGenerate === 'false'
                    ? false
                    : true;
        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                payrollCalculationStartDay: calculationStartDay,
                payrollCalculationEndDay: calculationEndDay,
                payrollPaymentDay: paymentDay,
                payrollExpenseVisibilityDaysBefore: expenseVisibilityDaysBefore,
                payrollAutoGenerate: autoGenerate,
            },
        });
        return this.getPayrollSettings(tenantId);
    }
    async generatePayroll(tenantId, period) {
        const employees = await this.prisma.user.findMany({
            where: { tenantId, salary: { gt: 0 }, isActive: true },
        });
        const results = [];
        for (const employee of employees) {
            const existing = await this.prisma.payroll.findFirst({
                where: { tenantId, userId: employee.id, period },
            });
            if (existing)
                continue;
            const advances = await this.prisma.employeeAdvance.findMany({
                where: { tenantId, userId: employee.id, isDeducted: false },
            });
            const totalAdvance = advances.reduce((acc, curr) => acc + curr.amount, 0);
            const netSalary = (employee.salary || 0) - totalAdvance;
            const payroll = await this.prisma.payroll.create({
                data: {
                    period,
                    baseSalary: employee.salary || 0,
                    deductions: totalAdvance,
                    netSalary,
                    userId: employee.id,
                    tenantId,
                    status: 'PENDING',
                },
            });
            if (advances.length > 0) {
                await this.prisma.employeeAdvance.updateMany({
                    where: { id: { in: advances.map((a) => a.id) } },
                    data: { isDeducted: true },
                });
            }
            results.push(payroll);
        }
        return results;
    }
    async updatePayroll(id, tenantId, data) {
        const existing = await this.prisma.payroll.findFirst({
            where: { id, tenantId },
        });
        if (!existing) {
            return null;
        }
        const toNumber = (value, fallback) => {
            const n = Number(value);
            return Number.isFinite(n) ? n : fallback;
        };
        const baseSalary = toNumber(data.baseSalary ?? existing.baseSalary, existing.baseSalary);
        const bonus = toNumber(data.bonus ?? existing.bonus ?? 0, existing.bonus ?? 0);
        const deductions = toNumber(data.deductions ?? existing.deductions, existing.deductions);
        const netSalary = baseSalary + bonus - deductions;
        return this.prisma.payroll.update({
            where: { id, tenantId },
            data: {
                baseSalary,
                bonus,
                deductions,
                netSalary,
            },
        });
    }
    async deletePayroll(id, tenantId) {
        await this.prisma.transaction.deleteMany({
            where: { tenantId, payrollId: id },
        });
        return this.prisma.payroll.delete({
            where: { id, tenantId },
        });
    }
    async payPayroll(id, tenantId) {
        const payroll = await this.prisma.payroll.findUnique({
            where: { id, tenantId },
            include: { user: true },
        });
        if (!payroll || payroll.status === 'PAID')
            return;
        const transaction = await this.prisma.transaction.findFirst({
            where: { payrollId: id, tenantId },
        });
        if (transaction) {
            await this.prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: 'PAID', date: new Date() },
            });
        }
        else {
            await this.prisma.transaction.create({
                data: {
                    tenantId,
                    type: 'EXPENSE',
                    category: 'Maaş',
                    description: `Maaş Ödemesi - ${payroll.user?.name || 'Bilinmeyen Kullanıcı'} - ${payroll.period}`,
                    amount: payroll.netSalary,
                    date: new Date(),
                    status: 'PAID',
                    payrollId: payroll.id,
                },
            });
        }
        return this.prisma.payroll.update({
            where: { id },
            data: { status: 'PAID', paymentDate: new Date() },
        });
    }
    async getCustomerStats(tenantId) {
        const customers = await this.prisma.customer.findMany({
            where: { tenantId },
            include: {
                recurringTransactions: {
                    where: { isActive: true },
                },
                transactions: {
                    where: { status: 'PAID' },
                },
            },
        });
        return customers.map((customer) => {
            const monthlyRevenue = customer.recurringTransactions
                .filter((t) => t.type === 'INCOME')
                .reduce((acc, curr) => {
                let amount = curr.amount;
                if (curr.interval === 'WEEKLY')
                    amount *= 4;
                if (curr.interval === 'DAILY')
                    amount *= 30;
                if (curr.interval === 'YEARLY')
                    amount /= 12;
                return acc + amount;
            }, 0);
            const monthlyExpense = customer.recurringTransactions
                .filter((t) => t.type === 'EXPENSE')
                .reduce((acc, curr) => {
                let amount = curr.amount;
                if (curr.interval === 'WEEKLY')
                    amount *= 4;
                if (curr.interval === 'DAILY')
                    amount *= 30;
                if (curr.interval === 'YEARLY')
                    amount /= 12;
                return acc + amount;
            }, 0);
            const recurringStatus = customer.recurringTransactions
                .filter((t) => t.type === 'INCOME' && t.isActive && t.interval === 'MONTHLY')
                .map((t) => {
                const nextRun = new Date(t.nextRunDate);
                const today = new Date();
                const isPaidThisMonth = nextRun.getMonth() !== today.getMonth() ||
                    nextRun.getFullYear() > today.getFullYear();
                return {
                    id: t.id,
                    category: t.category,
                    amount: t.amount,
                    day: nextRun.getDate(),
                    isPaid: isPaidThisMonth,
                    nextDate: t.nextRunDate,
                };
            });
            const totalRevenue = customer.transactions
                .filter((t) => t.type === 'INCOME')
                .reduce((acc, curr) => acc + curr.amount, 0);
            return {
                ...customer,
                monthlyRevenue,
                monthlyExpense,
                totalRevenue,
                recurringStatus,
                profitability: monthlyRevenue - monthlyExpense,
            };
        });
    }
    async seedData(tenantId) {
        const users = [
            {
                name: 'Ahmet Yılmaz',
                email: `ahmet.${Math.floor(Math.random() * 1000)}@ajans.com`,
                role: 'STAFF',
                salary: 25000,
                iban: 'TR12 3456 7890',
            },
            {
                name: 'Ayşe Demir',
                email: `ayse.${Math.floor(Math.random() * 1000)}@ajans.com`,
                role: 'STAFF',
                salary: 32000,
                iban: 'TR98 7654 3210',
            },
            {
                name: 'Mehmet Kaya',
                email: `mehmet.${Math.floor(Math.random() * 1000)}@ajans.com`,
                role: 'STAFF',
                salary: 28000,
                iban: 'TR11 2233 4455',
            },
        ];
        for (const u of users) {
            const hashedPassword = await bcrypt.hash('ajans123', 10);
            await this.prisma.user.create({
                data: {
                    tenantId,
                    email: u.email,
                    name: u.name,
                    password: hashedPassword,
                    role: u.role,
                    salary: u.salary,
                    iban: u.iban,
                    startDate: new Date('2024-01-01'),
                },
            });
        }
        const allUsers = await this.prisma.user.findMany({ where: { tenantId } });
        const customersData = [
            { name: 'Leka Motors', email: 'info@lekamotors.com' },
            { name: 'TechnoStart', email: 'contact@technostart.io' },
            { name: 'Gurme Burger', email: 'siparis@gurmeburger.com' },
        ];
        for (const c of customersData) {
            const existing = await this.prisma.customer.findFirst({
                where: { tenantId, name: c.name },
            });
            if (!existing) {
                await this.prisma.customer.create({
                    data: {
                        tenantId,
                        name: c.name,
                        email: c.email,
                    },
                });
            }
        }
        const allCustomers = await this.prisma.customer.findMany({
            where: { tenantId },
        });
        const recurring = [
            {
                type: 'EXPENSE',
                category: 'Kira',
                amount: 15000,
                description: 'Ofis Kirası',
                interval: 'MONTHLY',
                isActive: true,
            },
            {
                type: 'EXPENSE',
                category: 'Sunucu',
                amount: 2500,
                description: 'AWS & Vercel',
                interval: 'MONTHLY',
                isActive: true,
            },
            {
                type: 'EXPENSE',
                category: 'Yemek',
                amount: 8000,
                description: 'Sodexo',
                interval: 'MONTHLY',
                isActive: true,
            },
        ];
        for (const r of recurring) {
            await this.prisma.recurringTransaction.create({
                data: {
                    tenantId,
                    ...r,
                    nextRunDate: new Date(),
                },
            });
        }
        if (allCustomers.length > 0) {
            await this.prisma.recurringTransaction.create({
                data: {
                    tenantId,
                    type: 'INCOME',
                    category: 'Sosyal Medya Yönetimi',
                    amount: 20000,
                    description: 'Aylık Retainer',
                    interval: 'MONTHLY',
                    customerId: allCustomers[0].id,
                    nextRunDate: new Date(),
                },
            });
        }
        if (allCustomers.length > 0) {
            const inv1 = await this.prisma.invoice.create({
                data: {
                    tenantId,
                    customerId: allCustomers[0].id,
                    number: `INV-2024-${Math.floor(Math.random() * 1000)}`,
                    issueDate: new Date('2024-01-15'),
                    dueDate: new Date('2024-01-30'),
                    status: 'PAID',
                    amount: 20000,
                    taxRate: 20,
                    taxAmount: 4000,
                    totalAmount: 24000,
                    items: {
                        create: [
                            {
                                description: 'Ocak Ayı Hizmet Bedeli',
                                quantity: 1,
                                unitPrice: 20000,
                                totalPrice: 20000,
                            },
                        ],
                    },
                },
            });
            await this.prisma.transaction.create({
                data: {
                    tenantId,
                    type: 'INCOME',
                    category: 'Hizmet Bedeli',
                    amount: 24000,
                    date: new Date('2024-01-20'),
                    description: `Fatura Ödemesi - ${inv1.number}`,
                    invoiceId: inv1.id,
                    customerId: allCustomers[0].id,
                },
            });
        }
        if (allUsers.length > 0) {
            await this.prisma.employeeAdvance.create({
                data: {
                    tenantId,
                    userId: allUsers[0].id,
                    amount: 5000,
                    description: 'Acil ihtiyaç',
                    date: new Date(),
                    isDeducted: false,
                },
            });
        }
        const period = new Date().toISOString().slice(0, 7);
        await this.generatePayroll(tenantId, period);
        return { message: 'Seed data created successfully' };
    }
    async handleRecurringTransactions() {
        this.logger.log('Checking recurring transactions...');
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const dueItems = await this.prisma.recurringTransaction.findMany({
            where: {
                isActive: true,
                nextRunDate: { lte: today },
            },
        });
        this.logger.log(`Found ${dueItems.length} due recurring items.`);
        for (const item of dueItems) {
            await this.processRecurringTransaction(item);
        }
    }
    async autoGeneratePayroll() {
        this.logger.log('Auto generating payrolls based on tenant settings...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tenants = await this.prisma.tenant.findMany({
            select: {
                id: true,
                payrollAutoGenerate: true,
                payrollPaymentDay: true,
                payrollExpenseVisibilityDaysBefore: true,
            },
        });
        for (const tenant of tenants) {
            const autoGenerate = tenant.payrollAutoGenerate === null ||
                tenant.payrollAutoGenerate === undefined
                ? true
                : tenant.payrollAutoGenerate;
            if (!autoGenerate) {
                continue;
            }
            const paymentDay = tenant.payrollPaymentDay ?? 15;
            const visibilityDaysBefore = tenant.payrollExpenseVisibilityDaysBefore ?? 7;
            const candidatePaymentDate = new Date(today);
            candidatePaymentDate.setDate(today.getDate() + visibilityDaysBefore);
            if (candidatePaymentDate.getDate() !== paymentDay) {
                continue;
            }
            const periodDate = new Date(candidatePaymentDate);
            periodDate.setMonth(periodDate.getMonth() - 1);
            const period = periodDate.toISOString().slice(0, 7);
            await this.autoGeneratePayrollForTenant(tenant.id, period, candidatePaymentDate);
        }
    }
    async handleInvoiceReminders() {
        this.logger.log('Checking invoice reminders and overdue statuses...');
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const pendingStatuses = ['SENT', 'OVERDUE', 'DRAFT'];
        const invoices = await this.prisma.invoice.findMany({
            where: {
                status: { in: pendingStatuses },
            },
            select: {
                id: true,
                number: true,
                tenantId: true,
                customerId: true,
                issueDate: true,
                dueDate: true,
                status: true,
            },
        });
        for (const inv of invoices) {
            const due = new Date(inv.dueDate);
            due.setHours(0, 0, 0, 0);
            const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 0 &&
                inv.status !== 'PAID' &&
                inv.status !== 'CANCELLED' &&
                inv.status !== 'OVERDUE') {
                await this.prisma.invoice.update({
                    where: { id: inv.id },
                    data: { status: 'OVERDUE' },
                });
            }
            const shouldRemind = diffDays === 7 ||
                diffDays === 3 ||
                diffDays === 1 ||
                diffDays === 0 ||
                diffDays === -1 ||
                diffDays === -7;
            if (!shouldRemind)
                continue;
            const admins = await this.prisma.user.findMany({
                where: { tenantId: inv.tenantId, role: 'ADMIN' },
                select: { id: true },
            });
            const clientUsers = await this.prisma.user.findMany({
                where: {
                    tenantId: inv.tenantId,
                    role: 'CLIENT',
                    customerId: inv.customerId,
                },
                select: { id: true },
            });
            const title = diffDays >= 0 ? 'Fatura Hatırlatması' : 'Gecikmiş Fatura';
            const message = diffDays >= 0
                ? `#${inv.number} vadesi ${due.toLocaleDateString('tr-TR')} tarihinde.`
                : `#${inv.number} gecikmiş. Vade ${due.toLocaleDateString('tr-TR')}.`;
            for (const u of [...admins, ...clientUsers]) {
                await this.notifications.create(inv.tenantId, {
                    userId: u.id,
                    title,
                    message,
                    type: diffDays >= 0 ? 'INVOICE_REMINDER' : 'INVOICE_OVERDUE',
                    referenceId: inv.id,
                    referenceType: 'INVOICE',
                });
            }
            if (this.smsService) {
                await this.smsService.trySendEvent(inv.tenantId, diffDays >= 0 ? 'INVOICE_REMINDER' : 'INVOICE_OVERDUE', { invoiceId: inv.id });
            }
        }
    }
    async autoGeneratePayrollForTenant(tenantId, period, paymentDate) {
        const payrolls = await this.generatePayroll(tenantId, period);
        for (const payroll of payrolls) {
            await this.prisma.transaction.create({
                data: {
                    tenantId,
                    type: 'EXPENSE',
                    category: 'Maaş',
                    description: `Maaş Ödemesi - ${payroll.period}`,
                    amount: payroll.netSalary,
                    date: paymentDate,
                    status: 'PENDING',
                    payrollId: payroll.id,
                },
            });
        }
    }
};
exports.FinanceService = FinanceService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinanceService.prototype, "handleRecurringTransactions", null);
__decorate([
    (0, schedule_1.Cron)('0 3 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinanceService.prototype, "autoGeneratePayroll", null);
__decorate([
    (0, schedule_1.Cron)('0 9 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinanceService.prototype, "handleInvoiceReminders", null);
exports.FinanceService = FinanceService = FinanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        sms_service_1.SmsService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map