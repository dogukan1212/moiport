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
exports.WordpressController = void 0;
const common_1 = require("@nestjs/common");
const wordpress_service_1 = require("./wordpress.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
const path_1 = require("path");
let WordpressController = class WordpressController {
    wordpressService;
    constructor(wordpressService) {
        this.wordpressService = wordpressService;
    }
    downloadPlugin(res) {
        const filePath = (0, path_1.join)(process.cwd(), 'plugins', 'moi-port.zip');
        const fs = require('fs');
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            return res.status(404).send('Plugin dosyası bulunamadı.');
        }
        return res.download(filePath, 'moi-port.zip', (err) => {
            if (err) {
                console.error('Download error:', err);
                if (!res.headersSent) {
                    res.status(500).send('Dosya indirilemedi.');
                }
            }
        });
    }
    findAll(tenantId) {
        return this.wordpressService.findAll(tenantId);
    }
    findOne(tenantId, id) {
        return this.wordpressService.findOne(tenantId, id);
    }
    create(tenantId, data) {
        return this.wordpressService.create(tenantId, data);
    }
    getCategories(tenantId, id) {
        return this.wordpressService.getCategories(tenantId, id);
    }
    getKpi(tenantId, id) {
        return this.wordpressService.getKpi(tenantId, id);
    }
    listPosts(tenantId, id) {
        return this.wordpressService.listPosts(tenantId, id);
    }
    createPost(tenantId, id, data) {
        return this.wordpressService.createPost(tenantId, id, data);
    }
    updatePost(tenantId, id, postId, data) {
        return this.wordpressService.updatePost(tenantId, id, postId, data);
    }
    deletePost(tenantId, id, postId) {
        return this.wordpressService.deletePost(tenantId, id, postId);
    }
    update(tenantId, id, data) {
        return this.wordpressService.update(tenantId, id, data);
    }
    remove(tenantId, id) {
        return this.wordpressService.delete(tenantId, id);
    }
};
exports.WordpressController = WordpressController;
__decorate([
    (0, auth_guard_1.Public)(),
    (0, common_1.Get)('download-plugin'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WordpressController.prototype, "downloadPlugin", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WordpressController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WordpressController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WordpressController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id/categories'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WordpressController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)(':id/kpi'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WordpressController.prototype, "getKpi", null);
__decorate([
    (0, common_1.Get)(':id/posts'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WordpressController.prototype, "listPosts", null);
__decorate([
    (0, common_1.Post)(':id/posts'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], WordpressController.prototype, "createPost", null);
__decorate([
    (0, common_1.Patch)(':id/posts/:postId'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('postId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], WordpressController.prototype, "updatePost", null);
__decorate([
    (0, common_1.Delete)(':id/posts/:postId'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], WordpressController.prototype, "deletePost", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], WordpressController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WordpressController.prototype, "remove", null);
exports.WordpressController = WordpressController = __decorate([
    (0, common_1.Controller)('wordpress-sites'),
    __metadata("design:paramtypes", [wordpress_service_1.WordpressService])
], WordpressController);
//# sourceMappingURL=wordpress.controller.js.map