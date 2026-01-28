import { Injectable, Optional, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    @Optional() private notificationsService?: NotificationsService,
    @Optional() private storageService?: StorageService,
  ) {}

  private getCustomerPolicy(planCode?: string) {
    switch (planCode) {
      case 'PRO':
        return { maxCustomers: 5, portalEnabled: true, crmEnabled: true };
      case 'ENTERPRISE':
        return { maxCustomers: null, portalEnabled: true, crmEnabled: true };
      case 'STARTER':
      default:
        return { maxCustomers: 0, portalEnabled: false, crmEnabled: false };
    }
  }

  async create(
    tenantId: string,
    data: { name: string; email?: string; phone?: string },
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionPlan: true },
    });
    const policy = this.getCustomerPolicy(
      tenant?.subscriptionPlan || undefined,
    );
    if (policy.maxCustomers === 0) {
      throw new BadRequestException(
        'Bu pakette müşteri ekleme özelliği bulunmuyor. Lütfen paketinizi yükseltin.',
      );
    }
    if (Number.isFinite(policy.maxCustomers)) {
      const count = await this.prisma.customer.count({
        where: { tenantId },
      });
      if (count >= (policy.maxCustomers as number)) {
        throw new BadRequestException(
          `Müşteri limitine ulaşıldı (${policy.maxCustomers}). Lütfen paketinizi yükseltin.`,
        );
      }
    }

    const customer = await this.prisma.customer.create({
      data: {
        ...data,
        tenantId,
      },
    });

    // Auto-create storage folder
    if (this.storageService) {
      await this.storageService.ensureCustomerFolder(customer.id, tenantId);
    }

    // Notify admins
    if (this.notificationsService) {
      const admins = await this.prisma.user.findMany({
        where: { tenantId, role: 'ADMIN', isActive: true },
        select: { id: true },
      });
      for (const admin of admins) {
        await this.notificationsService.create(tenantId, {
          userId: admin.id,
          title: 'Yeni Müşteri Eklendi',
          message: `${customer.name} adlı müşteri sisteme eklendi.`,
          type: 'CUSTOMER_CREATED',
          referenceId: customer.id,
          referenceType: 'CUSTOMER',
        });
      }
    }

    return customer;
  }

  async findAll(tenantId: string) {
    return this.prisma.customer.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        projects: true,
        proposals: true,
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    data: { name?: string; email?: string; phone?: string },
  ) {
    return this.prisma.customer.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.customer.deleteMany({
      where: { id, tenantId },
    });
  }

  async getPortalUser(tenantId: string, customerId: string) {
    return this.prisma.user.findFirst({
      where: {
        tenantId,
        customerId,
        role: 'CLIENT',
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        allowedModules: true,
      },
    });
  }

  async createPortalUser(
    tenantId: string,
    customerId: string,
    data: {
      email: string;
      password: string;
      name: string;
      allowedModules?: string[];
    },
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionPlan: true },
    });
    const policy = this.getCustomerPolicy(
      tenant?.subscriptionPlan || undefined,
    );
    if (!policy.portalEnabled) {
      throw new BadRequestException(
        'Bu pakette müşteri paneli bulunmuyor. Lütfen paketinizi yükseltin.',
      );
    }
    if (data.allowedModules?.includes('CRM') && !policy.crmEnabled) {
      throw new BadRequestException(
        'Bu pakette CRM erişimi bulunmuyor. Lütfen paketinizi yükseltin.',
      );
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || customer.tenantId !== tenantId) {
      throw new BadRequestException('Müşteri bulunamadı.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    // If user exists and is the same portal user, update allowedModules
    if (existingUser) {
      if (
        existingUser.customerId === customerId &&
        existingUser.role === 'CLIENT'
      ) {
        // Update existing portal user
        const modulesStr = data.allowedModules
          ? data.allowedModules.join(',')
          : undefined;

        const updateData: any = {
          name: data.name,
          allowedModules: modulesStr,
        };

        if (data.password && data.password.trim()) {
          updateData.password = await bcrypt.hash(data.password, 10);
        }

        return this.prisma.user.update({
          where: { id: existingUser.id },
          data: updateData,
        });
      }
      throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const modulesStr = data.allowedModules ? data.allowedModules.join(',') : '';

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'CLIENT',
        tenantId,
        customerId,
        allowedModules: modulesStr,
      },
    });
  }

  async removePortalUser(tenantId: string, customerId: string) {
    return this.prisma.user.deleteMany({
      where: {
        tenantId,
        customerId,
        role: 'CLIENT',
      },
    });
  }
}
