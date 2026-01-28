import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from '../common/guards/auth.guard';
import { GetTenantId } from '../common/decorators/user.decorator';
import { SmsService } from './sms.service';

@Controller('sms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Get('settings')
  @Roles('ADMIN', 'STAFF')
  getSettings(@GetTenantId() tenantId: string) {
    return this.smsService.getSettings(tenantId);
  }

  @Post('settings')
  @Roles('ADMIN', 'STAFF')
  updateSettings(
    @GetTenantId() tenantId: string,
    @Body() body: { provider?: 'VATANSMS' | 'NETGSM'; isActive?: boolean },
  ) {
    return this.smsService.updateSettings(tenantId, body);
  }

  @Get('templates')
  @Roles('ADMIN', 'STAFF')
  listTemplates(@GetTenantId() tenantId: string) {
    return this.smsService.listTemplates(tenantId);
  }

  @Post('templates')
  @Roles('ADMIN', 'STAFF')
  createTemplate(
    @GetTenantId() tenantId: string,
    @Body()
    body: { key: string; title: string; content: string; isActive?: boolean },
  ) {
    return this.smsService.createTemplate(tenantId, body);
  }

  @Patch('templates/:id')
  @Roles('ADMIN', 'STAFF')
  updateTemplate(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @Body()
    body: {
      key?: string;
      title?: string;
      content?: string;
      isActive?: boolean;
    },
  ) {
    return this.smsService.updateTemplate(tenantId, id, body);
  }

  @Delete('templates/:id')
  @Roles('ADMIN', 'STAFF')
  deleteTemplate(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.smsService.deleteTemplate(tenantId, id);
  }

  @Get('triggers')
  @Roles('ADMIN', 'STAFF')
  listTriggers(@GetTenantId() tenantId: string) {
    return this.smsService.listTriggers(tenantId);
  }

  @Patch('triggers/:id')
  @Roles('ADMIN', 'STAFF')
  updateTrigger(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @Body()
    body: {
      enabled?: boolean;
      recipientType?:
        | 'TASK_ASSIGNEE'
        | 'TASK_WATCHERS'
        | 'CUSTOMER_PHONE'
        | 'CUSTOMER_USERS';
      templateKey?: string;
    },
  ) {
    return this.smsService.updateTrigger(tenantId, id, body);
  }

  @Post('send')
  @Roles('ADMIN', 'STAFF')
  sendManual(
    @GetTenantId() tenantId: string,
    @Body()
    body: {
      to: string;
      message?: string;
      templateKey?: string;
      variables?: Record<string, any>;
    },
  ) {
    return this.smsService.sendManual(tenantId, body);
  }
}
