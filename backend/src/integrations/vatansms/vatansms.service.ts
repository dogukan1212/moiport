import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

type VatansmsSendResponse = {
  status?: string | boolean;
  message?: string;
  id?: number | string;
  [key: string]: any;
};

@Injectable()
export class VatansmsService {
  constructor(private readonly prisma: PrismaService) {}

  private toErrorText(value: unknown) {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    if (value instanceof Error) return value.message || 'Bilinmeyen hata';
    try {
      return JSON.stringify(value);
    } catch {
      return 'Bilinmeyen hata';
    }
  }

  private isDbNotReadyError(error: any) {
    const msg = String(error?.message || '').toLowerCase();
    const code = String(error?.code || '').toUpperCase();
    return (
      msg.includes('no such table') ||
      msg.includes('does not exist in the current database') ||
      code === 'P2021' ||
      code === 'P2022'
    );
  }

  async getConfig(tenantId: string) {
    let db: any = null;
    try {
      db = await this.prisma.vatansmsConfig.findFirst({
        where: { tenantId },
      });
    } catch (error: any) {
      if (this.isDbNotReadyError(error)) {
        return {
          tenantId,
          apiId: null,
          apiKey: null,
          sender: null,
          messageType: 'normal',
          messageContentType: 'bilgi',
          isActive: false,
        };
      }
      throw error;
    }

    if (!db) {
      return {
        tenantId,
        apiId: null,
        apiKey: null,
        sender: null,
        messageType: 'normal',
        messageContentType: 'bilgi',
        isActive: false,
      };
    }

    return db;
  }

  async updateConfig(
    tenantId: string,
    data: {
      apiId?: string | null;
      apiKey?: string | null;
      sender?: string | null;
      messageType?: string | null;
      messageContentType?: string | null;
      isActive?: boolean;
    },
  ) {
    let existing: any = null;
    try {
      existing = await this.prisma.vatansmsConfig.findFirst({
        where: { tenantId },
      });
    } catch (error: any) {
      if (this.isDbNotReadyError(error)) {
        throw new BadRequestException(
          'Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.',
        );
      }
      throw error;
    }

    const messageType =
      (data.messageType && data.messageType.trim().toLowerCase()) ||
      existing?.messageType ||
      'normal';

    const messageContentType =
      (data.messageContentType &&
        data.messageContentType.trim().toLowerCase()) ||
      existing?.messageContentType ||
      'bilgi';

    const isActive =
      typeof data.isActive === 'boolean'
        ? data.isActive
        : (existing?.isActive ?? false);

    if (existing) {
      try {
        return await this.prisma.vatansmsConfig.update({
          where: { id: existing.id },
          data: {
            apiId: data.apiId !== undefined ? data.apiId : existing.apiId,
            apiKey: data.apiKey !== undefined ? data.apiKey : existing.apiKey,
            sender: data.sender !== undefined ? data.sender : existing.sender,
            messageType,
            messageContentType,
            isActive,
          },
        });
      } catch (error: any) {
        if (this.isDbNotReadyError(error)) {
          throw new BadRequestException(
            'Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.',
          );
        }
        throw error;
      }
    }

    try {
      return await this.prisma.vatansmsConfig.create({
        data: {
          tenantId,
          apiId: data.apiId ?? null,
          apiKey: data.apiKey ?? null,
          sender: data.sender ?? null,
          messageType,
          messageContentType,
          isActive,
        },
      });
    } catch (error: any) {
      if (this.isDbNotReadyError(error)) {
        throw new BadRequestException(
          'Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.',
        );
      }
      throw error;
    }
  }

  private normalizeTrGsm(phone: string) {
    const digits = String(phone || '').replace(/[^\d]/g, '');
    if (digits.length === 10 && digits.startsWith('5')) return digits;
    if (digits.length === 11 && digits.startsWith('0') && digits[1] === '5')
      return digits.slice(1);
    if (digits.length === 12 && digits.startsWith('90') && digits[2] === '5')
      return digits.slice(2);
    throw new BadRequestException(
      'Telefon formatı geçersiz. Örnek: 5XXXXXXXXX veya 05XXXXXXXXX',
    );
  }

  async sendSms(
    tenantId: string,
    to: string,
    message: string,
    overrides?: {
      sender?: string;
      messageType?: string;
      messageContentType?: string;
    },
  ) {
    const config = await this.getConfig(tenantId);

    if (!config || !config.isActive) {
      throw new BadRequestException('VatanSMS entegrasyonu aktif değil');
    }

    const apiId =
      (typeof config.apiId === 'string' ? config.apiId : null) || undefined;
    const apiKey =
      (typeof config.apiKey === 'string' ? config.apiKey : null) || undefined;

    if (!apiId || !apiKey) {
      throw new BadRequestException('VatanSMS api_id/api_key eksik');
    }

    const sender =
      (overrides?.sender && overrides.sender.trim()) ||
      (typeof config.sender === 'string' ? config.sender : '') ||
      '';

    const normalizedPhone = this.normalizeTrGsm(to);

    const messageType =
      (overrides?.messageType && overrides.messageType.trim().toLowerCase()) ||
      (typeof config.messageType === 'string'
        ? config.messageType
        : 'normal') ||
      'normal';

    const messageContentType =
      (overrides?.messageContentType &&
        overrides.messageContentType.trim().toLowerCase()) ||
      (typeof config.messageContentType === 'string'
        ? config.messageContentType
        : 'bilgi') ||
      'bilgi';

    if (!message || message.trim().length === 0) {
      throw new BadRequestException('Mesaj içeriği zorunludur');
    }

    try {
      const payload: Record<string, any> = {
        api_id: apiId,
        api_key: apiKey,
        message_type: messageType,
        message,
        message_content_type: messageContentType,
        phones: [normalizedPhone],
      };
      if (sender) payload.sender = sender;

      const { data } = await axios.post<VatansmsSendResponse>(
        'https://api.vatansms.net/api/v1/1toN',
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30_000,
        },
      );

      return data;
    } catch (error: any) {
      const details =
        error?.response?.data ||
        error?.message ||
        'VatanSMS API çağrısı başarısız';
      throw new InternalServerErrorException(this.toErrorText(details));
    }
  }
}
