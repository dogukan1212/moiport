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
exports.AIController = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const pexels_service_1 = require("./pexels.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
let AIController = class AIController {
    aiService;
    pexelsService;
    constructor(aiService, pexelsService) {
        this.aiService = aiService;
        this.pexelsService = pexelsService;
    }
    async suggestImages(query, perPage, locale) {
        return this.pexelsService.searchPhotos(query, perPage, locale);
    }
    async analyzeSector(tenantId, sector, customerUrl, customerIg, deepSearch) {
        return this.aiService.analyzeSector(tenantId, sector, customerUrl, customerIg, deepSearch);
    }
    async generateSmartPrompt(tenantId, data) {
        return this.aiService.generateSmartPrompt(tenantId, data);
    }
    async analyzeSite(tenantId, url, deepSearch, siteId) {
        return this.aiService.analyzeSite(tenantId, url, deepSearch, siteId);
    }
    async suggestTitles(tenantId, data) {
        return this.aiService.suggestTitles(tenantId, data);
    }
    async generateContent(tenantId, data) {
        return this.aiService.generateContent(tenantId, data);
    }
    async generateProposal(tenantId, data) {
        return this.aiService.generateProposal(tenantId, data);
    }
    async financeInsights(tenantId, data, options, context) {
        return this.aiService.financeInsights(tenantId, data, options, context);
    }
    async financeQA(tenantId, data, options, context) {
        return this.aiService.financeQA(tenantId, data, options, context);
    }
    async testConnection() {
        return this.aiService.testGemini();
    }
    async whatsappSmartReplies(tenantId, messages, aiModel) {
        const replies = await this.aiService.generateSmartReplies(Array.isArray(messages) ? messages : []);
        return { replies };
    }
};
exports.AIController = AIController;
__decorate([
    (0, common_1.Post)('suggest-images'),
    __param(0, (0, common_1.Body)('query')),
    __param(1, (0, common_1.Body)('perPage')),
    __param(2, (0, common_1.Body)('locale')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "suggestImages", null);
__decorate([
    (0, common_1.Post)('analyze-sector'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)('sector')),
    __param(2, (0, common_1.Body)('customerUrl')),
    __param(3, (0, common_1.Body)('customerIg')),
    __param(4, (0, common_1.Body)('deepSearch')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Boolean]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "analyzeSector", null);
__decorate([
    (0, common_1.Post)('generate-prompt'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "generateSmartPrompt", null);
__decorate([
    (0, common_1.Post)('analyze-site'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)('url')),
    __param(2, (0, common_1.Body)('deepSearch')),
    __param(3, (0, common_1.Body)('siteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean, String]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "analyzeSite", null);
__decorate([
    (0, common_1.Post)('suggest-titles'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "suggestTitles", null);
__decorate([
    (0, common_1.Post)('generate-content'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "generateContent", null);
__decorate([
    (0, common_1.Post)('generate-proposal'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "generateProposal", null);
__decorate([
    (0, common_1.Post)('finance/insights'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Body)('options')),
    __param(3, (0, common_1.Body)('context')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "financeInsights", null);
__decorate([
    (0, common_1.Post)('finance/qa'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Body)('options')),
    __param(3, (0, common_1.Body)('context')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "financeQA", null);
__decorate([
    (0, common_1.Get)('test-connection'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AIController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Post)('whatsapp/smart-replies'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)('messages')),
    __param(2, (0, common_1.Body)('aiModel')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, String]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "whatsappSmartReplies", null);
exports.AIController = AIController = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ai_service_1.AIService,
        pexels_service_1.PexelsService])
], AIController);
//# sourceMappingURL=ai.controller.js.map