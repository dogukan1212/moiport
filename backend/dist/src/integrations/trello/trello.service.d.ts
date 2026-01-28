import { PrismaService } from '../../prisma/prisma.service';
export declare class TrelloService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private trelloErrorToMessage;
    private getActiveCredentials;
    private trelloApi;
    testAuth(tenantId: string): Promise<{
        ok: boolean;
        member: {
            id: any;
            username: any;
            fullName: any;
        };
    }>;
    getConfig(tenantId: string): Promise<any>;
    updateConfig(tenantId: string, data: {
        apiKey?: string | null;
        token?: string | null;
        isActive?: boolean;
    }): Promise<{
        id: string;
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
        token: string | null;
        apiKey: string | null;
    }>;
    listBoards(tenantId: string): Promise<any[]>;
    listBoardLists(tenantId: string, boardId: string): Promise<any[]>;
    private isAllowedStatus;
    importBoardToProject(tenantId: string, body: {
        boardId: string;
        projectId?: string;
        customerId?: string;
        projectName?: string;
        listStatusMap: Record<string, string>;
    }): Promise<{
        projectId: string | null;
        createdTaskCount: number;
        skippedCardCount: number;
        lists: {
            id: any;
            name: any;
        }[];
    }>;
}
