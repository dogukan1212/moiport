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
exports.TrelloController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../../common/guards/auth.guard");
const user_decorator_1 = require("../../common/decorators/user.decorator");
const trello_service_1 = require("./trello.service");
let TrelloController = class TrelloController {
    trelloService;
    constructor(trelloService) {
        this.trelloService = trelloService;
    }
    getConfig(tenantId) {
        return this.trelloService.getConfig(tenantId);
    }
    updateConfig(tenantId, body) {
        return this.trelloService.updateConfig(tenantId, body);
    }
    testAuth(tenantId) {
        return this.trelloService.testAuth(tenantId);
    }
    listBoards(tenantId) {
        return this.trelloService.listBoards(tenantId);
    }
    listBoardLists(tenantId, boardId) {
        return this.trelloService.listBoardLists(tenantId, boardId);
    }
    importBoard(tenantId, body) {
        return this.trelloService.importBoardToProject(tenantId, body);
    }
};
exports.TrelloController = TrelloController;
__decorate([
    (0, common_1.Get)('config'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TrelloController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)('config'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TrelloController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Get)('test'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TrelloController.prototype, "testAuth", null);
__decorate([
    (0, common_1.Get)('boards'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TrelloController.prototype, "listBoards", null);
__decorate([
    (0, common_1.Get)('boards/:boardId/lists'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('boardId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TrelloController.prototype, "listBoardLists", null);
__decorate([
    (0, common_1.Post)('import/board'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TrelloController.prototype, "importBoard", null);
exports.TrelloController = TrelloController = __decorate([
    (0, common_1.Controller)('integrations/trello'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [trello_service_1.TrelloService])
], TrelloController);
//# sourceMappingURL=trello.controller.js.map