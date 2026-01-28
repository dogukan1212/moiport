import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  Public,
} from '../common/guards/auth.guard';
import { GetTenantId } from '../common/decorators/user.decorator';
import type { Request } from 'express';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Get('plans')
  @Roles('ADMIN', 'HR', 'SUPER_ADMIN')
  findPlans() {
    return this.service.findPlans();
  }

  @Public()
  @Get('public/plans')
  listPublicPlans() {
    return this.service.findPlans();
  }

  @Post('paytr/installments')
  @Roles('ADMIN')
  getInstallments(
    @Body()
    data: {
      bin: string;
      amount: number;
    },
  ) {
    return this.service.getPaytrInstallments(data.bin, data.amount);
  }

  @Get('me')
  @Roles('ADMIN', 'HR', 'STAFF')
  getMySubscription(@GetTenantId() tenantId: string) {
    return this.service.getTenantSubscription(tenantId);
  }

  @Post('paytr/init')
  @Roles('ADMIN')
  initPaytr(
    @GetTenantId() tenantId: string,
    @Req() req: Request,
    @Body()
    data: {
      planCode: string;
      period: 'MONTHLY' | 'YEARLY';
      method?: 'CARD' | 'BANK_TRANSFER';
      promoCode?: string;
      installments?: number;
      billing?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
        taxNumber?: string;
      };
      card?: {
        number?: string;
        name?: string;
        expiry?: string;
        cvv?: string;
      };
    },
  ) {
    return this.service.initPaytrPayment(
      tenantId,
      this.getRequestIp(req),
      data.planCode,
      data.period,
      data.method,
      data.promoCode,
      data.installments,
      data.billing,
      data.card,
    );
  }

  @Post('paytr/callback')
  @Public()
  paytrCallback(@Body() payload: any) {
    return this.service.handlePaytrCallback(payload);
  }

  private getRequestIp(req: Request) {
    const xff = String(req.headers['x-forwarded-for'] || '')
      .split(',')[0]
      ?.trim();
    if (xff) return xff;
    const realIp = String(req.headers['x-real-ip'] || '').trim();
    if (realIp) return realIp;
    return String((req as any).ip || '').trim();
  }

  // Admin plan management
  @Get('admin/plans')
  @Roles('SUPER_ADMIN')
  listAllPlans() {
    return this.service.findPlans();
  }

  @Post('admin/plans')
  @Roles('SUPER_ADMIN')
  createPlan(
    @Body()
    data: {
      code: string;
      name: string;
      description?: string;
      monthlyPrice: number;
      yearlyPrice?: number;
      isPopular?: boolean;
      maxUsers?: number;
      maxStorage?: number;
      features?: string[];
    },
  ) {
    return this.service.createPlan(data);
  }

  @Patch('admin/plans/:code')
  @Roles('SUPER_ADMIN')
  updatePlan(
    @Param('code') code: string,
    @Body()
    data: Partial<{
      name: string;
      description: string;
      monthlyPrice: number;
      yearlyPrice: number;
      isPopular: boolean;
      maxUsers: number;
      maxStorage: number;
      features: string[];
    }>,
  ) {
    return this.service.updatePlan(code, data);
  }
}
