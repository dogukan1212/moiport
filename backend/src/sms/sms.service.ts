import {
  BadRequestException,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VatansmsService } from '../integrations/vatansms/vatansms.service';
import { NetgsmService } from '../integrations/netgsm/netgsm.service';

type SmsProvider = 'VATANSMS' | 'NETGSM';

type SmsEvent =
  | 'TASK_COMPLETED'
  | 'INVOICE_CREATED'
  | 'INVOICE_REMINDER'
  | 'INVOICE_OVERDUE'
  | 'PROPOSAL_CREATED'
  | 'PROPOSAL_UPDATED';

type SmsRecipientType =
  | 'TASK_ASSIGNEE'
  | 'TASK_WATCHERS'
  | 'CUSTOMER_PHONE'
  | 'CUSTOMER_USERS';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly vatansmsService?: VatansmsService,
    @Optional() private readonly netgsmService?: NetgsmService,
  ) {}

  private isNoSuchTableError(error: any) {
    return String(error?.message || '')
      .toLowerCase()
      .includes('no such table');
  }

  private renderTemplate(content: string, variables: Record<string, any>) {
    const str = String(content ?? '');
    return str.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
      const val = variables?.[key];
      if (val === undefined || val === null) return '';
      return String(val);
    });
  }

  private async ensureDefaults(tenantId: string) {
    try {
      const existingSettings = await this.prisma.smsSettings.findUnique({
        where: { tenantId },
      });
      if (!existingSettings) {
        await this.prisma.smsSettings.create({
          data: { tenantId, provider: 'VATANSMS', isActive: false },
        });
      }

      const templates: Array<{ key: string; title: string; content: string }> =
        [
          {
            key: 'TASK_COMPLETED_DEFAULT',
            title: 'Görev tamamlandı',
            content: '{taskTitle} görevi tamamlandı.',
          },
          {
            key: 'INVOICE_CREATED_DEFAULT',
            title: 'Fatura oluşturuldu',
            content:
              '{invoiceNumber} numaralı fatura oluşturuldu. Toplam: {totalAmount} {currency}. Vade: {dueDate}.',
          },
          {
            key: 'INVOICE_REMINDER_DEFAULT',
            title: 'Fatura hatırlatması',
            content:
              '{invoiceNumber} faturasının vadesi {dueDate} tarihinde. Ödeme: {paymentUrl}',
          },
          {
            key: 'INVOICE_OVERDUE_DEFAULT',
            title: 'Gecikmiş fatura',
            content:
              '{invoiceNumber} faturasının vadesi geçti. Vade: {dueDate}.',
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

      const triggers: Array<{
        event: SmsEvent;
        recipientType: SmsRecipientType;
        templateKey: string;
      }> = [
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
    } catch (error: any) {
      if (this.isNoSuchTableError(error)) return;
      throw error;
    }
  }

  async getSettings(tenantId: string) {
    try {
      await this.ensureDefaults(tenantId);
      const s = await this.prisma.smsSettings.findUnique({
        where: { tenantId },
      });
      return (
        s || {
          tenantId,
          provider: 'VATANSMS',
          isActive: false,
          updatedAt: new Date(),
        }
      );
    } catch (error: any) {
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

  async updateSettings(
    tenantId: string,
    data: { provider?: SmsProvider; isActive?: boolean },
  ) {
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
          isActive:
            typeof data.isActive === 'boolean'
              ? data.isActive
              : existing.isActive,
        },
      });
    } catch (error: any) {
      if (this.isNoSuchTableError(error)) {
        throw new BadRequestException(
          'Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.',
        );
      }
      throw error;
    }
  }

  async listTemplates(tenantId: string) {
    try {
      await this.ensureDefaults(tenantId);
      return await this.prisma.smsTemplate.findMany({
        where: { tenantId },
        orderBy: [{ updatedAt: 'desc' }],
      });
    } catch (error: any) {
      if (this.isNoSuchTableError(error)) return [];
      throw error;
    }
  }

  async createTemplate(
    tenantId: string,
    data: { key: string; title: string; content: string; isActive?: boolean },
  ) {
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
    } catch (error: any) {
      if (this.isNoSuchTableError(error)) {
        throw new BadRequestException(
          'Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.',
        );
      }
      throw error;
    }
  }

  async updateTemplate(
    tenantId: string,
    id: string,
    data: {
      key?: string;
      title?: string;
      content?: string;
      isActive?: boolean;
    },
  ) {
    try {
      await this.ensureDefaults(tenantId);
      const existing = await this.prisma.smsTemplate.findFirst({
        where: { id, tenantId },
      });
      if (!existing) return null;
      return await this.prisma.smsTemplate.update({
        where: { id: existing.id },
        data: {
          key: data.key !== undefined ? String(data.key).trim() : existing.key,
          title:
            data.title !== undefined
              ? String(data.title).trim()
              : existing.title,
          content:
            data.content !== undefined
              ? String(data.content)
              : existing.content,
          isActive:
            typeof data.isActive === 'boolean'
              ? data.isActive
              : existing.isActive,
        },
      });
    } catch (error: any) {
      if (this.isNoSuchTableError(error)) {
        throw new BadRequestException(
          'Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.',
        );
      }
      throw error;
    }
  }

  async deleteTemplate(tenantId: string, id: string) {
    try {
      await this.ensureDefaults(tenantId);
      const existing = await this.prisma.smsTemplate.findFirst({
        where: { id, tenantId },
      });
      if (!existing) return null;
      return await this.prisma.smsTemplate.delete({
        where: { id: existing.id },
      });
    } catch (error: any) {
      if (this.isNoSuchTableError(error)) {
        throw new BadRequestException(
          'Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.',
        );
      }
      throw error;
    }
  }

  async listTriggers(tenantId: string) {
    try {
      await this.ensureDefaults(tenantId);
      return await this.prisma.smsTrigger.findMany({
        where: { tenantId },
        orderBy: [{ event: 'asc' }],
      });
    } catch (error: any) {
      if (this.isNoSuchTableError(error)) return [];
      throw error;
    }
  }

  async updateTrigger(
    tenantId: string,
    id: string,
    data: {
      enabled?: boolean;
      recipientType?: SmsRecipientType;
      templateKey?: string;
    },
  ) {
    try {
      await this.ensureDefaults(tenantId);
      const existing = await this.prisma.smsTrigger.findFirst({
        where: { id, tenantId },
      });
      if (!existing) return null;
      return await this.prisma.smsTrigger.update({
        where: { id: existing.id },
        data: {
          enabled:
            typeof data.enabled === 'boolean' ? data.enabled : existing.enabled,
          recipientType:
            data.recipientType !== undefined
              ? data.recipientType
              : (existing.recipientType as SmsRecipientType),
          templateKey:
            data.templateKey !== undefined
              ? data.templateKey
              : existing.templateKey,
        },
      });
    } catch (error: any) {
      if (this.isNoSuchTableError(error)) {
        throw new BadRequestException(
          'Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.',
        );
      }
      throw error;
    }
  }

  private async sendViaProvider(
    tenantId: string,
    provider: SmsProvider,
    to: string,
    message: string,
  ) {
    if (provider === 'VATANSMS') {
      if (!this.vatansmsService) {
        throw new BadRequestException('VatanSMS sağlayıcısı hazır değil');
      }
      const result = await this.vatansmsService.sendSms(tenantId, to, message);
      return {
        providerMessageId: String((result as any)?.id ?? '') || undefined,
      };
    }
    if (provider === 'NETGSM') {
      if (!this.netgsmService) {
        throw new BadRequestException('NetGSM sağlayıcısı hazır değil');
      }
      const result = await this.netgsmService.sendSms(tenantId, to, message);
      return {
        providerMessageId:
          String((result as any)?.bulkId ?? '') ||
          String((result as any)?.raw ?? '') ||
          undefined,
      };
    }
    throw new BadRequestException('SMS sağlayıcısı desteklenmiyor');
  }

  async sendManual(
    tenantId: string,
    data: {
      to: string;
      message?: string;
      templateKey?: string;
      variables?: Record<string, any>;
    },
  ) {
    const settings = await this.getSettings(tenantId);
    if (!settings.isActive) {
      throw new BadRequestException('SMS modülü aktif değil');
    }

    const to = String(data.to || '').trim();
    if (!to) {
      throw new BadRequestException('Telefon numarası zorunludur');
    }

    let message = String(data.message || '');
    if (data.templateKey) {
      const tpl = await this.prisma.smsTemplate.findFirst({
        where: { tenantId, key: data.templateKey, isActive: true },
      });
      if (!tpl) {
        throw new BadRequestException('Şablon bulunamadı');
      }
      message = this.renderTemplate(tpl.content, data.variables || {});
    }

    if (!message || message.trim().length === 0) {
      throw new BadRequestException('Mesaj içeriği zorunludur');
    }

    const provider = (settings.provider as SmsProvider) || 'VATANSMS';
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
      } catch (logErr) {
        if (!this.isNoSuchTableError(logErr)) {
          this.logger.error('SMS log yazılamadı', logErr);
        }
      }
      return { success: true, providerMessageId: r.providerMessageId };
    } catch (error: any) {
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
      } catch (logErr) {
        if (!this.isNoSuchTableError(logErr)) {
          this.logger.error('SMS log yazılamadı', logErr);
        }
      }
      throw error;
    }
  }

  private formatDateTr(date: Date) {
    try {
      return new Date(date).toLocaleDateString('tr-TR');
    } catch {
      return '';
    }
  }

  private async resolveRecipientsForCustomer(
    tenantId: string,
    customerId: string,
    recipientType: SmsRecipientType,
  ) {
    const phones = new Set<string>();
    if (recipientType === 'CUSTOMER_PHONE') {
      const c = await this.prisma.customer.findFirst({
        where: { id: customerId, tenantId },
        select: { phone: true },
      });
      if (c?.phone) phones.add(c.phone);
    }

    if (recipientType === 'CUSTOMER_USERS') {
      const users = await this.prisma.user.findMany({
        where: { tenantId, role: 'CLIENT', customerId },
        select: { phone: true },
      });
      for (const u of users) {
        if (u.phone) phones.add(u.phone);
      }
    }

    return Array.from(phones);
  }

  private async resolveTaskRecipients(
    tenantId: string,
    taskId: string,
    recipientType: SmsRecipientType,
    actorId?: string,
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, tenantId },
      include: {
        assignee: { select: { id: true, phone: true } },
        project: {
          select: { customerId: true, customer: { select: { phone: true } } },
        },
      },
    });
    if (!task) return [];

    if (recipientType === 'TASK_ASSIGNEE') {
      return task.assignee?.phone ? [task.assignee.phone] : [];
    }

    if (recipientType === 'TASK_WATCHERS') {
      const userIds: string[] = [];
      let members: unknown = [];
      try {
        members = task.members ? JSON.parse(task.members) : [];
      } catch {
        members = [];
      }
      if (Array.isArray(members)) userIds.push(...members.map(String));
      if (task.assigneeId && !userIds.includes(task.assigneeId)) {
        userIds.push(task.assigneeId);
      }
      const filtered = userIds.filter((id) => !actorId || id !== actorId);
      if (filtered.length === 0) return [];
      const users = await this.prisma.user.findMany({
        where: { id: { in: filtered }, tenantId },
        select: { phone: true },
      });
      return users.map((u) => u.phone).filter(Boolean) as string[];
    }

    if (recipientType === 'CUSTOMER_PHONE') {
      const phone = task.project?.customer?.phone;
      return phone ? [phone] : [];
    }

    if (recipientType === 'CUSTOMER_USERS') {
      const customerId = task.project?.customerId;
      if (!customerId) return [];
      return await this.resolveRecipientsForCustomer(
        tenantId,
        customerId,
        'CUSTOMER_USERS',
      );
    }

    return [];
  }

  async trySendEvent(
    tenantId: string,
    event: SmsEvent,
    context: {
      taskId?: string;
      invoiceId?: string;
      proposalId?: string;
      actorId?: string;
    },
  ) {
    try {
      await this.ensureDefaults(tenantId);
      const settings = await this.getSettings(tenantId);
      if (!settings.isActive)
        return { skipped: true, reason: 'MODULE_INACTIVE' };

      const trigger = await this.prisma.smsTrigger.findFirst({
        where: { tenantId, event, enabled: true },
      });
      if (!trigger) return { skipped: true, reason: 'TRIGGER_DISABLED' };

      const template = await this.prisma.smsTemplate.findFirst({
        where: { tenantId, key: trigger.templateKey, isActive: true },
      });
      if (!template) return { skipped: true, reason: 'TEMPLATE_MISSING' };

      const provider = (settings.provider as SmsProvider) || 'VATANSMS';
      const recipientType = trigger.recipientType as SmsRecipientType;

      let phones: string[] = [];
      let variables: Record<string, any> = {};
      let referenceType: string | undefined;
      let referenceId: string | undefined;

      if (event === 'TASK_COMPLETED' && context.taskId) {
        const task = await this.prisma.task.findFirst({
          where: { id: context.taskId, tenantId },
          select: { id: true, title: true, dueDate: true },
        });
        if (!task) return { skipped: true, reason: 'TASK_NOT_FOUND' };
        referenceType = 'TASK';
        referenceId = task.id;
        variables = {
          taskTitle: task.title,
          dueDate: task.dueDate ? this.formatDateTr(task.dueDate) : '',
        };
        phones = await this.resolveTaskRecipients(
          tenantId,
          context.taskId,
          recipientType,
          context.actorId,
        );
      }

      if (
        (event === 'INVOICE_CREATED' ||
          event === 'INVOICE_REMINDER' ||
          event === 'INVOICE_OVERDUE') &&
        context.invoiceId
      ) {
        const invoice = await this.prisma.invoice.findFirst({
          where: { id: context.invoiceId, tenantId },
          include: {
            customer: { select: { id: true, name: true, phone: true } },
          },
        });
        if (!invoice) return { skipped: true, reason: 'INVOICE_NOT_FOUND' };
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
            : await this.resolveRecipientsForCustomer(
                tenantId,
                invoice.customerId,
                recipientType,
              );
      }

      if (
        (event === 'PROPOSAL_CREATED' || event === 'PROPOSAL_UPDATED') &&
        context.proposalId
      ) {
        const proposal = await this.prisma.proposal.findFirst({
          where: { id: context.proposalId, tenantId },
          include: {
            customer: { select: { id: true, name: true, phone: true } },
          },
        });
        if (!proposal) return { skipped: true, reason: 'PROPOSAL_NOT_FOUND' };
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
            : await this.resolveRecipientsForCustomer(
                tenantId,
                proposal.customerId,
                recipientType,
              );
      }

      const uniquePhones = Array.from(
        new Set(phones.map((p) => String(p).trim()).filter(Boolean)),
      );
      if (uniquePhones.length === 0)
        return { skipped: true, reason: 'NO_RECIPIENT' };

      const message = this.renderTemplate(template.content, variables);
      if (!message || message.trim().length === 0) {
        return { skipped: true, reason: 'EMPTY_MESSAGE' };
      }

      const results: any[] = [];
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
          } catch (logErr) {
            if (!this.isNoSuchTableError(logErr)) {
              this.logger.error('SMS log yazılamadı', logErr);
            }
          }
        } catch (err: any) {
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
          } catch (logErr) {
            if (!this.isNoSuchTableError(logErr)) {
              this.logger.error('SMS log yazılamadı', logErr);
            }
          }
        }
      }

      return { sent: results.filter((r) => r.ok).length, results };
    } catch (error: any) {
      if (this.isNoSuchTableError(error))
        return { skipped: true, reason: 'DB_NOT_READY' };
      this.logger.error(`SMS event send error (${event})`, error);
      return { skipped: true, reason: 'ERROR' };
    }
  }
}
