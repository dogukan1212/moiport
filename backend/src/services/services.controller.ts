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
import { ServicesService } from './services.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../common/guards/auth.guard';
import { GetTenantId } from '../common/decorators/user.decorator';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(
    @GetTenantId() tenantId: string,
    @Body()
    data: {
      name: string;
      description?: string;
      basePrice?: number;
      billingCycle?: string;
    },
  ) {
    return this.servicesService.create(tenantId, data);
  }

  @Get()
  findAll(@GetTenantId() tenantId: string) {
    return this.servicesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.servicesService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @Body()
    data: {
      name?: string;
      description?: string;
      basePrice?: number;
      billingCycle?: string;
    },
  ) {
    return this.servicesService.update(tenantId, id, data);
  }

  @Delete(':id')
  remove(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.servicesService.remove(tenantId, id);
  }
}
