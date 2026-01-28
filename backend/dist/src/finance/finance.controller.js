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
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const finance_service_1 = require("./finance.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const user_decorator_1 = require("../common/decorators/user.decorator");
let FinanceController = class FinanceController {
    financeService;
    constructor(financeService) {
        this.financeService = financeService;
    }
    findAll(tenantId, user) {
        return this.financeService.findAll(tenantId, user);
    }
    getStats(tenantId, user) {
        return this.financeService.getStats(tenantId, user);
    }
    create(tenantId, data) {
        return this.financeService.create(tenantId, data);
    }
    update(id, tenantId, data) {
        return this.financeService.update(id, tenantId, data);
    }
    remove(id, tenantId) {
        return this.financeService.remove(id, tenantId);
    }
    findAllRecurring(tenantId, user) {
        return this.financeService.findAllRecurring(tenantId, user);
    }
    createRecurring(tenantId, data) {
        return this.financeService.createRecurring(tenantId, data);
    }
    toggleRecurring(id, tenantId) {
        return this.financeService.toggleRecurring(id, tenantId);
    }
    updateRecurring(id, tenantId, data) {
        return this.financeService.updateRecurring(id, tenantId, data);
    }
    removeRecurring(id, tenantId) {
        return this.financeService.removeRecurring(id, tenantId);
    }
    getCustomerStats(tenantId) {
        return this.financeService.getCustomerStats(tenantId);
    }
    findAllInvoices(tenantId, user) {
        return this.financeService.findAllInvoices(tenantId, user);
    }
    createInvoice(tenantId, data) {
        return this.financeService.createInvoice(tenantId, data);
    }
    updateInvoice(id, tenantId, data) {
        return this.financeService.updateInvoice(id, tenantId, data);
    }
    removeInvoice(id, tenantId) {
        return this.financeService.removeInvoice(id, tenantId);
    }
    remindInvoice(id, tenantId, body = {}) {
        return this.financeService.remindInvoice(id, tenantId, body);
    }
    getInvoicePaymentLink(id, tenantId, user) {
        return this.financeService.getInvoicePaymentLink(id, tenantId, user);
    }
    createInvoicePaymentLink(id, tenantId) {
        return this.financeService.createInvoicePaymentLink(id, tenantId, {
            reuseExisting: true,
        });
    }
    getEmployees(tenantId) {
        return this.financeService.getEmployees(tenantId);
    }
    getEmployeeDetails(id, tenantId) {
        return this.financeService.getEmployeeDetails(id, tenantId);
    }
    terminateEmployee(id, tenantId) {
        return this.financeService.terminateEmployee(id, tenantId);
    }
    updateEmployee(id, tenantId, data) {
        return this.financeService.updateEmployeeFinancials(id, tenantId, data);
    }
    createAdvance(tenantId, data) {
        return this.financeService.createAdvance(tenantId, data);
    }
    getPayrolls(tenantId) {
        return this.financeService.getPayrolls(tenantId);
    }
    getPayrollSettings(tenantId) {
        return this.financeService.getPayrollSettings(tenantId);
    }
    updatePayrollSettings(tenantId, data) {
        return this.financeService.updatePayrollSettings(tenantId, data);
    }
    generatePayroll(tenantId, period) {
        return this.financeService.generatePayroll(tenantId, period);
    }
    payPayroll(id, tenantId) {
        return this.financeService.payPayroll(id, tenantId);
    }
    updatePayroll(id, tenantId, data) {
        return this.financeService.updatePayroll(id, tenantId, data);
    }
    deletePayroll(id, tenantId) {
        return this.financeService.deletePayroll(id, tenantId);
    }
    seedData(tenantId) {
        return this.financeService.seedData(tenantId);
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Get)(),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF', 'CLIENT'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF', 'CLIENT'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)(),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('recurring/all'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF', 'CLIENT'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "findAllRecurring", null);
__decorate([
    (0, common_1.Post)('recurring'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "createRecurring", null);
__decorate([
    (0, common_1.Patch)('recurring/:id/toggle'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "toggleRecurring", null);
__decorate([
    (0, common_1.Patch)('recurring/:id'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "updateRecurring", null);
__decorate([
    (0, common_1.Delete)('recurring/:id'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "removeRecurring", null);
__decorate([
    (0, common_1.Get)('customers/stats'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getCustomerStats", null);
__decorate([
    (0, common_1.Get)('invoices/all'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF', 'CLIENT'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "findAllInvoices", null);
__decorate([
    (0, common_1.Post)('invoices'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "createInvoice", null);
__decorate([
    (0, common_1.Patch)('invoices/:id'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "updateInvoice", null);
__decorate([
    (0, common_1.Delete)('invoices/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "removeInvoice", null);
__decorate([
    (0, common_1.Post)('invoices/:id/remind'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "remindInvoice", null);
__decorate([
    (0, common_1.Get)('invoices/:id/payment-link'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF', 'CLIENT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __param(2, (0, user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getInvoicePaymentLink", null);
__decorate([
    (0, common_1.Post)('invoices/:id/payment-link'),
    (0, auth_guard_1.Roles)('ADMIN', 'STAFF'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "createInvoicePaymentLink", null);
__decorate([
    (0, auth_guard_1.Roles)('ADMIN', 'HR'),
    (0, common_1.Get)('employees'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getEmployees", null);
__decorate([
    (0, auth_guard_1.Roles)('ADMIN', 'HR'),
    (0, common_1.Get)('employees/:id/details'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getEmployeeDetails", null);
__decorate([
    (0, auth_guard_1.Roles)('ADMIN', 'HR'),
    (0, common_1.Patch)('employees/:id/terminate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "terminateEmployee", null);
__decorate([
    (0, auth_guard_1.Roles)('ADMIN', 'HR'),
    (0, common_1.Patch)('employees/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "updateEmployee", null);
__decorate([
    (0, auth_guard_1.Roles)('ADMIN', 'HR'),
    (0, common_1.Post)('advances'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "createAdvance", null);
__decorate([
    (0, auth_guard_1.Roles)('ADMIN', 'HR'),
    (0, common_1.Get)('payroll'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getPayrolls", null);
__decorate([
    (0, auth_guard_1.Roles)('ADMIN', 'HR'),
    (0, common_1.Get)('payroll/settings'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getPayrollSettings", null);
__decorate([
    (0, common_1.Patch)('payroll/settings'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "updatePayrollSettings", null);
__decorate([
    (0, common_1.Post)('payroll/generate'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __param(1, (0, common_1.Body)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "generatePayroll", null);
__decorate([
    (0, common_1.Post)('payroll/:id/pay'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "payPayroll", null);
__decorate([
    (0, auth_guard_1.Roles)('ADMIN', 'HR'),
    (0, common_1.Patch)('payroll/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "updatePayroll", null);
__decorate([
    (0, common_1.Delete)('payroll/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "deletePayroll", null);
__decorate([
    (0, common_1.Post)('seed-data'),
    __param(0, (0, user_decorator_1.GetTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "seedData", null);
exports.FinanceController = FinanceController = __decorate([
    (0, common_1.Controller)('finance'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, auth_guard_1.RolesGuard),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map