import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { MessageBody } from '@nestjs/websockets';
import { ConnectedSocket } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/tasks',
})
export class TasksGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TasksGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
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
      const tenantId = payload?.tenantId;
      const userId = payload?.sub;
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
          select: { id: true, role: true, customerId: true },
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
      if (user.role === 'CLIENT' && user.customerId) {
        await client.join(this.getTenantClientRoom(tenantId, user.customerId));
      } else {
        await client.join(this.getTenantRoom(tenantId));
      }
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
    const tenantId = client.data?.tenantId;
    const userId = client.data?.userId;
    this.logger.log(
      `socket disconnected (${client.id}) tenant=${tenantId} user=${userId}`,
    );
  }

  emitTaskCreated(tenantId: string, task: any) {
    const ts = Date.now();
    this.server
      .to(this.getTenantRoom(tenantId))
      .emit('tasks:created', { task, ts });
  }
  emitTaskCreatedClient(tenantId: string, customerId: string, task: any) {
    const ts = Date.now();
    this.server
      .to(this.getTenantClientRoom(tenantId, customerId))
      .emit('tasks:created', { task, ts });
  }

  emitTaskUpdated(tenantId: string, task: any) {
    const ts = Date.now();
    this.server
      .to(this.getTenantRoom(tenantId))
      .emit('tasks:updated', { task, ts });
  }
  emitTaskUpdatedClient(tenantId: string, customerId: string, task: any) {
    const ts = Date.now();
    this.server
      .to(this.getTenantClientRoom(tenantId, customerId))
      .emit('tasks:updated', { task, ts });
  }

  emitTasksBulkUpdated(tenantId: string, tasks: any[]) {
    const ts = Date.now();
    this.server
      .to(this.getTenantRoom(tenantId))
      .emit('tasks:bulkUpdated', { tasks, ts });
  }
  emitTasksBulkUpdatedClient(
    tenantId: string,
    customerId: string,
    tasks: any[],
  ) {
    const ts = Date.now();
    this.server
      .to(this.getTenantClientRoom(tenantId, customerId))
      .emit('tasks:bulkUpdated', { tasks, ts });
  }

  emitTaskDeleted(tenantId: string, taskId: string) {
    const ts = Date.now();
    this.server
      .to(this.getTenantRoom(tenantId))
      .emit('tasks:deleted', { taskId, ts });
  }
  emitTaskDeletedClient(tenantId: string, customerId: string, taskId: string) {
    const ts = Date.now();
    this.server
      .to(this.getTenantClientRoom(tenantId, customerId))
      .emit('tasks:deleted', { taskId, ts });
  }

  emitTasksReordered(tenantId: string, taskIds: string[]) {
    const ts = Date.now();
    this.server
      .to(this.getTenantRoom(tenantId))
      .emit('tasks:reordered', { taskIds, ts });
  }

  @SubscribeMessage('tasks:positions:client')
  handleClientPositions(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: any,
  ) {
    const tenantId = client.data?.tenantId;
    if (!tenantId) return;
    const ts = Date.now();
    const origin = typeof body?.origin === 'string' ? body.origin : undefined;
    const list = Array.isArray(body?.changes) ? body.changes : [];
    const out: Array<{ id: string; status: string; order: number }> = [];
    for (const c of list) {
      const id = typeof c?.id === 'string' ? c.id : undefined;
      const status = typeof c?.status === 'string' ? c.status : undefined;
      const order = Number.isFinite(c?.order) ? c.order : Number(c?.order);
      if (id && status && Number.isFinite(order)) {
        out.push({ id, status, order });
      }
    }
    if (out.length === 0) return;
    this.server
      .to(this.getTenantRoom(tenantId))
      .emit('tasks:positions', { changes: out, ts, origin });
  }

  private getTenantRoom(tenantId: string) {
    return `tenant:${tenantId}`;
  }
  private getTenantClientRoom(tenantId: string, customerId: string) {
    return `tenant-client:${tenantId}:${customerId}`;
  }

  private getBearerFromAuthorizationHeader(header: unknown) {
    if (!header || typeof header !== 'string') return undefined;
    const m = header.match(/^Bearer\s+(.+)$/i);
    return m?.[1];
  }
}
