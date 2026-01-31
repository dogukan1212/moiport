import {
  Controller,
  Get,
  Body,
  Patch,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../common/guards/auth.guard';
import { GetTenantId } from '../common/decorators/user.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'HR', 'SUPER_ADMIN')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Roles('SUPER_ADMIN')
  @Get()
  findAll() {
    return this.tenantsService.getAllTenants();
  }

  @Roles('SUPER_ADMIN')
  @Get(':id/admin')
  findOneForAdmin(@Param('id') id: string) {
    return this.tenantsService.getTenantInfo(id);
  }

  @Roles('SUPER_ADMIN')
  @Patch(':id/subscription')
  updateSubscription(
    @Param('id') id: string,
    @Body()
    data: {
      subscriptionPlan?: string;
      subscriptionStatus?: string;
      subscriptionEndsAt?: string | null;
      maxUsers?: number;
      maxStorage?: number;
      payrollCalculationStartDay?: number;
      payrollCalculationEndDay?: number;
      payrollPaymentDay?: number;
    },
  ) {
    return this.tenantsService.updateTenantSubscription(id, {
      ...data,
      subscriptionEndsAt: data.subscriptionEndsAt
        ? new Date(data.subscriptionEndsAt)
        : data.subscriptionEndsAt === null
          ? null
          : undefined,
    });
  }

  @Roles('SUPER_ADMIN')
  @Delete(':id')
  deleteTenant(@Param('id') id: string) {
    return this.tenantsService.deleteTenant(id);
  }

  @Roles('SUPER_ADMIN')
  @Post(':id/users')
  addUserByAdmin(
    @Param('id') tenantId: string,
    @Body()
    data: {
      email: string;
      name: string;
      role?: string;
    },
  ) {
    return this.tenantsService.addUser(tenantId, {
      ...data,
    });
  }

  @Roles('ADMIN', 'CLIENT', 'STAFF')
  @Get('me')
  getMe(@GetTenantId() tenantId: string) {
    return this.tenantsService.getTenantInfo(tenantId);
  }

  @Roles('ADMIN')
  @Patch('me')
  updateMe(
    @GetTenantId() tenantId: string,
    @Body()
    data: {
      name?: string;
      logoUrl?: string;
      address?: string;
      title?: string;
      phone?: string;
      email?: string;
      wordpressModuleEnabled?: boolean;
      industry?: string;
      industrySubType?: string;
      enabledModules?: string;
    },
  ) {
    return this.tenantsService.updateTenant(tenantId, data);
  }

  @Post('users')
  addUser(
    @GetTenantId() tenantId: string,
    @Body()
    data: {
      email: string;
      name: string;
      role?: string;
      phone?: string;
      startDate?: string;
      salary?: number;
      iban?: string;
      tckn?: string;
      address?: string;
      birthDate?: string;
      jobTitle?: string;
      department?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      bankName?: string;
      bankBranch?: string;
      bankAccountNumber?: string;
      maritalStatus?: string;
      childrenCount?: number;
      bloodType?: string;
      educationLevel?: string;
      contractType?: string;
      socialSecurityNumber?: string;
      taxNumber?: string;
    },
  ) {
    return this.tenantsService.addUser(tenantId, data);
  }

  @Delete('users/:id')
  removeUser(@GetTenantId() tenantId: string, @Param('id') userId: string) {
    return this.tenantsService.removeUser(tenantId, userId);
  }

  @Patch('users/:id')
  updateUser(
    @GetTenantId() tenantId: string,
    @Param('id') userId: string,
    @Body()
    data: {
      name?: string;
      email?: string;
      role?: string;
      newPassword?: string;
      allowedModules?: string;
    },
  ) {
    return this.tenantsService.updateUser(tenantId, userId, data);
  }
}
