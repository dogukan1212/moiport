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
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const notifications_service_1 = require("./notifications.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
let NotificationsController = class NotificationsController {
    notificationsService;
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    findAll(tenantId, user, limit) {
        const userId = typeof user?.userId === 'string'
            ? user.userId
            : typeof user?.id === 'string'
                ? user.id
                : String(user?.userId ?? user?.id ?? '');
        return this.notificationsService.findAll(tenantId, userId, limit ? parseInt(limit) : 20);
    }
    getUnreadCount(tenantId, user) {
        const userId = typeof user?.userId === 'string'
            ? user.userId
            : typeof user?.id === 'string'
                ? user.id
                : String(user?.userId ?? user?.id ?? '');
        return this.notificationsService.getUnreadCount(tenantId, userId);
    }
    markAsRead(tenantId, user, id) {
        const userId = typeof user?.userId === 'string'
            ? user.userId
            : typeof user?.id === 'string'
                ? user.id
                : String(user?.userId ?? user?.id ?? '');
        return this.notificationsService.markAsRead(tenantId, userId, id);
    }
    markAllAsRead(tenantId, user) {
        const userId = typeof user?.userId === 'string'
            ? user.userId
            : typeof user?.id === 'string'
                ? user.id
                : String(user?.userId ?? user?.id ?? '');
        return this.notificationsService.markAllAsRead(tenantId, userId);
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('unread-count'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "getUnreadCount", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Post)('read-all'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "markAllAsRead", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.Controller)('notifications'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map