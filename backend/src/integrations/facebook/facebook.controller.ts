import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { FacebookService } from './facebook.service';
import {
  JwtAuthGuard,
  Public,
  Roles,
  RolesGuard,
} from '../../common/guards/auth.guard';
import { GetTenantId, GetUser } from '../../common/decorators/user.decorator';

@Controller('integrations/facebook')
@UseGuards(JwtAuthGuard)
export class FacebookController {
  constructor(private readonly facebookService: FacebookService) {}

  // System Admin Endpoints
  @Get('system-config')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  getSystemConfig() {
    return this.facebookService.getSystemConfig();
  }

  @Post('system-config')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  updateSystemConfig(@Body() data: any) {
    return this.facebookService.updateSystemConfig(data);
  }

  // OAuth Flow
  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  async getAuthUrl(@GetTenantId() tenantId: string) {
    const url = await this.facebookService.getAuthUrl(tenantId);
    return { url };
  }

  @Public()
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: any,
  ) {
    const tenantId = state;
    try {
      await this.facebookService.handleCallback(code, tenantId);
      const frontendUrl =
        process.env.FRONTEND_URL || 'https://kolayentegrasyon.com';
      return res.redirect(
        `${frontendUrl}/dashboard/settings?tab=facebook&success=true`,
      );
    } catch (error) {
      console.error('Facebook Callback Error:', error);
      const frontendUrl =
        process.env.FRONTEND_URL || 'https://kolayentegrasyon.com';
      return res.redirect(
        `${frontendUrl}/dashboard/settings?tab=facebook&error=auth_failed`,
      );
    }
  }

  // Tenant Config
  @Get('config')
  @UseGuards(JwtAuthGuard)
  getConfig(@GetTenantId() tenantId: string, @GetUser() user: any) {
    return this.facebookService.getConfig(tenantId, user);
  }

  @Post('config')
  updateConfig(
    @GetTenantId() tenantId: string,
    @Body() data: any,
    @GetUser() user: any,
  ) {
    return this.facebookService.updateConfig(tenantId, data, user);
  }

  @Post('pages')
  getPages(@Body('accessToken') accessToken: string) {
    return this.facebookService.getPages(accessToken);
  }

  @Post('forms/:pageId')
  getForms(
    @Param('pageId') pageId: string,
    @Body('accessToken') accessToken: string,
  ) {
    return this.facebookService.getForms(pageId, accessToken);
  }

  @Post('form-fields/:formId')
  getFormFields(
    @Param('formId') formId: string,
    @Body('accessToken') accessToken: string,
  ) {
    return this.facebookService.getFormFields(formId, accessToken);
  }

  @Post('mappings')
  addMapping(@GetTenantId() tenantId: string, @Body() data: any) {
    return this.facebookService.addMapping(tenantId, data);
  }

  @Patch('mappings/:id')
  updateMapping(@Param('id') id: string, @Body() data: any) {
    return this.facebookService.updateMapping(id, data);
  }

  @Delete('mappings/:id')
  deleteMapping(@Param('id') id: string) {
    return this.facebookService.deleteMapping(id);
  }

  @Post('import-leads/:mappingId')
  importLeads(
    @GetTenantId() tenantId: string,
    @Param('mappingId') mappingId: string,
  ) {
    return this.facebookService.importLeads(tenantId, mappingId);
  }

  @Post('test-connection')
  testConnection(@GetTenantId() tenantId: string) {
    return this.facebookService.testConnection(tenantId);
  }

  @Get('preview-sync')
  previewSync(@GetTenantId() tenantId: string) {
    console.log(
      `[FacebookController] previewSync called for tenant: ${tenantId}`,
    );
    return this.facebookService.previewMessages(tenantId);
  }

  @Post('confirm-sync')
  confirmSync(@GetTenantId() tenantId: string) {
    return this.facebookService.confirmSync(tenantId);
  }

  @Post('clear-leads')
  clearLeads(@GetTenantId() tenantId: string) {
    return this.facebookService.clearFacebookLeads(tenantId);
  }
}
