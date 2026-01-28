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
exports.JwtStrategy = void 0;
const passport_jwt_1 = require("passport-jwt");
const passport_1 = require("@nestjs/passport");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    prisma;
    constructor(prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'ajans-gizli-anahtar-2026',
        });
        this.prisma = prisma;
    }
    async validate(payload) {
        const tenantId = payload?.tenantId;
        const userId = payload?.sub;
        if (!tenantId || !userId) {
            throw new common_1.UnauthorizedException('Geçersiz oturum.');
        }
        const [tenant, user] = await Promise.all([
            this.prisma.tenant.findUnique({
                where: { id: tenantId },
                select: {
                    id: true,
                    subscriptionStatus: true,
                    subscriptionEndsAt: true,
                },
            }),
            this.prisma.user.findFirst({
                where: { id: userId, tenantId },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    tenantId: true,
                    customerId: true,
                },
            }),
        ]);
        if (!tenant || !user) {
            throw new common_1.UnauthorizedException('Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.');
        }
        if (tenant.subscriptionStatus === 'SUSPENDED') {
        }
        let finalStatus = tenant.subscriptionStatus;
        if (finalStatus !== 'SUSPENDED' && tenant.subscriptionEndsAt) {
            const now = new Date();
            const endsAt = new Date(tenant.subscriptionEndsAt);
            if (now > endsAt) {
                finalStatus = finalStatus === 'TRIAL' ? 'TRIAL_ENDED' : 'EXPIRED';
            }
        }
        return {
            userId: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role,
            customerId: user.customerId,
            subscriptionStatus: finalStatus,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map