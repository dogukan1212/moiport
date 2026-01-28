import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';
import { NotificationsService } from '../notifications/notifications.service';

import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private chatService: ChatService,
    private tasksService: TasksService,
    @Optional() private notificationsService?: NotificationsService,
  ) {}

  async findAll(tenantId: string, user?: any, customerId?: string) {
    const where: any = { tenantId };
    if (user?.role === 'CLIENT' && user?.customerId) {
      where.customerId = user.customerId;
    } else if (customerId) {
      where.customerId = customerId;
    }

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });
    const ids = projects.map((p) => p.id);
    if (ids.length === 0) return projects;
    const grouped = await this.prisma.task.groupBy({
      by: ['projectId', 'status'],
      where: {
        tenantId,
        projectId: { in: ids },
      },
      _count: { _all: true },
    });
    const map = new Map<string, any>();
    for (const g of grouped) {
      if (!g.projectId) continue;
      const prev = map.get(g.projectId) || {
        TODO: 0,
        IN_PROGRESS: 0,
        REVIEW: 0,
        DONE: 0,
      };
      const key = String(g.status || '');
      prev[key] = (prev[key] || 0) + (g._count as any)._all;
      map.set(g.projectId, prev);
    }
    return projects.map((p) => ({
      ...p,
      tasksByStatus: map.get(p.id) || {
        TODO: 0,
        IN_PROGRESS: 0,
        REVIEW: 0,
        DONE: 0,
      },
    }));
  }

  async findOne(id: string, tenantId: string, user?: any) {
    const where: any = { id, tenantId };
    if (user?.role === 'CLIENT' && user?.customerId) {
      where.customerId = user.customerId;
    }

    return this.prisma.project.findFirst({
      where,
      include: {
        customer: true,
        tasks: {
          include: {
            assignee: true,
          },
        },
      },
    });
  }

  async create(tenantId: string, data: any, user?: any) {
    const project = await this.prisma.project.create({
      data: {
        ...data,
        tenantId,
      },
    });

    try {
      if (project.customerId) {
        const customer = await this.prisma.customer.findFirst({
          where: { id: project.customerId, tenantId },
          select: { id: true, name: true },
        });
        const mirrorGroupId =
          (global as any).crypto?.randomUUID?.() ||
          `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const checklist: any[] = []; // Removed default items
        const checklistStr = JSON.stringify(checklist);
        // Agency side task in first column (BRANDS if present, else TODO)
        const agencyTitle = `${customer?.name || 'Müşteri'} ${project.name}`;
        await this.prisma.task.create({
          data: {
            tenantId,
            projectId: project.id,
            title: agencyTitle,
            status: 'BRANDS',
            order: 1024,
            checklist: checklistStr,
            checklistTotal: checklist.length,
            checklistCompleted: 0,
            mirrorGroupId,
          },
        });
        // Client side task in TODO
        await this.prisma.task.create({
          data: {
            tenantId,
            projectId: project.id,
            title: project.name,
            status: 'TODO',
            order: 1024,
            checklist: checklistStr,
            checklistTotal: checklist.length,
            checklistCompleted: 0,
            mirrorGroupId,
          },
        });
      }
    } catch (e) {
      console.error('[ProjectsService] auto task create failed', e);
    }

    // Notify admins
    if (this.notificationsService) {
      const admins = await this.prisma.user.findMany({
        where: { tenantId, role: 'ADMIN', isActive: true },
        select: { id: true },
      });
      for (const admin of admins) {
        // Avoid notifying self if the creator is an admin (user info not passed fully yet, but we can skip if we want)
        // For now, notify all admins
        await this.notificationsService.create(tenantId, {
          userId: admin.id,
          title: 'Yeni Proje Oluşturuldu',
          message: `${project.name} adlı proje oluşturuldu.`,
          type: 'PROJECT_CREATED',
          referenceId: project.id,
          referenceType: 'PROJECT',
        });
      }
    }

    // Auto create chat room
    try {
      const base = (project.name || '').toLowerCase().trim();
      const slug = base
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const roomName = `prj-${slug}`;
      await this.chatService.createRoom(tenantId, user, {
        name: roomName,
        type: 'PROJECT',
        projectId: project.id,
        isPrivate: true,
      });
    } catch (e) {
      void e;
    }
    return project;
  }

  async update(id: string, tenantId: string, data: any) {
    return this.prisma.project.update({
      where: { id, tenantId },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    // Proje silinmeden önce görevlerini arşive taşı ve proje bağlantısını kopar
    await this.tasksService.archiveTasksByProject(tenantId, id);

    return this.prisma.project.delete({
      where: { id, tenantId },
    });
  }
}
