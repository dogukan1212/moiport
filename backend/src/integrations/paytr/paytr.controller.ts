import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '../../common/guards/auth.guard';
import { GetTenantId } from '../../common/decorators/user.decorator';
import { PaytrService } from './paytr.service';

@Controller('integrations/paytr')
@UseGuards(JwtAuthGuard)
export class PaytrController {
  constructor(private readonly paytrService: PaytrService) {}

  @Get('system-config')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  getSystemConfig() {
    return this.paytrService.getSystemConfig();
  }

  @Post('system-config')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  updateSystemConfig(
    @Body()
    body: {
      paytrMerchantId?: string | null;
      paytrMerchantKey?: string | null;
      paytrMerchantSalt?: string | null;
      paytrIsActive?: boolean;
      paytrTestMode?: boolean;
    },
  ) {
    return this.paytrService.updateSystemConfig(body);
  }

  @Get('config')
  getConfig(@GetTenantId() tenantId: string) {
    return this.paytrService.getConfig(tenantId);
  }

  @Post('config')
  updateConfig(
    @GetTenantId() tenantId: string,
    @Body()
    body: {
      merchantId?: string | null;
      merchantKey?: string | null;
      merchantSalt?: string | null;
      isActive?: boolean;
    },
  ) {
    return this.paytrService.updateConfig(tenantId, body);
  }
}
