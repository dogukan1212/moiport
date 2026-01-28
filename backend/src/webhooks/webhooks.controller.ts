import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { FacebookService } from '../integrations/facebook/facebook.service';
import { Public } from '../common/guards/auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { createHmac } from 'crypto';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly facebookService: FacebookService,
    private readonly prisma: PrismaService,
  ) {}

  // Meta (Instagram/Facebook) Verification
  @Public()
  @Get('meta')
  async verifyMeta(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    console.log('Meta Webhook Verification:', { mode, token, challenge });
    const config = await this.facebookService.getSystemConfig();
    const verifyToken =
      config.facebookVerifyToken || process.env.META_VERIFY_TOKEN;

    console.log('Expected Token:', verifyToken);

    // Meta bazen token'ı string olarak göndermeyebilir veya boşluk olabilir, trim yapalım
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Verification successful, returning challenge:', challenge);
      return challenge;
    }

    // Eğer veritabanında token yoksa ve gelen token bizim manuel belirlediğimiz ise kabul et (Test için)
    if (mode === 'subscribe' && token === '3ebf6a77424ce953cd0c5d3e628e7567') {
      console.log(
        'Verification successful (Hardcoded fallback), returning challenge:',
        challenge,
      );
      return challenge;
    }

    console.log('Verification failed');
    return 'Verification failed';
  }

  // Meta (Instagram/Facebook) Payload
  @Public()
  @Post('meta')
  @HttpCode(HttpStatus.OK)
  async handleMetaPayload(@Body() payload: any) {
    console.log('Meta Webhook Payload:', JSON.stringify(payload, null, 2));
    return this.webhooksService.handleMetaPayload(payload);
  }

  @Public()
  @Post('wasender')
  @HttpCode(HttpStatus.OK)
  async handleWasenderPayload(
    @Body() payload: any,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    const secret = process.env.WASENDER_WEBHOOK_SECRET;
    if (secret && signature !== secret) {
      return { status: 'unauthorized' };
    }
    return this.webhooksService.handleWasenderPayload(payload);
  }

  @Public()
  @Post('paytr/link')
  @HttpCode(HttpStatus.OK)
  async handlePaytrLinkCallback(@Body() body: any) {
    const callbackId = String(body?.callback_id || '').trim();
    const merchantOid = String(body?.merchant_oid || '').trim();
    const status = String(body?.status || '').trim();
    const totalAmount = String(body?.total_amount || '').trim();
    const hash = String(body?.hash || '').trim();

    if (!callbackId) {
      return 'OK';
    }

    const payment = await this.prisma.invoicePayment.findFirst({
      where: { id: callbackId },
      select: { id: true, tenantId: true, invoiceId: true, status: true },
    });
    if (!payment) {
      return 'OK';
    }

    const config = await this.prisma.paytrConfig.findFirst({
      where: { tenantId: payment.tenantId },
      select: { merchantKey: true, merchantSalt: true, isActive: true },
    });
    if (!config?.isActive || !config.merchantKey || !config.merchantSalt) {
      return 'OK';
    }

    const hashStr = `${callbackId}${merchantOid}${config.merchantSalt}${status}${totalAmount}`;
    const expected = createHmac('sha256', config.merchantKey)
      .update(hashStr)
      .digest('base64');
    if (expected !== hash) {
      return 'PAYTR notification failed: bad hash';
    }

    if (payment.status === 'PAID') {
      return 'OK';
    }

    const rawCallback = (() => {
      try {
        return JSON.stringify(body);
      } catch {
        return null;
      }
    })();

    if (status === 'success') {
      await this.prisma.invoicePayment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paytrMerchantOid: merchantOid || null,
          paidAt: new Date(),
          rawCallback,
        },
      });

      const invoice = await this.prisma.invoice.findFirst({
        where: { id: payment.invoiceId, tenantId: payment.tenantId },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          currency: true,
          customerId: true,
          number: true,
        },
      });

      if (invoice && invoice.status !== 'PAID') {
        await this.prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: 'PAID' },
        });
      }

      if (invoice) {
        const already = await this.prisma.transaction.findFirst({
          where: {
            tenantId: payment.tenantId,
            invoiceId: invoice.id,
            type: 'INCOME',
            status: 'PAID',
          },
          select: { id: true },
        });
        if (!already) {
          const cbAmount = Number(totalAmount);
          const amount =
            Number.isFinite(cbAmount) && cbAmount > 0
              ? cbAmount / 100
              : Number(invoice.totalAmount || 0);
          await this.prisma.transaction.create({
            data: {
              tenantId: payment.tenantId,
              type: 'INCOME',
              amount,
              category: 'Invoice',
              description: `PayTR: ${invoice.number}`,
              status: 'PAID',
              customerId: invoice.customerId,
              invoiceId: invoice.id,
              date: new Date(),
            },
          });
        }
      }
    } else {
      await this.prisma.invoicePayment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          paytrMerchantOid: merchantOid || null,
          rawCallback,
        },
      });
    }

    return 'OK';
  }
}
