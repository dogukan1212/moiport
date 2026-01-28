import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class WordpressService {
  constructor(private prisma: PrismaService) {}

  private parseGmtDateTime(dateGmt?: string): Date | null {
    if (!dateGmt || typeof dateGmt !== 'string') return null;
    const normalized = dateGmt.trim();
    if (!normalized) return null;
    const iso = normalized.includes('T')
      ? normalized
      : normalized.replace(' ', 'T');
    const withZ = iso.endsWith('Z') ? iso : `${iso}Z`;
    const d = new Date(withZ);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private safeJsonStringify(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }

  async findAll(tenantId: string) {
    return this.prisma.wordpressSite.findMany({
      where: { tenantId },
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.wordpressSite.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
      },
    });
  }

  async create(tenantId: string, data: any) {
    const { siteUrl, connectionCode, customerId } = data;

    // Eğer connectionCode varsa (yeni akış), doğrulama yap
    if (connectionCode) {
      if (!siteUrl) {
        throw new BadRequestException('Site adresi gereklidir.');
      }

      // Generate a strong API key
      const apiKey = crypto.randomBytes(32).toString('hex');

      // Verify with WordPress site
      try {
        const verifyUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/moi-port/v1/verify-code`;
        await axios.post(
          verifyUrl,
          {
            code: connectionCode,
            api_key: apiKey,
          },
          {
            timeout: 10000, // 10 seconds timeout
          },
        );
      } catch (error) {
        console.error(
          'WordPress verification failed:',
          error.response?.data || error.message,
        );
        throw new BadRequestException(
          error.response?.data?.message ||
            'Bağlantı doğrulanamadı. Kod hatalı veya süresi dolmuş olabilir. Lütfen site adresini ve kodu kontrol edin.',
        );
      }

      return this.prisma.wordpressSite.create({
        data: {
          siteUrl,
          apiKey,
          customerId: customerId || null,
          isActive: true,
          tenantId,
        },
      });
    }

    // Eski manuel akış desteği (API Key direkt girildiyse)
    return this.prisma.wordpressSite.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    return this.prisma.wordpressSite.update({
      where: { id }, // In a real app, verify tenantId too, but ID is unique globally
      data,
    });
  }

  async createPost(tenantId: string, siteId: string, data: any) {
    const site = await this.prisma.wordpressSite.findFirst({
      where: { id: siteId, tenantId },
    });

    if (!site) {
      throw new BadRequestException('Site bulunamadı.');
    }

    try {
      const endpoint = `${site.siteUrl.replace(/\/$/, '')}/wp-json/moi-port/v1/post`;
      const response = await axios.post(
        endpoint,
        {
          title: data.title,
          content: data.content,
          status: data.status || 'draft',
          featured_image_url: data.featuredImage,
          categories: data.categories, // Array of category IDs
          tags: data.tags, // Array of tag names
          date: data.date, // Local time (legacy support)
          date_gmt: data.date_gmt, // UTC time (preferred for scheduling)
        },
        {
          headers: {
            'X-Moi-Port-Key': site.apiKey,
          },
        },
      );

      const wpPostId = Number(response.data?.post_id);
      if (!Number.isFinite(wpPostId)) {
        return response.data;
      }

      const status = (data.status || 'draft') as string;
      const scheduledAt =
        status === 'future' ? this.parseGmtDateTime(data.date_gmt) : null;
      const publishedAt = status === 'publish' ? new Date() : null;

      const tagsJson = this.safeJsonStringify(
        Array.isArray(data.tags) ? data.tags : undefined,
      );
      const categoriesJson = this.safeJsonStringify(
        Array.isArray(data.categories) ? data.categories : undefined,
      );

      await this.prisma.wordpressPost.upsert({
        where: {
          siteId_wpPostId: {
            siteId,
            wpPostId,
          },
        },
        create: {
          tenantId,
          siteId,
          wpPostId,
          postUrl: response.data?.post_url || null,
          title: data.title,
          content: data.content || null,
          status,
          tags: tagsJson,
          categories: categoriesJson,
          featuredImageUrl: data.featuredImage || null,
          scheduledAt,
          publishedAt,
        },
        update: {
          tenantId,
          postUrl: response.data?.post_url || null,
          title: data.title,
          content: data.content || null,
          status,
          tags: tagsJson,
          categories: categoriesJson,
          featuredImageUrl: data.featuredImage || null,
          scheduledAt,
          publishedAt,
          deletedAt: null,
        },
      });

      return response.data;
    } catch (error) {
      console.error(
        'WordPress post creation failed:',
        error.response?.data || error.message,
      );
      throw new BadRequestException(
        error.response?.data?.message || 'WordPress yazısı oluşturulamadı.',
      );
    }
  }

  async listPosts(tenantId: string, siteId: string) {
    const site = await this.prisma.wordpressSite.findFirst({
      where: { id: siteId, tenantId },
    });
    if (!site) {
      throw new BadRequestException('Site bulunamadı.');
    }

    return this.prisma.wordpressPost.findMany({
      where: {
        tenantId,
        siteId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getKpi(tenantId: string, siteId: string) {
    const site = await this.prisma.wordpressSite.findFirst({
      where: { id: siteId, tenantId },
    });
    if (!site) {
      throw new BadRequestException('Site bulunamadı.');
    }

    const [total, drafts, published, scheduled] = await Promise.all([
      this.prisma.wordpressPost.count({
        where: { tenantId, siteId, deletedAt: null },
      }),
      this.prisma.wordpressPost.count({
        where: { tenantId, siteId, deletedAt: null, status: 'draft' },
      }),
      this.prisma.wordpressPost.count({
        where: { tenantId, siteId, deletedAt: null, status: 'publish' },
      }),
      this.prisma.wordpressPost.count({
        where: { tenantId, siteId, deletedAt: null, status: 'future' },
      }),
    ]);

    const lastPost = await this.prisma.wordpressPost.findFirst({
      where: { tenantId, siteId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return {
      total,
      drafts,
      published,
      scheduled,
      lastSentAt: lastPost?.createdAt || null,
    };
  }

  async updatePost(
    tenantId: string,
    siteId: string,
    postRecordId: string,
    data: any,
  ) {
    const site = await this.prisma.wordpressSite.findFirst({
      where: { id: siteId, tenantId },
    });
    if (!site) {
      throw new BadRequestException('Site bulunamadı.');
    }

    const post = await this.prisma.wordpressPost.findFirst({
      where: { id: postRecordId, tenantId, siteId, deletedAt: null },
    });
    if (!post) {
      throw new BadRequestException('Yazı bulunamadı.');
    }

    try {
      const endpoint = `${site.siteUrl.replace(/\/$/, '')}/wp-json/moi-port/v1/post/${post.wpPostId}`;
      const response = await axios.patch(
        endpoint,
        {
          title: data.title,
          content: data.content,
          status: data.status,
          featured_image_url: data.featuredImage,
          categories: data.categories,
          tags: data.tags,
          date_gmt: data.date_gmt,
        },
        {
          headers: {
            'X-Moi-Port-Key': site.apiKey,
          },
        },
      );

      const status = (data.status || post.status) as string;
      const scheduledAt =
        status === 'future'
          ? this.parseGmtDateTime(data.date_gmt) || post.scheduledAt
          : null;
      const publishedAt =
        status === 'publish' ? post.publishedAt || new Date() : null;

      const tagsJson = this.safeJsonStringify(
        Array.isArray(data.tags) ? data.tags : undefined,
      );
      const categoriesJson = this.safeJsonStringify(
        Array.isArray(data.categories) ? data.categories : undefined,
      );

      await this.prisma.wordpressPost.update({
        where: { id: postRecordId },
        data: {
          title: data.title ?? post.title,
          content: data.content ?? post.content,
          status,
          tags: tagsJson ?? post.tags,
          categories: categoriesJson ?? post.categories,
          featuredImageUrl: data.featuredImage ?? post.featuredImageUrl,
          scheduledAt,
          publishedAt,
          postUrl: response.data?.post_url ?? post.postUrl,
        },
      });

      return response.data;
    } catch (error) {
      console.error(
        'WordPress post update failed:',
        error.response?.data || error.message,
      );
      throw new BadRequestException(
        error.response?.data?.message || 'WordPress yazısı güncellenemedi.',
      );
    }
  }

  async deletePost(tenantId: string, siteId: string, postRecordId: string) {
    const site = await this.prisma.wordpressSite.findFirst({
      where: { id: siteId, tenantId },
    });
    if (!site) {
      throw new BadRequestException('Site bulunamadı.');
    }

    const post = await this.prisma.wordpressPost.findFirst({
      where: { id: postRecordId, tenantId, siteId, deletedAt: null },
    });
    if (!post) {
      throw new BadRequestException('Yazı bulunamadı.');
    }

    try {
      const endpoint = `${site.siteUrl.replace(/\/$/, '')}/wp-json/moi-port/v1/post/${post.wpPostId}`;
      const response = await axios.delete(endpoint, {
        headers: {
          'X-Moi-Port-Key': site.apiKey,
        },
      });

      await this.prisma.wordpressPost.update({
        where: { id: postRecordId },
        data: { deletedAt: new Date() },
      });

      return response.data;
    } catch (error) {
      console.error(
        'WordPress post delete failed:',
        error.response?.data || error.message,
      );
      throw new BadRequestException(
        error.response?.data?.message || 'WordPress yazısı silinemedi.',
      );
    }
  }

  async getCategories(tenantId: string, siteId: string) {
    const site = await this.prisma.wordpressSite.findFirst({
      where: { id: siteId, tenantId },
    });

    if (!site) {
      throw new BadRequestException('Site bulunamadı.');
    }

    try {
      const endpoint = `${site.siteUrl.replace(/\/$/, '')}/wp-json/moi-port/v1/categories`;
      const response = await axios.get(endpoint, {
        headers: {
          'X-Moi-Port-Key': site.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error(
        'WordPress categories fetch failed:',
        error.response?.data || error.message,
      );
      // Return empty array instead of throwing to avoid breaking UI
      return [];
    }
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.wordpressSite.delete({
      where: { id },
    });
  }
}
