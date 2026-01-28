import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '../../common/guards/auth.guard';
import { Smtp2goService } from './smtp2go.service';

@Controller('integrations/smtp2go')
@UseGuards(JwtAuthGuard)
export class Smtp2goController {
  constructor(private readonly smtp2goService: Smtp2goService) {}

  @Get('system-config')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  getSystemConfig() {
    return this.smtp2goService.getSystemConfig();
  }

  @Post('system-config')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  updateSystemConfig(
    @Body()
    body: {
      smtp2goUsername?: string | null;
      smtp2goPassword?: string | null;
      smtp2goFromEmail?: string | null;
      smtp2goFromName?: string | null;
      smtp2goIsActive?: boolean;
    },
  ) {
    return this.smtp2goService.updateSystemConfig(body);
  }

  @Post('test-email')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  sendTestEmail(
    @Body()
    body: {
      to: string;
      subject?: string | null;
      text?: string | null;
      html?: string | null;
    },
  ) {
    return this.smtp2goService.sendTestEmail(body);
  }
}
