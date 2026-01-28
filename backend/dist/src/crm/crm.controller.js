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
exports.CrmController = void 0;
const common_1 = require("@nestjs/common");
const crm_service_1 = require("./crm.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
const create_lead_dto_1 = require("./dto/create-lead.dto");
const create_pipeline_dto_1 = require("./dto/create-pipeline.dto");
let CrmController = class CrmController {
    crmService;
    constructor(crmService) {
        this.crmService = crmService;
    }
    ensureCrmAccess(user) {
        if (user?.role !== 'CLIENT')
            return;
        const modules = (user?.allowedModules || '')
            .split(',')
            .map((module) => module.trim())
            .filter(Boolean);
        if (!modules.includes('CRM')) {
            throw new common_1.ForbiddenException('CRM erişiminiz yok.');
        }
    }
    createPipeline(tenantId, user, data) {
        this.ensureCrmAccess(user);
        return this.crmService.createPipeline(tenantId, data);
    }
    findAllPipelines(tenantId, user) {
        this.ensureCrmAccess(user);
        return this.crmService.findAllPipelines(tenantId, user);
    }
    findPipeline(tenantId, id, user) {
        this.ensureCrmAccess(user);
        return this.crmService.findPipeline(tenantId, id, user);
    }
    deletePipeline(tenantId, user, id) {
        this.ensureCrmAccess(user);
        return this.crmService.deletePipeline(tenantId, id);
    }
    createStage(tenantId, user, data) {
        this.ensureCrmAccess(user);
        return this.crmService.createStage(tenantId, data.pipelineId, data);
    }
    updateStage(tenantId, user, id, data) {
        this.ensureCrmAccess(user);
        return this.crmService.updateStage(tenantId, id, data);
    }
    deleteStage(tenantId, user, id) {
        this.ensureCrmAccess(user);
        return this.crmService.deleteStage(tenantId, id);
    }
    createLead(tenantId, user, data) {
        this.ensureCrmAccess(user);
        return this.crmService.createLead(tenantId, data);
    }
    findAllLeads(tenantId, user, pipelineId) {
        this.ensureCrmAccess(user);
        return this.crmService.findAllLeads(tenantId, user, pipelineId);
    }
    findWhatsappConversations(tenantId, user, includeArchived) {
        this.ensureCrmAccess(user);
        return this.crmService.findWhatsappConversations(tenantId, user, includeArchived === 'true');
    }
    findLead(tenantId, user, id) {
        this.ensureCrmAccess(user);
        return this.crmService.findLead(tenantId, id);
    }
    updateLead(tenantId, user, id, data) {
        this.ensureCrmAccess(user);
        return this.crmService.updateLead(tenantId, id, data);
    }
    assignLead(tenantId, user, id, assigneeId) {
        this.ensureCrmAccess(user);
        return this.crmService.assignLead(tenantId, id, assigneeId ? String(assigneeId) : null);
    }
    moveLead(tenantId, user, leadId, stageId) {
        this.ensureCrmAccess(user);
        return this.crmService.moveLead(tenantId, leadId, stageId);
    }
    deleteLead(tenantId, user, id) {
        this.ensureCrmAccess(user);
        return this.crmService.deleteLead(tenantId, id);
    }
    setWhatsappConversationArchived(tenantId, user, leadId, archived) {
        this.ensureCrmAccess(user);
        return this.crmService.setWhatsappConversationArchived(tenantId, leadId, archived);
    }
    addActivity(tenantId, user, userId, leadId, data) {
        this.ensureCrmAccess(user);
        return this.crmService.addActivity(tenantId, leadId, userId, data);
    }
    updateActivity(tenantId, user, id, data) {
        this.ensureCrmAccess(user);
        return this.crmService.updateActivity(tenantId, id, data);
    }
    convertToCustomer(tenantId, user, leadId) {
        this.ensureCrmAccess(user);
        return this.crmService.convertToCustomer(tenantId, leadId);
    }
    recalculateScores(tenantId, user) {
        this.ensureCrmAccess(user);
        return this.crmService.recalculateLeadScores(tenantId);
    }
};
exports.CrmController = CrmController;
__decorate([
    (0, common_1.Post)('pipelines'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_pipeline_dto_1.CreatePipelineDto]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "createPipeline", null);
__decorate([
    (0, common_1.Get)('pipelines'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "findAllPipelines", null);
__decorate([
    (0, common_1.Get)('pipelines/:id'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "findPipeline", null);
__decorate([
    (0, common_1.Delete)('pipelines/:id'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "deletePipeline", null);
__decorate([
    (0, common_1.Post)('stages'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "createStage", null);
__decorate([
    (0, common_1.Patch)('stages/:id'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "updateStage", null);
__decorate([
    (0, common_1.Delete)('stages/:id'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "deleteStage", null);
__decorate([
    (0, common_1.Post)('leads'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_lead_dto_1.CreateLeadDto]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "createLead", null);
__decorate([
    (0, common_1.Get)('leads'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Query)('pipelineId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "findAllLeads", null);
__decorate([
    (0, common_1.Get)('whatsapp-conversations'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Query)('includeArchived')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "findWhatsappConversations", null);
__decorate([
    (0, common_1.Get)('leads/:id'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "findLead", null);
__decorate([
    (0, common_1.Patch)('leads/:id'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "updateLead", null);
__decorate([
    (0, common_1.Patch)('leads/:id/assignee'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)('assigneeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "assignLead", null);
__decorate([
    (0, common_1.Patch)('leads/:id/move'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)('stageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "moveLead", null);
__decorate([
    (0, common_1.Delete)('leads/:id'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "deleteLead", null);
__decorate([
    (0, common_1.Patch)('leads/:id/archive'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)('archived')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Boolean]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "setWhatsappConversationArchived", null);
__decorate([
    (0, common_1.Post)('leads/:id/activities'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, user_decorator_1.GetUser)('userId')),
    __param(3, (0, common_1.Param)('id')),
    __param(4, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "addActivity", null);
__decorate([
    (0, common_1.Patch)('activities/:id'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "updateActivity", null);
__decorate([
    (0, common_1.Post)('leads/:id/convert'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "convertToCustomer", null);
__decorate([
    (0, common_1.Post)('recalculate-scores'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CrmController.prototype, "recalculateScores", null);
exports.CrmController = CrmController = __decorate([
    (0, common_1.Controller)('crm'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [crm_service_1.CrmService])
], CrmController);
//# sourceMappingURL=crm.controller.js.map