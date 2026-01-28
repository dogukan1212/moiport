import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      basePrice?: number;
      billingCycle?: string;
    },
  ) {
    return this.prisma.service.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.service.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, tenantId },
    });
    if (!service) throw new NotFoundException('Hizmet bulunamadı.');
    return service;
  }

  async update(
    tenantId: string,
    id: string,
    data: {
      name?: string;
      description?: string;
      basePrice?: number;
      billingCycle?: string;
    },
  ) {
    const service = await this.findOne(tenantId, id);
    return this.prisma.service.update({
      where: { id: service.id },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    const service = await this.findOne(tenantId, id);
    return this.prisma.service.delete({
      where: { id: service.id },
    });
  }
}
