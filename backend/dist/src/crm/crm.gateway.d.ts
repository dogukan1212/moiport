import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
export declare class CrmGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    server: Server;
    private readonly logger;
    constructor(jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    emitLeadCreated(tenantId: string, lead: any): void;
    emitLeadUpdated(tenantId: string, lead: any): void;
    emitLeadMoved(tenantId: string, lead: any): void;
    emitLeadDeleted(tenantId: string, leadId: string): void;
    emitWhatsappMessage(tenantId: string, data: any): void;
}
