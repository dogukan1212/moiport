import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../common/guards/auth.guard';
import { GetTenantId, GetUser } from '../common/decorators/user.decorator';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get()
  @Roles('ADMIN', 'STAFF', 'CLIENT')
  findAll(@GetTenantId() tenantId: string, @GetUser() user: any) {
    return this.financeService.findAll(tenantId, user);
  }

  @Get('stats')
  @Roles('ADMIN', 'STAFF', 'CLIENT')
  getStats(@GetTenantId() tenantId: string, @GetUser() user: any) {
    return this.financeService.getStats(tenantId, user);
  }

  @Post()
  @Roles('ADMIN', 'STAFF')
  create(@GetTenantId() tenantId: string, @Body() data: any) {
    return this.financeService.create(tenantId, data);
  }

  @Patch(':id')
  @Roles('ADMIN', 'STAFF')
  update(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Body() data: any,
  ) {
    return this.financeService.update(id, tenantId, data);
  }

  @Delete(':id')
  @Roles('ADMIN', 'STAFF')
  remove(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.financeService.remove(id, tenantId);
  }

  // Recurring
  @Get('recurring/all')
  @Roles('ADMIN', 'STAFF', 'CLIENT')
  findAllRecurring(@GetTenantId() tenantId: string, @GetUser() user: any) {
    return this.financeService.findAllRecurring(tenantId, user);
  }

  @Post('recurring')
  @Roles('ADMIN', 'STAFF')
  createRecurring(@GetTenantId() tenantId: string, @Body() data: any) {
    return this.financeService.createRecurring(tenantId, data);
  }

  @Patch('recurring/:id/toggle')
  @Roles('ADMIN', 'STAFF')
  toggleRecurring(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.financeService.toggleRecurring(id, tenantId);
  }

  @Patch('recurring/:id')
  @Roles('ADMIN', 'STAFF')
  updateRecurring(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Body() data: any,
  ) {
    return this.financeService.updateRecurring(id, tenantId, data);
  }

  @Delete('recurring/:id')
  @Roles('ADMIN', 'STAFF')
  removeRecurring(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.financeService.removeRecurring(id, tenantId);
  }

  @Get('customers/stats')
  @Roles('ADMIN', 'STAFF')
  getCustomerStats(@GetTenantId() tenantId: string) {
    return this.financeService.getCustomerStats(tenantId);
  }

  // Invoices
  @Get('invoices/all')
  @Roles('ADMIN', 'STAFF', 'CLIENT')
  findAllInvoices(@GetTenantId() tenantId: string, @GetUser() user: any) {
    return this.financeService.findAllInvoices(tenantId, user);
  }

  @Post('invoices')
  @Roles('ADMIN', 'STAFF')
  createInvoice(@GetTenantId() tenantId: string, @Body() data: any) {
    return this.financeService.createInvoice(tenantId, data);
  }

  @Patch('invoices/:id')
  @Roles('ADMIN', 'STAFF')
  updateInvoice(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Body() data: any,
  ) {
    return this.financeService.updateInvoice(id, tenantId, data);
  }

  @Delete('invoices/:id')
  removeInvoice(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.financeService.removeInvoice(id, tenantId);
  }

  @Post('invoices/:id/remind')
  @Roles('ADMIN', 'STAFF')
  remindInvoice(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Body() body: { forceSms?: boolean } = {},
  ) {
    return this.financeService.remindInvoice(id, tenantId, body);
  }

  @Get('invoices/:id/payment-link')
  @Roles('ADMIN', 'STAFF', 'CLIENT')
  getInvoicePaymentLink(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
  ) {
    return this.financeService.getInvoicePaymentLink(id, tenantId, user);
  }

  @Post('invoices/:id/payment-link')
  @Roles('ADMIN', 'STAFF')
  createInvoicePaymentLink(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
  ) {
    return this.financeService.createInvoicePaymentLink(id, tenantId, {
      reuseExisting: true,
    });
  }

  // Payroll & Employees
  @Roles('ADMIN', 'HR')
  @Get('employees')
  getEmployees(@GetTenantId() tenantId: string) {
    return this.financeService.getEmployees(tenantId);
  }

  @Roles('ADMIN', 'HR')
  @Get('employees/:id/details')
  getEmployeeDetails(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.financeService.getEmployeeDetails(id, tenantId);
  }

  @Roles('ADMIN', 'HR')
  @Patch('employees/:id/terminate')
  terminateEmployee(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.financeService.terminateEmployee(id, tenantId);
  }

  @Roles('ADMIN', 'HR')
  @Patch('employees/:id')
  updateEmployee(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Body() data: any,
  ) {
    return this.financeService.updateEmployeeFinancials(id, tenantId, data);
  }

  @Roles('ADMIN', 'HR')
  @Post('advances')
  createAdvance(@GetTenantId() tenantId: string, @Body() data: any) {
    return this.financeService.createAdvance(tenantId, data);
  }

  @Roles('ADMIN', 'HR')
  @Get('payroll')
  getPayrolls(@GetTenantId() tenantId: string) {
    return this.financeService.getPayrolls(tenantId);
  }

  // Settings: HR can read, only ADMIN can update
  @Roles('ADMIN', 'HR')
  @Get('payroll/settings')
  getPayrollSettings(@GetTenantId() tenantId: string) {
    return this.financeService.getPayrollSettings(tenantId);
  }

  @Patch('payroll/settings')
  updatePayrollSettings(@GetTenantId() tenantId: string, @Body() data: any) {
    return this.financeService.updatePayrollSettings(tenantId, data);
  }

  @Post('payroll/generate')
  generatePayroll(
    @GetTenantId() tenantId: string,
    @Body('period') period: string,
  ) {
    return this.financeService.generatePayroll(tenantId, period);
  }

  @Post('payroll/:id/pay')
  payPayroll(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.financeService.payPayroll(id, tenantId);
  }

  @Roles('ADMIN', 'HR')
  @Patch('payroll/:id')
  updatePayroll(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Body() data: any,
  ) {
    return this.financeService.updatePayroll(id, tenantId, data);
  }

  @Delete('payroll/:id')
  deletePayroll(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.financeService.deletePayroll(id, tenantId);
  }

  @Post('seed-data')
  seedData(@GetTenantId() tenantId: string) {
    return this.financeService.seedData(tenantId);
  }
}
