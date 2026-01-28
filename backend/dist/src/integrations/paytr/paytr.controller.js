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
exports.PaytrController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../../common/guards/auth.guard");
const user_decorator_1 = require("../../common/decorators/user.decorator");
const paytr_service_1 = require("./paytr.service");
let PaytrController = class PaytrController {
    paytrService;
    constructor(paytrService) {
        this.paytrService = paytrService;
    }
    getSystemConfig() {
        return this.paytrService.getSystemConfig();
    }
    updateSystemConfig(body) {
        return this.paytrService.updateSystemConfig(body);
    }
    getConfig(tenantId) {
        return this.paytrService.getConfig(tenantId);
    }
    updateConfig(tenantId, body) {
        return this.paytrService.updateConfig(tenantId, body);
    }
};
exports.PaytrController = PaytrController;
__decorate([
    (0, common_1.Get)('system-config'),
    (0, common_1.UseGuards)(auth_guard_1.RolesGuard),
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaytrController.prototype, "getSystemConfig", null);
__decorate([
    (0, common_1.Post)('system-config'),
    (0, common_1.UseGuards)(auth_guard_1.RolesGuard),
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaytrController.prototype, "updateSystemConfig", null);
__decorate([
    (0, common_1.Get)('config'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaytrController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)('config'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PaytrController.prototype, "updateConfig", null);
exports.PaytrController = PaytrController = __decorate([
    (0, common_1.Controller)('integrations/paytr'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [paytr_service_1.PaytrService])
], PaytrController);
//# sourceMappingURL=paytr.controller.js.map