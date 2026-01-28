import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string[]>(); // userId -> socketIds

  constructor(private jwtService: JwtService) {}

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

      const payload = this.jwtService.decode(token);
      if (!payload || !payload.sub) {
        client.disconnect();
        return;
      }

      const userId =
        typeof payload.sub === 'string'
          ? payload.sub
          : String(payload.sub ?? '');
      const socketId = client.id;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)?.push(socketId);

      client.data.userId = userId;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId =
      typeof client.data?.userId === 'string'
        ? client.data.userId
        : String(client.data?.userId ?? '');
    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        const index = sockets.indexOf(client.id);
        if (index !== -1) {
          sockets.splice(index, 1);
        }
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
  }

  sendNotification(userId: string, notification: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets && sockets.length > 0) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit('notification', notification);
      });
    }
  }
}
