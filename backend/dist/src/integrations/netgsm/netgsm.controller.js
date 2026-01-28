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
exports.NetgsmController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../../common/guards/auth.guard");
const user_decorator_1 = require("../../common/decorators/user.decorator");
const netgsm_service_1 = require("./netgsm.service");
let NetgsmController = class NetgsmController {
    netgsmService;
    constructor(netgsmService) {
        this.netgsmService = netgsmService;
    }
    getSystemConfig() {
        return this.netgsmService.getSystemConfig();
    }
    updateSystemConfig(body) {
        return this.netgsmService.updateSystemConfig(body);
    }
    getConfig(tenantId) {
        return this.netgsmService.getConfig(tenantId);
    }
    updateConfig(tenantId, body) {
        return this.netgsmService.updateConfig(tenantId, body);
    }
    async send(tenantId, body) {
        const result = await this.netgsmService.sendSms(tenantId, body.to, body.message, {
            msgheader: body.msgheader,
        });
        return { success: true, result };
    }
};
exports.NetgsmController = NetgsmController;
__decorate([
    (0, common_1.Get)('system-config'),
    (0, common_1.UseGuards)(auth_guard_1.RolesGuard),
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NetgsmController.prototype, "getSystemConfig", null);
__decorate([
    (0, common_1.Post)('system-config'),
    (0, common_1.UseGuards)(auth_guard_1.RolesGuard),
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NetgsmController.prototype, "updateSystemConfig", null);
__decorate([
    (0, common_1.Get)('config'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NetgsmController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)('config'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NetgsmController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NetgsmController.prototype, "send", null);
exports.NetgsmController = NetgsmController = __decorate([
    (0, common_1.Controller)('integrations/netgsm'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [netgsm_service_1.NetgsmService])
], NetgsmController);
//# sourceMappingURL=netgsm.controller.js.map