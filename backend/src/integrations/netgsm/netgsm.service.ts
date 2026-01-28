import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NetgsmService {
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

  async getSystemConfig() {
    let config = await this.prisma.systemConfig.findFirst();
    if (!config) {
      config = await this.prisma.systemConfig.create({
        data: {
          netgsmUsercode: '',
          netgsmPassword: '',
          netgsmMsgheader: '',
          netgsmIsActive: false,
          registrationSmsVerificationEnabled: false,
        },
      });
    }
    return config;
  }

  async updateSystemConfig(data: {
    netgsmUsercode?: string | null;
    netgsmPassword?: string | null;
    netgsmMsgheader?: string | null;
    netgsmIsActive?: boolean;
    registrationSmsVerificationEnabled?: boolean;
  }) {
    const config = await this.getSystemConfig();
    return this.prisma.systemConfig.update({
      where: { id: config.id },
      data: {
        netgsmUsercode: data.netgsmUsercode ?? null,
        netgsmPassword: data.netgsmPassword ?? null,
        netgsmMsgheader: data.netgsmMsgheader ?? null,
        netgsmIsActive:
          typeof data.netgsmIsActive === 'boolean'
            ? data.netgsmIsActive
            : config.netgsmIsActive,
        registrationSmsVerificationEnabled:
          typeof data.registrationSmsVerificationEnabled === 'boolean'
            ? data.registrationSmsVerificationEnabled
            : config.registrationSmsVerificationEnabled,
      },
    });
  }

  async getConfig(tenantId: string) {
    let db: any = null;
    try {
      db = await this.prisma.netgsmConfig.findFirst({
        where: { tenantId },
      });
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.toLowerCase().includes('no such table')) {
        return {
          tenantId,
          usercode: null,
          password: null,
          msgheader: null,
          isActive: false,
        };
      }
      throw error;
    }

    if (!db) {
      return {
        tenantId,
        usercode: null,
        password: null,
        msgheader: null,
        isActive: false,
      };
    }
    return db;
  }

  async updateConfig(
    tenantId: string,
    data: {
      usercode?: string | null;
      password?: string | null;
      msgheader?: string | null;
      isActive?: boolean;
    },
  ) {
    let existing: any = null;
    try {
      existing = await this.prisma.netgsmConfig.findFirst({
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
      return await this.prisma.netgsmConfig.update({
        where: { id: existing.id },
        data: {
          usercode:
            data.usercode !== undefined ? data.usercode : existing.usercode,
          password:
            data.password !== undefined ? data.password : existing.password,
          msgheader:
            data.msgheader !== undefined ? data.msgheader : existing.msgheader,
          isActive,
        },
      });
    }

    return await this.prisma.netgsmConfig.create({
      data: {
        tenantId,
        usercode: data.usercode ?? null,
        password: data.password ?? null,
        msgheader: data.msgheader ?? null,
        isActive,
      },
    });
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

  async sendSystemSms(
    to: string,
    message: string,
    overrides?: { msgheader?: string },
  ) {
    const config = await this.getSystemConfig();
    if (!config || !config.netgsmIsActive) {
      throw new BadRequestException('NetGSM sistem ayarları aktif değil');
    }
    const usercode = String(config.netgsmUsercode || '').trim();
    const password = String(config.netgsmPassword || '').trim();
    const msgheader =
      (overrides?.msgheader && overrides.msgheader.trim()) ||
      String(config.netgsmMsgheader || '').trim() ||
      '';
    const effectiveMsgheader = msgheader || usercode || '';

    if (!usercode || !password) {
      throw new BadRequestException('NetGSM sistem usercode/password eksik');
    }
    if (!message || message.trim().length === 0) {
      throw new BadRequestException('Mesaj içeriği zorunludur');
    }

    const normalizedPhone = this.normalizeTrGsm(to);

    try {
      const sendRequest = async (msgheaderCandidate?: string) => {
        const params: Record<string, any> = {
          usercode,
          password,
          gsmno: `90${normalizedPhone}`,
          message,
          dil: 'TR',
        };
        if (msgheaderCandidate) params.msgheader = msgheaderCandidate;

        const { data } = await axios.get(
          'https://api.netgsm.com.tr/sms/send/get',
          {
            params,
            timeout: 30_000,
          },
        );

        const text = String(data ?? '').trim();
        if (!text) {
          throw new InternalServerErrorException('NetGSM boş yanıt döndü');
        }

        const parts = text.split(/\s+/);
        const code = parts[0];
        const bulkId = parts[1];
        return { code, bulkId, raw: text };
      };

      const attemptHeaders: string[] = [];
      const tryHeaders: string[] = [];
      if (effectiveMsgheader) tryHeaders.push(effectiveMsgheader);

      const numeric = (effectiveMsgheader || '').replace(/[^\d]/g, '');
      if (numeric && numeric === effectiveMsgheader) {
        if (numeric.length === 10) {
          tryHeaders.push(`0${numeric}`);
        } else if (numeric.length === 11 && numeric.startsWith('0')) {
          tryHeaders.push(numeric.slice(1));
        }
      }

      const uniqueTryHeaders = Array.from(
        new Set(tryHeaders.map((h) => h.trim()).filter(Boolean)),
      );
      if (uniqueTryHeaders.length === 0) uniqueTryHeaders.push('');

      let lastResult: { code: string; bulkId?: string; raw: string } | null =
        null;
      for (const headerCandidate of uniqueTryHeaders) {
        attemptHeaders.push(headerCandidate || '(boş)');
        const r = await sendRequest(headerCandidate || undefined);
        lastResult = r;
        if (r.code === '00' || r.code === '0') {
          return { code: r.code, bulkId: r.bulkId, raw: r.raw };
        }
        if (r.code !== '40') {
          break;
        }
      }

      const code = String(lastResult?.code || '').trim();
      const bulkId = lastResult?.bulkId;
      const text = lastResult?.raw || '';

      if (code !== '00' && code !== '0') {
        if (code === '40') {
          throw new BadRequestException(
            `NetGSM: Mesaj başlığı (msgheader) sistemde tanımlı değil veya geçersiz. Denenen başlıklar: ${attemptHeaders.join(
              ', ',
            )}`,
          );
        }
        if (code === '30') {
          throw new BadRequestException(
            'NetGSM: Geçersiz kullanıcı adı/şifre veya API erişimi/IP kısıtı problemi.',
          );
        }
        throw new InternalServerErrorException(text);
      }

      return { code, bulkId, raw: text };
    } catch (error: any) {
      const msg = this.toErrorText(
        error?.response?.data || error?.message || error,
      );
      if (error instanceof BadRequestException) throw error;
      if (error instanceof InternalServerErrorException) throw error;
      throw new InternalServerErrorException(msg);
    }
  }

  async sendSms(
    tenantId: string,
    to: string,
    message: string,
    overrides?: { msgheader?: string },
  ) {
    const config = await this.getConfig(tenantId);
    if (!config || !config.isActive) {
      throw new BadRequestException('NetGSM entegrasyonu aktif değil');
    }

    const usercode =
      (typeof config.usercode === 'string' ? config.usercode : null) ||
      undefined;
    const password =
      (typeof config.password === 'string' ? config.password : null) ||
      undefined;
    const msgheader =
      (overrides?.msgheader && overrides.msgheader.trim()) ||
      (typeof config.msgheader === 'string' ? config.msgheader : '') ||
      '';
    const effectiveMsgheader = msgheader || usercode || '';

    if (!usercode || !password) {
      throw new BadRequestException('NetGSM usercode/password eksik');
    }
    if (!message || message.trim().length === 0) {
      throw new BadRequestException('Mesaj içeriği zorunludur');
    }

    const normalizedPhone = this.normalizeTrGsm(to);

    try {
      const sendRequest = async (msgheaderCandidate?: string) => {
        const params: Record<string, any> = {
          usercode,
          password,
          gsmno: `90${normalizedPhone}`,
          message,
          dil: 'TR',
        };
        if (msgheaderCandidate) params.msgheader = msgheaderCandidate;

        const { data } = await axios.get(
          'https://api.netgsm.com.tr/sms/send/get',
          {
            params,
            timeout: 30_000,
          },
        );

        const text = String(data ?? '').trim();
        if (!text) {
          throw new InternalServerErrorException('NetGSM boş yanıt döndü');
        }

        const parts = text.split(/\s+/);
        const code = parts[0];
        const bulkId = parts[1];
        return { code, bulkId, raw: text };
      };

      const attemptHeaders: string[] = [];
      const tryHeaders: string[] = [];
      if (effectiveMsgheader) tryHeaders.push(effectiveMsgheader);

      const numeric = (effectiveMsgheader || '').replace(/[^\d]/g, '');
      if (numeric && numeric === effectiveMsgheader) {
        if (numeric.length === 10) {
          tryHeaders.push(`0${numeric}`);
        } else if (numeric.length === 11 && numeric.startsWith('0')) {
          tryHeaders.push(numeric.slice(1));
        }
      }

      const uniqueTryHeaders = Array.from(
        new Set(tryHeaders.map((h) => h.trim()).filter(Boolean)),
      );
      if (uniqueTryHeaders.length === 0) uniqueTryHeaders.push('');

      let lastResult: { code: string; bulkId?: string; raw: string } | null =
        null;
      for (const headerCandidate of uniqueTryHeaders) {
        attemptHeaders.push(headerCandidate || '(boş)');
        const r = await sendRequest(headerCandidate || undefined);
        lastResult = r;
        if (r.code === '00' || r.code === '0') {
          return { code: r.code, bulkId: r.bulkId, raw: r.raw };
        }
        if (r.code !== '40') {
          break;
        }
      }

      const code = String(lastResult?.code || '').trim();
      const bulkId = lastResult?.bulkId;
      const text = lastResult?.raw || '';

      if (code !== '00' && code !== '0') {
        if (code === '40') {
          throw new BadRequestException(
            `NetGSM: Mesaj başlığı (msgheader) sistemde tanımlı değil veya geçersiz. Denenen başlıklar: ${attemptHeaders.join(
              ', ',
            )}`,
          );
        }
        if (code === '30') {
          throw new BadRequestException(
            'NetGSM: Geçersiz kullanıcı adı/şifre veya API erişimi/IP kısıtı problemi.',
          );
        }
        throw new InternalServerErrorException(text);
      }

      return { code, bulkId, raw: text };
    } catch (error: any) {
      const details =
        error?.response?.data ||
        error?.message ||
        'NetGSM API çağrısı başarısız';
      throw new InternalServerErrorException(this.toErrorText(details));
    }
  }
}
