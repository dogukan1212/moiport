import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SocialMediaService {
  private readonly logger = new Logger(SocialMediaService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    tenantId: string,
    data: {
      content: string;
      type: string;
      customerId: string;
      platform?: string;
    },
  ) {
    return this.prisma.socialMediaPost.create({
      data: {
        content: data.content,
        type: data.type,
        platform: data.platform || 'INSTAGRAM',
        customerId: data.customerId,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string, customerId?: string) {
    return this.prisma.socialMediaPost.findMany({
      where: {
        tenantId,
        ...(customerId ? { customerId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { name: true },
        },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const post = await this.prisma.socialMediaPost.findFirst({
      where: { id, tenantId },
    });
    if (!post) throw new NotFoundException('İçerik bulunamadı.');
    return post;
  }

  async update(
    tenantId: string,
    id: string,
    data: {
      content?: string;
      status?: string;
      platform?: string;
    },
  ) {
    const post = await this.findOne(tenantId, id);
    return this.prisma.socialMediaPost.update({
      where: { id: post.id },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    const post = await this.findOne(tenantId, id);
    return this.prisma.socialMediaPost.delete({
      where: { id: post.id },
    });
  }

  // --- Plans ---

  async createPlan(tenantId: string, data: any) {
    const plan = await this.prisma.socialMediaPlan.create({
      data: {
        ...data,
        tenantId,
      },
    });

    // Notify Assignees
    await this.notifyAssignees(tenantId, plan);

    return plan;
  }

  async findAllPlans(tenantId: string, customerId?: string) {
    return this.prisma.socialMediaPlan.findMany({
      where: {
        tenantId,
        ...(customerId ? { customerId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true } },
        socialMediaManagerUser: {
          select: { id: true, name: true, avatar: true },
        },
        designerUser: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async findOnePlan(tenantId: string, id: string, user?: any) {
    const plan = await this.prisma.socialMediaPlan.findFirst({
      where: {
        id,
        tenantId,
        ...(user?.role === 'CLIENT' && user?.customerId
          ? { customerId: user.customerId }
          : {}),
      },
      include: {
        customer: { select: { id: true, name: true } },
        socialMediaManagerUser: {
          select: { id: true, name: true, avatar: true },
        },
        designerUser: { select: { id: true, name: true, avatar: true } },
      },
    });
    if (!plan) throw new NotFoundException('Plan bulunamadı.');
    return plan;
  }

  async updatePlan(tenantId: string, id: string, data: any) {
    const oldPlan = await this.findOnePlan(tenantId, id);
    const plan = await this.prisma.socialMediaPlan.update({
      where: { id },
      data,
    });

    // Check for changes and notify
    if (
      data.socialMediaManagerId &&
      data.socialMediaManagerId !== oldPlan.socialMediaManagerId
    ) {
      await this.notificationsService.create(tenantId, {
        userId: data.socialMediaManagerId,
        title: 'Yeni Görev Ataması',
        message: `${plan.brandName || 'Bir plan'} için Sosyal Medya Yöneticisi olarak atandınız.`,
        type: 'PLAN_ASSIGNMENT',
        referenceId: plan.id,
        referenceType: 'SOCIAL_MEDIA_PLAN',
      });
    }

    if (data.designerId && data.designerId !== oldPlan.designerId) {
      await this.notificationsService.create(tenantId, {
        userId: data.designerId,
        title: 'Yeni Görev Ataması',
        message: `${plan.brandName || 'Bir plan'} için Tasarımcı olarak atandınız.`,
        type: 'PLAN_ASSIGNMENT',
        referenceId: plan.id,
        referenceType: 'SOCIAL_MEDIA_PLAN',
      });
    }

    return plan;
  }

  async removePlan(tenantId: string, id: string) {
    await this.findOnePlan(tenantId, id);
    return this.prisma.socialMediaPlan.delete({
      where: { id },
    });
  }

  private async notifyAssignees(tenantId: string, plan: any) {
    if (plan.socialMediaManagerId) {
      await this.notificationsService.create(tenantId, {
        userId: plan.socialMediaManagerId,
        title: 'Yeni Görev Ataması',
        message: `${plan.brandName || 'Bir plan'} için Sosyal Medya Yöneticisi olarak atandınız.`,
        type: 'PLAN_ASSIGNMENT',
        referenceId: plan.id,
        referenceType: 'SOCIAL_MEDIA_PLAN',
      });
    }
    if (plan.designerId) {
      await this.notificationsService.create(tenantId, {
        userId: plan.designerId,
        title: 'Yeni Görev Ataması',
        message: `${plan.brandName || 'Bir plan'} için Tasarımcı olarak atandınız.`,
        type: 'PLAN_ASSIGNMENT',
        referenceId: plan.id,
        referenceType: 'SOCIAL_MEDIA_PLAN',
      });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleCron() {
    this.logger.debug('Running Social Media Plan Deadlines Check...');

    // Find plans where deadlines are approaching or overdue
    const plans = await this.prisma.socialMediaPlan.findMany({
      where: {
        OR: [
          { briefStatus: { not: 'Tamamlandı' } },
          { designStatus: { not: 'Tamamlandı' } },
        ],
      },
    });

    for (const plan of plans) {
      // Check Brief Deadline
      if (plan.briefDeadline && plan.briefStatus !== 'Tamamlandı') {
        await this.checkAndNotifyDeadline(
          plan,
          plan.briefDeadline,
          'Brief',
          plan.socialMediaManagerId,
        );
      }

      // Check Presentation Deadline
      if (plan.presentationDeadline && plan.designStatus !== 'Tamamlandı') {
        await this.checkAndNotifyDeadline(
          plan,
          plan.presentationDeadline,
          'Sunum',
          plan.socialMediaManagerId,
        );
        await this.checkAndNotifyDeadline(
          plan,
          plan.presentationDeadline,
          'Sunum',
          plan.designerId,
        );
      }
    }
  }

  private async checkAndNotifyDeadline(
    plan: any,
    deadline: Date,
    type: string,
    userId: string | null,
  ) {
    if (!userId) return;
    const tenantId =
      typeof plan?.tenantId === 'string'
        ? plan.tenantId
        : String(plan?.tenantId ?? '');
    if (!tenantId) return;

    const now = new Date();
    const d = new Date(deadline);
    const diffTime = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      await this.notificationsService.create(tenantId, {
        userId,
        title: `${type} Teslim Tarihi Yaklaşıyor`,
        message: `${plan.brandName} için ${type} teslimine 1 gün kaldı!`,
        type: 'PLAN_REMINDER',
        referenceId: plan.id,
        referenceType: 'SOCIAL_MEDIA_PLAN',
      });
    } else if (diffDays === 0) {
      await this.notificationsService.create(tenantId, {
        userId,
        title: `${type} Teslim Tarihi Bugün`,
        message: `${plan.brandName} için ${type} teslimi bugün!`,
        type: 'PLAN_REMINDER',
        referenceId: plan.id,
        referenceType: 'SOCIAL_MEDIA_PLAN',
      });
    } else if (diffDays === -1) {
      await this.notificationsService.create(tenantId, {
        userId,
        title: `${type} Teslim Tarihi Geçti`,
        message: `${plan.brandName} için ${type} teslim tarihi dün doldu!`,
        type: 'PLAN_OVERDUE',
        referenceId: plan.id,
        referenceType: 'SOCIAL_MEDIA_PLAN',
      });
    }
  }
}
