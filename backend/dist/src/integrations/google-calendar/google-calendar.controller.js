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
exports.GoogleCalendarController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../../common/guards/auth.guard");
const user_decorator_1 = require("../../common/decorators/user.decorator");
const google_calendar_service_1 = require("./google-calendar.service");
let GoogleCalendarController = class GoogleCalendarController {
    googleService;
    constructor(googleService) {
        this.googleService = googleService;
    }
    getSystemConfig() {
        return this.googleService.getSystemConfig();
    }
    updateSystemConfig(body) {
        return this.googleService.updateSystemConfig(body);
    }
    testSystemConfig() {
        return this.googleService.testSystemConfig();
    }
    getConfig(tenantId) {
        return this.googleService.getConfig(tenantId);
    }
    async getAuthUrl(tenantId) {
        const url = await this.googleService.getAuthUrl(tenantId);
        return { url };
    }
    async handleCallback(code, state, res) {
        const tenantId = state;
        const frontendUrl = process.env.FRONTEND_URL || 'https://moiport.com';
        try {
            await this.googleService.exchangeCode(tenantId, code);
            return res.redirect(`${frontendUrl}/dashboard/settings?tab=google-calendar&success=true`);
        }
        catch (error) {
            console.error('Google Calendar Callback Error:', error);
            return res.redirect(`${frontendUrl}/dashboard/settings?tab=google-calendar&error=auth_failed`);
        }
    }
    exchangeCode(tenantId, body) {
        return this.googleService.exchangeCode(tenantId, body.code);
    }
    updateConfig(tenantId, body) {
        return this.googleService.updateConfig(tenantId, body);
    }
    testConnection(tenantId) {
        return this.googleService.testConnection(tenantId);
    }
    listEvents(tenantId, calendarId, timeMin, timeMax, maxResults, q) {
        const parsedMax = typeof maxResults === 'string' && maxResults.trim()
            ? Number(maxResults)
            : undefined;
        return this.googleService.listEvents(tenantId, {
            calendarId: calendarId || null,
            timeMin: timeMin || null,
            timeMax: timeMax || null,
            maxResults: Number.isFinite(parsedMax)
                ? parsedMax
                : null,
            q: q || null,
        });
    }
    createEvent(tenantId, body) {
        return this.googleService.createEvent(tenantId, body);
    }
};
exports.GoogleCalendarController = GoogleCalendarController;
__decorate([
    (0, common_1.Get)('system-config'),
    (0, common_1.UseGuards)(auth_guard_1.RolesGuard),
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GoogleCalendarController.prototype, "getSystemConfig", null);
__decorate([
    (0, common_1.Post)('system-config'),
    (0, common_1.UseGuards)(auth_guard_1.RolesGuard),
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GoogleCalendarController.prototype, "updateSystemConfig", null);
__decorate([
    (0, common_1.Get)('system-test'),
    (0, common_1.UseGuards)(auth_guard_1.RolesGuard),
    (0, auth_guard_1.Roles)('SUPER_ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GoogleCalendarController.prototype, "testSystemConfig", null);
__decorate([
    (0, common_1.Get)('config'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GoogleCalendarController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Get)('auth-url'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GoogleCalendarController.prototype, "getAuthUrl", null);
__decorate([
    (0, auth_guard_1.Public)(),
    (0, common_1.Get)('callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], GoogleCalendarController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Post)('oauth/exchange'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GoogleCalendarController.prototype, "exchangeCode", null);
__decorate([
    (0, common_1.Post)('config'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GoogleCalendarController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Get)('test'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GoogleCalendarController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Get)('events'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Query)('calendarId')),
    __param(2, (0, common_1.Query)('timeMin')),
    __param(3, (0, common_1.Query)('timeMax')),
    __param(4, (0, common_1.Query)('maxResults')),
    __param(5, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], GoogleCalendarController.prototype, "listEvents", null);
__decorate([
    (0, common_1.Post)('events'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GoogleCalendarController.prototype, "createEvent", null);
exports.GoogleCalendarController = GoogleCalendarController = __decorate([
    (0, common_1.Controller)('integrations/google-calendar'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [google_calendar_service_1.GoogleCalendarService])
], GoogleCalendarController);
//# sourceMappingURL=google-calendar.controller.js.map