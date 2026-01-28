import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ParasutService } from './parasut.service';
import { JwtAuthGuard, Public } from '../../common/guards/auth.guard';
import { GetTenantId, GetUser } from '../../common/decorators/user.decorator';

@Controller('integrations/parasut')
@UseGuards(JwtAuthGuard)
export class ParasutController {
  constructor(private readonly parasutService: ParasutService) {}

  @Get('config')
  getConfig(@GetTenantId() tenantId: string, @GetUser() user: any) {
    return this.parasutService.getConfig(tenantId, user);
  }

  @Post('config')
  updateConfig(
    @GetTenantId() tenantId: string,
    @Body()
    body: {
      companyId?: string | null;
      isActive?: boolean;
    },
    @GetUser() user: any,
  ) {
    return this.parasutService.updateConfig(tenantId, body, user);
  }

  @Post('disconnect')
  disconnect(@GetTenantId() tenantId: string, @GetUser() user: any) {
    return this.parasutService.disconnect(tenantId, user);
  }

  @Get('auth-url')
  async getAuthUrl(@GetTenantId() tenantId: string, @GetUser() user: any) {
    const url = await this.parasutService.getAuthUrl(tenantId, user);
    return { url };
  }

  @Public()
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: any,
  ) {
    const frontendUrl =
      process.env.FRONTEND_URL || 'https://kolayentegrasyon.com';
    try {
      await this.parasutService.handleCallback(code, state);
      return res.redirect(
        `${frontendUrl}/dashboard/settings?tab=parasut&success=true`,
      );
    } catch (error) {
      console.error('Parasut Callback Error:', error);
      return res.redirect(
        `${frontendUrl}/dashboard/settings?tab=parasut&error=auth_failed`,
      );
    }
  }

  @Get('me')
  getMe(@GetTenantId() tenantId: string, @GetUser() user: any) {
    return this.parasutService.getMe(tenantId, user);
  }
}
