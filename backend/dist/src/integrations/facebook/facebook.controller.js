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
exports.FacebookController = void 0;
const common_1 = require("@nestjs/common");
const facebook_service_1 = require("./facebook.service");
const auth_guard_1 = require("../../common/guards/auth.guard");
const user_decorator_1 = require("../../common/decorators/user.decorator");
let FacebookController = class FacebookController {
    facebookService;
    constructor(facebookService) {
        this.facebookService = facebookService;
    }
    getSystemConfig() {
        return this.facebookService.getSystemConfig();
    }
    updateSystemConfig(data) {
        return this.facebookService.updateSystemConfig(data);
    }
    async getAuthUrl(tenantId) {
        const url = await this.facebookService.getAuthUrl(tenantId);
        return { url };
    }
    async handleCallback(code, state, res) {
        const tenantId = state;
        try {
            await this.facebookService.handleCallback(code, tenantId);
            const frontendUrl = process.env.FRONTEND_URL || 'https://kolayentegrasyon.com';
            return res.redirect(`${frontendUrl}/dashboard/settings?tab=facebook&success=true`);
        }
        catch (error) {
            console.error('Facebook Callback Error:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'https://kolayentegrasyon.com';
            return res.redirect(`${frontendUrl}/dashboard/settings?tab=facebook&error=auth_failed`);
        }
    }
    getConfig(tenantId, user) {
        return this.facebookService.getConfig(tenantId, user);
    }
    updateConfig(tenantId, data, user) {
        return this.facebookService.updateConfig(tenantId, data, user);
    }
    getPages(accessToken) {
        return this.facebookService.getPages(accessToken);
    }
    getForms(pageId, accessToken) {
        return this.facebookService.getForms(pageId, accessToken);
    }
    getFormFields(formId, accessToken) {
        return this.facebookService.getFormFields(formId, accessToken);
    }
    addMapping(tenantId, data) {
        return this.facebookService.addMapping(tenantId, data);
    }
    updateMapping(id, data) {
        return this.facebookService.updateMapping(id, data);
    }
    deleteMapping(id) {
        return this.facebookService.deleteMapping(id);
    }
    importLeads(tenantId, mappingId) {
        return this.facebookService.importLeads(tenantId, mappingId);
    }
    testConnection(tenantId) {
        return this.facebookService.testConnection(tenantId);
    }
    previewSync(tenantId) {
        console.log(`[FacebookController] previewSync called for tenant: ${tenantId}`);
        return this.facebookService.previewMessages(tenantId);
    }
    confirmSync(tenantId) {
        return this.facebookService.confirmSync(tenantId);
    }
    clearLeads(tenantId) {
        return this.facebookService.clearFacebookLeads(tenantId);
    }
};
exports.FacebookController = FacebookController;
__decorate([
    (0, common_1.Get)('system-config'),
    (0, common_1.UseGuards)(auth_guard_1.RolesGuard),
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FacebookController.prototype, "getSystemConfig", null);
__decorate([
    (0, common_1.Post)('system-config'),
    (0, common_1.UseGuards)(auth_guard_1.RolesGuard),
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FacebookController.prototype, "updateSystemConfig", null);
__decorate([
    (0, common_1.Get)('auth-url'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FacebookController.prototype, "getAuthUrl", null);
__decorate([
    (0, auth_guard_1.Public)(),
    (0, common_1.Get)('callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], FacebookController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Get)('config'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FacebookController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)('config'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], FacebookController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Post)('pages'),
    __param(0, (0, common_1.Body)('accessToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FacebookController.prototype, "getPages", null);
__decorate([
    (0, common_1.Post)('forms/:pageId'),
    __param(0, (0, common_1.Param)('pageId')),
    __param(1, (0, common_1.Body)('accessToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FacebookController.prototype, "getForms", null);
__decorate([
    (0, common_1.Post)('form-fields/:formId'),
    __param(0, (0, common_1.Param)('formId')),
    __param(1, (0, common_1.Body)('accessToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FacebookController.prototype, "getFormFields", null);
__decorate([
    (0, common_1.Post)('mappings'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FacebookController.prototype, "addMapping", null);
__decorate([
    (0, common_1.Patch)('mappings/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FacebookController.prototype, "updateMapping", null);
__decorate([
    (0, common_1.Delete)('mappings/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FacebookController.prototype, "deleteMapping", null);
__decorate([
    (0, common_1.Post)('import-leads/:mappingId'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('mappingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FacebookController.prototype, "importLeads", null);
__decorate([
    (0, common_1.Post)('test-connection'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FacebookController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Get)('preview-sync'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FacebookController.prototype, "previewSync", null);
__decorate([
    (0, common_1.Post)('confirm-sync'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FacebookController.prototype, "confirmSync", null);
__decorate([
    (0, common_1.Post)('clear-leads'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FacebookController.prototype, "clearLeads", null);
exports.FacebookController = FacebookController = __decorate([
    (0, common_1.Controller)('integrations/facebook'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [facebook_service_1.FacebookService])
], FacebookController);
//# sourceMappingURL=facebook.controller.js.map