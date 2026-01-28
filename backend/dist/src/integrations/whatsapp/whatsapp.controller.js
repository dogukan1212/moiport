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
exports.WhatsappController = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_service_1 = require("./whatsapp.service");
const auth_guard_1 = require("../../common/guards/auth.guard");
const user_decorator_1 = require("../../common/decorators/user.decorator");
const crm_service_1 = require("../../crm/crm.service");
let WhatsappController = class WhatsappController {
    whatsappService;
    crmService;
    constructor(whatsappService, crmService) {
        this.whatsappService = whatsappService;
        this.crmService = crmService;
    }
    getConfig(tenantId, user) {
        return this.whatsappService.getConfig(tenantId, user);
    }
    updateConfig(tenantId, body, user) {
        return this.whatsappService.updateConfig(tenantId, body, user);
    }
    async sendMessage(tenantId, user, body) {
        const userId = typeof user?.id === 'string' ? user.id : String(user?.id ?? '');
        if ((!body.message || body.message.trim().length === 0) &&
            (!body.attachments || body.attachments.length === 0)) {
            throw new common_1.BadRequestException('Mesaj içeriği veya dosya zorunludur');
        }
        let to = body.to;
        const leadId = body.leadId;
        if (leadId && !to) {
            const lead = await this.crmService.findLead(tenantId, leadId);
            if (!lead || !lead.phone) {
                throw new common_1.BadRequestException('Lead veya telefon numarası bulunamadı');
            }
            to = lead.phone;
        }
        if (!to) {
            throw new common_1.BadRequestException('Telefon numarası veya leadId parametresi zorunludur');
        }
        const result = await this.whatsappService.sendMessage(tenantId, to, body.message, body.attachments, user);
        if (leadId) {
            let content = body.message;
            if (body.attachments && body.attachments.length > 0) {
                const fileNames = body.attachments
                    .map((a) => a.name || 'Dosya')
                    .join(', ');
                content = content
                    ? `${content}\n[Ekler: ${fileNames}]`
                    : `[Ekler: ${fileNames}]`;
            }
            const metaId = result.metaResponse?.messages?.[0]?.id ||
                result.infobipResponse?.messages?.[0]?.messageId;
            await this.crmService.addActivity(tenantId, leadId, userId, {
                type: 'WHATSAPP_OUT',
                content: content || 'Dosya gönderildi',
                status: metaId ? 'SENT' : undefined,
                externalId: metaId,
            });
        }
        return {
            success: true,
            result,
        };
    }
};
exports.WhatsappController = WhatsappController;
__decorate([
    (0, common_1.Get)('config'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)('config'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "sendMessage", null);
exports.WhatsappController = WhatsappController = __decorate([
    (0, common_1.Controller)('integrations/whatsapp'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsappService,
        crm_service_1.CrmService])
], WhatsappController);
//# sourceMappingURL=whatsapp.controller.js.map