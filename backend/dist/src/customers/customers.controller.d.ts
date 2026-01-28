import { CustomersService } from './customers.service';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(tenantId: string, data: {
        name: string;
        email?: string;
        phone?: string;
    }): Promise<{
        id: string;
        email: string | null;
        name: string;
        tenantId: string;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(tenantId: string): Promise<({
        _count: {
            projects: number;
        };
    } & {
        id: string;
        email: string | null;
        name: string;
        tenantId: string;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(tenantId: string, id: string): Promise<({
        projects: {
            id: string;
            name: string;
            tenantId: string;
            customerId: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            description: string | null;
        }[];
        proposals: {
            id: string;
            tenantId: string;
            customerId: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            status: string;
            metadata: string | null;
            content: string;
        }[];
    } & {
        id: string;
        email: string | null;
        name: string;
        tenantId: string;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    update(tenantId: string, id: string, data: {
        name?: string;
        email?: string;
        phone?: string;
    }): Promise<import("@prisma/client").Prisma.BatchPayload>;
    remove(tenantId: string, id: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    getPortalUser(tenantId: string, id: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        isActive: boolean;
        allowedModules: string | null;
    } | null>;
    createPortalUser(tenantId: string, id: string, data: {
        email: string;
        password: string;
        name: string;
        allowedModules?: string[];
    }): Promise<{
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
    }>;
    removePortalUser(tenantId: string, id: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
