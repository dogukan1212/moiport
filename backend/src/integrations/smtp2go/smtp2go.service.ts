import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import nodemailer from 'nodemailer';

@Injectable()
export class Smtp2goService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeEmail(value: unknown) {
    if (typeof value !== 'string') return '';
    return value.trim().toLowerCase();
  }

  async getSystemConfig() {
    let config = await this.prisma.systemConfig.findFirst();
    if (!config) {
      config = await this.prisma.systemConfig.create({
        data: {
          smtp2goUsername: '',
          smtp2goPassword: '',
          smtp2goFromEmail: '',
          smtp2goFromName: '',
          smtp2goIsActive: false,
        },
      });
    }
    return config;
  }

  async updateSystemConfig(data: {
    smtp2goUsername?: string | null;
    smtp2goPassword?: string | null;
    smtp2goFromEmail?: string | null;
    smtp2goFromName?: string | null;
    smtp2goIsActive?: boolean;
  }) {
    const config = await this.getSystemConfig();
    return this.prisma.systemConfig.update({
      where: { id: config.id },
      data: {
        smtp2goUsername: data.smtp2goUsername ?? null,
        smtp2goPassword: data.smtp2goPassword ?? null,
        smtp2goFromEmail: data.smtp2goFromEmail ?? null,
        smtp2goFromName: data.smtp2goFromName ?? null,
        smtp2goIsActive:
          typeof data.smtp2goIsActive === 'boolean'
            ? data.smtp2goIsActive
            : config.smtp2goIsActive,
      },
    });
  }

  async sendTestEmail(data: {
    to: string;
    subject?: string | null;
    text?: string | null;
    html?: string | null;
  }) {
    const config = await this.getSystemConfig();

    if (!config.smtp2goIsActive) {
      throw new BadRequestException('SMTP2GO sistem ayarları aktif değil');
    }

    const username = String(config.smtp2goUsername || '').trim();
    const password = String(config.smtp2goPassword || '').trim();
    const fromEmail = this.normalizeEmail(config.smtp2goFromEmail);
    const fromName = String(config.smtp2goFromName || '').trim();

    if (!username || !password) {
      throw new BadRequestException('SMTP2GO username/password eksik');
    }
    if (!fromEmail) {
      throw new BadRequestException(
        'Gönderici e-posta (From Email) zorunludur',
      );
    }

    const to = this.normalizeEmail(data.to);
    if (!to || !to.includes('@')) {
      throw new BadRequestException('Test e-posta alıcısı geçersiz');
    }

    const subject = String(data.subject || 'SMTP2GO Test Mail').trim();
    const text = String(
      data.text ||
        'Bu e-posta SMTP2GO ayarlarının çalıştığını doğrulamak için gönderilmiştir.',
    );

    try {
      const transporter = nodemailer.createTransport({
        host: 'mail.smtp2go.com',
        port: 587,
        secure: false,
        auth: {
          user: username,
          pass: password,
        },
      });

      const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html: data.html || undefined,
      });

      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
      };
    } catch (error: any) {
      const code = String(error?.code || '')
        .trim()
        .toUpperCase();
      const responseCode = Number(error?.responseCode || 0);
      const message = String(error?.message || '');

      if (code === 'EAUTH' || responseCode === 535) {
        throw new BadRequestException(
          'SMTP2GO giriş bilgileri hatalı (535). Username/Password kontrol edin.',
        );
      }

      if (
        code === 'ECONNECTION' ||
        code === 'ECONNREFUSED' ||
        code === 'ETIMEDOUT' ||
        code === 'ENOTFOUND'
      ) {
        throw new BadRequestException(
          'SMTP sunucusuna bağlanılamadı. Ağ/Firewall veya port engeli olabilir.',
        );
      }

      throw new BadRequestException(
        message || 'Test e-postası gönderilemedi (bilinmeyen hata).',
      );
    }
  }

  async sendEmail(data: {
    to: string;
    subject: string;
    text: string;
    html?: string | null;
  }) {
    const config = await this.getSystemConfig();

    if (!config.smtp2goIsActive) {
      throw new BadRequestException('SMTP2GO sistem ayarları aktif değil');
    }

    const username = String(config.smtp2goUsername || '').trim();
    const password = String(config.smtp2goPassword || '').trim();
    const fromEmail = this.normalizeEmail(config.smtp2goFromEmail);
    const fromName = String(config.smtp2goFromName || '').trim();

    if (!username || !password) {
      throw new BadRequestException('SMTP2GO username/password eksik');
    }
    if (!fromEmail) {
      throw new BadRequestException(
        'Gönderici e-posta (From Email) zorunludur',
      );
    }

    const to = this.normalizeEmail(data.to);
    if (!to || !to.includes('@')) {
      throw new BadRequestException('E-posta alıcısı geçersiz');
    }

    const subject = String(data.subject || '').trim();
    const text = String(data.text || '');
    if (!subject) {
      throw new BadRequestException('E-posta konusu zorunludur');
    }
    if (!text) {
      throw new BadRequestException('E-posta içeriği zorunludur');
    }

    try {
      const transporter = nodemailer.createTransport({
        host: 'mail.smtp2go.com',
        port: 587,
        secure: false,
        auth: {
          user: username,
          pass: password,
        },
      });

      const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html: data.html || undefined,
      });

      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
      };
    } catch (error: any) {
      const code = String(error?.code || '')
        .trim()
        .toUpperCase();
      const responseCode = Number(error?.responseCode || 0);
      const message = String(error?.message || '');

      if (code === 'EAUTH' || responseCode === 535) {
        throw new BadRequestException(
          'SMTP2GO giriş bilgileri hatalı (535). Username/Password kontrol edin.',
        );
      }

      if (
        code === 'ECONNECTION' ||
        code === 'ECONNREFUSED' ||
        code === 'ETIMEDOUT' ||
        code === 'ENOTFOUND'
      ) {
        throw new BadRequestException(
          'SMTP sunucusuna bağlanılamadı. Ağ/Firewall veya port engeli olabilir.',
        );
      }

      throw new BadRequestException(
        message || 'E-posta gönderilemedi (bilinmeyen hata).',
      );
    }
  }
}
