"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordpressService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
let WordpressService = class WordpressService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    parseGmtDateTime(dateGmt) {
        if (!dateGmt || typeof dateGmt !== 'string')
            return null;
        const normalized = dateGmt.trim();
        if (!normalized)
            return null;
        const iso = normalized.includes('T')
            ? normalized
            : normalized.replace(' ', 'T');
        const withZ = iso.endsWith('Z') ? iso : `${iso}Z`;
        const d = new Date(withZ);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    safeJsonStringify(value) {
        if (value === undefined || value === null)
            return null;
        try {
            return JSON.stringify(value);
        }
        catch {
            return null;
        }
    }
    async findAll(tenantId) {
        return this.prisma.wordpressSite.findMany({
            where: { tenantId },
            include: {
                customer: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(tenantId, id) {
        return this.prisma.wordpressSite.findFirst({
            where: { id, tenantId },
            include: {
                customer: true,
            },
        });
    }
    async create(tenantId, data) {
        const { siteUrl, connectionCode, customerId } = data;
        if (connectionCode) {
            if (!siteUrl) {
                throw new common_1.BadRequestException('Site adresi gereklidir.');
            }
            const apiKey = crypto.randomBytes(32).toString('hex');
            try {
                const verifyUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/moi-port/v1/verify-code`;
                await axios_1.default.post(verifyUrl, {
                    code: connectionCode,
                    api_key: apiKey,
                }, {
                    timeout: 10000,
                });
            }
            catch (error) {
                console.error('WordPress verification failed:', error.response?.data || error.message);
                throw new common_1.BadRequestException(error.response?.data?.message ||
                    'Bağlantı doğrulanamadı. Kod hatalı veya süresi dolmuş olabilir. Lütfen site adresini ve kodu kontrol edin.');
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
        return this.prisma.wordpressSite.create({
            data: {
                ...data,
                tenantId,
            },
        });
    }
    async update(tenantId, id, data) {
        return this.prisma.wordpressSite.update({
            where: { id },
            data,
        });
    }
    async createPost(tenantId, siteId, data) {
        const site = await this.prisma.wordpressSite.findFirst({
            where: { id: siteId, tenantId },
        });
        if (!site) {
            throw new common_1.BadRequestException('Site bulunamadı.');
        }
        try {
            const endpoint = `${site.siteUrl.replace(/\/$/, '')}/wp-json/moi-port/v1/post`;
            const response = await axios_1.default.post(endpoint, {
                title: data.title,
                content: data.content,
                status: data.status || 'draft',
                featured_image_url: data.featuredImage,
                categories: data.categories,
                tags: data.tags,
                date: data.date,
                date_gmt: data.date_gmt,
            }, {
                headers: {
                    'X-Moi-Port-Key': site.apiKey,
                },
            });
            const wpPostId = Number(response.data?.post_id);
            if (!Number.isFinite(wpPostId)) {
                return response.data;
            }
            const status = (data.status || 'draft');
            const scheduledAt = status === 'future' ? this.parseGmtDateTime(data.date_gmt) : null;
            const publishedAt = status === 'publish' ? new Date() : null;
            const tagsJson = this.safeJsonStringify(Array.isArray(data.tags) ? data.tags : undefined);
            const categoriesJson = this.safeJsonStringify(Array.isArray(data.categories) ? data.categories : undefined);
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
        }
        catch (error) {
            console.error('WordPress post creation failed:', error.response?.data || error.message);
            throw new common_1.BadRequestException(error.response?.data?.message || 'WordPress yazısı oluşturulamadı.');
        }
    }
    async listPosts(tenantId, siteId) {
        const site = await this.prisma.wordpressSite.findFirst({
            where: { id: siteId, tenantId },
        });
        if (!site) {
            throw new common_1.BadRequestException('Site bulunamadı.');
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
    async getKpi(tenantId, siteId) {
        const site = await this.prisma.wordpressSite.findFirst({
            where: { id: siteId, tenantId },
        });
        if (!site) {
            throw new common_1.BadRequestException('Site bulunamadı.');
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
    async updatePost(tenantId, siteId, postRecordId, data) {
        const site = await this.prisma.wordpressSite.findFirst({
            where: { id: siteId, tenantId },
        });
        if (!site) {
            throw new common_1.BadRequestException('Site bulunamadı.');
        }
        const post = await this.prisma.wordpressPost.findFirst({
            where: { id: postRecordId, tenantId, siteId, deletedAt: null },
        });
        if (!post) {
            throw new common_1.BadRequestException('Yazı bulunamadı.');
        }
        try {
            const endpoint = `${site.siteUrl.replace(/\/$/, '')}/wp-json/moi-port/v1/post/${post.wpPostId}`;
            const response = await axios_1.default.patch(endpoint, {
                title: data.title,
                content: data.content,
                status: data.status,
                featured_image_url: data.featuredImage,
                categories: data.categories,
                tags: data.tags,
                date_gmt: data.date_gmt,
            }, {
                headers: {
                    'X-Moi-Port-Key': site.apiKey,
                },
            });
            const status = (data.status || post.status);
            const scheduledAt = status === 'future'
                ? this.parseGmtDateTime(data.date_gmt) || post.scheduledAt
                : null;
            const publishedAt = status === 'publish' ? post.publishedAt || new Date() : null;
            const tagsJson = this.safeJsonStringify(Array.isArray(data.tags) ? data.tags : undefined);
            const categoriesJson = this.safeJsonStringify(Array.isArray(data.categories) ? data.categories : undefined);
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
        }
        catch (error) {
            console.error('WordPress post update failed:', error.response?.data || error.message);
            throw new common_1.BadRequestException(error.response?.data?.message || 'WordPress yazısı güncellenemedi.');
        }
    }
    async deletePost(tenantId, siteId, postRecordId) {
        const site = await this.prisma.wordpressSite.findFirst({
            where: { id: siteId, tenantId },
        });
        if (!site) {
            throw new common_1.BadRequestException('Site bulunamadı.');
        }
        const post = await this.prisma.wordpressPost.findFirst({
            where: { id: postRecordId, tenantId, siteId, deletedAt: null },
        });
        if (!post) {
            throw new common_1.BadRequestException('Yazı bulunamadı.');
        }
        try {
            const endpoint = `${site.siteUrl.replace(/\/$/, '')}/wp-json/moi-port/v1/post/${post.wpPostId}`;
            const response = await axios_1.default.delete(endpoint, {
                headers: {
                    'X-Moi-Port-Key': site.apiKey,
                },
            });
            await this.prisma.wordpressPost.update({
                where: { id: postRecordId },
                data: { deletedAt: new Date() },
            });
            return response.data;
        }
        catch (error) {
            console.error('WordPress post delete failed:', error.response?.data || error.message);
            throw new common_1.BadRequestException(error.response?.data?.message || 'WordPress yazısı silinemedi.');
        }
    }
    async getCategories(tenantId, siteId) {
        const site = await this.prisma.wordpressSite.findFirst({
            where: { id: siteId, tenantId },
        });
        if (!site) {
            throw new common_1.BadRequestException('Site bulunamadı.');
        }
        try {
            const endpoint = `${site.siteUrl.replace(/\/$/, '')}/wp-json/moi-port/v1/categories`;
            const response = await axios_1.default.get(endpoint, {
                headers: {
                    'X-Moi-Port-Key': site.apiKey,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('WordPress categories fetch failed:', error.response?.data || error.message);
            return [];
        }
    }
    async delete(tenantId, id) {
        return this.prisma.wordpressSite.delete({
            where: { id },
        });
    }
};
exports.WordpressService = WordpressService;
exports.WordpressService = WordpressService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WordpressService);
//# sourceMappingURL=wordpress.service.js.map