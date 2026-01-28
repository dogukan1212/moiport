import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { NetgsmService } from '../integrations/netgsm/netgsm.service';
import { Smtp2goService } from '../integrations/smtp2go/smtp2go.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private netgsmService;
    private smtp2goService;
    constructor(prisma: PrismaService, jwtService: JwtService, netgsmService: NetgsmService, smtp2goService: Smtp2goService);
    private slugify;
    private getFrontendUrl;
    private normalizeUrlBase;
    private getEmailLogoUrl;
    private buildEmailVerifyLink;
    private getSystemConfig;
    private generateOtp;
    private otpExpiresAt;
    private buildOtpEmailHtml;
    private buildAuthResponseForUser;
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
    verifyEmail(data: {
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
    verifyEmailToken(data: {
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
    resendEmailVerification(data: {
        token: string;
    }): Promise<{
        status: string;
        expiresAt: Date;
    }>;
    verifyPhone(data: {
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
    resendPhoneVerification(data: {
        token: string;
    }): Promise<{
        status: string;
        expiresAt: Date;
    }>;
    verifyTwoFactor(data: {
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
    resendTwoFactor(data: {
        token: string;
    }): Promise<{
        status: string;
        expiresAt: Date;
    }>;
    requestPasswordReset(data: {
        email: string;
    }): Promise<{
        status: string;
        expiresAt?: undefined;
    } | {
        status: string;
        expiresAt: Date;
    }>;
    confirmPasswordReset(data: {
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
    getMe(userId: string): Promise<{
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
