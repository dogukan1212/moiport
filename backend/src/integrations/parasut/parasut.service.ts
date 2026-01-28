import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { URLSearchParams } from 'url';
import { PrismaService } from '../../prisma/prisma.service';

type ParasutState = {
  tenantId: string;
  customerId?: string | null;
};

@Injectable()
export class ParasutService {
  constructor(private prisma: PrismaService) {}

  private getBaseUrl() {
    return process.env.PARASUT_BASE_URL || 'https://api.parasut.com';
  }

  private getApiBaseUrl() {
    return process.env.PARASUT_API_BASE_URL || `${this.getBaseUrl()}/v4`;
  }

  private getOAuthConfig() {
    const clientId = process.env.PARASUT_CLIENT_ID;
    const clientSecret = process.env.PARASUT_CLIENT_SECRET;
    const redirectUri = process.env.PARASUT_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException(
        'Paraşüt entegrasyon ayarları eksik: PARASUT_CLIENT_ID, PARASUT_CLIENT_SECRET, PARASUT_REDIRECT_URI',
      );
    }

    return { clientId, clientSecret, redirectUri };
  }

  private buildState(payload: ParasutState) {
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  private parseState(state: string): ParasutState {
    try {
      const normalized = state.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = Buffer.from(normalized, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      if (!parsed?.tenantId) {
        throw new Error('tenantId eksik');
      }
      return parsed;
    } catch {
      throw new BadRequestException('Geçersiz state');
    }
  }

  async getConfig(tenantId: string, user?: any) {
    const where: any = { tenantId };
    if (user?.role === 'CLIENT' && user?.customerId) {
      where.customerId = user.customerId;
    } else if (user) {
      where.customerId = null;
    }
    if (!user) where.customerId = null;

    return this.prisma.parasutConfig.findFirst({ where });
  }

  async updateConfig(
    tenantId: string,
    data: { companyId?: string | null; isActive?: boolean },
    user?: any,
  ) {
    const where: any = { tenantId };
    if (user?.role === 'CLIENT' && user?.customerId) {
      where.customerId = user.customerId;
    } else {
      where.customerId = null;
    }

    const existing = await this.prisma.parasutConfig.findFirst({ where });
    const isActive =
      typeof data.isActive === 'boolean'
        ? data.isActive
        : (existing?.isActive ?? false);

    if (existing) {
      return this.prisma.parasutConfig.update({
        where: { id: existing.id },
        data: {
          companyId: data.companyId ?? existing.companyId,
          isActive,
        },
      });
    }

    return this.prisma.parasutConfig.create({
      data: {
        tenantId,
        customerId: user?.role === 'CLIENT' ? user.customerId : null,
        companyId: data.companyId ?? null,
        isActive,
      },
    });
  }

  async disconnect(tenantId: string, user?: any) {
    const where: any = { tenantId };
    if (user?.role === 'CLIENT' && user?.customerId) {
      where.customerId = user.customerId;
    } else {
      where.customerId = null;
    }

    const existing = await this.prisma.parasutConfig.findFirst({ where });
    if (!existing) {
      return null;
    }

    return this.prisma.parasutConfig.update({
      where: { id: existing.id },
      data: {
        accessToken: null,
        refreshToken: null,
        tokenType: null,
        scope: null,
        expiresAt: null,
        isActive: false,
      },
    });
  }

  async getAuthUrl(tenantId: string, user?: any) {
    const { clientId, redirectUri } = this.getOAuthConfig();
    const customerId =
      user?.role === 'CLIENT' ? (user.customerId ?? null) : null;
    const state = this.buildState({ tenantId, customerId });
    const baseUrl = this.getBaseUrl();

    const url =
      `${baseUrl}/oauth/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&state=${encodeURIComponent(state)}`;

    return url;
  }

  async handleCallback(code: string, state: string) {
    const { clientId, clientSecret, redirectUri } = this.getOAuthConfig();
    const { tenantId, customerId } = this.parseState(state);
    const baseUrl = this.getBaseUrl();

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    const response = await axios.post(`${baseUrl}/oauth/token`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const tokenData = response.data || {};
    const expiresAt =
      typeof tokenData.expires_in === 'number'
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null;

    const where: any = { tenantId };
    if (customerId) {
      where.customerId = customerId;
    } else {
      where.customerId = null;
    }

    const existing = await this.prisma.parasutConfig.findFirst({ where });

    if (existing) {
      return this.prisma.parasutConfig.update({
        where: { id: existing.id },
        data: {
          accessToken: tokenData.access_token ?? null,
          refreshToken: tokenData.refresh_token ?? null,
          tokenType: tokenData.token_type ?? null,
          scope: tokenData.scope ?? null,
          expiresAt,
          isActive: true,
        },
      });
    }

    return this.prisma.parasutConfig.create({
      data: {
        tenantId,
        customerId: customerId ?? null,
        accessToken: tokenData.access_token ?? null,
        refreshToken: tokenData.refresh_token ?? null,
        tokenType: tokenData.token_type ?? null,
        scope: tokenData.scope ?? null,
        expiresAt,
        isActive: true,
      },
    });
  }

  private async refreshAccessToken(config: any) {
    const { clientId, clientSecret } = this.getOAuthConfig();
    if (!config?.refreshToken) {
      throw new BadRequestException('Refresh token bulunamadı');
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('refresh_token', String(config.refreshToken ?? ''));

    const baseUrl = this.getBaseUrl();
    const response = await axios.post(`${baseUrl}/oauth/token`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const tokenData = response.data || {};
    const expiresAt =
      typeof tokenData.expires_in === 'number'
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null;

    return this.prisma.parasutConfig.update({
      where: { id: config.id },
      data: {
        accessToken: tokenData.access_token ?? config.accessToken ?? null,
        refreshToken: tokenData.refresh_token ?? config.refreshToken ?? null,
        tokenType: tokenData.token_type ?? config.tokenType ?? null,
        scope: tokenData.scope ?? config.scope ?? null,
        expiresAt,
        isActive: true,
      },
    });
  }

  private async ensureAccessToken(config: any) {
    if (!config?.accessToken) {
      throw new BadRequestException('Paraşüt bağlantısı bulunamadı');
    }

    if (config.expiresAt) {
      const now = Date.now();
      const expiresAt = new Date(String(config.expiresAt ?? '')).getTime();
      if (expiresAt - now <= 60_000) {
        return this.refreshAccessToken(config);
      }
    }

    return config;
  }

  async getMe(tenantId: string, user?: any) {
    const config = await this.getConfig(tenantId, user);
    const refreshed = await this.ensureAccessToken(config);
    const apiBaseUrl = this.getApiBaseUrl();

    const response = await axios.get(`${apiBaseUrl}/me`, {
      headers: { Authorization: `Bearer ${refreshed.accessToken}` },
    });

    return response.data;
  }
}
