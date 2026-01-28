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
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { GetTenantId } from '../common/decorators/user.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(
    @GetTenantId() tenantId: string,
    @Body() data: { name: string; email?: string; phone?: string },
  ) {
    return this.customersService.create(tenantId, data);
  }

  @Get()
  findAll(@GetTenantId() tenantId: string) {
    return this.customersService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.customersService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() data: { name?: string; email?: string; phone?: string },
  ) {
    return this.customersService.update(tenantId, id, data);
  }

  @Delete(':id')
  remove(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.customersService.remove(tenantId, id);
  }

  @Get(':id/portal-user')
  getPortalUser(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.customersService.getPortalUser(tenantId, id);
  }

  @Post(':id/portal-user')
  createPortalUser(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @Body()
    data: {
      email: string;
      password: string;
      name: string;
      allowedModules?: string[];
    },
  ) {
    return this.customersService.createPortalUser(tenantId, id, data);
  }

  @Delete(':id/portal-user')
  removePortalUser(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.customersService.removePortalUser(tenantId, id);
  }
}
