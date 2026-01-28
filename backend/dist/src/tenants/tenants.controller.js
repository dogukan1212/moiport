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
exports.TenantsController = void 0;
const common_1 = require("@nestjs/common");
const tenants_service_1 = require("./tenants.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
let TenantsController = class TenantsController {
    tenantsService;
    constructor(tenantsService) {
        this.tenantsService = tenantsService;
    }
    findAll() {
        return this.tenantsService.getAllTenants();
    }
    findOneForAdmin(id) {
        return this.tenantsService.getTenantInfo(id);
    }
    updateSubscription(id, data) {
        return this.tenantsService.updateTenantSubscription(id, {
            ...data,
            subscriptionEndsAt: data.subscriptionEndsAt
                ? new Date(data.subscriptionEndsAt)
                : data.subscriptionEndsAt === null
                    ? null
                    : undefined,
        });
    }
    deleteTenant(id) {
        return this.tenantsService.deleteTenant(id);
    }
    addUserByAdmin(tenantId, data) {
        return this.tenantsService.addUser(tenantId, {
            ...data,
        });
    }
    getMe(tenantId) {
        return this.tenantsService.getTenantInfo(tenantId);
    }
    updateMe(tenantId, data) {
        return this.tenantsService.updateTenant(tenantId, data);
    }
    addUser(tenantId, data) {
        return this.tenantsService.addUser(tenantId, data);
    }
    removeUser(tenantId, userId) {
        return this.tenantsService.removeUser(tenantId, userId);
    }
    updateUser(tenantId, userId, data) {
        return this.tenantsService.updateUser(tenantId, userId, data);
    }
};
exports.TenantsController = TenantsController;
__decorate([
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "findAll", null);
__decorate([
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    (0, common_1.Get)(':id/admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "findOneForAdmin", null);
__decorate([
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    (0, common_1.Patch)(':id/subscription'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "updateSubscription", null);
__decorate([
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "deleteTenant", null);
__decorate([
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    (0, common_1.Post)(':id/users'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "addUserByAdmin", null);
__decorate([
    (0, auth_guard_1.Roles)('ADMIN', 'CLIENT', 'STAFF'),
    (0, common_1.Get)('me'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "getMe", null);
__decorate([
    (0, auth_guard_1.Roles)('ADMIN'),
    (0, common_1.Patch)('me'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "updateMe", null);
__decorate([
    (0, common_1.Post)('users'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "addUser", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "removeUser", null);
__decorate([
    (0, common_1.Patch)('users/:id'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "updateUser", null);
exports.TenantsController = TenantsController = __decorate([
    (0, common_1.Controller)('tenants'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, auth_guard_1.RolesGuard),
    (0, auth_guard_1.Roles)('ADMIN', 'HR', 'SUPER_ADMIN'),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService])
], TenantsController);
//# sourceMappingURL=tenants.controller.js.map