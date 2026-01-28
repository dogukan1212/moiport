import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Server, Socket } from 'socket.io';
export declare class TasksGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly prisma;
    server: Server;
    private readonly logger;
    constructor(jwtService: JwtService, prisma: PrismaService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    emitTaskCreated(tenantId: string, task: any): void;
    emitTaskCreatedClient(tenantId: string, customerId: string, task: any): void;
    emitTaskUpdated(tenantId: string, task: any): void;
    emitTaskUpdatedClient(tenantId: string, customerId: string, task: any): void;
    emitTasksBulkUpdated(tenantId: string, tasks: any[]): void;
    emitTasksBulkUpdatedClient(tenantId: string, customerId: string, tasks: any[]): void;
    emitTaskDeleted(tenantId: string, taskId: string): void;
    emitTaskDeletedClient(tenantId: string, customerId: string, taskId: string): void;
    emitTasksReordered(tenantId: string, taskIds: string[]): void;
    handleClientPositions(client: Socket, body: any): void;
    private getTenantRoom;
    private getTenantClientRoom;
    private getBearerFromAuthorizationHeader;
}
