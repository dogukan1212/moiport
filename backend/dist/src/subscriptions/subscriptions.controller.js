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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const subscriptions_service_1 = require("./subscriptions.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
let SubscriptionsController = class SubscriptionsController {
    service;
    constructor(service) {
        this.service = service;
    }
    findPlans() {
        return this.service.findPlans();
    }
    listPublicPlans() {
        return this.service.findPlans();
    }
    getInstallments(data) {
        return this.service.getPaytrInstallments(data.bin, data.amount);
    }
    getMySubscription(tenantId) {
        return this.service.getTenantSubscription(tenantId);
    }
    initPaytr(tenantId, req, data) {
        return this.service.initPaytrPayment(tenantId, this.getRequestIp(req), data.planCode, data.period, data.method, data.promoCode, data.installments, data.billing, data.card);
    }
    paytrCallback(payload) {
        return this.service.handlePaytrCallback(payload);
    }
    getRequestIp(req) {
        const xff = String(req.headers['x-forwarded-for'] || '')
            .split(',')[0]
            ?.trim();
        if (xff)
            return xff;
        const realIp = String(req.headers['x-real-ip'] || '').trim();
        if (realIp)
            return realIp;
        return String(req.ip || '').trim();
    }
    listAllPlans() {
        return this.service.findPlans();
    }
    createPlan(data) {
        return this.service.createPlan(data);
    }
    updatePlan(code, data) {
        return this.service.updatePlan(code, data);
    }
};
exports.SubscriptionsController = SubscriptionsController;
__decorate([
    (0, common_1.Get)('plans'),
    (0, auth_guard_1.Roles)('ADMIN', 'HR', 'SUPER_ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "findPlans", null);
__decorate([
    (0, auth_guard_1.Public)(),
    (0, common_1.Get)('public/plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "listPublicPlans", null);
__decorate([
    (0, common_1.Post)('paytr/installments'),
    (0, auth_guard_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "getInstallments", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, auth_guard_1.Roles)('ADMIN', 'HR', 'STAFF'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "getMySubscription", null);
__decorate([
    (0, common_1.Post)('paytr/init'),
    (0, auth_guard_1.Roles)('ADMIN'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "initPaytr", null);
__decorate([
    (0, common_1.Post)('paytr/callback'),
    (0, auth_guard_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "paytrCallback", null);
__decorate([
    (0, common_1.Get)('admin/plans'),
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "listAllPlans", null);
__decorate([
    (0, common_1.Post)('admin/plans'),
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Patch)('admin/plans/:code'),
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "updatePlan", null);
exports.SubscriptionsController = SubscriptionsController = __decorate([
    (0, common_1.Controller)('subscriptions'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, auth_guard_1.RolesGuard),
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService])
], SubscriptionsController);
//# sourceMappingURL=subscriptions.controller.js.map