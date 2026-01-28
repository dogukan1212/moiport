import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async create(
    tenantId: string,
    data: {
      userId: string;
      title: string;
      message: string;
      type: string;
      referenceId?: string;
      referenceType?: string;
    },
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        tenantId,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
      },
    });

    // Send real-time notification
    this.gateway.sendNotification(data.userId, notification);

    return notification;
  }

  async findAll(tenantId: string, userId: string, limit: number = 20) {
    return this.prisma.notification.findMany({
      where: {
        tenantId,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getUnreadCount(tenantId: string, userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        tenantId,
        userId,
        isRead: false,
      },
    });
    return { count };
  }

  async markAsRead(tenantId: string, userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: {
        id,
        tenantId,
        userId,
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(tenantId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        tenantId,
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }
}
