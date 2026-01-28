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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const tenants_service_1 = require("../tenants/tenants.service");
let UsersController = class UsersController {
    usersService;
    tenantsService;
    constructor(usersService, tenantsService) {
        this.usersService = usersService;
        this.tenantsService = tenantsService;
    }
    getProfile(user) {
        const userId = typeof user?.userId === 'string'
            ? user.userId
            : String(user?.userId ?? user?.id ?? '');
        return this.usersService.getProfile(userId);
    }
    updateProfile(user, data) {
        const userId = typeof user?.userId === 'string'
            ? user.userId
            : String(user?.userId ?? user?.id ?? '');
        return this.usersService.updateProfile(userId, data);
    }
    changePassword(user, data) {
        const userId = typeof user?.userId === 'string'
            ? user.userId
            : String(user?.userId ?? user?.id ?? '');
        const oldPassword = String(data?.oldPassword ?? '');
        const newPassword = String(data?.newPassword ?? '');
        return this.usersService.changePassword(userId, oldPassword, newPassword);
    }
    async uploadAvatar(user, tenantId, file) {
        console.log('Upload avatar called for user:', user);
        console.log('File:', file);
        if (!file) {
            throw new Error('File is undefined in controller');
        }
        if (user.role !== 'SUPER_ADMIN') {
            const fileSize = Number(file?.size ?? 0);
            const isAllowed = await this.tenantsService.checkStorageLimit(tenantId, fileSize);
            if (!isAllowed) {
                const fs = require('fs');
                const filePath = typeof file.path === 'string' ? file.path : String(file.path ?? '');
                if (filePath && fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                return {
                    error: `Depolama limitine ulaşıldı. Profil resmi yüklenemedi.`,
                };
            }
        }
        const avatarUrl = `/uploads/avatars/${String(file.filename ?? '')}`;
        const userId = typeof user?.userId === 'string'
            ? user.userId
            : String(user?.userId ?? user?.id ?? '');
        return this.usersService.updateAvatar(userId, avatarUrl);
    }
    async findAll(tenantId) {
        return this.usersService.findAll(tenantId);
    }
    create(user, data) {
        const tenantId = typeof user?.tenantId === 'string'
            ? user.tenantId
            : String(user?.tenantId ?? '');
        return this.usersService.create(data, tenantId);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('me'),
    __param(0, (0, user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('me/password'),
    __param(0, (0, user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('me/avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/avatars',
            filename: (req, file, cb) => {
                const randomName = Array(32)
                    .fill(null)
                    .map(() => Math.round(Math.random() * 16).toString(16))
                    .join('');
                cb(null, `${randomName}${(0, path_1.extname)(String(file.originalname ?? ''))}`);
            },
        }),
    })),
    __param(0, (0, user_decorator_1.GetUser)()),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        tenants_service_1.TenantsService])
], UsersController);
//# sourceMappingURL=users.controller.js.map