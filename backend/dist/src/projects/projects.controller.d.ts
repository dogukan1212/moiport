import { ProjectsService } from './projects.service';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    findAll(tenantId: string, user: any, customerId?: string): Promise<({
        customer: {
            id: string;
            name: string;
        };
        _count: {
            tasks: number;
        };
    } & {
        id: string;
        name: string;
        tenantId: string;
        customerId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
    })[]>;
    findOne(id: string, tenantId: string, user: any): Promise<({
        customer: {
            id: string;
            email: string | null;
            name: string;
            tenantId: string;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        tasks: ({
            assignee: {
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
            } | null;
        } & {
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
        })[];
    } & {
        id: string;
        name: string;
        tenantId: string;
        customerId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
    }) | null>;
    create(tenantId: string, user: any, data: any): Promise<{
        id: string;
        name: string;
        tenantId: string;
        customerId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
    }>;
    update(id: string, tenantId: string, data: any): Promise<{
        id: string;
        name: string;
        tenantId: string;
        customerId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
    }>;
    remove(id: string, tenantId: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        customerId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        description: string | null;
    }>;
}
