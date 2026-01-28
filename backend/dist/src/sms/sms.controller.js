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
exports.SmsController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../common/guards/auth.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
const sms_service_1 = require("./sms.service");
let SmsController = class SmsController {
    smsService;
    constructor(smsService) {
        this.smsService = smsService;
    }
    getSettings(tenantId) {
        return this.smsService.getSettings(tenantId);
    }
    updateSettings(tenantId, body) {
        return this.smsService.updateSettings(tenantId, body);
    }
    listTemplates(tenantId) {
        return this.smsService.listTemplates(tenantId);
    }
    createTemplate(tenantId, body) {
        return this.smsService.createTemplate(tenantId, body);
    }
    updateTemplate(tenantId, id, body) {
        return this.smsService.updateTemplate(tenantId, id, body);
    }
    deleteTemplate(tenantId, id) {
        return this.smsService.deleteTemplate(tenantId, id);
    }
    listTriggers(tenantId) {
        return this.smsService.listTriggers(tenantId);
    }
    updateTrigger(tenantId, id, body) {
        return this.smsService.updateTrigger(tenantId, id, body);
    }
    sendManual(tenantId, body) {
        return this.smsService.sendManual(tenantId, body);
    }
};
exports.SmsController = SmsController;
__decorate([
    (0, common_1.Get)('settings'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SmsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Post)('settings'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SmsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SmsController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SmsController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Patch)('templates/:id'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SmsController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SmsController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Get)('triggers'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SmsController.prototype, "listTriggers", null);
__decorate([
    (0, common_1.Patch)('triggers/:id'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SmsController.prototype, "updateTrigger", null);
__decorate([
    (0, common_1.Post)('send'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SmsController.prototype, "sendManual", null);
exports.SmsController = SmsController = __decorate([
    (0, common_1.Controller)('sms'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, auth_guard_1.RolesGuard),
    __metadata("design:paramtypes", [sms_service_1.SmsService])
], SmsController);
//# sourceMappingURL=sms.controller.js.map