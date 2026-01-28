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
exports.ParasutController = void 0;
const common_1 = require("@nestjs/common");
const parasut_service_1 = require("./parasut.service");
const auth_guard_1 = require("../../common/guards/auth.guard");
const user_decorator_1 = require("../../common/decorators/user.decorator");
let ParasutController = class ParasutController {
    parasutService;
    constructor(parasutService) {
        this.parasutService = parasutService;
    }
    getConfig(tenantId, user) {
        return this.parasutService.getConfig(tenantId, user);
    }
    updateConfig(tenantId, body, user) {
        return this.parasutService.updateConfig(tenantId, body, user);
    }
    disconnect(tenantId, user) {
        return this.parasutService.disconnect(tenantId, user);
    }
    async getAuthUrl(tenantId, user) {
        const url = await this.parasutService.getAuthUrl(tenantId, user);
        return { url };
    }
    async handleCallback(code, state, res) {
        const frontendUrl = process.env.FRONTEND_URL || 'https://kolayentegrasyon.com';
        try {
            await this.parasutService.handleCallback(code, state);
            return res.redirect(`${frontendUrl}/dashboard/settings?tab=parasut&success=true`);
        }
        catch (error) {
            console.error('Parasut Callback Error:', error);
            return res.redirect(`${frontendUrl}/dashboard/settings?tab=parasut&error=auth_failed`);
        }
    }
    getMe(tenantId, user) {
        return this.parasutService.getMe(tenantId, user);
    }
};
exports.ParasutController = ParasutController;
__decorate([
    (0, common_1.Get)('config'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ParasutController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)('config'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ParasutController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Post)('disconnect'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ParasutController.prototype, "disconnect", null);
__decorate([
    (0, common_1.Get)('auth-url'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ParasutController.prototype, "getAuthUrl", null);
__decorate([
    (0, auth_guard_1.Public)(),
    (0, common_1.Get)('callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ParasutController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ParasutController.prototype, "getMe", null);
exports.ParasutController = ParasutController = __decorate([
    (0, common_1.Controller)('integrations/parasut'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [parasut_service_1.ParasutService])
], ParasutController);
//# sourceMappingURL=parasut.controller.js.map