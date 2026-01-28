import { TrelloService } from './trello.service';
export declare class TrelloController {
    private readonly trelloService;
    constructor(trelloService: TrelloService);
    getConfig(tenantId: string): Promise<any>;
    updateConfig(tenantId: string, body: {
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
    testAuth(tenantId: string): Promise<{
        ok: boolean;
        member: {
            id: any;
            username: any;
            fullName: any;
        };
    }>;
    listBoards(tenantId: string): Promise<any[]>;
    listBoardLists(tenantId: string, boardId: string): Promise<any[]>;
    importBoard(tenantId: string, body: {
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
