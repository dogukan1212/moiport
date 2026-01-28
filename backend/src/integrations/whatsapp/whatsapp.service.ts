import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { URLSearchParams } from 'url';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WhatsappService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureAiDir() {
    const dir = path.join(process.cwd(), 'storage', 'whatsapp-ai');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  private aiConfigPath(tenantId: string, user?: any) {
    const dir = this.ensureAiDir();
    const suffix =
      user?.role === 'CLIENT' && user?.customerId ? `_${user.customerId}` : '';
    return path.join(dir, `${tenantId}${suffix}.json`);
  }

  private readAiConfig(
    tenantId: string,
    user?: any,
  ): {
    aiEnabled: boolean;
    autoReplyEnabled: boolean;
    autoReplyTemplates: string | null;
  } {
    try {
      const p = this.aiConfigPath(tenantId, user);
      if (!fs.existsSync(p)) {
        return {
          aiEnabled: false,
          autoReplyEnabled: false,
          autoReplyTemplates: null,
        };
      }
      const raw = fs.readFileSync(p, 'utf-8');
      const json = JSON.parse(raw || '{}');
      return {
        aiEnabled: !!json.aiEnabled,
        autoReplyEnabled: !!json.autoReplyEnabled,
        autoReplyTemplates:
          typeof json.autoReplyTemplates === 'string'
            ? json.autoReplyTemplates
            : null,
      };
    } catch {
      return {
        aiEnabled: false,
        autoReplyEnabled: false,
        autoReplyTemplates: null,
      };
    }
  }

  private writeAiConfig(
    tenantId: string,
    user: any,
    data: {
      aiEnabled?: boolean;
      autoReplyEnabled?: boolean;
      autoReplyTemplates?: string | null;
    },
  ) {
    const prev = this.readAiConfig(tenantId, user);
    const merged = {
      aiEnabled:
        typeof data.aiEnabled === 'boolean' ? data.aiEnabled : prev.aiEnabled,
      autoReplyEnabled:
        typeof data.autoReplyEnabled === 'boolean'
          ? data.autoReplyEnabled
          : prev.autoReplyEnabled,
      autoReplyTemplates:
        data.autoReplyTemplates !== undefined
          ? data.autoReplyTemplates
          : prev.autoReplyTemplates,
    };
    const p = this.aiConfigPath(tenantId, user);
    fs.writeFileSync(p, JSON.stringify(merged));
    return merged;
  }

  async getConfig(tenantId: string, user?: any) {
    const where: any = { tenantId };
    if (user?.role === 'CLIENT' && user?.customerId) {
      where.customerId = user.customerId;
    } else if (user) {
      where.customerId = null;
    }
    // If user is undefined (system call), we might default to agency (null) or findFirst?
    // Let's default to agency if no user context, or allow findFirst if we want any?
    // Better: default to agency (customerId: null) for consistency.
    if (!user) where.customerId = null;

    let db = await this.prisma.whatsappConfig.findFirst({
      where,
    });
    if (!db && user?.role === 'CLIENT') {
      db = await this.prisma.whatsappConfig.findFirst({
        where: { tenantId, customerId: null },
      });
    }
    if (!db) {
      return {
        tenantId,
        customerId: user?.customerId ?? null,
        isActive: false,
        provider: 'meta',
        phoneNumberId: null,
        accessToken: null,
        apiVersion: 'v21.0',
        twilioAccountSid: null,
        aiEnabled: false,
        autoReplyEnabled: false,
        autoReplyTemplates: null,
      };
    }
    return db;
  }

  async updateConfig(
    tenantId: string,
    data: {
      phoneNumberId?: string | null;
      accessToken?: string | null;
      apiVersion?: string | null;
      provider?: string | null;
      twilioAccountSid?: string | null;
      isActive?: boolean;
      aiEnabled?: boolean;
      autoReplyEnabled?: boolean;
      autoReplyTemplates?: string | null;
    },
    user?: any,
  ) {
    const where: any = { tenantId };
    if (user?.role === 'CLIENT' && user?.customerId) {
      where.customerId = user.customerId;
    } else {
      where.customerId = null;
    }

    const existing = await this.prisma.whatsappConfig.findFirst({
      where,
    });

    const isActive =
      typeof data.isActive === 'boolean'
        ? data.isActive
        : (existing?.isActive ?? false);

    const provider =
      (data.provider && data.provider.trim().toLowerCase()) ||
      existing?.provider ||
      'meta';

    let saved;
    if (existing) {
      saved = await this.prisma.whatsappConfig.update({
        where: { id: existing.id },
        data: {
          phoneNumberId:
            data.phoneNumberId !== undefined
              ? data.phoneNumberId
              : existing.phoneNumberId,
          accessToken:
            data.accessToken !== undefined
              ? data.accessToken
              : existing.accessToken,
          apiVersion:
            data.apiVersion !== undefined && data.apiVersion !== null
              ? data.apiVersion
              : (existing.apiVersion ?? 'v21.0'),
          provider,
          twilioAccountSid:
            data.twilioAccountSid !== undefined
              ? data.twilioAccountSid
              : existing.twilioAccountSid,
          isActive,
          aiEnabled:
            typeof data.aiEnabled === 'boolean'
              ? data.aiEnabled
              : (existing.aiEnabled ?? false),
          autoReplyEnabled:
            typeof data.autoReplyEnabled === 'boolean'
              ? data.autoReplyEnabled
              : (existing.autoReplyEnabled ?? false),
          autoReplyTemplates:
            data.autoReplyTemplates !== undefined
              ? data.autoReplyTemplates
              : existing.autoReplyTemplates,
        },
      });
    } else {
      saved = await this.prisma.whatsappConfig.create({
        data: {
          tenantId,
          customerId: user?.role === 'CLIENT' ? user.customerId : null,
          phoneNumberId: data.phoneNumberId ?? null,
          accessToken: data.accessToken ?? null,
          apiVersion: data.apiVersion ?? 'v21.0',
          provider,
          twilioAccountSid: data.twilioAccountSid ?? null,
          isActive,
          aiEnabled:
            typeof data.aiEnabled === 'boolean' ? data.aiEnabled : false,
          autoReplyEnabled:
            typeof data.autoReplyEnabled === 'boolean'
              ? data.autoReplyEnabled
              : false,
          autoReplyTemplates: data.autoReplyTemplates ?? null,
        },
      });
    }
    return saved;
  }

  async sendMessage(
    tenantId: string,
    to: string,
    message: string,
    attachments?: { url: string; type: string; name?: string }[],
    user?: any,
  ) {
    const config = await this.getConfig(tenantId, user);
    if (!config || !config.isActive) {
      throw new InternalServerErrorException(
        'WhatsApp API yapılandırması eksik',
      );
    }

    let provider = (config.provider || '').toLowerCase();

    if (!provider && config.phoneNumberId && config.accessToken) {
      provider = 'meta';
    } else if (!provider && config.accessToken && !config.phoneNumberId) {
      provider = 'wasender';
    } else if (
      provider === 'meta' &&
      !config.phoneNumberId &&
      config.accessToken
    ) {
      provider = 'wasender';
    }

    if (provider === 'meta') {
      const phoneNumberId = config.phoneNumberId;
      const accessToken = config.accessToken;
      const apiVersion = config.apiVersion || 'v21.0';

      if (!phoneNumberId || !accessToken) {
        throw new InternalServerErrorException(
          'Meta WhatsApp Cloud API yapılandırması eksik',
        );
      }

      const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };

      // Send text message if content exists
      let lastResponseData: any = null;

      if (message && message.trim()) {
        try {
          const res = await axios.post(
            url,
            {
              messaging_product: 'whatsapp',
              to,
              type: 'text',
              text: { body: message },
            },
            { headers },
          );
          lastResponseData = res.data;
        } catch (error: any) {
          console.error(
            'Meta WhatsApp Text Error:',
            error.response?.data || error.message,
          );
          throw new InternalServerErrorException(
            `WhatsApp mesajı gönderilemedi: ${error.message}`,
          );
        }
      }

      // Send attachments
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          const type = att.type.startsWith('image') ? 'image' : 'document';
          const payload: any = {
            messaging_product: 'whatsapp',
            to,
            type,
          };

          if (type === 'image') {
            payload.image = { link: att.url }; // Meta requires public URL
          } else {
            payload.document = { link: att.url, filename: att.name || 'Dosya' };
          }

          try {
            const res = await axios.post(url, payload, { headers });
            if (!lastResponseData) lastResponseData = res.data;
          } catch (error: any) {
            console.error(
              'Meta WhatsApp Media Error:',
              error.response?.data || error.message,
            );
            // Continue sending other attachments even if one fails
          }
        }
      }
      return { success: true, metaResponse: lastResponseData };
    }

    if (provider === 'infobip') {
      const sender = config.phoneNumberId;
      const apiKey = config.accessToken;
      const baseUrl = 'https://api.infobip.com';
      if (!sender || !apiKey) {
        throw new InternalServerErrorException('Infobip yapılandırması eksik');
      }
      const headers = {
        Authorization: `App ${apiKey}`,
        'Content-Type': 'application/json',
      };
      let lastResponseData: any = null;
      if (message && message.trim()) {
        const url = `${baseUrl}/whatsapp/1/message/text`;
        const payload = {
          from: sender,
          to,
          content: { text: message },
        };
        try {
          const res = await axios.post(url, payload, { headers });
          lastResponseData = res.data;
        } catch (error: any) {
          throw new InternalServerErrorException(
            `Infobip hatası: ${error.response?.data?.requestError?.serviceException?.message || error.message}`,
          );
        }
      }
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          const isImage = (att.type || '').startsWith('image');
          const url = `${baseUrl}/whatsapp/1/message/${isImage ? 'image' : 'document'}`;
          const payload: any = {
            from: sender,
            to,
            content: {
              mediaUrl: att.url,
            },
          };
          if (!isImage) {
            payload.content.caption = att.name || 'Dosya';
          }
          try {
            const res = await axios.post(url, payload, { headers });
            if (!lastResponseData) lastResponseData = res.data;
          } catch (error: any) {
            // ignore single attachment failure
          }
        }
      }
      return { success: true, infobipResponse: lastResponseData };
    }

    // Legacy/Wasender fallback
    const apiKey = config.accessToken;
    if (!apiKey) {
      throw new InternalServerErrorException('API anahtarı eksik.');
    }

    const url = 'https://www.wasenderapi.com/api/send-message';
    // Wasender likely supports only text in this endpoint
    if (message) {
      try {
        const response = await axios.post(
          url,
          { to, text: message },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        );
        return response.data;
      } catch (error: any) {
        throw new InternalServerErrorException(
          `WasenderAPI hatası: ${error.message}`,
        );
      }
    }
    return { success: true };
  }

  // Deprecated
  async sendTextMessage(tenantId: string, to: string, body: string) {
    return this.sendMessage(tenantId, to, body);
  }
}
