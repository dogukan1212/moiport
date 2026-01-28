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
exports.SocialMediaController = void 0;
const common_1 = require("@nestjs/common");
const social_media_service_1 = require("./social-media.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
let SocialMediaController = class SocialMediaController {
    socialMediaService;
    constructor(socialMediaService) {
        this.socialMediaService = socialMediaService;
    }
    create(tenantId, data) {
        return this.socialMediaService.create(tenantId, data);
    }
    createPlan(tenantId, data) {
        return this.socialMediaService.createPlan(tenantId, data);
    }
    findAllPlans(tenantId, user, queryCustomerId) {
        const customerId = user.role === 'CLIENT' ? user.customerId : queryCustomerId;
        const safeCustomerId = typeof customerId === 'string' ? customerId : undefined;
        return this.socialMediaService.findAllPlans(tenantId, safeCustomerId);
    }
    findOnePlan(tenantId, user, id) {
        return this.socialMediaService.findOnePlan(tenantId, id, user);
    }
    updatePlan(tenantId, id, data) {
        return this.socialMediaService.updatePlan(tenantId, id, data);
    }
    removePlan(tenantId, id) {
        return this.socialMediaService.removePlan(tenantId, id);
    }
    findAll(tenantId, user, queryCustomerId) {
        const customerId = user.role === 'CLIENT' ? user.customerId : queryCustomerId;
        const safeCustomerId = typeof customerId === 'string' ? customerId : undefined;
        return this.socialMediaService.findAll(tenantId, safeCustomerId);
    }
    findOne(tenantId, id) {
        return this.socialMediaService.findOne(tenantId, id);
    }
    update(tenantId, id, data) {
        return this.socialMediaService.update(tenantId, id, data);
    }
    remove(tenantId, id) {
        return this.socialMediaService.remove(tenantId, id);
    }
};
exports.SocialMediaController = SocialMediaController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SocialMediaController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('plans'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SocialMediaController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Get)('plans'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Query)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], SocialMediaController.prototype, "findAllPlans", null);
__decorate([
    (0, common_1.Get)('plans/:id'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], SocialMediaController.prototype, "findOnePlan", null);
__decorate([
    (0, common_1.Patch)('plans/:id'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SocialMediaController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Delete)('plans/:id'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SocialMediaController.prototype, "removePlan", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Query)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], SocialMediaController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SocialMediaController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SocialMediaController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SocialMediaController.prototype, "remove", null);
exports.SocialMediaController = SocialMediaController = __decorate([
    (0, common_1.Controller)('social-media'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [social_media_service_1.SocialMediaService])
], SocialMediaController);
//# sourceMappingURL=social-media.controller.js.map