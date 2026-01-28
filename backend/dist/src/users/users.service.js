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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId) {
        return this.prisma.user.findMany({
            where: {
                tenantId,
                isActive: true,
                role: { not: 'CLIENT' },
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
            },
            orderBy: { name: 'asc' },
        });
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const { password: _password, ...result } = user;
        return result;
    }
    async updateProfile(userId, data) {
        const allowedUpdates = {
            name: data.name,
            phone: data.phone,
            address: data.address,
            tckn: data.tckn,
            emergencyContactName: data.emergencyContactName,
            emergencyContactPhone: data.emergencyContactPhone,
            bankName: data.bankName,
            bankBranch: data.bankBranch,
            bankAccountNumber: data.bankAccountNumber,
            iban: data.iban,
            maritalStatus: data.maritalStatus,
            bloodType: data.bloodType,
            educationLevel: data.educationLevel,
        };
        if (data.birthDate) {
            allowedUpdates.birthDate = new Date(data.birthDate);
        }
        if (data.childrenCount !== undefined) {
            allowedUpdates.childrenCount = Number(data.childrenCount);
        }
        Object.keys(allowedUpdates).forEach((key) => allowedUpdates[key] === undefined && delete allowedUpdates[key]);
        return this.prisma.user.update({
            where: { id: userId },
            data: allowedUpdates,
        });
    }
    async updateAvatar(userId, avatarUrl) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarUrl },
        });
    }
    async changePassword(userId, oldPass, newPass) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const isMatch = await bcrypt.compare(oldPass, user.password);
        if (!isMatch) {
            throw new common_1.BadRequestException('Mevcut şifre yanlış');
        }
        const hashedPassword = await bcrypt.hash(newPass, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        return { message: 'Şifre başarıyla güncellendi' };
    }
    async create(data, tenantId) {
        const [tenant, userCount] = await Promise.all([
            this.prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { maxUsers: true },
            }),
            this.prisma.user.count({
                where: { tenantId, isActive: true },
            }),
        ]);
        if (tenant && tenant.maxUsers && userCount >= tenant.maxUsers) {
            throw new common_1.BadRequestException(`Kullanıcı limitine ulaşıldı (${tenant.maxUsers}). Lütfen paketinizi yükseltin.`);
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('Bu e-posta adresi zaten kullanılıyor.');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        return this.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role: data.role || 'STAFF',
                tenantId: tenantId,
                isActive: true,
            },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map