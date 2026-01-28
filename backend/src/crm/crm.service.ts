import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { CrmGateway } from './crm.gateway';

@Injectable()
export class CrmService {
  constructor(
    private prisma: PrismaService,
    @Optional() private readonly notificationsService?: NotificationsService,
    @Optional() private readonly crmGateway?: CrmGateway,
  ) {}

  // Pipelines
  async createPipeline(tenantId: string, data: CreatePipelineDto) {
    return this.prisma.pipeline.create({
      data: {
        ...data,
        tenantId,
        stages: {
          create: [
            { name: 'Yeni Aday', order: 1, color: '#3b82f6' },
            { name: 'İletişime Geçildi', order: 2, color: '#f59e0b' },
            { name: 'Teklif Gönderildi', order: 3, color: '#8b5cf6' },
            { name: 'Pazarlık', order: 4, color: '#ec4899' },
            { name: 'Kazandık', order: 5, color: '#10b981' },
            { name: 'Kaybettik', order: 6, color: '#ef4444' },
          ],
        },
      },
      include: {
        stages: {
          include: { leads: true },
        },
      },
    });
  }

  async findAllPipelines(tenantId: string, user: any) {
    const allowedFormIds = await this.getAllowedFormIds(tenantId, user);

    const where: any = { tenantId };
    if (user?.role === 'CLIENT' && user?.customerId) {
      where.customerId = user.customerId;
    }

    const pipelines = await this.prisma.pipeline.findMany({
      where,
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            leads: {
              where: {
                status: { not: 'WON' },
                ...(user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN'
                  ? {
                      OR: [
                        { assigneeId: user.id },
                        {
                          AND: [
                            { assigneeId: null },
                            ...(allowedFormIds !== null
                              ? [
                                  {
                                    OR: [
                                      { source: { not: 'FACEBOOK' } },
                                      {
                                        facebookFormId: { in: allowedFormIds },
                                      },
                                      { facebookFormId: null },
                                    ],
                                  },
                                ]
                              : []),
                          ],
                        },
                      ],
                    }
                  : {}),
              },
              include: { assignee: true },
              orderBy: { updatedAt: 'desc' },
            },
          },
        },
      },
    });

    if (pipelines.length === 0 && user?.role !== 'CLIENT') {
      const defaultPipeline = await this.createPipeline(tenantId, {
        name: 'Genel Satış Süreci',
      });
      return [defaultPipeline];
    }

    return pipelines;
  }

  async findPipeline(tenantId: string, id: string, user: any) {
    const allowedFormIds = await this.getAllowedFormIds(tenantId, user);

    const where: any = { id, tenantId };
    if (user?.role === 'CLIENT' && user?.customerId) {
      where.customerId = user.customerId;
    }

    return this.prisma.pipeline.findFirst({
      where,
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            leads: {
              where: {
                ...(user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN'
                  ? {
                      OR: [
                        { assigneeId: user.id },
                        {
                          AND: [
                            { assigneeId: null },
                            ...(allowedFormIds !== null
                              ? [
                                  {
                                    OR: [
                                      { source: { not: 'FACEBOOK' } },
                                      {
                                        facebookFormId: { in: allowedFormIds },
                                      },
                                      { facebookFormId: null },
                                    ],
                                  },
                                ]
                              : []),
                          ],
                        },
                      ],
                    }
                  : {}),
              },
              include: { assignee: true },
            },
          },
        },
      },
    });
  }

  async deletePipeline(tenantId: string, id: string) {
    // Delete stages and leads will be handled by DB cascade if configured,
    // but let's be explicit or check if cascade is in schema.prisma
    return this.prisma.pipeline.delete({
      where: { id },
    });
  }

  // Stages
  async createStage(
    tenantId: string,
    pipelineId: string,
    data: { name: string; color?: string; order?: number },
  ) {
    const lastStage = await this.prisma.stage.findFirst({
      where: { pipelineId },
      orderBy: { order: 'desc' },
    });

    return this.prisma.stage.create({
      data: {
        ...data,
        pipelineId,
        order: data.order ?? (lastStage ? lastStage.order + 1 : 1),
      },
    });
  }

  async updateStage(
    tenantId: string,
    id: string,
    data: { name?: string; color?: string; order?: number },
  ) {
    return this.prisma.stage.update({
      where: { id },
      data,
    });
  }

  async deleteStage(tenantId: string, id: string) {
    return this.prisma.stage.delete({
      where: { id },
    });
  }

  // Leads
  async createLead(tenantId: string, data: CreateLeadDto) {
    // Calculate initial score
    let score = data.score || 0;
    if (data.email) score += 10;
    if (data.phone) score += 10;
    if (data.company) score += 5;
    if (data.source && data.source !== 'OTHER') score += 5;

    const createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
    const lead = await this.prisma.lead.create({
      data: {
        ...data,
        score,
        tenantId,
        ...(createdAt ? { createdAt, updatedAt: createdAt } : {}),
      },
      include: { stage: true, pipeline: true, assignee: true },
    });

    this.crmGateway?.emitLeadCreated(tenantId, lead);
    return lead;
  }

  async findAllLeads(tenantId: string, user: any, pipelineId?: string) {
    // Temporary: Recalculate scores on fetch to fix existing data
    await this.recalculateLeadScores(tenantId);

    const allowedFormIds = await this.getAllowedFormIds(tenantId, user);

    const andConditions: any[] = [{ tenantId }];

    if (pipelineId) {
      andConditions.push({ pipelineId });
    }

    if (user?.role !== 'ADMIN') {
      const accessConditions: any[] = [{ assigneeId: user.id }];

      const formConditions: any[] = [{ assigneeId: null }];

      if (allowedFormIds !== null) {
        formConditions.push({
          OR: [
            { source: { not: 'FACEBOOK' } },
            { facebookFormId: { in: allowedFormIds } },
            { facebookFormId: null },
          ],
        });
      }

      accessConditions.push({ AND: formConditions });
      andConditions.push({ OR: accessConditions });
    }

    if (user?.role === 'CLIENT' && user?.customerId) {
      andConditions.push({
        OR: [
          { pipeline: { customerId: user.customerId } },
          { customerId: user.customerId },
        ],
      });
    }

    const where: any = { AND: andConditions };

    return this.prisma.lead.findMany({
      where,
      include: { stage: true, pipeline: true, assignee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findWhatsappConversations(
    tenantId: string,
    user: any,
    includeArchived?: boolean,
  ) {
    const allowedFormIds = await this.getAllowedFormIds(tenantId, user);

    const andConditions: any[] = [{ tenantId }];
    if (includeArchived) {
      andConditions.push({
        activities: {
          some: {
            type: { in: ['WHATSAPP_IN', 'WHATSAPP_OUT'] },
          },
        },
      });
    } else {
      andConditions.push({
        activities: {
          some: {
            type: { in: ['WHATSAPP_IN', 'WHATSAPP_OUT'] },
            status: { not: 'ARCHIVED' },
          },
        },
      });
    }

    if (user?.role !== 'ADMIN') {
      const accessConditions: any[] = [{ assigneeId: user.id }];

      const formConditions: any[] = [{ assigneeId: null }];

      if (allowedFormIds !== null) {
        formConditions.push({
          OR: [
            { source: { not: 'FACEBOOK' } },
            { facebookFormId: { in: allowedFormIds } },
            { facebookFormId: null },
          ],
        });
      }

      accessConditions.push({ AND: formConditions });
      andConditions.push({ OR: accessConditions });
    }

    if (user?.role === 'CLIENT' && user?.customerId) {
      andConditions.push({
        OR: [
          { pipeline: { customerId: user.customerId } },
          { customerId: user.customerId },
        ],
      });
    }

    const where: any = { AND: andConditions };

    console.log(
      '[findWhatsappConversations] User:',
      JSON.stringify(user, null, 2),
    );
    console.log(
      '[findWhatsappConversations] Where:',
      JSON.stringify(where, null, 2),
    );

    const leads = await this.prisma.lead.findMany({
      where,
      include: {
        stage: true,
        pipeline: true,
        assignee: true,
        activities: {
          where: includeArchived
            ? {
                type: { in: ['WHATSAPP_IN', 'WHATSAPP_OUT'] },
              }
            : {
                type: { in: ['WHATSAPP_IN', 'WHATSAPP_OUT'] },
                status: { not: 'ARCHIVED' },
              },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return leads.map((lead: any) => {
      const whatsappActivities = lead.activities || [];
      const lastWhatsappActivity =
        whatsappActivities.length > 0
          ? whatsappActivities[whatsappActivities.length - 1]
          : null;

      const hasNewMessage =
        lastWhatsappActivity && lastWhatsappActivity.type === 'WHATSAPP_IN';

      const isWhatsappArchived =
        whatsappActivities.length > 0 &&
        whatsappActivities.every((a: any) => a.status === 'ARCHIVED');

      return {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        stage: lead.stage,
        pipeline: lead.pipeline,
        assignee: lead.assignee,
        lastWhatsappActivity,
        hasNewMessage,
        isWhatsappArchived,
      };
    });
  }

  private async getAllowedFormIds(
    tenantId: string,
    user: any,
  ): Promise<string[] | null> {
    if (user.role === 'ADMIN') return null;

    const mappings = await this.prisma.facebookLeadMapping.findMany({
      where: { config: { tenantId } },
    });

    const allowedFormIds: string[] = [];
    for (const mapping of mappings) {
      if (!mapping.assignedUserIds) {
        // No assignment means everyone can see
        if (mapping.facebookFormId) allowedFormIds.push(mapping.facebookFormId);
        continue;
      }

      try {
        const assignedIds = JSON.parse(mapping.assignedUserIds);
        if (assignedIds.length === 0 || assignedIds.includes(user.id)) {
          if (mapping.facebookFormId)
            allowedFormIds.push(mapping.facebookFormId);
        }
      } catch {
        // If JSON parse fails, assume everyone can see as fallback
        if (mapping.facebookFormId) allowedFormIds.push(mapping.facebookFormId);
      }
    }
    return allowedFormIds;
  }

  async findLead(tenantId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
      include: {
        stage: true,
        assignee: true,
        pipeline: {
          include: {
            stages: true,
          },
        },
        activities: {
          include: { user: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    console.log('Backend findLead debug:', {
      leadId: id,
      hasActivities: !!lead?.activities,
      activitiesCount: lead?.activities?.length,
      activities: lead?.activities,
      reminderActivities: lead?.activities?.filter(
        (a: any) => a.type === 'REMINDER',
      ),
      reminderActivitiesCount: lead?.activities?.filter(
        (a: any) => a.type === 'REMINDER',
      ).length,
    });

    return lead;
  }

  async updateLead(tenantId: string, id: string, data: any) {
    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        ...data,
      },
      include: { stage: true, pipeline: true, assignee: true },
    });

    this.crmGateway?.emitLeadUpdated(tenantId, lead);
    return lead;
  }

  async moveLead(tenantId: string, leadId: string, stageId: string) {
    const lead = await this.prisma.lead.update({
      where: { id: leadId },
      data: { stageId },
      include: { stage: true, pipeline: true, assignee: true },
    });

    this.crmGateway?.emitLeadMoved(tenantId, lead);
    return lead;
  }

  async deleteLead(tenantId: string, id: string) {
    await this.prisma.lead.delete({
      where: { id },
    });
    this.crmGateway?.emitLeadDeleted(tenantId, id);
    return { id };
  }

  async setWhatsappConversationArchived(
    tenantId: string,
    leadId: string,
    archived: boolean,
  ) {
    if (archived) {
      await this.prisma.crmActivity.updateMany({
        where: {
          tenantId,
          leadId,
          type: { in: ['WHATSAPP_IN', 'WHATSAPP_OUT'] },
        },
        data: { status: 'ARCHIVED' },
      });
    } else {
      const activities = await this.prisma.crmActivity.findMany({
        where: {
          tenantId,
          leadId,
          type: { in: ['WHATSAPP_IN', 'WHATSAPP_OUT'] },
        },
        orderBy: { createdAt: 'asc' },
      });
      const toDeliveredIds = activities
        .filter((a: any) => a.type === 'WHATSAPP_IN')
        .map((a: any) => a.id);
      const toSentIds = activities
        .filter((a: any) => a.type === 'WHATSAPP_OUT')
        .map((a: any) => a.id);
      if (toDeliveredIds.length > 0) {
        await this.prisma.crmActivity.updateMany({
          where: { id: { in: toDeliveredIds } },
          data: { status: 'DELIVERED' },
        });
      }
      if (toSentIds.length > 0) {
        await this.prisma.crmActivity.updateMany({
          where: { id: { in: toSentIds } },
          data: { status: 'SENT' },
        });
      }
    }
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { stage: true, pipeline: true, assignee: true },
    });
    this.crmGateway?.emitLeadUpdated(tenantId, lead);
    return lead;
  }

  async assignLead(
    tenantId: string,
    leadId: string,
    assigneeId: string | null,
  ) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      select: { id: true },
    });

    if (!lead) {
      throw new NotFoundException('Lead bulunamadı.');
    }

    if (assigneeId) {
      const assignee = await this.prisma.user.findFirst({
        where: { id: assigneeId, tenantId, isActive: true },
        select: { id: true },
      });

      if (!assignee) {
        throw new BadRequestException('Atanacak kullanıcı bulunamadı.');
      }
    }

    const updatedLead = await this.prisma.lead.update({
      where: { id: leadId },
      data: { assigneeId: assigneeId || null },
      include: { stage: true, pipeline: true, assignee: true },
    });

    this.crmGateway?.emitLeadUpdated(tenantId, updatedLead);
    return updatedLead;
  }

  // Activities
  async addActivity(
    tenantId: string,
    leadId: string,
    userId: string | null,
    data: {
      type: string;
      content: string;
      reminderDate?: string;
      status?: string;
      externalId?: string;
      createdAt?: string;
    },
  ) {
    const createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
    const activity = await this.prisma.crmActivity.create({
      data: {
        type: data.type,
        content: data.content,
        reminderDate: data.reminderDate ? new Date(data.reminderDate) : null,
        leadId,
        userId: userId || undefined,
        tenantId,
        status: data.status,
        externalId: data.externalId,
        ...(createdAt ? { createdAt } : {}),
      },
    });

    // Update lead score based on activity type
    let scoreIncrement = 0;
    switch (data.type) {
      case 'MEETING':
        scoreIncrement = 20;
        break;
      case 'CALL':
        scoreIncrement = 15;
        break;
      case 'EMAIL':
        scoreIncrement = 10;
        break;
      case 'NOTE':
        scoreIncrement = 5;
        break;
      default:
        scoreIncrement = 5;
    }

    await this.prisma.lead.update({
      where: { id: leadId },
      data: { score: { increment: scoreIncrement } },
    });

    // Create notification for reminders
    if (data.type === 'REMINDER' && userId && this.notificationsService) {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        select: { name: true },
      });

      if (lead) {
        await this.notificationsService.create(tenantId, {
          userId,
          title: 'Hatırlatma Oluşturuldu',
          message: `${lead.name} için hatırlatma oluşturuldu: ${data.content}`,
          type: 'CRM_REMINDER_CREATED',
          referenceId: activity.id,
          referenceType: 'CRM_ACTIVITY',
        });
      }
    }

    if (data.type === 'WHATSAPP_IN' || data.type === 'WHATSAPP_OUT') {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: { stage: true, pipeline: true },
      });

      this.crmGateway?.emitWhatsappMessage(tenantId, {
        leadId,
        activity,
        lead,
      });
    }

    return activity;
  }

  async updateActivity(
    tenantId: string,
    id: string,
    data: { status?: string; content?: string },
  ) {
    const activity = await this.prisma.crmActivity.update({
      where: { id },
      data: {
        status: data.status,
        content: data.content,
      },
    });

    const lead = await this.prisma.lead.findUnique({
      where: { id: activity.leadId },
      include: { stage: true, pipeline: true },
    });

    if (activity.type === 'WHATSAPP_IN' || activity.type === 'WHATSAPP_OUT') {
      this.crmGateway?.emitWhatsappMessage(tenantId, {
        leadId: activity.leadId,
        activity,
        lead,
      });
    }

    return activity;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkReminders() {
    if (!this.notificationsService) {
      console.log(
        '[CRM Service] Notifications service not available for reminders',
      );
      return;
    }

    const now = new Date();
    // Add a 5-second buffer to catch reminders that might be exactly on the minute
    const searchLimit = new Date(now.getTime() + 5000);

    console.log(`[CRM Service] Checking reminders at ${now.toISOString()}`);

    // Find reminders that are due and not sent
    const reminders = await this.prisma.crmActivity.findMany({
      where: {
        type: 'REMINDER',
        reminderDate: {
          lte: searchLimit,
        },
        isReminderSent: false,
      },
      include: {
        lead: true,
      },
    });

    if (reminders.length > 0) {
      console.log(`[CRM Service] Found ${reminders.length} due reminders`);
    }

    for (const reminder of reminders) {
      let targetUserId = reminder.userId;

      if (!targetUserId) {
        console.log(
          `[CRM Service] Reminder ${reminder.id} has no userId, looking for an admin...`,
        );
        // Fallback: find first active admin of the tenant
        const admin = await this.prisma.user.findFirst({
          where: { tenantId: reminder.tenantId, role: 'ADMIN', isActive: true },
          select: { id: true },
        });

        if (admin) {
          targetUserId = admin.id;
          console.log(
            `[CRM Service] Fallback to admin ${admin.id} for reminder ${reminder.id}`,
          );
        } else {
          console.log(
            `[CRM Service] No admin found for tenant ${reminder.tenantId}, skipping reminder ${reminder.id}`,
          );
          continue;
        }
      }

      try {
        await this.notificationsService.create(reminder.tenantId, {
          userId: targetUserId,
          title: 'Hatırlatma',
          message: `${reminder.lead.name} için hatırlatma: ${reminder.content}`,
          type: 'CRM_REMINDER',
          referenceId: reminder.leadId,
          referenceType: 'LEAD',
        });

        await this.prisma.crmActivity.update({
          where: { id: reminder.id },
          data: { isReminderSent: true },
        });

        console.log(
          `[CRM Service] Reminder sent successfully for lead: ${reminder.lead.name}`,
        );
      } catch (error) {
        console.error(
          `[CRM Service] Error sending reminder ${reminder.id}:`,
          error,
        );
      }
    }
  }

  // Conversion
  async convertToCustomer(tenantId: string, leadId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Create customer
    const customer = await this.prisma.customer.create({
      data: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        tenantId,
      },
    });

    // Update lead
    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'WON',
        customerId: customer.id,
      },
    });

    return customer;
  }

  // Recalculate Scores
  async recalculateLeadScores(tenantId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { tenantId },
      include: { activities: true },
    });

    let updatedCount = 0;

    for (const lead of leads) {
      let score = 0;

      // Basic info score
      if (lead.email) score += 10;
      if (lead.phone) score += 10;
      if (lead.company) score += 5;
      if (lead.source && lead.source !== 'OTHER') score += 5;

      // Activity score
      if (lead.activities) {
        for (const activity of lead.activities) {
          switch (activity.type) {
            case 'MEETING':
              score += 20;
              break;
            case 'CALL':
              score += 15;
              break;
            case 'EMAIL':
              score += 10;
              break;
            case 'NOTE':
              score += 5;
              break;
            default:
              score += 5;
          }
        }
      }

      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { score },
      });
      updatedCount++;
    }

    return { message: `${updatedCount} leads updated successfully` };
  }
}
