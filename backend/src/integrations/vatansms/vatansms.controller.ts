import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { GetTenantId } from '../../common/decorators/user.decorator';
import { VatansmsService } from './vatansms.service';

@Controller('integrations/vatansms')
@UseGuards(JwtAuthGuard)
export class VatansmsController {
  constructor(private readonly vatansmsService: VatansmsService) {}

  @Get('config')
  getConfig(@GetTenantId() tenantId: string) {
    return this.vatansmsService.getConfig(tenantId);
  }

  @Post('config')
  updateConfig(
    @GetTenantId() tenantId: string,
    @Body()
    body: {
      apiId?: string | null;
      apiKey?: string | null;
      sender?: string | null;
      messageType?: string | null;
      messageContentType?: string | null;
      isActive?: boolean;
    },
  ) {
    return this.vatansmsService.updateConfig(tenantId, body);
  }

  @Post('send')
  async send(
    @GetTenantId() tenantId: string,
    @Body()
    body: {
      to: string;
      message: string;
      sender?: string;
      messageType?: string;
      messageContentType?: string;
    },
  ) {
    const result = await this.vatansmsService.sendSms(
      tenantId,
      body.to,
      body.message,
      {
        sender: body.sender,
        messageType: body.messageType,
        messageContentType: body.messageContentType,
      },
    );

    return { success: true, result };
  }
}
