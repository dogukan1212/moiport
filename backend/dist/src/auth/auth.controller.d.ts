import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        requiresEmailVerification: boolean;
        token: `${string}-${string}-${string}-${string}-${string}`;
        expiresAt: Date;
    }>;
    login(dto: LoginDto): Promise<{
        requiresEmailVerification: boolean;
        token: string;
        expiresAt: Date;
        requiresTwoFactor?: undefined;
        access_token?: undefined;
        user?: undefined;
    } | {
        requiresTwoFactor: boolean;
        token: `${string}-${string}-${string}-${string}-${string}`;
        expiresAt: Date;
        requiresEmailVerification?: undefined;
        access_token?: undefined;
        user?: undefined;
    } | {
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            role: string;
            tenantId: string;
            avatar: string | null;
            allowedModules: string | null;
            customerId: string | null;
        };
        requiresEmailVerification?: undefined;
        token?: undefined;
        expiresAt?: undefined;
        requiresTwoFactor?: undefined;
    }>;
    verifyPhone(body: {
        token: string;
        code: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            role: string;
            tenantId: string;
            avatar: string | null;
            allowedModules: string | null;
            customerId: string | null;
        };
    }>;
    verifyEmail(body: {
        token: string;
        code: string;
    }): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            tenantId: any;
            avatar: any;
            allowedModules: any;
            customerId: any;
        };
    }>;
    verifyEmailToken(body: {
        token: string;
    }): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            tenantId: any;
            avatar: any;
            allowedModules: any;
            customerId: any;
        };
    }>;
    resendPhoneVerification(body: {
        token: string;
    }): Promise<{
        status: string;
        expiresAt: Date;
    }>;
    resendEmailVerification(body: {
        token: string;
    }): Promise<{
        status: string;
        expiresAt: Date;
    }>;
    verifyTwoFactor(body: {
        token: string;
        code: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            role: string;
            tenantId: string;
            avatar: string | null;
            allowedModules: string | null;
            customerId: string | null;
        };
    }>;
    resendTwoFactor(body: {
        token: string;
    }): Promise<{
        status: string;
        expiresAt: Date;
    }>;
    requestPasswordReset(body: {
        email: string;
    }): Promise<{
        status: string;
        expiresAt?: undefined;
    } | {
        status: string;
        expiresAt: Date;
    }>;
    confirmPasswordReset(body: {
        email: string;
        code: string;
        newPassword: string;
    }): Promise<{
        status: string;
    }>;
    bootstrapAdmin(data: {
        email?: string;
        password?: string;
        agencyName?: string;
        secret?: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            role: string;
            tenantId: string;
            avatar: string | null;
        };
    }>;
    resetAdminPassword(data: {
        email: string;
        newPassword: string;
        secret?: string;
    }): Promise<{
        status: string;
    }>;
    getMe(user: any): Promise<{
        id: string;
        email: string;
        emailVerifiedAt: Date | null;
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
}
