import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  JwtAuthGuard,
  Public,
  Roles,
  RolesGuard,
} from '../../common/guards/auth.guard';
import { GetTenantId } from '../../common/decorators/user.decorator';
import { GoogleCalendarService } from './google-calendar.service';

@Controller('integrations/google-calendar')
@UseGuards(JwtAuthGuard)
export class GoogleCalendarController {
  constructor(private readonly googleService: GoogleCalendarService) {}

  @Get('system-config')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  getSystemConfig() {
    return this.googleService.getSystemConfig();
  }

  @Post('system-config')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  updateSystemConfig(
    @Body()
    body: {
      googleOAuthClientId?: string | null;
      googleOAuthClientSecret?: string | null;
      googleOAuthRedirectUri?: string | null;
      googleCalendarIsActive?: boolean;
    },
  ) {
    return this.googleService.updateSystemConfig(body);
  }

  @Get('system-test')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  testSystemConfig() {
    return this.googleService.testSystemConfig();
  }

  @Get('config')
  getConfig(@GetTenantId() tenantId: string) {
    return this.googleService.getConfig(tenantId);
  }

  @Get('auth-url')
  async getAuthUrl(@GetTenantId() tenantId: string) {
    const url = await this.googleService.getAuthUrl(tenantId);
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
    const frontendUrl = process.env.FRONTEND_URL || 'https://moiport.com';
    try {
      await this.googleService.exchangeCode(tenantId, code);
      return res.redirect(
        `${frontendUrl}/dashboard/settings?tab=google-calendar&success=true`,
      );
    } catch (error) {
      console.error('Google Calendar Callback Error:', error);
      return res.redirect(
        `${frontendUrl}/dashboard/settings?tab=google-calendar&error=auth_failed`,
      );
    }
  }

  @Post('oauth/exchange')
  exchangeCode(
    @GetTenantId() tenantId: string,
    @Body() body: { code: string },
  ) {
    return this.googleService.exchangeCode(tenantId, body.code);
  }

  @Post('config')
  updateConfig(
    @GetTenantId() tenantId: string,
    @Body()
    body: { primaryCalendar?: string | null; isActive?: boolean },
  ) {
    return this.googleService.updateConfig(tenantId, body);
  }

  @Get('test')
  testConnection(@GetTenantId() tenantId: string) {
    return this.googleService.testConnection(tenantId);
  }

  @Get('events')
  listEvents(
    @GetTenantId() tenantId: string,
    @Query('calendarId') calendarId?: string,
    @Query('timeMin') timeMin?: string,
    @Query('timeMax') timeMax?: string,
    @Query('maxResults') maxResults?: string,
    @Query('q') q?: string,
  ) {
    const parsedMax =
      typeof maxResults === 'string' && maxResults.trim()
        ? Number(maxResults)
        : undefined;
    return this.googleService.listEvents(tenantId, {
      calendarId: calendarId || null,
      timeMin: timeMin || null,
      timeMax: timeMax || null,
      maxResults: Number.isFinite(parsedMax as number)
        ? (parsedMax as number)
        : null,
      q: q || null,
    });
  }

  @Post('events')
  createEvent(
    @GetTenantId() tenantId: string,
    @Body()
    body: {
      calendarId?: string | null;
      summary: string;
      description?: string | null;
      start: string;
      end: string;
      timeZone?: string | null;
      attendees?: Array<{ email: string }>;
    },
  ) {
    return this.googleService.createEvent(tenantId, body);
  }
}
