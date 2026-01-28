"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let TenantsService = class TenantsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getStorageUsage(tenantId) {
        const dir = path.join(process.cwd(), 'uploads', tenantId);
        let size = 0;
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            files.forEach((f) => {
                const stats = fs.statSync(path.join(dir, f));
                size += stats.size;
            });
        }
        return size;
    }
    async checkStorageLimit(tenantId, additionalBytes) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { maxStorage: true },
        });
        if (!tenant || !tenant.maxStorage)
            return true;
        const currentUsage = this.getStorageUsage(tenantId);
        const maxBytes = tenant.maxStorage * 1024 * 1024;
        return currentUsage + additionalBytes <= maxBytes;
    }
    async getAllTenants() {
        const tenants = await this.prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        users: true,
                        customers: true,
                        projects: true,
                    },
                },
            },
        });
        return tenants.map((t) => ({
            ...t,
            storageUsage: this.getStorageUsage(t.id),
        }));
    }
    async deleteTenant(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true, slug: true },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        await this.prisma.$transaction(async (tx) => {
            const userIds = (await tx.user.findMany({
                where: { tenantId },
                select: { id: true },
            })).map((u) => u.id);
            const facebookConfigIds = (await tx.facebookConfig.findMany({
                where: { tenantId },
                select: { id: true },
            })).map((c) => c.id);
            const pipelineIds = (await tx.pipeline.findMany({
                where: { tenantId },
                select: { id: true },
            })).map((p) => p.id);
            if (facebookConfigIds.length > 0) {
                await tx.facebookLeadMapping.deleteMany({
                    where: { configId: { in: facebookConfigIds } },
                });
            }
            if (pipelineIds.length > 0) {
                await tx.facebookLeadMapping.deleteMany({
                    where: { pipelineId: { in: pipelineIds } },
                });
            }
            await tx.notification.deleteMany({ where: { tenantId } });
            await tx.columnWatcher.deleteMany({ where: { tenantId } });
            await tx.chatMessage.deleteMany({ where: { tenantId } });
            await tx.chatMembership.deleteMany({ where: { tenantId } });
            await tx.chatRoom.deleteMany({ where: { tenantId } });
            await tx.crmActivity.deleteMany({ where: { tenantId } });
            await tx.lead.deleteMany({ where: { tenantId } });
            await tx.pipeline.deleteMany({ where: { tenantId } });
            await tx.task.deleteMany({ where: { tenantId } });
            await tx.project.deleteMany({ where: { tenantId } });
            await tx.transaction.deleteMany({ where: { tenantId } });
            await tx.invoicePayment.deleteMany({ where: { tenantId } });
            await tx.invoice.deleteMany({ where: { tenantId } });
            await tx.recurringTransaction.deleteMany({ where: { tenantId } });
            await tx.employeeAdvance.deleteMany({ where: { tenantId } });
            await tx.payroll.deleteMany({ where: { tenantId } });
            await tx.socialMediaPost.deleteMany({ where: { tenantId } });
            await tx.socialMediaPlan.deleteMany({ where: { tenantId } });
            await tx.proposal.deleteMany({ where: { tenantId } });
            await tx.service.deleteMany({ where: { tenantId } });
            await tx.wordpressPost.deleteMany({ where: { tenantId } });
            await tx.wordpressSite.deleteMany({ where: { tenantId } });
            await tx.smsLog.deleteMany({ where: { tenantId } });
            await tx.smsTrigger.deleteMany({ where: { tenantId } });
            await tx.smsTemplate.deleteMany({ where: { tenantId } });
            await tx.smsSettings.deleteMany({ where: { tenantId } });
            await tx.whatsappConfig.deleteMany({ where: { tenantId } });
            await tx.facebookConfig.deleteMany({ where: { tenantId } });
            await tx.parasutConfig.deleteMany({ where: { tenantId } });
            await tx.paytrConfig.deleteMany({ where: { tenantId } });
            await tx.vatansmsConfig.deleteMany({ where: { tenantId } });
            await tx.netgsmConfig.deleteMany({ where: { tenantId } });
            await tx.subscriptionPayment.deleteMany({ where: { tenantId } });
            await tx.paymentMethod.deleteMany({ where: { tenantId } });
            await tx.authOtp.deleteMany({ where: { tenantId } });
            if (userIds.length > 0) {
                await tx.user.updateMany({
                    where: { id: { in: userIds } },
                    data: { customerId: null },
                });
            }
            await tx.customer.deleteMany({ where: { tenantId } });
            await tx.user.deleteMany({ where: { tenantId } });
            await tx.tenant.delete({ where: { id: tenantId } });
        });
        const uploadsDir = path.join(process.cwd(), 'uploads', tenantId);
        try {
            if (fs.existsSync(uploadsDir)) {
                fs.rmSync(uploadsDir, { recursive: true, force: true });
            }
        }
        catch (error) {
            void error;
        }
        return {
            status: 'deleted',
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
        };
    }
    async getTenantInfo(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                        customers: true,
                        projects: true,
                    },
                },
            },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        let finalStatus = tenant.subscriptionStatus;
        if (finalStatus !== 'SUSPENDED' && tenant.subscriptionEndsAt) {
            const now = new Date();
            console.log('Status Check:', {
                id: tenant.id,
                currentStatus: tenant.subscriptionStatus,
                endsAt: tenant.subscriptionEndsAt,
                now: now,
                isExpired: now > tenant.subscriptionEndsAt,
            });
            if (now > tenant.subscriptionEndsAt) {
                finalStatus = finalStatus === 'TRIAL' ? 'TRIAL_ENDED' : 'EXPIRED';
            }
        }
        return {
            ...tenant,
            subscriptionStatus: finalStatus,
            storageUsage: this.getStorageUsage(tenantId),
        };
    }
    async updateTenantSubscription(tenantId, data) {
        return this.prisma.tenant.update({
            where: { id: tenantId },
            data,
        });
    }
    async updateTenant(tenantId, data) {
        return this.prisma.tenant.update({
            where: { id: tenantId },
            data,
        });
    }
    async addUser(tenantId, data) {
        const existing = await this.prisma.user.findUnique({
            where: { email: (data.email || '').trim().toLowerCase() },
        });
        if (existing) {
            throw new Error('Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var.');
        }
        const hashedPassword = await bcrypt.hash('ajans123', 10);
        return this.prisma.user.create({
            data: {
                email: (data.email || '').trim().toLowerCase(),
                name: data.name,
                password: hashedPassword,
                role: data.role || 'STAFF',
                tenantId,
                phone: data.phone,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                salary: data.salary,
                iban: data.iban,
                tckn: data.tckn,
                address: data.address,
                birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
                jobTitle: data.jobTitle,
                department: data.department,
                emergencyContactName: data.emergencyContactName,
                emergencyContactPhone: data.emergencyContactPhone,
                bankName: data.bankName,
                bankBranch: data.bankBranch,
                bankAccountNumber: data.bankAccountNumber,
                maritalStatus: data.maritalStatus,
                childrenCount: data.childrenCount,
                bloodType: data.bloodType,
                educationLevel: data.educationLevel,
                contractType: data.contractType,
                socialSecurityNumber: data.socialSecurityNumber,
                taxNumber: data.taxNumber,
                weeklyHours: data.weeklyHours,
                probationMonths: data.probationMonths,
                confidentialityYears: data.confidentialityYears,
                nonCompeteMonths: data.nonCompeteMonths,
                penaltyAmount: data.penaltyAmount,
                equipmentList: data.equipmentList,
                benefits: data.benefits,
                performancePeriod: data.performancePeriod,
            },
        });
    }
    async removeUser(tenantId, userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, tenantId },
        });
        if (!user)
            throw new common_1.NotFoundException('Kullanıcı bulunamadı.');
        if (user.role === 'ADMIN') {
            const adminCount = await this.prisma.user.count({
                where: { tenantId, role: 'ADMIN' },
            });
            if (adminCount <= 1) {
                throw new Error('Sistemdeki son yöneticiyi silemezsiniz.');
            }
        }
        return this.prisma.user.delete({
            where: { id: userId },
        });
    }
    async updateUser(tenantId, userId, data) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, tenantId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Kullanıcı bulunamadı.');
        }
        const updateData = {};
        if (typeof data.name === 'string') {
            updateData.name = data.name;
        }
        if (typeof data.email === 'string') {
            const nextEmail = data.email.trim().toLowerCase();
            if (!nextEmail || !nextEmail.includes('@')) {
                throw new common_1.BadRequestException('Geçerli bir e-posta girin');
            }
            if (nextEmail !== user.email) {
                const existing = await this.prisma.user.findUnique({
                    where: { email: nextEmail },
                });
                if (existing && existing.id !== user.id) {
                    throw new common_1.BadRequestException('Bu e-posta adresi zaten kullanılıyor');
                }
                updateData.email = nextEmail;
            }
        }
        if (typeof data.role === 'string' && data.role) {
            const nextRole = data.role;
            if (user.role === 'ADMIN' && nextRole !== 'ADMIN') {
                const adminCount = await this.prisma.user.count({
                    where: { tenantId, role: 'ADMIN' },
                });
                if (adminCount <= 1) {
                    throw new common_1.BadRequestException('Sistemdeki son yöneticiyi değiştiremezsiniz.');
                }
            }
            updateData.role = nextRole;
        }
        if (typeof data.newPassword === 'string') {
            const nextPassword = data.newPassword;
            if (nextPassword.trim()) {
                if (nextPassword.length < 6) {
                    throw new common_1.BadRequestException('Şifre en az 6 karakter olmalı');
                }
                updateData.password = await bcrypt.hash(nextPassword, 10);
            }
        }
        if (!Object.keys(updateData).length) {
            return { status: 'ok' };
        }
        return this.prisma.user.update({
            where: { id: user.id },
            data: updateData,
        });
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map