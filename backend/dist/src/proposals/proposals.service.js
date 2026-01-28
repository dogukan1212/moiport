"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProposalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const sms_service_1 = require("../sms/sms.service");
let ProposalsService = class ProposalsService {
    prisma;
    smsService;
    constructor(prisma, smsService) {
        this.prisma = prisma;
        this.smsService = smsService;
    }
    async create(tenantId, data) {
        const created = await this.prisma.proposal.create({
            data: {
                title: data.title,
                content: data.content,
                customerId: data.customerId,
                tenantId,
                status: data.status || 'DRAFT',
                metadata: data.metadata,
            },
        });
        if (this.smsService) {
            await this.smsService.trySendEvent(tenantId, 'PROPOSAL_CREATED', {
                proposalId: created.id,
            });
        }
        return created;
    }
    async findAll(tenantId, customerId) {
        if (!customerId || customerId === 'undefined' || customerId === 'null') {
            return [];
        }
        return this.prisma.proposal.findMany({
            where: {
                tenantId,
                customerId,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                customer: {
                    select: { name: true },
                },
            },
        });
    }
    async findOne(tenantId, id) {
        const proposal = await this.prisma.proposal.findFirst({
            where: { id, tenantId },
            include: {
                customer: {
                    select: { name: true },
                },
            },
        });
        if (!proposal)
            throw new common_1.NotFoundException('Teklif bulunamadı.');
        return proposal;
    }
    async update(tenantId, id, data) {
        const proposal = await this.findOne(tenantId, id);
        const updated = await this.prisma.proposal.update({
            where: { id: proposal.id },
            data,
        });
        if (this.smsService) {
            await this.smsService.trySendEvent(tenantId, 'PROPOSAL_UPDATED', {
                proposalId: updated.id,
            });
        }
        return updated;
    }
    async remove(tenantId, id) {
        const proposal = await this.findOne(tenantId, id);
        return this.prisma.proposal.delete({
            where: { id: proposal.id },
        });
    }
};
exports.ProposalsService = ProposalsService;
exports.ProposalsService = ProposalsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sms_service_1.SmsService])
], ProposalsService);
//# sourceMappingURL=proposals.service.js.map