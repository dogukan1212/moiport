import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { ConnectedSocket } from '@nestjs/websockets';
import { MessageBody } from '@nestjs/websockets';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // Online kullanıcıları takip etmek için Map<UserId, Set<SocketId>>
  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ||
      this.getBearerFromAuthorizationHeader(
        client.handshake.headers.authorization,
      );

    if (!token) {
      this.logger.warn(`socket rejected: missing token (${client.id})`);
      client.disconnect(true);
      return;
    }

    try {
      const payload: any = await this.jwtService.verifyAsync(token);
      const tenantId = this.normalizeId(payload?.tenantId);
      const userId = this.normalizeId(payload?.sub ?? payload?.id);
      if (!tenantId || !userId) {
        this.logger.warn(`socket rejected: invalid payload (${client.id})`);
        client.disconnect(true);
        return;
      }

      const [tenant, user] = await Promise.all([
        this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { id: true },
        }),
        this.prisma.user.findFirst({
          where: { id: userId, tenantId },
          select: { id: true, role: true },
        }),
      ]);

      if (!tenant || !user) {
        this.logger.warn(
          `socket rejected: tenant/user not found (${client.id})`,
        );
        client.disconnect(true);
        return;
      }

      client.data.userId = userId;
      client.data.tenantId = tenantId;
      client.data.role = user.role;
      await client.join(this.getTenantRoom(tenantId));

      // Online kullanıcı yönetimi
      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
        // İlk bağlantı, herkese duyur (Sadece aynı tenant içindekilere duyurmak daha doğru ama şimdilik global)
        // TODO: Tenant bazlı ayrım yapılabilir. Şimdilik basitleştirilmiş hali.
        this.server.emit('chat:user:online', { userId });
      }

      const userSockets = this.onlineUsers.get(userId);
      if (userSockets) {
        userSockets.add(client.id);
      }

      // Bağlanan kişiye mevcut online listesini gönder
      client.emit('chat:users:online', Array.from(this.onlineUsers.keys()));

      this.logger.log(
        `socket connected (${client.id}) tenant=${tenantId} user=${userId}`,
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `socket rejected: verify failed (${client.id}) ${message}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const tenantId = this.normalizeId(client.data?.tenantId);
    const userId = this.normalizeId(client.data?.userId);
    this.logger.log(
      `socket disconnected (${client.id}) tenant=${tenantId} user=${userId}`,
    );
  }

  @SubscribeMessage('chat:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId?: string },
  ) {
    const tenantId = client.data?.tenantId;
    const userId = client.data?.userId;
    if (!tenantId || !userId) return;
    const roomId = typeof body?.roomId === 'string' ? body.roomId : undefined;
    if (!roomId) return;

    this.logger.log(`Socket ${client.id} joining room ${roomId}`);

    const room = await this.prisma.chatRoom.findFirst({
      where: { id: roomId, tenantId },
    });
    if (!room) return;
    const isAdmin = (client.data?.role || '').includes('ADMIN');
    if (!isAdmin && room.isPrivate) {
      const membership = await this.prisma.chatMembership.findFirst({
        where: { roomId, userId, tenantId },
      });
      if (!membership) return;
    }
    await client.join(this.getChatRoom(tenantId, roomId));
  }

  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; isTyping: boolean },
  ) {
    this.logger.log(`handleTyping called for room ${payload.roomId}`);
    const token = this.getBearerFromAuthorizationHeader(
      client.handshake.auth.token || client.handshake.headers.authorization,
    );
    if (!token) {
      this.logger.warn(`handleTyping: No token found for socket ${client.id}`);
      return;
    }
    try {
      const decoded = this.jwtService.verify(token);
      const tenantId = this.normalizeId(decoded?.tenantId);
      const userId = this.normalizeId(decoded?.sub ?? decoded?.id);
      if (!tenantId || !userId) {
        return;
      }

      this.logger.warn(
        `### TYPING DEBUG ### Typing event from ${userId} in room ${payload.roomId}: ${payload.isTyping}`,
      );

      const roomName = this.getChatRoom(tenantId, payload.roomId);
      this.logger.warn(
        `### TYPING DEBUG ### Broadcasting chat:typing to room ${roomName} excluding sender ${client.id}`,
      );

      client.broadcast.to(roomName).emit('chat:typing', {
        userId,
        roomId: payload.roomId,
        isTyping: payload.isTyping,
      });
    } catch (e) {
      this.logger.error(`handleTyping error: ${e.message}`, e.stack);
    }
  }

  @SubscribeMessage('chat:read')
  async handleRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; messageIds: string[] },
  ) {
    const token = this.getBearerFromAuthorizationHeader(
      client.handshake.auth.token || client.handshake.headers.authorization,
    );
    if (!token) return;
    try {
      const decoded = this.jwtService.verify(token);
      const tenantId = this.normalizeId(decoded?.tenantId);
      const userId = this.normalizeId(decoded?.sub ?? decoded?.id);
      if (!tenantId || !userId) {
        return;
      }
      const user = {
        id: userId,
        userId,
        role: decoded?.role,
      };

      this.logger.log(
        `Read event from ${user.id} in room ${payload.roomId} for messages ${payload.messageIds.length}`,
      );

      await this.chatService.markMessagesAsRead(
        tenantId,
        user,
        payload.roomId,
        payload.messageIds,
      );

      const roomName = this.getChatRoom(tenantId, payload.roomId);
      this.logger.log(`Emitting chat:message:read to room ${roomName}`);

      this.server.to(roomName).emit('chat:message:read', {
        roomId: payload.roomId,
        messageIds: payload.messageIds,
        userId: user.id,
        status: 'READ',
      });
    } catch (e) {
      this.logger.error(e);
    }
  }

  @SubscribeMessage('chat:delivered')
  async handleDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; messageIds: string[] },
  ) {
    this.logger.log(
      `handleDelivered called for room ${payload.roomId} messages: ${payload.messageIds?.length}`,
    );
    const token = this.getBearerFromAuthorizationHeader(
      client.handshake.auth.token || client.handshake.headers.authorization,
    );
    if (!token) {
      this.logger.warn(
        `handleDelivered: No token found for socket ${client.id}`,
      );
      return;
    }
    try {
      const decoded = this.jwtService.verify(token);
      const tenantId = this.normalizeId(decoded?.tenantId);
      const userId = this.normalizeId(decoded?.sub ?? decoded?.id);
      if (!tenantId || !userId) {
        return;
      }
      const user = {
        id: userId,
        userId,
        role: decoded?.role,
      };

      this.logger.log(
        `Delivered event from ${user.id} in room ${payload.roomId} for messages ${payload.messageIds.length}`,
      );

      await this.chatService.markMessagesAsDelivered(
        tenantId,
        user,
        payload.roomId,
        payload.messageIds,
      );

      this.server
        .to(this.getChatRoom(tenantId, payload.roomId))
        .emit('chat:message:delivered', {
          roomId: payload.roomId,
          messageIds: payload.messageIds,
          userId: user.id,
        });
    } catch (e) {
      this.logger.error(`handleDelivered error: ${e.message}`, e.stack);
    }
  }

  async sendMessage(
    tenantId: string,
    user: any,
    roomId: string,
    content: string,
    attachments?: any[],
  ) {
    return this.chatService.sendMessage(
      tenantId,
      user,
      roomId,
      content,
      attachments,
    );
  }

  emitMessageCreated(tenantId: string, roomId: string, message: any) {
    const ts = Date.now();
    this.server
      .to(this.getChatRoom(tenantId, roomId))
      .emit('chat:message:new', { message, ts });
  }

  emitMessageToTask(tenantId: string, task: any) {
    const ts = Date.now();
    this.server.to(this.getTenantRoom(tenantId)).emit('chat:message:to-task', {
      task,
      ts,
    });
  }

  emitMessageDeleted(tenantId: string, roomId: string, message: any) {
    const ts = Date.now();
    this.server
      .to(this.getChatRoom(tenantId, roomId))
      .emit('chat:message:deleted', { message, ts });
  }

  emitRoomCreated(tenantId: string, room: any) {
    this.server
      .to(this.getTenantRoom(tenantId))
      .emit('chat:room:created', { room });
  }

  private getTenantRoom(tenantId: string) {
    return `tenant:${tenantId}`;
  }

  private getChatRoom(tenantId: string, roomId: string) {
    return `chat:${tenantId}:${roomId}`;
  }

  private normalizeId(value: unknown) {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return undefined;
  }

  private getBearerFromAuthorizationHeader(header: unknown) {
    if (!header || typeof header !== 'string') return undefined;
    const m = header.match(/^Bearer\s+(.+)$/i);
    return m ? m[1] : header;
  }
}
