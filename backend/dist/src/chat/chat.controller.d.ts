import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { TenantsService } from '../tenants/tenants.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class ChatController {
    private readonly chatService;
    private readonly gateway;
    private readonly tenantsService;
    private readonly prisma;
    constructor(chatService: ChatService, gateway: ChatGateway, tenantsService: TenantsService, prisma: PrismaService);
    listRooms(tenantId: string, user: any, view?: string, projectId?: string): Promise<({
        memberships: {
            user: {
                id: string;
                email: string;
                name: string | null;
                avatar: string | null;
            };
            userId: string;
        }[];
    } & {
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        platform: string;
        type: string;
        projectId: string | null;
        isPrivate: boolean;
        externalId: string | null;
        metadata: string | null;
    })[]>;
    createRoom(tenantId: string, user: any, data: {
        name: string;
        type?: 'CHANNEL' | 'PROJECT' | 'DM';
        projectId?: string;
        isPrivate?: boolean;
        memberIds?: string[];
    }): Promise<({
        memberships: {
            user: {
                id: string;
                email: string;
                name: string | null;
                avatar: string | null;
            };
            userId: string;
        }[];
    } & {
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        platform: string;
        type: string;
        projectId: string | null;
        isPrivate: boolean;
        externalId: string | null;
        metadata: string | null;
    }) | null>;
    listMessages(tenantId: string, user: any, roomId: string, cursor?: string, limit?: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        userId: string;
        platform: string;
        externalId: string | null;
        metadata: string | null;
        attachments: string | null;
        content: string;
        roomId: string;
        pinned: boolean;
        deletedAt: Date | null;
    }[]>;
    sendMessage(tenantId: string, user: any, roomId: string, body: {
        content: string;
        attachments?: any[];
    }): Promise<{
        user: {
            id: string;
            email: string;
            emailVerifiedAt: Date | null;
            password: string;
            name: string | null;
            avatar: string | null;
            role: string;
            tenantId: string;
            customerId: string | null;
            salary: number | null;
            iban: string | null;
            phone: string | null;
            phoneVerifiedAt: Date | null;
            startDate: Date | null;
            isActive: boolean;
            tckn: string | null;
            address: string | null;
            birthDate: Date | null;
            jobTitle: string | null;
            department: string | null;
            emergencyContactName: string | null;
            emergencyContactPhone: string | null;
            bankName: string | null;
            bankBranch: string | null;
            bankAccountNumber: string | null;
            maritalStatus: string | null;
            childrenCount: number | null;
            bloodType: string | null;
            educationLevel: string | null;
            contractType: string | null;
            socialSecurityNumber: string | null;
            taxNumber: string | null;
            weeklyHours: number | null;
            probationMonths: number | null;
            confidentialityYears: number | null;
            nonCompeteMonths: number | null;
            penaltyAmount: number | null;
            equipmentList: string | null;
            benefits: string | null;
            performancePeriod: string | null;
            workplace: string | null;
            bonusPolicy: string | null;
            leavePolicy: string | null;
            noticePeriodWeeks: number | null;
            allowedModules: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        userId: string;
        platform: string;
        externalId: string | null;
        metadata: string | null;
        attachments: string | null;
        content: string;
        roomId: string;
        pinned: boolean;
        deletedAt: Date | null;
    }>;
    syncRoom(tenantId: string, roomId: string): Promise<{
        count: number;
    }>;
    messageToTask(tenantId: string, user: any, messageId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        status: string;
        assigneeId: string | null;
        activities: string | null;
        projectId: string | null;
        attachments: string | null;
        priority: string;
        description: string | null;
        order: number;
        mirrorGroupId: string | null;
        dueDate: Date | null;
        labels: string | null;
        checklist: string | null;
        checklistTotal: number;
        checklistCompleted: number;
        members: string | null;
        memberCount: number;
        watchers: string | null;
        watcherCount: number;
        attachmentCount: number;
        coverColor: string | null;
        comments: string | null;
    }>;
    deleteMessage(tenantId: string, user: any, messageId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        userId: string;
        platform: string;
        externalId: string | null;
        metadata: string | null;
        attachments: string | null;
        content: string;
        roomId: string;
        pinned: boolean;
        deletedAt: Date | null;
    }>;
    listUsers(tenantId: string, user: any): Promise<{
        id: string;
        email: string;
        name: string | null;
        avatar: string | null;
        role: string;
    }[]>;
    uploadFile(user: any, tenantId: string, file?: any): Promise<{
        error: string;
        url?: undefined;
        name?: undefined;
        size?: undefined;
        mime?: undefined;
    } | {
        url: string;
        name: any;
        size: number;
        mime: any;
        error?: undefined;
    }>;
}
