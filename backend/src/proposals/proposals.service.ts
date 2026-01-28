import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class ProposalsService {
  constructor(
    private prisma: PrismaService,
    @Optional() private readonly smsService?: SmsService,
  ) {}

  async create(
    tenantId: string,
    data: {
      title: string;
      content: string;
      customerId: string;
      status?: string;
      metadata?: string;
    },
  ) {
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

  async findAll(tenantId: string, customerId?: string) {
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

  async findOne(tenantId: string, id: string) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id, tenantId },
      include: {
        customer: {
          select: { name: true },
        },
      },
    });
    if (!proposal) throw new NotFoundException('Teklif bulunamadı.');
    return proposal;
  }

  async update(
    tenantId: string,
    id: string,
    data: {
      title?: string;
      content?: string;
      status?: string;
      metadata?: string;
    },
  ) {
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

  async remove(tenantId: string, id: string) {
    const proposal = await this.findOne(tenantId, id);
    return this.prisma.proposal.delete({
      where: { id: proposal.id },
    });
  }
}
