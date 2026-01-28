import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SocialMediaService } from './social-media.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { GetTenantId, GetUser } from '../common/decorators/user.decorator';

@Controller('social-media')
@UseGuards(JwtAuthGuard)
export class SocialMediaController {
  constructor(private readonly socialMediaService: SocialMediaService) {}

  @Post()
  create(
    @GetTenantId() tenantId: string,
    @Body()
    data: {
      content: string;
      type: string;
      customerId: string;
      platform?: string;
    },
  ) {
    return this.socialMediaService.create(tenantId, data);
  }

  // --- Plans Endpoints ---

  @Post('plans')
  createPlan(@GetTenantId() tenantId: string, @Body() data: any) {
    return this.socialMediaService.createPlan(tenantId, data);
  }

  @Get('plans')
  findAllPlans(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Query('customerId') queryCustomerId?: string,
  ) {
    const customerId =
      user.role === 'CLIENT' ? user.customerId : queryCustomerId;
    const safeCustomerId =
      typeof customerId === 'string' ? customerId : undefined;
    return this.socialMediaService.findAllPlans(tenantId, safeCustomerId);
  }

  @Get('plans/:id')
  findOnePlan(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    return this.socialMediaService.findOnePlan(tenantId, id, user);
  }

  @Patch('plans/:id')
  updatePlan(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.socialMediaService.updatePlan(tenantId, id, data);
  }

  @Delete('plans/:id')
  removePlan(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.socialMediaService.removePlan(tenantId, id);
  }

  // --- Posts Endpoints ---

  @Get()
  findAll(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Query('customerId') queryCustomerId?: string,
  ) {
    const customerId =
      user.role === 'CLIENT' ? user.customerId : queryCustomerId;
    const safeCustomerId =
      typeof customerId === 'string' ? customerId : undefined;
    return this.socialMediaService.findAll(tenantId, safeCustomerId);
  }

  @Get(':id')
  findOne(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.socialMediaService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() data: { content?: string; status?: string; platform?: string },
  ) {
    return this.socialMediaService.update(tenantId, id, data);
  }

  @Delete(':id')
  remove(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.socialMediaService.remove(tenantId, id);
  }
}
