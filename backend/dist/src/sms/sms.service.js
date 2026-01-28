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
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const vatansms_service_1 = require("../integrations/vatansms/vatansms.service");
const netgsm_service_1 = require("../integrations/netgsm/netgsm.service");
let SmsService = SmsService_1 = class SmsService {
    prisma;
    vatansmsService;
    netgsmService;
    logger = new common_1.Logger(SmsService_1.name);
    constructor(prisma, vatansmsService, netgsmService) {
        this.prisma = prisma;
        this.vatansmsService = vatansmsService;
        this.netgsmService = netgsmService;
    }
    isNoSuchTableError(error) {
        return String(error?.message || '')
            .toLowerCase()
            .includes('no such table');
    }
    renderTemplate(content, variables) {
        const str = String(content ?? '');
        return str.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
            const val = variables?.[key];
            if (val === undefined || val === null)
                return '';
            return String(val);
        });
    }
    async ensureDefaults(tenantId) {
        try {
            const existingSettings = await this.prisma.smsSettings.findUnique({
                where: { tenantId },
            });
            if (!existingSettings) {
                await this.prisma.smsSettings.create({
                    data: { tenantId, provider: 'VATANSMS', isActive: false },
                });
            }
            const templates = [
                {
                    key: 'TASK_COMPLETED_DEFAULT',
                    title: 'Görev tamamlandı',
                    content: '{taskTitle} görevi tamamlandı.',
                },
                {
                    key: 'INVOICE_CREATED_DEFAULT',
                    title: 'Fatura oluşturuldu',
                    content: '{invoiceNumber} numaralı fatura oluşturuldu. Toplam: {totalAmount} {currency}. Vade: {dueDate}.',
                },
                {
                    key: 'INVOICE_REMINDER_DEFAULT',
                    title: 'Fatura hatırlatması',
                    content: '{invoiceNumber} faturasının vadesi {dueDate} tarihinde. Ödeme: {paymentUrl}',
                },
                {
                    key: 'INVOICE_OVERDUE_DEFAULT',
                    title: 'Gecikmiş fatura',
                    content: '{invoiceNumber} faturasının vadesi geçti. Vade: {dueDate}.',
                },
                {
                    key: 'PROPOSAL_CREATED_DEFAULT',
                    title: 'Teklif oluşturuldu',
                    content: '{proposalTitle} teklifi oluşturuldu. Durum: {status}.',
                },
                {
                    key: 'PROPOSAL_UPDATED_DEFAULT',
                    title: 'Teklif güncellendi',
                    content: '{proposalTitle} teklifi güncellendi. Durum: {status}.',
                },
            ];
            for (const t of templates) {
                await this.prisma.smsTemplate.upsert({
                    where: { tenantId_key: { tenantId, key: t.key } },
                    create: { tenantId, key: t.key, title: t.title, content: t.content },
                    update: {},
                });
            }
            const triggers = [
                {
                    event: 'TASK_COMPLETED',
                    recipientType: 'TASK_ASSIGNEE',
                    templateKey: 'TASK_COMPLETED_DEFAULT',
                },
                {
                    event: 'INVOICE_CREATED',
                    recipientType: 'CUSTOMER_PHONE',
                    templateKey: 'INVOICE_CREATED_DEFAULT',
                },
                {
                    event: 'INVOICE_REMINDER',
                    recipientType: 'CUSTOMER_PHONE',
                    templateKey: 'INVOICE_REMINDER_DEFAULT',
                },
                {
                    event: 'INVOICE_OVERDUE',
                    recipientType: 'CUSTOMER_PHONE',
                    templateKey: 'INVOICE_OVERDUE_DEFAULT',
                },
                {
                    event: 'PROPOSAL_CREATED',
                    recipientType: 'CUSTOMER_PHONE',
                    templateKey: 'PROPOSAL_CREATED_DEFAULT',
                },
                {
                    event: 'PROPOSAL_UPDATED',
                    recipientType: 'CUSTOMER_PHONE',
                    templateKey: 'PROPOSAL_UPDATED_DEFAULT',
                },
            ];
            for (const tr of triggers) {
                await this.prisma.smsTrigger.upsert({
                    where: { tenantId_event: { tenantId, event: tr.event } },
                    create: {
                        tenantId,
                        event: tr.event,
                        enabled: false,
                        recipientType: tr.recipientType,
                        templateKey: tr.templateKey,
                    },
                    update: {},
                });
            }
        }
        catch (error) {
            if (this.isNoSuchTableError(error))
                return;
            throw error;
        }
    }
    async getSettings(tenantId) {
        try {
            await this.ensureDefaults(tenantId);
            const s = await this.prisma.smsSettings.findUnique({
                where: { tenantId },
            });
            return (s || {
                tenantId,
                provider: 'VATANSMS',
                isActive: false,
                updatedAt: new Date(),
            });
        }
        catch (error) {
            if (this.isNoSuchTableError(error)) {
                return {
                    tenantId,
                    provider: 'VATANSMS',
                    isActive: false,
                    updatedAt: new Date(),
                };
            }
            throw error;
        }
    }
    async updateSettings(tenantId, data) {
        try {
            await this.ensureDefaults(tenantId);
            const existing = await this.prisma.smsSettings.findUnique({
                where: { tenantId },
            });
            if (!existing) {
                return await this.prisma.smsSettings.create({
                    data: {
                        tenantId,
                        provider: data.provider || 'VATANSMS',
                        isActive: !!data.isActive,
                    },
                });
            }
            return await this.prisma.smsSettings.update({
                where: { tenantId },
                data: {
                    provider: data.provider ?? existing.provider,
                    isActive: typeof data.isActive === 'boolean'
                        ? data.isActive
                        : existing.isActive,
                },
            });
        }
        catch (error) {
            if (this.isNoSuchTableError(error)) {
                throw new common_1.BadRequestException('Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.');
            }
            throw error;
        }
    }
    async listTemplates(tenantId) {
        try {
            await this.ensureDefaults(tenantId);
            return await this.prisma.smsTemplate.findMany({
                where: { tenantId },
                orderBy: [{ updatedAt: 'desc' }],
            });
        }
        catch (error) {
            if (this.isNoSuchTableError(error))
                return [];
            throw error;
        }
    }
    async createTemplate(tenantId, data) {
        try {
            await this.ensureDefaults(tenantId);
            return await this.prisma.smsTemplate.create({
                data: {
                    tenantId,
                    key: String(data.key || '').trim(),
                    title: String(data.title || '').trim(),
                    content: String(data.content || ''),
                    isActive: data.isActive ?? true,
                },
            });
        }
        catch (error) {
            if (this.isNoSuchTableError(error)) {
                throw new common_1.BadRequestException('Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.');
            }
            throw error;
        }
    }
    async updateTemplate(tenantId, id, data) {
        try {
            await this.ensureDefaults(tenantId);
            const existing = await this.prisma.smsTemplate.findFirst({
                where: { id, tenantId },
            });
            if (!existing)
                return null;
            return await this.prisma.smsTemplate.update({
                where: { id: existing.id },
                data: {
                    key: data.key !== undefined ? String(data.key).trim() : existing.key,
                    title: data.title !== undefined
                        ? String(data.title).trim()
                        : existing.title,
                    content: data.content !== undefined
                        ? String(data.content)
                        : existing.content,
                    isActive: typeof data.isActive === 'boolean'
                        ? data.isActive
                        : existing.isActive,
                },
            });
        }
        catch (error) {
            if (this.isNoSuchTableError(error)) {
                throw new common_1.BadRequestException('Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.');
            }
            throw error;
        }
    }
    async deleteTemplate(tenantId, id) {
        try {
            await this.ensureDefaults(tenantId);
            const existing = await this.prisma.smsTemplate.findFirst({
                where: { id, tenantId },
            });
            if (!existing)
                return null;
            return await this.prisma.smsTemplate.delete({
                where: { id: existing.id },
            });
        }
        catch (error) {
            if (this.isNoSuchTableError(error)) {
                throw new common_1.BadRequestException('Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.');
            }
            throw error;
        }
    }
    async listTriggers(tenantId) {
        try {
            await this.ensureDefaults(tenantId);
            return await this.prisma.smsTrigger.findMany({
                where: { tenantId },
                orderBy: [{ event: 'asc' }],
            });
        }
        catch (error) {
            if (this.isNoSuchTableError(error))
                return [];
            throw error;
        }
    }
    async updateTrigger(tenantId, id, data) {
        try {
            await this.ensureDefaults(tenantId);
            const existing = await this.prisma.smsTrigger.findFirst({
                where: { id, tenantId },
            });
            if (!existing)
                return null;
            return await this.prisma.smsTrigger.update({
                where: { id: existing.id },
                data: {
                    enabled: typeof data.enabled === 'boolean' ? data.enabled : existing.enabled,
                    recipientType: data.recipientType !== undefined
                        ? data.recipientType
                        : existing.recipientType,
                    templateKey: data.templateKey !== undefined
                        ? data.templateKey
                        : existing.templateKey,
                },
            });
        }
        catch (error) {
            if (this.isNoSuchTableError(error)) {
                throw new common_1.BadRequestException('Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.');
            }
            throw error;
        }
    }
    async sendViaProvider(tenantId, provider, to, message) {
        if (provider === 'VATANSMS') {
            if (!this.vatansmsService) {
                throw new common_1.BadRequestException('VatanSMS sağlayıcısı hazır değil');
            }
            const result = await this.vatansmsService.sendSms(tenantId, to, message);
            return {
                providerMessageId: String(result?.id ?? '') || undefined,
            };
        }
        if (provider === 'NETGSM') {
            if (!this.netgsmService) {
                throw new common_1.BadRequestException('NetGSM sağlayıcısı hazır değil');
            }
            const result = await this.netgsmService.sendSms(tenantId, to, message);
            return {
                providerMessageId: String(result?.bulkId ?? '') ||
                    String(result?.raw ?? '') ||
                    undefined,
            };
        }
        throw new common_1.BadRequestException('SMS sağlayıcısı desteklenmiyor');
    }
    async sendManual(tenantId, data) {
        const settings = await this.getSettings(tenantId);
        if (!settings.isActive) {
            throw new common_1.BadRequestException('SMS modülü aktif değil');
        }
        const to = String(data.to || '').trim();
        if (!to) {
            throw new common_1.BadRequestException('Telefon numarası zorunludur');
        }
        let message = String(data.message || '');
        if (data.templateKey) {
            const tpl = await this.prisma.smsTemplate.findFirst({
                where: { tenantId, key: data.templateKey, isActive: true },
            });
            if (!tpl) {
                throw new common_1.BadRequestException('Şablon bulunamadı');
            }
            message = this.renderTemplate(tpl.content, data.variables || {});
        }
        if (!message || message.trim().length === 0) {
            throw new common_1.BadRequestException('Mesaj içeriği zorunludur');
        }
        const provider = settings.provider || 'VATANSMS';
        try {
            const r = await this.sendViaProvider(tenantId, provider, to, message);
            try {
                await this.prisma.smsLog.create({
                    data: {
                        tenantId,
                        provider,
                        to,
                        message,
                        status: 'SUCCESS',
                        providerMessageId: r.providerMessageId,
                    },
                });
            }
            catch (logErr) {
                if (!this.isNoSuchTableError(logErr)) {
                    this.logger.error('SMS log yazılamadı', logErr);
                }
            }
            return { success: true, providerMessageId: r.providerMessageId };
        }
        catch (error) {
            try {
                await this.prisma.smsLog.create({
                    data: {
                        tenantId,
                        provider,
                        to,
                        message,
                        status: 'FAILED',
                        error: String(error?.message || error),
                    },
                });
            }
            catch (logErr) {
                if (!this.isNoSuchTableError(logErr)) {
                    this.logger.error('SMS log yazılamadı', logErr);
                }
            }
            throw error;
        }
    }
    formatDateTr(date) {
        try {
            return new Date(date).toLocaleDateString('tr-TR');
        }
        catch {
            return '';
        }
    }
    async resolveRecipientsForCustomer(tenantId, customerId, recipientType) {
        const phones = new Set();
        if (recipientType === 'CUSTOMER_PHONE') {
            const c = await this.prisma.customer.findFirst({
                where: { id: customerId, tenantId },
                select: { phone: true },
            });
            if (c?.phone)
                phones.add(c.phone);
        }
        if (recipientType === 'CUSTOMER_USERS') {
            const users = await this.prisma.user.findMany({
                where: { tenantId, role: 'CLIENT', customerId },
                select: { phone: true },
            });
            for (const u of users) {
                if (u.phone)
                    phones.add(u.phone);
            }
        }
        return Array.from(phones);
    }
    async resolveTaskRecipients(tenantId, taskId, recipientType, actorId) {
        const task = await this.prisma.task.findFirst({
            where: { id: taskId, tenantId },
            include: {
                assignee: { select: { id: true, phone: true } },
                project: {
                    select: { customerId: true, customer: { select: { phone: true } } },
                },
            },
        });
        if (!task)
            return [];
        if (recipientType === 'TASK_ASSIGNEE') {
            return task.assignee?.phone ? [task.assignee.phone] : [];
        }
        if (recipientType === 'TASK_WATCHERS') {
            const userIds = [];
            let members = [];
            try {
                members = task.members ? JSON.parse(task.members) : [];
            }
            catch {
                members = [];
            }
            if (Array.isArray(members))
                userIds.push(...members.map(String));
            if (task.assigneeId && !userIds.includes(task.assigneeId)) {
                userIds.push(task.assigneeId);
            }
            const filtered = userIds.filter((id) => !actorId || id !== actorId);
            if (filtered.length === 0)
                return [];
            const users = await this.prisma.user.findMany({
                where: { id: { in: filtered }, tenantId },
                select: { phone: true },
            });
            return users.map((u) => u.phone).filter(Boolean);
        }
        if (recipientType === 'CUSTOMER_PHONE') {
            const phone = task.project?.customer?.phone;
            return phone ? [phone] : [];
        }
        if (recipientType === 'CUSTOMER_USERS') {
            const customerId = task.project?.customerId;
            if (!customerId)
                return [];
            return await this.resolveRecipientsForCustomer(tenantId, customerId, 'CUSTOMER_USERS');
        }
        return [];
    }
    async trySendEvent(tenantId, event, context) {
        try {
            await this.ensureDefaults(tenantId);
            const settings = await this.getSettings(tenantId);
            if (!settings.isActive)
                return { skipped: true, reason: 'MODULE_INACTIVE' };
            const trigger = await this.prisma.smsTrigger.findFirst({
                where: { tenantId, event, enabled: true },
            });
            if (!trigger)
                return { skipped: true, reason: 'TRIGGER_DISABLED' };
            const template = await this.prisma.smsTemplate.findFirst({
                where: { tenantId, key: trigger.templateKey, isActive: true },
            });
            if (!template)
                return { skipped: true, reason: 'TEMPLATE_MISSING' };
            const provider = settings.provider || 'VATANSMS';
            const recipientType = trigger.recipientType;
            let phones = [];
            let variables = {};
            let referenceType;
            let referenceId;
            if (event === 'TASK_COMPLETED' && context.taskId) {
                const task = await this.prisma.task.findFirst({
                    where: { id: context.taskId, tenantId },
                    select: { id: true, title: true, dueDate: true },
                });
                if (!task)
                    return { skipped: true, reason: 'TASK_NOT_FOUND' };
                referenceType = 'TASK';
                referenceId = task.id;
                variables = {
                    taskTitle: task.title,
                    dueDate: task.dueDate ? this.formatDateTr(task.dueDate) : '',
                };
                phones = await this.resolveTaskRecipients(tenantId, context.taskId, recipientType, context.actorId);
            }
            if ((event === 'INVOICE_CREATED' ||
                event === 'INVOICE_REMINDER' ||
                event === 'INVOICE_OVERDUE') &&
                context.invoiceId) {
                const invoice = await this.prisma.invoice.findFirst({
                    where: { id: context.invoiceId, tenantId },
                    include: {
                        customer: { select: { id: true, name: true, phone: true } },
                    },
                });
                if (!invoice)
                    return { skipped: true, reason: 'INVOICE_NOT_FOUND' };
                referenceType = 'INVOICE';
                referenceId = invoice.id;
                variables = {
                    invoiceNumber: invoice.number,
                    customerName: invoice.customer?.name ?? '',
                    totalAmount: invoice.totalAmount,
                    currency: invoice.currency,
                    dueDate: this.formatDateTr(invoice.dueDate),
                };
                phones =
                    recipientType === 'CUSTOMER_PHONE' && invoice.customer?.phone
                        ? [invoice.customer.phone]
                        : await this.resolveRecipientsForCustomer(tenantId, invoice.customerId, recipientType);
            }
            if ((event === 'PROPOSAL_CREATED' || event === 'PROPOSAL_UPDATED') &&
                context.proposalId) {
                const proposal = await this.prisma.proposal.findFirst({
                    where: { id: context.proposalId, tenantId },
                    include: {
                        customer: { select: { id: true, name: true, phone: true } },
                    },
                });
                if (!proposal)
                    return { skipped: true, reason: 'PROPOSAL_NOT_FOUND' };
                referenceType = 'PROPOSAL';
                referenceId = proposal.id;
                variables = {
                    proposalTitle: proposal.title,
                    status: proposal.status,
                    customerName: proposal.customer?.name ?? '',
                };
                phones =
                    recipientType === 'CUSTOMER_PHONE' && proposal.customer?.phone
                        ? [proposal.customer.phone]
                        : await this.resolveRecipientsForCustomer(tenantId, proposal.customerId, recipientType);
            }
            const uniquePhones = Array.from(new Set(phones.map((p) => String(p).trim()).filter(Boolean)));
            if (uniquePhones.length === 0)
                return { skipped: true, reason: 'NO_RECIPIENT' };
            const message = this.renderTemplate(template.content, variables);
            if (!message || message.trim().length === 0) {
                return { skipped: true, reason: 'EMPTY_MESSAGE' };
            }
            const results = [];
            for (const to of uniquePhones) {
                try {
                    const r = await this.sendViaProvider(tenantId, provider, to, message);
                    results.push({
                        to,
                        ok: true,
                        providerMessageId: r.providerMessageId,
                    });
                    try {
                        await this.prisma.smsLog.create({
                            data: {
                                tenantId,
                                provider,
                                event,
                                to,
                                message,
                                status: 'SUCCESS',
                                providerMessageId: r.providerMessageId,
                                referenceType,
                                referenceId,
                            },
                        });
                    }
                    catch (logErr) {
                        if (!this.isNoSuchTableError(logErr)) {
                            this.logger.error('SMS log yazılamadı', logErr);
                        }
                    }
                }
                catch (err) {
                    results.push({ to, ok: false, error: String(err?.message || err) });
                    try {
                        await this.prisma.smsLog.create({
                            data: {
                                tenantId,
                                provider,
                                event,
                                to,
                                message,
                                status: 'FAILED',
                                error: String(err?.message || err),
                                referenceType,
                                referenceId,
                            },
                        });
                    }
                    catch (logErr) {
                        if (!this.isNoSuchTableError(logErr)) {
                            this.logger.error('SMS log yazılamadı', logErr);
                        }
                    }
                }
            }
            return { sent: results.filter((r) => r.ok).length, results };
        }
        catch (error) {
            if (this.isNoSuchTableError(error))
                return { skipped: true, reason: 'DB_NOT_READY' };
            this.logger.error(`SMS event send error (${event})`, error);
            return { skipped: true, reason: 'ERROR' };
        }
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        vatansms_service_1.VatansmsService,
        netgsm_service_1.NetgsmService])
], SmsService);
//# sourceMappingURL=sms.service.js.map