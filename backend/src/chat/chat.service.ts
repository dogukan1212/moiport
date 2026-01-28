import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FacebookService } from '../integrations/facebook/facebook.service';
import axios from 'axios';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => FacebookService))
    private facebookService: FacebookService,
  ) {}

  async listRooms(
    tenantId: string,
    user: any,
    view?: string,
    projectId?: string,
  ) {
    const isAdmin = (user?.role || '').includes('ADMIN');

    let whereClause: any = { tenantId };

    // Eğer view='all' ise ve adminse, tüm odaları getir.
    // Değilse (view='mine' veya belirtilmemişse), sadece üye olunan + public odaları getir.
    if (isAdmin && view === 'all') {
      // Tüm odalar, whereClause zaten { tenantId }
    } else {
      // Normal kullanıcı veya Admin'in 'Benim Sohbetlerim' görünümü
      const currentUserId = user?.userId || user?.id;
      const isClient = user?.role === 'CLIENT';

      const memberRoomIds = await this.prisma.chatMembership
        .findMany({
          where: { tenantId, userId: currentUserId },
          select: { roomId: true },
        })
        .then((rows) => rows.map((r) => r.roomId));

      if (isClient) {
        // Müşteriler sadece üye oldukları odaları görebilir (Public odaları göremezler)
        whereClause = {
          tenantId,
          id: { in: memberRoomIds },
        };
      } else {
        // Normal personel hem public odaları hem de üye olduğu odaları görür
        whereClause = {
          tenantId,
          OR: [{ isPrivate: false }, { id: { in: memberRoomIds } }],
        };
      }
    }

    if (projectId) {
      const brandFilter = { OR: [{ type: 'DM' }, { projectId }] };
      if (whereClause.AND) {
        whereClause.AND.push(brandFilter);
      } else {
        whereClause.AND = [brandFilter];
      }
    }

    const rooms = await this.prisma.chatRoom.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      include: {
        memberships: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    const currentUserId = user?.userId || user?.id;
    if (!currentUserId) return rooms;

    const roomIds = rooms.map((r) => r.id);
    if (roomIds.length === 0) return [];

    const unreadCounts = await this.prisma.chatMessage.groupBy({
      by: ['roomId'],
      where: {
        tenantId,
        roomId: { in: roomIds },
        userId: { not: currentUserId },
        status: { not: 'READ' },
      },
      _count: {
        id: true,
      },
    });

    return rooms.map((room) => {
      const c = unreadCounts.find((x) => x.roomId === room.id);
      return {
        ...room,
        unreadCount: c?._count.id || 0,
      };
    });
  }

  async createRoom(
    tenantId: string,
    user: any,
    data: {
      name: string;
      type?: 'CHANNEL' | 'PROJECT' | 'DM';
      projectId?: string;
      isPrivate?: boolean;
      memberIds?: string[];
    },
  ) {
    const type = data.type || 'CHANNEL';
    const isAdmin = (user?.role || '').includes('ADMIN');
    if (!isAdmin && type !== 'DM') {
      throw new ForbiddenException('Yeni oda açma yetkiniz yok.');
    }
    const isPrivate = !!data.isPrivate || type === 'DM';
    const members = Array.isArray(data.memberIds) ? data.memberIds : [];
    const desiredMemberIds = Array.from(
      new Set([user?.userId || user?.id, ...members]),
    );
    if (type === 'DM' && desiredMemberIds.length >= 2) {
      const a = desiredMemberIds[0];
      const b = desiredMemberIds[1];
      const [rowsA, rowsB] = await Promise.all([
        this.prisma.chatMembership.findMany({
          where: { tenantId, userId: a },
          select: { roomId: true },
        }),
        this.prisma.chatMembership.findMany({
          where: { tenantId, userId: b },
          select: { roomId: true },
        }),
      ]);
      const setA = new Set(rowsA.map((r) => r.roomId));
      const commonIds = Array.from(
        new Set(rowsB.map((r) => r.roomId).filter((id) => setA.has(id))),
      );
      if (commonIds.length > 0) {
        const existing = await this.prisma.chatRoom.findFirst({
          where: { id: { in: commonIds }, tenantId, type: 'DM' },
        });
        if (existing) {
          // Eğer oda zaten varsa, üyelerin bu odaya tekrar eklenmesini sağlamak için
          // (belki biri çıkmış olabilir) membership kontrolü yapılabilir ama
          // şimdilik sadece odayı dönmek yeterli.
          return this.prisma.chatRoom.findUnique({
            where: { id: existing.id },
            include: {
              memberships: {
                select: {
                  userId: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          });
        }
      }
    }
    const room = await this.prisma.chatRoom.create({
      data: {
        name: data.name,
        type,
        isPrivate,
        projectId: data.projectId,
        tenantId,
      },
    });
    if (desiredMemberIds.length > 0) {
      const validUsers = await this.prisma.user.findMany({
        where: { id: { in: desiredMemberIds }, tenantId },
        select: { id: true },
      });
      const validIds = Array.from(new Set(validUsers.map((u) => u.id)));
      for (const uid of validIds) {
        try {
          await this.prisma.chatMembership.create({
            data: {
              roomId: room.id,
              userId: uid,
              tenantId,
            },
          });
        } catch {
          // ignore duplicates or FK errors silently
        }
      }
    }

    return this.prisma.chatRoom.findUnique({
      where: { id: room.id },
      include: {
        memberships: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async listMessages(
    tenantId: string,
    user: any,
    roomId: string,
    cursor?: string,
    limit: number = 50,
  ) {
    const room = await this.prisma.chatRoom.findFirst({
      where: { id: roomId, tenantId },
    });
    if (!room) throw new NotFoundException('Oda bulunamadı');
    const isAdmin = (user?.role || '').includes('ADMIN');
    if (!isAdmin && room.isPrivate) {
      const membership = await this.prisma.chatMembership.findFirst({
        where: { roomId, userId: user?.userId || user?.id, tenantId },
      });
      if (!membership) throw new ForbiddenException('Erişim yok');
    }

    const messages = await this.prisma.chatMessage.findMany({
      where: { roomId, tenantId },
      take: -limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  }

  async sendMessage(
    tenantId: string,
    user: any,
    roomId: string,
    content: string,
    attachments?: any[],
  ) {
    const room = await this.prisma.chatRoom.findFirst({
      where: { id: roomId, tenantId },
    });
    if (!room) throw new NotFoundException('Oda bulunamadı');

    const isAdmin = (user?.role || '').includes('ADMIN');
    if (!isAdmin && room.isPrivate) {
      const membership = await this.prisma.chatMembership.findFirst({
        where: { roomId, userId: user?.userId || user?.id, tenantId },
      });
      if (!membership) throw new ForbiddenException('Erişim yok');
    }

    const msg = await this.prisma.chatMessage.create({
      data: {
        roomId,
        userId: user?.userId || user?.id,
        tenantId,
        content,
        attachments: attachments ? JSON.stringify(attachments) : undefined,
        status: 'SENT',
        platform: room.platform,
      },
      include: { user: true },
    });

    await this.prisma.chatRoom.update({
      where: { id: room.id },
      data: { updatedAt: new Date() },
    });

    // Handle External Integration
    if (room.platform === 'INSTAGRAM' && room.externalId) {
      try {
        await this.sendInstagramMessage(
          tenantId,
          room.externalId,
          content,
          room.type,
        );
      } catch (err: any) {
        console.error('Failed to send IG message:', err);
        // Mark message as FAILED
        await this.prisma.chatMessage.update({
          where: { id: msg.id },
          data: { status: 'FAILED' },
        });
        // Rethrow or return?
        // If we throw, the controller returns 500.
        // But we already created the message.
        // Let's just swallow but ensure status is updated so UI shows red.
      }
    }

    return msg;
  }

  async syncInstagramMessages(tenantId: string, roomId: string) {
    const room = await this.prisma.chatRoom.findFirst({
      where: { id: roomId, tenantId },
    });

    if (!room || room.platform !== 'INSTAGRAM' || !room.externalId) {
      return [];
    }

    const config = await this.facebookService.getConfig(tenantId);
    if (!config || !config.accessToken || !config.instagramBusinessAccountId) {
      throw new NotFoundException('Instagram connection not configured');
    }

    // 1. Find Conversation ID
    const conversations = await this.facebookService.getInstagramConversations(
      config.instagramBusinessAccountId,
      config.accessToken,
    );

    // Filter for the conversation with our user (externalId)
    // externalId in our DB is the IG User ID of the customer.
    // participants.data is array of { id, username }
    const conversation = conversations.find((c: any) =>
      c.participants?.data?.some((p: any) => p.id === room.externalId),
    );

    if (!conversation) {
      console.log('Conversation not found for user:', room.externalId);
      return [];
    }

    // 2. Fetch Messages
    const conversationId =
      typeof conversation.id === 'string'
        ? conversation.id
        : String(conversation.id ?? '');
    if (!conversationId) {
      return [];
    }
    const igMessages = await this.facebookService.getInstagramMessages(
      conversationId,
      config.accessToken,
    );

    const newMessages: any[] = [];

    // 3. Sync to DB
    for (const igMsg of igMessages.reverse()) {
      // Process oldest first
      // Check if exists
      const exists = await this.prisma.chatMessage.findFirst({
        where: {
          roomId,
          externalId: igMsg.id,
        },
      });

      if (!exists) {
        // Determine Sender
        // igMsg.from.id
        // If from.id === config.instagramBusinessAccountId, it's US (Agent)
        // Else it's the User.

        // Wait, we need to know who sent it.
        // If it's us, we might not have a user ID for "Agent" easily mapping to a system user unless we track who sent it.
        // But for syncing history, we can assign "Agent" messages to the first admin or a system user?
        // Or better, leave userId null? No, schema might require it.
        // Let's check schema for ChatMessage.userId

        // If it's the customer (igMsg.from.id === room.externalId):
        let userId: string | null = null;
        if (igMsg.from.id === room.externalId) {
          // Find the member user
          // Actually we have room memberships.
          // Let's try to find the user in the room memberships.
          // We can also find by externalId if we stored it? We don't store externalId on User directly, only on Room.
          // But we created users with email `ig_${id}@...` in webhooks.
          const u = await this.prisma.user.findFirst({
            where: {
              tenantId,
              email: `ig_${igMsg.from.id}@instagram.placeholder`,
            },
          });
          if (u) userId = u.id;
        } else {
          // It's likely US (the page)
          // We should assign this to an Admin or System.
          // For now, let's find an admin.
          const admin = await this.prisma.user.findFirst({
            where: { tenantId, role: { contains: 'ADMIN' } },
          });
          if (admin) userId = admin.id;
        }

        if (userId) {
          const created = await this.prisma.chatMessage.create({
            data: {
              roomId,
              tenantId,
              userId,
              content: igMsg.message || (igMsg.attachments ? 'Attachment' : ''),
              platform: 'INSTAGRAM',
              externalId: igMsg.id,
              status: 'READ', // Past messages are read
              createdAt: new Date(String(igMsg.created_time ?? '')),
            },
          });
          newMessages.push(created);
        }
      }
    }

    return newMessages;
  }

  private async sendInstagramMessage(
    tenantId: string,
    recipientId: string,
    content: string,
    roomType: string,
  ) {
    const config = await this.facebookService.getConfig(tenantId);
    if (!config || !config.accessToken) return;

    if (roomType === 'DM') {
      try {
        await axios.post(
          `https://graph.facebook.com/v21.0/me/messages`,
          {
            recipient: { id: recipientId },
            message: { text: content },
          },
          {
            params: { access_token: config.accessToken },
          },
        );
      } catch (e) {
        console.error('Failed to send IG DM', e.response?.data);
      }
    } else if (roomType === 'CHANNEL') {
      // Post Comment
      try {
        await axios.post(
          `https://graph.facebook.com/v21.0/${recipientId}/comments`,
          {
            message: content,
          },
          {
            params: { access_token: config.accessToken },
          },
        );
      } catch (e) {
        console.error('Failed to post IG Comment', e.response?.data);
      }
    }
  }

  async createTaskFromMessage(tenantId: string, user: any, messageId: string) {
    const msg = await this.prisma.chatMessage.findFirst({
      where: { id: messageId, tenantId },
      include: { room: true, user: true },
    });
    if (!msg) throw new NotFoundException('Mesaj bulunamadı');
    const room = msg.room;
    const isAdmin = (user?.role || '').includes('ADMIN');
    if (!isAdmin && room.isPrivate) {
      const membership = await this.prisma.chatMembership.findFirst({
        where: { roomId: room.id, userId: user?.userId || user?.id, tenantId },
      });
      if (!membership) throw new ForbiddenException('Erişim yok');
    }
    const title = (msg.content || '').slice(0, 64) || 'Sohbetten Görev';
    const task = await this.prisma.task.create({
      data: {
        title,
        description: msg.content,
        status: 'TODO',
        tenantId,
        projectId: room.projectId || undefined,
      },
    });
    return task;
  }

  async deleteMessage(tenantId: string, user: any, messageId: string) {
    const msg = await this.prisma.chatMessage.findFirst({
      where: { id: messageId, tenantId },
      include: { room: true },
    });
    if (!msg) throw new NotFoundException('Mesaj bulunamadı');
    const room = msg.room;
    const isAdmin = (user?.role || '').includes('ADMIN');
    if (!isAdmin && room.isPrivate) {
      const membership = await this.prisma.chatMembership.findFirst({
        where: { roomId: room.id, userId: user?.userId || user?.id, tenantId },
      });
      if (!membership) throw new ForbiddenException('Erişim yok');
    }
    const currentUserId = user?.userId || user?.id;
    if (!isAdmin && msg.userId !== currentUserId) {
      throw new ForbiddenException('Sadece kendi mesajınızı silebilirsiniz');
    }
    const updated = await this.prisma.chatMessage.update({
      where: { id: msg.id },
      data: { deletedAt: new Date() },
    });
    return updated;
  }

  async listUsers(tenantId: string, user?: any) {
    const where: any = { tenantId, isActive: true };

    if (user?.role === 'CLIENT') {
      // Müşteriler sadece Admin, Staff ve kendilerini görebilir
      // Diğer müşterileri göremez
      where.OR = [
        { role: { in: ['ADMIN', 'STAFF', 'SUPER_ADMIN', 'HR'] } },
        { id: user.userId || user.id },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, avatar: true },
      orderBy: { name: 'asc' },
    });
    return users;
  }

  async markMessagesAsRead(
    tenantId: string,
    user: any,
    roomId: string,
    messageIds: string[],
  ) {
    if (!messageIds.length) return;
    const room = await this.prisma.chatRoom.findFirst({
      where: { id: roomId, tenantId },
    });
    if (!room) return;

    await this.prisma.chatMessage.updateMany({
      where: {
        id: { in: messageIds },
        roomId,
        tenantId,
        userId: { not: user.userId || user.id },
        status: { not: 'READ' },
      },
      data: { status: 'READ' },
    });

    return messageIds;
  }

  async markMessagesAsDelivered(
    tenantId: string,
    user: any,
    roomId: string,
    messageIds: string[],
  ) {
    if (!messageIds.length) return;
    const room = await this.prisma.chatRoom.findFirst({
      where: { id: roomId, tenantId },
    });
    if (!room) return;

    // Only update messages that are currently SENT (not READ)
    // and not sent by the user themselves (though logic usually prevents this from client side)
    await this.prisma.chatMessage.updateMany({
      where: {
        id: { in: messageIds },
        roomId,
        tenantId,
        status: 'SENT',
      },
      data: { status: 'DELIVERED' },
    });

    return messageIds;
  }
}
