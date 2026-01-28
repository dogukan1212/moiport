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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const bcrypt = __importStar(require("bcrypt"));
let CustomersService = class CustomersService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    getCustomerPolicy(planCode) {
        switch (planCode) {
            case 'PRO':
                return { maxCustomers: 5, portalEnabled: true, crmEnabled: true };
            case 'ENTERPRISE':
                return { maxCustomers: null, portalEnabled: true, crmEnabled: true };
            case 'STARTER':
            default:
                return { maxCustomers: 0, portalEnabled: false, crmEnabled: false };
        }
    }
    async create(tenantId, data) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { subscriptionPlan: true },
        });
        const policy = this.getCustomerPolicy(tenant?.subscriptionPlan || undefined);
        if (policy.maxCustomers === 0) {
            throw new common_1.BadRequestException('Bu pakette müşteri ekleme özelliği bulunmuyor. Lütfen paketinizi yükseltin.');
        }
        if (Number.isFinite(policy.maxCustomers)) {
            const count = await this.prisma.customer.count({
                where: { tenantId },
            });
            if (count >= policy.maxCustomers) {
                throw new common_1.BadRequestException(`Müşteri limitine ulaşıldı (${policy.maxCustomers}). Lütfen paketinizi yükseltin.`);
            }
        }
        const customer = await this.prisma.customer.create({
            data: {
                ...data,
                tenantId,
            },
        });
        if (this.notificationsService) {
            const admins = await this.prisma.user.findMany({
                where: { tenantId, role: 'ADMIN', isActive: true },
                select: { id: true },
            });
            for (const admin of admins) {
                await this.notificationsService.create(tenantId, {
                    userId: admin.id,
                    title: 'Yeni Müşteri Eklendi',
                    message: `${customer.name} adlı müşteri sisteme eklendi.`,
                    type: 'CUSTOMER_CREATED',
                    referenceId: customer.id,
                    referenceType: 'CUSTOMER',
                });
            }
        }
        return customer;
    }
    async findAll(tenantId) {
        return this.prisma.customer.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { projects: true },
                },
            },
        });
    }
    async findOne(tenantId, id) {
        return this.prisma.customer.findFirst({
            where: { id, tenantId },
            include: {
                projects: true,
                proposals: true,
            },
        });
    }
    async update(tenantId, id, data) {
        return this.prisma.customer.updateMany({
            where: { id, tenantId },
            data,
        });
    }
    async remove(tenantId, id) {
        return this.prisma.customer.deleteMany({
            where: { id, tenantId },
        });
    }
    async getPortalUser(tenantId, customerId) {
        return this.prisma.user.findFirst({
            where: {
                tenantId,
                customerId,
                role: 'CLIENT',
            },
            select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
                allowedModules: true,
            },
        });
    }
    async createPortalUser(tenantId, customerId, data) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { subscriptionPlan: true },
        });
        const policy = this.getCustomerPolicy(tenant?.subscriptionPlan || undefined);
        if (!policy.portalEnabled) {
            throw new common_1.BadRequestException('Bu pakette müşteri paneli bulunmuyor. Lütfen paketinizi yükseltin.');
        }
        if (data.allowedModules?.includes('CRM') && !policy.crmEnabled) {
            throw new common_1.BadRequestException('Bu pakette CRM erişimi bulunmuyor. Lütfen paketinizi yükseltin.');
        }
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });
        if (!customer || customer.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Müşteri bulunamadı.');
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            if (existingUser.customerId === customerId &&
                existingUser.role === 'CLIENT') {
                const modulesStr = data.allowedModules
                    ? data.allowedModules.join(',')
                    : undefined;
                const updateData = {
                    name: data.name,
                    allowedModules: modulesStr,
                };
                if (data.password && data.password.trim()) {
                    updateData.password = await bcrypt.hash(data.password, 10);
                }
                return this.prisma.user.update({
                    where: { id: existingUser.id },
                    data: updateData,
                });
            }
            throw new common_1.BadRequestException('Bu e-posta adresi zaten kullanımda.');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const modulesStr = data.allowedModules ? data.allowedModules.join(',') : '';
        return this.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role: 'CLIENT',
                tenantId,
                customerId,
                allowedModules: modulesStr,
            },
        });
    }
    async removePortalUser(tenantId, customerId) {
        return this.prisma.user.deleteMany({
            where: {
                tenantId,
                customerId,
                role: 'CLIENT',
            },
        });
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map