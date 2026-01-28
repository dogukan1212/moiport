import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/crm',
})
export class CrmGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CrmGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const rawToken =
        client.handshake.auth?.token || client.handshake.headers.authorization;
      const token =
        typeof rawToken === 'string'
          ? rawToken.split(' ')[1] || rawToken
          : undefined;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload: any = this.jwtService.decode(token);
      if (!payload || !payload.tenantId) {
        client.disconnect();
        return;
      }

      const tenantId: string = payload.tenantId;
      const role: string | undefined = payload.role;
      const customerId: string | undefined = payload.customerId;

      client.data.tenantId = tenantId;
      client.data.role = role;
      client.data.customerId = customerId;

      if (role === 'CLIENT' && customerId) {
        await client.join(`tenant-client:${tenantId}:${customerId}`);
        this.logger.log(
          `Client connected to CRM (CLIENT): ${client.id} Tenant=${tenantId} Customer=${customerId}`,
        );
      } else {
        await client.join(`tenant:${tenantId}`);
        this.logger.log(
          `Client connected to CRM: ${client.id} (Tenant: ${tenantId})`,
        );
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    void client;
  }

  emitLeadCreated(tenantId: string, lead: any) {
    this.server.to(`tenant:${tenantId}`).emit('lead:created', lead);
    const customerId = lead?.customerId ?? lead?.pipeline?.customerId;
    if (customerId) {
      this.server
        .to(`tenant-client:${tenantId}:${customerId}`)
        .emit('lead:created', lead);
    }
  }

  emitLeadUpdated(tenantId: string, lead: any) {
    this.server.to(`tenant:${tenantId}`).emit('lead:updated', lead);
    const customerId = lead?.customerId ?? lead?.pipeline?.customerId;
    if (customerId) {
      this.server
        .to(`tenant-client:${tenantId}:${customerId}`)
        .emit('lead:updated', lead);
    }
  }

  emitLeadMoved(tenantId: string, lead: any) {
    this.server.to(`tenant:${tenantId}`).emit('lead:moved', lead);
    const customerId = lead?.customerId ?? lead?.pipeline?.customerId;
    if (customerId) {
      this.server
        .to(`tenant-client:${tenantId}:${customerId}`)
        .emit('lead:moved', lead);
    }
  }

  emitLeadDeleted(tenantId: string, leadId: string) {
    this.server.to(`tenant:${tenantId}`).emit('lead:deleted', { id: leadId });
  }

  emitWhatsappMessage(tenantId: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit('whatsapp:message', data);
    const customerId =
      data?.lead?.customerId ?? data?.lead?.pipeline?.customerId;
    if (customerId) {
      this.server
        .to(`tenant-client:${tenantId}:${customerId}`)
        .emit('whatsapp:message', data);
    }
  }
}
