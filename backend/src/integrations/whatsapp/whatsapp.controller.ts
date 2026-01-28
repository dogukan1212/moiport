import {
  Body,
  Controller,
  Post,
  UseGuards,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { GetTenantId, GetUser } from '../../common/decorators/user.decorator';
import { CrmService } from '../../crm/crm.service';

@Controller('integrations/whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly crmService: CrmService,
  ) {}

  @Get('config')
  getConfig(@GetTenantId() tenantId: string, @GetUser() user: any) {
    return this.whatsappService.getConfig(tenantId, user);
  }

  @Post('config')
  updateConfig(
    @GetTenantId() tenantId: string,
    @Body()
    body: {
      provider?: string | null;
      phoneNumberId?: string | null;
      accessToken?: string | null;
      apiVersion?: string | null;
      twilioAccountSid?: string | null;
      isActive?: boolean;
      aiEnabled?: boolean;
      autoReplyEnabled?: boolean;
      autoReplyTemplates?: string | null;
    },
    @GetUser() user: any,
  ) {
    return this.whatsappService.updateConfig(tenantId, body, user);
  }

  @Post('send')
  async sendMessage(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body()
    body: {
      leadId?: string;
      to?: string;
      message: string;
      attachments?: { url: string; type: string; name?: string }[];
    },
  ) {
    const userId =
      typeof user?.id === 'string' ? user.id : String(user?.id ?? '');
    if (
      (!body.message || body.message.trim().length === 0) &&
      (!body.attachments || body.attachments.length === 0)
    ) {
      throw new BadRequestException('Mesaj içeriği veya dosya zorunludur');
    }

    let to = body.to;
    const leadId = body.leadId;

    if (leadId && !to) {
      const lead = await this.crmService.findLead(tenantId, leadId);
      if (!lead || !lead.phone) {
        throw new BadRequestException('Lead veya telefon numarası bulunamadı');
      }
      to = lead.phone;
    }

    if (!to) {
      throw new BadRequestException(
        'Telefon numarası veya leadId parametresi zorunludur',
      );
    }

    const result = await this.whatsappService.sendMessage(
      tenantId,
      to,
      body.message,
      body.attachments,
      user,
    );

    if (leadId) {
      let content = body.message;
      if (body.attachments && body.attachments.length > 0) {
        const fileNames = body.attachments
          .map((a) => a.name || 'Dosya')
          .join(', ');
        content = content
          ? `${content}\n[Ekler: ${fileNames}]`
          : `[Ekler: ${fileNames}]`;
      }

      // Extract Meta Message ID
      const metaId =
        result.metaResponse?.messages?.[0]?.id ||
        result.infobipResponse?.messages?.[0]?.messageId;

      await this.crmService.addActivity(tenantId, leadId, userId, {
        type: 'WHATSAPP_OUT',
        content: content || 'Dosya gönderildi',
        status: metaId ? 'SENT' : undefined,
        externalId: metaId,
      });
    }

    return {
      success: true,
      result,
    };
  }
}
