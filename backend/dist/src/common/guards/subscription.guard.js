"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const core_1 = require("@nestjs/core");
const auth_guard_1 = require("./auth.guard");
let SubscriptionGuard = class SubscriptionGuard {
    prisma;
    reflector;
    constructor(prisma, reflector) {
        this.prisma = prisma;
        this.reflector = reflector;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(auth_guard_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (user?.role === 'SUPER_ADMIN') {
            return true;
        }
        if (!user?.tenantId) {
            return true;
        }
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: user.tenantId },
            select: { subscriptionStatus: true },
        });
        if (!tenant) {
            throw new common_1.ForbiddenException('Ajans bulunamadı.');
        }
        if (tenant.subscriptionStatus === 'SUSPENDED') {
            throw new common_1.ForbiddenException('Aboneliğiniz askıya alınmıştır. Lütfen sistem yöneticisi ile iletişime geçin.');
        }
        if (tenant.subscriptionStatus === 'CANCELED') {
            throw new common_1.ForbiddenException('Aboneliğiniz iptal edilmiştir.');
        }
        return true;
    }
};
exports.SubscriptionGuard = SubscriptionGuard;
exports.SubscriptionGuard = SubscriptionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        core_1.Reflector])
], SubscriptionGuard);
//# sourceMappingURL=subscription.guard.js.map