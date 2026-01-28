import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaytrService {
  constructor(private readonly prisma: PrismaService) {}

  async getSystemConfig() {
    let config = await this.prisma.systemConfig.findFirst();
    if (!config) {
      config = await this.prisma.systemConfig.create({
        data: {
          paytrMerchantId: '',
          paytrMerchantKey: '',
          paytrMerchantSalt: '',
          paytrIsActive: false,
          paytrTestMode: true,
        },
      });
    }
    return config;
  }

  async updateSystemConfig(data: {
    paytrMerchantId?: string | null;
    paytrMerchantKey?: string | null;
    paytrMerchantSalt?: string | null;
    paytrIsActive?: boolean;
    paytrTestMode?: boolean;
  }) {
    const config = await this.getSystemConfig();
    return this.prisma.systemConfig.update({
      where: { id: config.id },
      data: {
        paytrMerchantId: data.paytrMerchantId ?? null,
        paytrMerchantKey: data.paytrMerchantKey ?? null,
        paytrMerchantSalt: data.paytrMerchantSalt ?? null,
        paytrIsActive:
          typeof data.paytrIsActive === 'boolean'
            ? data.paytrIsActive
            : config.paytrIsActive,
        paytrTestMode:
          typeof data.paytrTestMode === 'boolean'
            ? data.paytrTestMode
            : config.paytrTestMode,
      },
    });
  }

  async getConfig(tenantId: string) {
    let db: any = null;
    try {
      db = await this.prisma.paytrConfig.findFirst({
        where: { tenantId },
      });
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.toLowerCase().includes('no such table')) {
        return {
          tenantId,
          merchantId: null,
          merchantKey: null,
          merchantSalt: null,
          isActive: false,
        };
      }
      throw error;
    }

    if (!db) {
      return {
        tenantId,
        merchantId: null,
        merchantKey: null,
        merchantSalt: null,
        isActive: false,
      };
    }

    return db;
  }

  async updateConfig(
    tenantId: string,
    data: {
      merchantId?: string | null;
      merchantKey?: string | null;
      merchantSalt?: string | null;
      isActive?: boolean;
    },
  ) {
    let existing: any = null;
    try {
      existing = await this.prisma.paytrConfig.findFirst({
        where: { tenantId },
      });
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.toLowerCase().includes('no such table')) {
        throw new BadRequestException(
          'Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.',
        );
      }
      throw error;
    }

    const isActive =
      typeof data.isActive === 'boolean'
        ? data.isActive
        : (existing?.isActive ?? false);

    if (existing) {
      return await this.prisma.paytrConfig.update({
        where: { id: existing.id },
        data: {
          merchantId:
            data.merchantId !== undefined
              ? data.merchantId
              : existing.merchantId,
          merchantKey:
            data.merchantKey !== undefined
              ? data.merchantKey
              : existing.merchantKey,
          merchantSalt:
            data.merchantSalt !== undefined
              ? data.merchantSalt
              : existing.merchantSalt,
          isActive,
        },
      });
    }

    return await this.prisma.paytrConfig.create({
      data: {
        tenantId,
        merchantId: data.merchantId ?? null,
        merchantKey: data.merchantKey ?? null,
        merchantSalt: data.merchantSalt ?? null,
        isActive,
      },
    });
  }
}
