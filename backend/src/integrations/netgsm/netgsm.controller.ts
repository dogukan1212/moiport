import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '../../common/guards/auth.guard';
import { GetTenantId } from '../../common/decorators/user.decorator';
import { NetgsmService } from './netgsm.service';

@Controller('integrations/netgsm')
@UseGuards(JwtAuthGuard)
export class NetgsmController {
  constructor(private readonly netgsmService: NetgsmService) {}

  @Get('system-config')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  getSystemConfig() {
    return this.netgsmService.getSystemConfig();
  }

  @Post('system-config')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  updateSystemConfig(
    @Body()
    body: {
      netgsmUsercode?: string | null;
      netgsmPassword?: string | null;
      netgsmMsgheader?: string | null;
      netgsmIsActive?: boolean;
      registrationSmsVerificationEnabled?: boolean;
    },
  ) {
    return this.netgsmService.updateSystemConfig(body);
  }

  @Get('config')
  getConfig(@GetTenantId() tenantId: string) {
    return this.netgsmService.getConfig(tenantId);
  }

  @Post('config')
  updateConfig(
    @GetTenantId() tenantId: string,
    @Body()
    body: {
      usercode?: string | null;
      password?: string | null;
      msgheader?: string | null;
      isActive?: boolean;
    },
  ) {
    return this.netgsmService.updateConfig(tenantId, body);
  }

  @Post('send')
  async send(
    @GetTenantId() tenantId: string,
    @Body()
    body: { to: string; message: string; msgheader?: string },
  ) {
    const result = await this.netgsmService.sendSms(
      tenantId,
      body.to,
      body.message,
      {
        msgheader: body.msgheader,
      },
    );
    return { success: true, result };
  }
}
