import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksGateway } from './tasks.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    @Optional() private readonly tasksGateway?: TasksGateway,
    @Optional() private readonly notificationsService?: NotificationsService,
    @Optional() private readonly smsService?: SmsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleCron() {
    // Notify about due tasks
    if (!this.notificationsService) return;

    // Find tasks due today or tomorrow that are not completed
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Set time to end of day for range
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    const tasks = await this.prisma.task.findMany({
      where: {
        status: { not: 'DONE' },
        dueDate: {
          gte: startOfToday,
          lte: endOfTomorrow,
        },
        assigneeId: { not: null },
      },
      include: { assignee: true },
    });

    for (const task of tasks) {
      if (!task.assigneeId) continue;

      // Check if we already sent a notification today for this task
      const alreadySent = await this.prisma.notification.findFirst({
        where: {
          userId: task.assigneeId,
          type: 'TASK_DUE',
          referenceId: task.id,
          createdAt: {
            gte: startOfToday,
          },
        },
      });

      if (!alreadySent) {
        await this.notificationsService.create(task.tenantId, {
          userId: task.assigneeId,
          title: 'Görev Zamanı Yaklaşıyor',
          message: `${task.title} görevinin son tarihi yaklaşıyor (${task.dueDate?.toLocaleDateString('tr-TR')}).`,
          type: 'TASK_DUE',
          referenceId: task.id,
          referenceType: 'TASK',
        });
      }
    }
  }

  async findAll(tenantId: string, projectId?: string, user?: any) {
    const where: any = {
      tenantId,
      ...(projectId ? { projectId } : {}),
    };

    if (user?.role === 'CLIENT' && user?.customerId) {
      where.project = {
        customerId: user.customerId,
      };
    }

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: {
        order: 'asc',
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (user?.role !== 'CLIENT') {
      const uniqueTasks: typeof tasks = [];
      const mirrorGroups = new Map<string, typeof tasks>();

      for (const task of tasks) {
        if (!task.mirrorGroupId) {
          uniqueTasks.push(task);
        } else {
          const group = mirrorGroups.get(task.mirrorGroupId) || [];
          group.push(task);
          mirrorGroups.set(task.mirrorGroupId, group);
        }
      }

      for (const [_, groupTasks] of mirrorGroups) {
        if (groupTasks.length === 1) {
          uniqueTasks.push(groupTasks[0]);
        } else {
          // Prefer 'BRANDS' status, or fallback to the one with longer title (Agency title usually includes Customer Name)
          const preferred =
            groupTasks.find((t) => t.status === 'BRANDS') ||
            groupTasks.sort((a, b) => b.title.length - a.title.length)[0];
          uniqueTasks.push(preferred);
        }
      }

      return uniqueTasks
        .sort((a, b) => a.order - b.order)
        .map((task) => this.mapTask(task));
    }

    return tasks.map((task) => this.mapTask(task));
  }

  async findOne(id: string, tenantId: string, user?: any) {
    const where: any = { id, tenantId };
    if (user?.role === 'CLIENT' && user?.customerId) {
      where.project = {
        customerId: user.customerId,
      };
    }

    const task = await this.prisma.task.findFirst({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return task ? this.mapTask(task) : null;
  }

  async create(tenantId: string, data: any, user?: any) {
    const preparedData = this.prepareDataForSave(data);
    if (
      user?.role === 'CLIENT' &&
      user?.customerId &&
      (!preparedData.projectId || preparedData.projectId === null)
    ) {
      preparedData.status = 'BRANDS';
      const existing = await this.prisma.project.findFirst({
        where: { tenantId, customerId: user.customerId },
        select: { id: true, name: true },
      });
      let projectId = existing?.id || null;
      if (!projectId) {
        const created = await this.prisma.project.create({
          data: {
            tenantId,
            customerId: user.customerId,
            name: 'Genel',
            description: 'Müşteri görevleri',
            status: 'ACTIVE',
          },
        });
        projectId = created.id;
      }
      preparedData.projectId = projectId;
    }
    const task = await this.prisma.task.create({
      data: {
        ...preparedData,
        tenantId,
      },
    });
    const mapped = await this.getTaskForRealtime(task.id, tenantId);

    // Only emit event for this specific task
    // If it's a mirror task, we might want to be careful not to emit twice if we are creating both in a loop elsewhere?
    // But create() is atomic per task.
    // The issue is that frontend receives BOTH events and adds both.

    // If this task has a mirrorGroupId, we should check if we should emit it to everyone.
    // Agency users should only see ONE of the mirror tasks (preferably the Agency one).
    // Client users should only see the Client one.

    // Let's rely on frontend or gateway filtering?
    // Or we can attach a flag to the event.

    // Better: If I am an Agency User, and I receive an event for a task that has a mirrorGroupId.
    // If I already have a task with that mirrorGroupId, I should ignore/merge.
    // But create event implies a NEW task.

    // When ProjectsService creates 2 tasks:
    // 1. Agency Task (BRANDS) -> emit
    // 2. Client Task (TODO) -> emit

    // Frontend receives 2 'tasks:created' events.
    // It adds both to the list.
    // We need to stop this.

    // Solution:
    // If task is part of a mirror group, and status is 'TODO' (which usually means Client side in this context of auto-create),
    // maybe we shouldn't emit to Agency room if we already emitted the BRANDS one?
    // But we don't know the order or existence easily here without querying.

    // Alternative: Emit to specific rooms.
    // Currently `emitTaskCreated` emits to `tenant-${tenantId}`.
    // Everyone in the tenant listens to this.

    // Let's modify `emitTaskCreated` in Gateway to handle this?
    // Or just filter here.

    // If this is the Client-side mirror task (usually status != BRANDS in our auto-create logic, but can vary),
    // and we know it's a mirror...

    // Actually, the simplest fix for the "Double Card on Create" issue for Agency users is:
    // If I am creating a task that is intended for the Client (e.g. created via ProjectsService auto-create),
    // maybe I shouldn't emit it to the general tenant room if I also created an Agency one?

    // But `create` is generic.

    // Let's look at `ProjectsService`. It calls `prisma.task.create` directly.
    // Ah! `ProjectsService` does NOT call `TasksService.create`.
    // It calls `prisma.task.create`.
    // So `TasksService.create` logic is NOT executed for auto-created tasks in `ProjectsService`.
    // Wait, let me check `ProjectsService` again.

    // ... Checked ProjectsService ...
    // It calls `this.prisma.task.create`. It does NOT emit socket events!
    // So where do the events come from?
    // If ProjectsService doesn't emit, then the user shouldn't see them in realtime until refresh?
    // UNLESS `ProjectsService` was modified to emit?
    // I don't see emit calls in `ProjectsService.create` in the file I just read.

    // Wait, if `ProjectsService` creates tasks directly via Prisma and doesn't emit events,
    // then the user wouldn't see 2 cards *immediately* upon creation without refresh.
    // But the user says "yeni proje oluşturup kullanıcı ataması yaptım".
    // Maybe they refreshed? Or maybe they are talking about "Atama yaptım" -> Update event?

    // "yeni proje oluşturup kullanıcı ataması yaptım"
    // 1. Create Project -> 2 tasks created (db only, no socket if ProjectsService doesn't emit).
    // 2. User sees project? Or user goes to Tasks page?
    // If user goes to Tasks page, `findAll` is called.
    // `findAll` returns 2 tasks if not filtered.
    // I fixed `findAll` in the previous turn to filter mirror tasks.

    // So if `findAll` is fixed, why 2 cards?
    // Maybe the user assigned a user to the task?
    // "kullanıcı ataması yaptım"
    // When assignment happens, `update` is called.
    // `update` emits `tasks:bulkUpdated` (if mirror) or `tasks:updated`.

    // If `update` is called on ONE of the mirror tasks (e.g. the Agency one),
    // `update` logic detects mirrorGroupId, updates BOTH tasks in DB.
    // Then it emits `tasks:bulkUpdated` with BOTH tasks mapped.
    // `this.tasksGateway?.emitTasksBulkUpdated(tenantId, mapped);`

    // The `mapped` array contains BOTH tasks.
    // Frontend receives `tasks:bulkUpdated` with 2 tasks.
    // Frontend updates/adds both tasks to the list.

    // Bingo! `tasks:bulkUpdated` sends both mirror tasks to the frontend.
    // And frontend blindly merges them.

    // Fix: In `update` method, before emitting `emitTasksBulkUpdated`,
    // we should filter `mapped` list for Agency (tenant room) just like we did in `findAll`.
    // But `emitTasksBulkUpdated` sends to the whole tenant.
    // We can't filter there because we don't know who is listening (Client vs Staff).
    // Wait, Clients listen to `tenant-client-...` room usually?
    // `emitTasksBulkUpdated` -> `server.to(tenantId).emit(...)`.
    // Staff are in `tenantId` room.
    // Clients are in `tenant-client...` room?
    // Let's check Gateway (memory or file).
    // Memory says: "CRM Gateway joins STAFF/ADMIN to tenant:<tenantId>, CLIENT to tenant-client:<tenantId>:<customerId>."

    // So `emitTasksBulkUpdated` (which emits to `tenantId` room) goes to STAFF/ADMIN only.
    // Clients don't receive this event. Clients receive `emitTasksBulkUpdatedClient`.

    // So for Staff/Admin, they receive `emitTasksBulkUpdated` with ALL mirror tasks.
    // We should filter this list before emitting to `tenantId` room.
    // We should only send the "Agency" version of the mirror group to the Staff room.

    // Let's modify `update` in `TasksService`.

    this.tasksGateway?.emitTaskCreated(tenantId, mapped);
    const customerId = mapped?.project?.customerId;
    if (customerId) {
      this.tasksGateway?.emitTaskCreatedClient(tenantId, customerId, mapped);
    }

    // Notify Assignee
    if (task.assigneeId && this.notificationsService) {
      await this.notificationsService.create(tenantId, {
        userId: task.assigneeId,
        title: 'Yeni Görev Atandı',
        message: `Size yeni bir görev atandı: ${task.title}`,
        type: 'TASK_ASSIGNMENT',
        referenceId: task.id,
        referenceType: 'TASK',
      });
    }

    return mapped;
  }

  async update(id: string, tenantId: string, data: any, actorId?: string) {
    const sendSmsOnCompletion = data?.sendSmsOnCompletion === true;
    const preparedData = this.prepareDataForSave(data);
    // Block CLIENT from marking tasks as DONE
    if (preparedData.status === 'DONE' && actorId) {
      try {
        const actor = await this.prisma.user.findFirst({
          where: { id: actorId, tenantId },
          select: { role: true },
        });
        if (actor?.role === 'CLIENT') {
          delete preparedData.status;
        }
      } catch (e) {
        void e;
      }
    }
    const existing = await this.prisma.task.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        mirrorGroupId: true,
        assigneeId: true,
        title: true,
        members: true,
        description: true,
        comments: true,
        status: true,
        attachmentCount: true,
        checklistCompleted: true,
        checklistTotal: true,
      },
    });
    if (!existing) throw new NotFoundException('Görev bulunamadı.');

    const mirrorSyncData = this.getMirrorSyncData(preparedData);

    const ops: any[] = [];
    if (existing.mirrorGroupId && Object.keys(mirrorSyncData).length > 0) {
      ops.push(
        this.prisma.task.updateMany({
          where: { tenantId, mirrorGroupId: existing.mirrorGroupId },
          data: mirrorSyncData,
        }),
      );
    }

    ops.push(
      this.prisma.task.update({
        where: { id: existing.id },
        data: preparedData,
      }),
    );

    await this.prisma.$transaction(ops);

    // Notify if assignee changed
    if (
      preparedData.assigneeId &&
      preparedData.assigneeId !== existing.assigneeId &&
      this.notificationsService
    ) {
      await this.notificationsService.create(tenantId, {
        userId: preparedData.assigneeId,
        title: 'Görev Size Atandı',
        message: `Bir görev size atandı: ${existing.title}`,
        type: 'TASK_ASSIGNMENT',
        referenceId: existing.id,
        referenceType: 'TASK',
      });
    }

    // Notify if new members added
    if (preparedData.members && this.notificationsService) {
      const oldMembers: string[] = existing.members
        ? JSON.parse(existing.members)
        : [];
      const newMembers: string[] = JSON.parse(preparedData.members);
      const addedMembers = newMembers.filter((id) => !oldMembers.includes(id));

      for (const userId of addedMembers) {
        // Skip if the added member is the assignee (already notified)
        if (userId === preparedData.assigneeId) continue;

        await this.notificationsService.create(tenantId, {
          userId,
          title: 'Göreve Eklendiniz',
          message: `Bir göreve üye olarak eklendiniz: ${existing.title}`,
          type: 'TASK_ASSIGNMENT',
          referenceId: existing.id,
          referenceType: 'TASK',
        });
      }
    }

    // Notify if mentioned in description
    if (
      preparedData.description &&
      preparedData.description !== existing.description &&
      this.notificationsService
    ) {
      const oldDescription = existing.description || '';
      const newDescription = preparedData.description || '';

      // Simple regex to find @Name
      // Note: This assumes names don't have spaces or we only match single word names for simplicity,
      // OR we match until end of line/special char.
      // Since frontend implementation inserts "@Name Surname ", let's try to match that.
      // But names are not unique. This is a best-effort implementation without ID tagging.
      // We will search for all users in the tenant and check if their name is in the description.
      // This is expensive if many users. A better way is to rely on frontend sending IDs, but user asked for @mentions in text.

      // Let's iterate over all users of the tenant to see if they are mentioned in the new description but not in the old one.
      // First, we need to fetch tenant users.
      // Optimisation: Only fetch users if we detect an '@' in the new description.
      if (newDescription.includes('@')) {
        const tenantUsers = await this.prisma.user.findMany({
          where: { tenantId, isActive: true },
          select: { id: true, name: true },
        });

        for (const user of tenantUsers) {
          if (!user.name) continue;
          const mentionText = `@${user.name}`;
          const isMentionedNow = newDescription.includes(mentionText);
          const wasMentionedBefore = oldDescription.includes(mentionText);

          if (isMentionedNow && !wasMentionedBefore) {
            // Avoid notifying self if the user is editing their own task (though we don't have actor ID here easily available in update method without extra param)
            // We'll skip if the mentioned user is the one performing the action?
            // We don't have current user ID in 'update' arguments easily unless passed in 'data'.
            // Let's assume we want to notify regardless for now, or check if 'data.updatedBy' exists.

            await this.notificationsService.create(tenantId, {
              userId: user.id,
              title: 'Görevde Sizden Bahsedildi',
              message: `${existing.title} görevinde sizden bahsedildi.`,
              type: 'TASK_MENTION',
              referenceId: existing.id,
              referenceType: 'TASK',
            });
          }
        }
      }
    }

    if (existing.mirrorGroupId && Object.keys(mirrorSyncData).length > 0) {
      const tasks = await this.prisma.task.findMany({
        where: { tenantId, mirrorGroupId: existing.mirrorGroupId },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          project: {
            select: { customerId: true },
          },
        },
      });
      const mapped = tasks.map((t) => this.mapTask(t));

      // Filter mapped tasks for general tenant room (Agency)
      // Only include unique tasks or preferred mirror task
      const uniqueMapped: any[] = [];
      const mirrorGroups = new Map<string, any[]>();

      for (const t of mapped) {
        if (!t.mirrorGroupId) {
          uniqueMapped.push(t);
        } else {
          const group = mirrorGroups.get(t.mirrorGroupId) || [];
          group.push(t);
          mirrorGroups.set(t.mirrorGroupId, group);
        }
      }

      for (const [_, groupTasks] of mirrorGroups) {
        if (groupTasks.length === 1) {
          uniqueMapped.push(groupTasks[0]);
        } else {
          // Prefer 'BRANDS' status, or fallback to the one with longer title
          const preferred =
            groupTasks.find((t) => t.status === 'BRANDS') ||
            groupTasks.sort((a, b) => b.title.length - a.title.length)[0];
          uniqueMapped.push(preferred);
        }
      }

      this.tasksGateway?.emitTasksBulkUpdated(tenantId, uniqueMapped);

      const byCustomer: Record<string, any[]> = {};
      for (const mt of mapped) {
        const cid = mt?.project?.customerId;
        if (cid) {
          (byCustomer[cid] ||= []).push(mt);
        }
      }
      for (const [cid, list] of Object.entries(byCustomer)) {
        this.tasksGateway?.emitTasksBulkUpdatedClient(tenantId, cid, list);
      }
      const current = mapped.find((t) => t.id === existing.id);
      return current || (await this.getTaskForRealtime(existing.id, tenantId));
    }

    // Check for task completion
    if (
      preparedData.status &&
      preparedData.status === 'DONE' &&
      existing.status !== 'DONE' &&
      this.notificationsService
    ) {
      // Notify watchers
      const watchers = existing.members ? JSON.parse(existing.members) : [];
      if (existing.assigneeId && !watchers.includes(existing.assigneeId)) {
        watchers.push(existing.assigneeId);
      }

      for (const userId of watchers) {
        // Don't notify the actor
        if (actorId && userId === actorId) continue;

        await this.notificationsService.create(tenantId, {
          userId,
          title: 'Görev Tamamlandı',
          message: `${existing.title} görevi tamamlandı.`,
          type: 'TASK_COMPLETED',
          referenceId: existing.id,
          referenceType: 'TASK',
        });
      }
    }

    if (
      preparedData.status &&
      preparedData.status === 'DONE' &&
      existing.status !== 'DONE' &&
      sendSmsOnCompletion &&
      this.smsService
    ) {
      await this.smsService.trySendEvent(tenantId, 'TASK_COMPLETED', {
        taskId: existing.id,
        actorId,
      });
    }

    // Check for file added
    if (
      preparedData.attachmentCount &&
      preparedData.attachmentCount > (existing.attachmentCount || 0) &&
      this.notificationsService
    ) {
      // Notify watchers
      const watchers = existing.members ? JSON.parse(existing.members) : [];
      if (existing.assigneeId && !watchers.includes(existing.assigneeId)) {
        watchers.push(existing.assigneeId);
      }

      for (const userId of watchers) {
        // Don't notify the actor
        if (actorId && userId === actorId) continue;

        await this.notificationsService.create(tenantId, {
          userId,
          title: 'Dosya Eklendi',
          message: `${existing.title} görevine yeni bir dosya eklendi.`,
          type: 'TASK_FILE_ADDED',
          referenceId: existing.id,
          referenceType: 'TASK',
        });
      }
    }

    // Check for checklist completion
    // preparedData might have checklistCompleted count.
    if (
      preparedData.checklistCompleted !== undefined &&
      preparedData.checklistTotal !== undefined &&
      preparedData.checklistTotal > 0 &&
      preparedData.checklistCompleted === preparedData.checklistTotal &&
      existing.checklistCompleted !== existing.checklistTotal &&
      this.notificationsService
    ) {
      // Notify watchers
      const watchers = existing.members ? JSON.parse(existing.members) : [];
      if (existing.assigneeId && !watchers.includes(existing.assigneeId)) {
        watchers.push(existing.assigneeId);
      }

      for (const userId of watchers) {
        // Don't notify the actor
        if (actorId && userId === actorId) continue;

        await this.notificationsService.create(tenantId, {
          userId,
          title: 'Kontrol Listesi Tamamlandı',
          message: `${existing.title} görevindeki kontrol listesi tamamlandı.`,
          type: 'TASK_CHECKLIST_COMPLETED',
          referenceId: existing.id,
          referenceType: 'TASK',
        });
      }
    }

    // Check for mentions in new comments
    // Comments are stored as JSON array string in 'comments' field
    // We need to compare old comments with new comments to find the new one
    // But this is tricky because 'preparedData.comments' is the full array stringified
    // Let's rely on checking if 'comments' field is being updated
    if (
      preparedData.comments &&
      preparedData.comments !== existing.comments &&
      this.notificationsService
    ) {
      try {
        const oldComments = existing.comments
          ? JSON.parse(existing.comments)
          : [];
        const newComments = JSON.parse(preparedData.comments);

        // Find added comments
        // Assuming comments have unique IDs.
        // If newComments has more items than oldComments, or different items.
        // Simple diff: find items in newComments that are not in oldComments by ID
        const addedComments = newComments.filter(
          (nc: any) => !oldComments.some((oc: any) => oc.id === nc.id),
        );

        if (addedComments.length > 0) {
          const tenantUsers = await this.prisma.user.findMany({
            where: { tenantId, isActive: true },
            select: { id: true, name: true },
          });

          for (const comment of addedComments) {
            const text = comment.text || '';
            if (!text.includes('@')) continue;

            for (const user of tenantUsers) {
              if (!user.name) continue;
              const mentionText = `@${user.name}`;
              if (text.includes(mentionText)) {
                // Don't notify self
                if (comment.userId === user.id) continue;

                await this.notificationsService.create(tenantId, {
                  userId: user.id,
                  title: 'Yorumda Sizden Bahsedildi',
                  message: `${existing.title} görevindeki bir yorumda sizden bahsedildi.`,
                  type: 'TASK_MENTION',
                  referenceId: existing.id,
                  referenceType: 'TASK',
                });
              }
            }
          }
        }
      } catch (e) {
        console.error('Error processing comment mentions:', e);
      }
    }

    const mapped = await this.getTaskForRealtime(existing.id, tenantId);
    this.tasksGateway?.emitTaskUpdated(tenantId, mapped);
    const customerId = mapped?.project?.customerId;
    if (customerId) {
      this.tasksGateway?.emitTaskUpdatedClient(tenantId, customerId, mapped);
    }
    return mapped;
  }

  private mapTask(task: any) {
    return {
      ...task,
      labels: task.labels ? JSON.parse(task.labels) : [],
      checklist: task.checklist ? JSON.parse(task.checklist) : [],
      members: task.members ? JSON.parse(task.members) : [],
      watchers: task.watchers ? JSON.parse(task.watchers) : [],
      attachments: task.attachments ? JSON.parse(task.attachments) : [],
      comments: task.comments ? JSON.parse(task.comments) : [],
      activities: task.activities ? JSON.parse(task.activities) : [],
    };
  }

  private prepareDataForSave(data: any) {
    // Filter out fields that shouldn't be updated directly or don't exist in Prisma schema
    const {
      id,
      tenantId,
      createdAt,
      updatedAt,
      assignee,
      tenant,
      project,
      sendSmsOnCompletion,
      ...rest
    } = data;
    const newData = { ...rest };

    // Handle empty date string
    if (newData.dueDate === '') {
      newData.dueDate = null;
    } else if (
      newData.dueDate &&
      typeof newData.dueDate === 'string' &&
      newData.dueDate.length === 10
    ) {
      // Convert YYYY-MM-DD to ISO string
      newData.dueDate = new Date(newData.dueDate).toISOString();
    }
    if (newData.coverColor === '') {
      newData.coverColor = null;
    }
    if (newData.projectId === '') {
      newData.projectId = null;
    }
    if (newData.assigneeId === '') {
      newData.assigneeId = null;
    }

    // Only stringify if it's an object/array, not if it's already string or null/undefined
    if (newData.labels && typeof newData.labels !== 'string')
      newData.labels = JSON.stringify(newData.labels);
    if (newData.checklist && typeof newData.checklist !== 'string')
      newData.checklist = JSON.stringify(newData.checklist);
    if (newData.members && typeof newData.members !== 'string')
      newData.members = JSON.stringify(newData.members);
    if (newData.watchers && typeof newData.watchers !== 'string')
      newData.watchers = JSON.stringify(newData.watchers);
    if (newData.attachments && typeof newData.attachments !== 'string')
      newData.attachments = JSON.stringify(newData.attachments);
    if (newData.comments && typeof newData.comments !== 'string')
      newData.comments = JSON.stringify(newData.comments);
    if (newData.activities && typeof newData.activities !== 'string')
      newData.activities = JSON.stringify(newData.activities);
    return newData;
  }

  private getMirrorSyncData(preparedData: any) {
    const { status, order, mirrorGroupId, ...rest } = preparedData ?? {};
    return rest;
  }

  async updateOrder(tenantId: string, taskIds: string[]) {
    const results = await this.prisma.$transaction(
      taskIds.map((id, index) =>
        this.prisma.task.updateMany({
          where: { id, tenantId },
          data: { order: index },
        }),
      ),
    );

    this.tasksGateway?.emitTasksReordered(tenantId, taskIds);
    return {
      updatedCount: results.reduce((acc, r) => acc + r.count, 0),
    };
  }

  async updatePositions(
    tenantId: string,
    changes: Array<{ id: string; status: string; order: number }>,
  ) {
    const list = Array.isArray(changes) ? changes : [];
    const byId = new Map<
      string,
      { id: string; status: string; order: number }
    >();
    for (const c of list) {
      if (!c || typeof c.id !== 'string') continue;
      if (typeof c.status !== 'string') continue;
      const order = Number.isFinite(c.order) ? c.order : Number(c.order);
      if (!Number.isFinite(order)) continue;
      byId.set(c.id, { id: c.id, status: c.status, order });
    }

    const normalized = Array.from(byId.values());
    if (normalized.length === 0) {
      return { updatedCount: 0, tasks: [] };
    }

    const results = await this.prisma.$transaction(
      normalized.map((c) =>
        this.prisma.task.updateMany({
          where: { id: c.id, tenantId },
          data: { status: c.status, order: c.order },
        }),
      ),
    );

    const ids = normalized.map((c) => c.id);
    const tasks = await this.prisma.task.findMany({
      where: { tenantId, id: { in: ids } },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: { customerId: true },
        },
      },
    });

    const mapped = tasks.map((t) => this.mapTask(t));
    this.tasksGateway?.emitTasksBulkUpdated(tenantId, mapped);
    const byCustomer: Record<string, any[]> = {};
    for (const mt of mapped) {
      const cid = mt?.project?.customerId;
      if (cid) {
        (byCustomer[cid] ||= []).push(mt);
      }
    }
    for (const [cid, list] of Object.entries(byCustomer)) {
      this.tasksGateway?.emitTasksBulkUpdatedClient(tenantId, cid, list);
    }

    return {
      updatedCount: results.reduce((acc, r) => acc + r.count, 0),
      tasks: mapped,
    };
  }

  async delete(id: string, tenantId: string) {
    const existing = await this.prisma.task.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Görev bulunamadı.');

    const task = await this.prisma.task.delete({
      where: { id: existing.id },
    });
    this.tasksGateway?.emitTaskDeleted(tenantId, existing.id);
    const mapped = this.mapTask(task);
    const customerId = mapped?.project?.customerId;
    if (customerId) {
      this.tasksGateway?.emitTaskDeletedClient(
        tenantId,
        customerId,
        existing.id,
      );
    }
    return mapped;
  }

  async archiveTasksByProject(tenantId: string, projectId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { tenantId, projectId },
      select: { id: true },
    });

    if (tasks.length === 0) return;

    await this.prisma.task.updateMany({
      where: { tenantId, projectId },
      data: {
        status: 'ARCHIVED',
        projectId: null,
      },
    });

    // Emit updates
    // We need to fetch updated tasks to map them correctly?
    // Or just construct minimal objects?
    // Frontend needs at least ID and Status to update state.
    // But `mapTask` usually expects full object.

    // Let's fetch them again or optimistically map.
    // Since we set projectId to null, fetching by projectId won't work anymore.
    // We have IDs.

    const updatedTasks = await this.prisma.task.findMany({
      where: {
        tenantId,
        id: { in: tasks.map((t) => t.id) },
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: { customerId: true },
        },
      },
    });

    const mapped = updatedTasks.map((t) => this.mapTask(t));
    this.tasksGateway?.emitTasksBulkUpdated(tenantId, mapped);

    const byCustomer: Record<string, any[]> = {};
    for (const mt of mapped) {
      const cid = mt?.project?.customerId;
      if (cid) {
        (byCustomer[cid] ||= []).push(mt);
      }
    }
    for (const [cid, list] of Object.entries(byCustomer)) {
      this.tasksGateway?.emitTasksBulkUpdatedClient(tenantId, cid, list);
    }
  }

  async getColumnWatchers(
    tenantId: string,
    userId: string,
    projectId?: string,
  ) {
    const watchers = await this.prisma.columnWatcher.findMany({
      where: {
        tenantId,
        userId,
        ...(projectId ? { projectId } : { projectId: null }),
      },
    });
    return watchers.map((w) => w.columnId);
  }

  async toggleColumnWatcher(
    tenantId: string,
    userId: string,
    columnId: string,
    projectId?: string,
  ) {
    console.log('toggleColumnWatcher called with:', {
      tenantId,
      userId,
      columnId,
      projectId,
    });
    try {
      // Clean undefined values
      const safeProjectId = projectId === undefined ? null : projectId;

      console.log('Searching for existing watcher with:', {
        tenantId,
        userId,
        columnId,
        projectId: safeProjectId,
      });

      const found = await this.prisma.columnWatcher.findFirst({
        where: {
          tenantId,
          userId,
          columnId,
          projectId: safeProjectId,
        },
      });

      console.log('Found existing:', found);

      if (found) {
        await this.prisma.columnWatcher.delete({
          where: { id: found.id },
        });
        console.log('Deleted watcher');
        return { watching: false };
      } else {
        const newData = {
          tenantId,
          userId,
          columnId,
          projectId: safeProjectId,
        };
        console.log('Creating new watcher with:', newData);
        await this.prisma.columnWatcher.create({
          data: newData,
        });
        console.log('Created watcher');
        return { watching: true };
      }
    } catch (error) {
      console.error('toggleColumnWatcher error details:', error);
      throw error;
    }
  }

  private async getTaskForRealtime(taskId: string, tenantId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, tenantId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: { customerId: true },
        },
      },
    });
    if (!task) throw new NotFoundException('Görev bulunamadı.');
    return this.mapTask(task);
  }
}
