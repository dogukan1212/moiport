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
exports.Smtp2goController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../../common/guards/auth.guard");
const smtp2go_service_1 = require("./smtp2go.service");
let Smtp2goController = class Smtp2goController {
    smtp2goService;
    constructor(smtp2goService) {
        this.smtp2goService = smtp2goService;
    }
    getSystemConfig() {
        return this.smtp2goService.getSystemConfig();
    }
    updateSystemConfig(body) {
        return this.smtp2goService.updateSystemConfig(body);
    }
    sendTestEmail(body) {
        return this.smtp2goService.sendTestEmail(body);
    }
};
exports.Smtp2goController = Smtp2goController;
__decorate([
    (0, common_1.Get)('system-config'),
    (0, common_1.UseGuards)(auth_guard_1.RolesGuard),
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Smtp2goController.prototype, "getSystemConfig", null);
__decorate([
    (0, common_1.Post)('system-config'),
    (0, common_1.UseGuards)(auth_guard_1.RolesGuard),
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], Smtp2goController.prototype, "updateSystemConfig", null);
__decorate([
    (0, common_1.Post)('test-email'),
    (0, common_1.UseGuards)(auth_guard_1.RolesGuard),
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], Smtp2goController.prototype, "sendTestEmail", null);
exports.Smtp2goController = Smtp2goController = __decorate([
    (0, common_1.Controller)('integrations/smtp2go'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [smtp2go_service_1.Smtp2goService])
], Smtp2goController);
//# sourceMappingURL=smtp2go.controller.js.map