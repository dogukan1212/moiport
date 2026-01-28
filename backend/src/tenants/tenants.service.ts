import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  private getStorageUsage(tenantId: string): number {
    const dir = path.join(process.cwd(), 'uploads', tenantId);
    let size = 0;
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      files.forEach((f) => {
        const stats = fs.statSync(path.join(dir, f));
        size += stats.size;
      });
    }
    return size;
  }

  async checkStorageLimit(
    tenantId: string,
    additionalBytes: number,
  ): Promise<boolean> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxStorage: true, storageUsed: true },
    });

    if (!tenant || !tenant.maxStorage) return true;

    // Use DB usage if available, else fallback to FS calculation (deprecated)
    const currentUsage = tenant.storageUsed ? BigInt(tenant.storageUsed) : BigInt(this.getStorageUsage(tenantId));
    const maxBytes = BigInt(tenant.maxStorage); // Now stored as bytes

    return currentUsage + BigInt(additionalBytes) <= maxBytes;
  }

  async getAllTenants() {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            projects: true,
          },
        },
      },
    });

    return tenants.map((t) => ({
      ...t,
      storageUsage: this.getStorageUsage(t.id),
    }));
  }

  async deleteTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.prisma.$transaction(async (tx) => {
      const userIds = (
        await tx.user.findMany({
          where: { tenantId },
          select: { id: true },
        })
      ).map((u) => u.id);

      const facebookConfigIds = (
        await tx.facebookConfig.findMany({
          where: { tenantId },
          select: { id: true },
        })
      ).map((c) => c.id);

      const pipelineIds = (
        await tx.pipeline.findMany({
          where: { tenantId },
          select: { id: true },
        })
      ).map((p) => p.id);

      if (facebookConfigIds.length > 0) {
        await tx.facebookLeadMapping.deleteMany({
          where: { configId: { in: facebookConfigIds } },
        });
      }
      if (pipelineIds.length > 0) {
        await tx.facebookLeadMapping.deleteMany({
          where: { pipelineId: { in: pipelineIds } },
        });
      }

      await tx.notification.deleteMany({ where: { tenantId } });
      await tx.columnWatcher.deleteMany({ where: { tenantId } });

      await tx.chatMessage.deleteMany({ where: { tenantId } });
      await tx.chatMembership.deleteMany({ where: { tenantId } });
      await tx.chatRoom.deleteMany({ where: { tenantId } });

      await tx.crmActivity.deleteMany({ where: { tenantId } });
      await tx.lead.deleteMany({ where: { tenantId } });
      await tx.pipeline.deleteMany({ where: { tenantId } });

      await tx.task.deleteMany({ where: { tenantId } });
      await tx.project.deleteMany({ where: { tenantId } });

      await tx.transaction.deleteMany({ where: { tenantId } });
      await tx.invoicePayment.deleteMany({ where: { tenantId } });
      await tx.invoice.deleteMany({ where: { tenantId } });
      await tx.recurringTransaction.deleteMany({ where: { tenantId } });

      await tx.employeeAdvance.deleteMany({ where: { tenantId } });
      await tx.payroll.deleteMany({ where: { tenantId } });

      await tx.socialMediaPost.deleteMany({ where: { tenantId } });
      await tx.socialMediaPlan.deleteMany({ where: { tenantId } });
      await tx.proposal.deleteMany({ where: { tenantId } });
      await tx.service.deleteMany({ where: { tenantId } });

      await tx.wordpressPost.deleteMany({ where: { tenantId } });
      await tx.wordpressSite.deleteMany({ where: { tenantId } });

      await tx.smsLog.deleteMany({ where: { tenantId } });
      await tx.smsTrigger.deleteMany({ where: { tenantId } });
      await tx.smsTemplate.deleteMany({ where: { tenantId } });
      await tx.smsSettings.deleteMany({ where: { tenantId } });

      await tx.whatsappConfig.deleteMany({ where: { tenantId } });
      await tx.facebookConfig.deleteMany({ where: { tenantId } });
      await tx.parasutConfig.deleteMany({ where: { tenantId } });
      await tx.paytrConfig.deleteMany({ where: { tenantId } });
      await tx.vatansmsConfig.deleteMany({ where: { tenantId } });
      await tx.netgsmConfig.deleteMany({ where: { tenantId } });

      await tx.subscriptionPayment.deleteMany({ where: { tenantId } });
      await tx.paymentMethod.deleteMany({ where: { tenantId } });

      await tx.authOtp.deleteMany({ where: { tenantId } });

      if (userIds.length > 0) {
        await tx.user.updateMany({
          where: { id: { in: userIds } },
          data: { customerId: null },
        });
      }

      await tx.customer.deleteMany({ where: { tenantId } });
      await tx.user.deleteMany({ where: { tenantId } });
      await tx.tenant.delete({ where: { id: tenantId } });
    });

    const uploadsDir = path.join(process.cwd(), 'uploads', tenantId);
    try {
      if (fs.existsSync(uploadsDir)) {
        fs.rmSync(uploadsDir, { recursive: true, force: true });
      }
    } catch (error) {
      void error;
    }

    return {
      status: 'deleted',
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
    };
  }

  async getTenantInfo(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            users: true,
            customers: true,
            projects: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Compute status
    let finalStatus = tenant.subscriptionStatus;
    if (finalStatus !== 'SUSPENDED' && tenant.subscriptionEndsAt) {
      const now = new Date();
      // Debug Log
      console.log('Status Check:', {
        id: tenant.id,
        currentStatus: tenant.subscriptionStatus,
        endsAt: tenant.subscriptionEndsAt,
        now: now,
        isExpired: now > tenant.subscriptionEndsAt,
      });

      if (now > tenant.subscriptionEndsAt) {
        finalStatus = finalStatus === 'TRIAL' ? 'TRIAL_ENDED' : 'EXPIRED';
      }
    }

    return {
      ...tenant,
      subscriptionStatus: finalStatus, // Return computed status
      storageUsage: this.getStorageUsage(tenantId),
    };
  }

  async updateTenantSubscription(
    tenantId: string,
    data: {
      subscriptionPlan?: string;
      subscriptionStatus?: string;
      subscriptionEndsAt?: Date | null;
      maxUsers?: number;
      maxStorage?: number;
      payrollCalculationStartDay?: number;
      payrollCalculationEndDay?: number;
      payrollPaymentDay?: number;
    },
  ) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data,
    });
  }

  async updateTenant(
    tenantId: string,
    data: {
      name?: string;
      logoUrl?: string;
      address?: string;
      title?: string;
      phone?: string;
      email?: string;
      wordpressModuleEnabled?: boolean;
    },
  ) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data,
    });
  }

  async addUser(
    tenantId: string,
    data: {
      email: string;
      name: string;
      role?: string;
      phone?: string;
      startDate?: string;
      salary?: number;
      iban?: string;
      tckn?: string;
      address?: string;
      birthDate?: string;
      jobTitle?: string;
      department?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      bankName?: string;
      bankBranch?: string;
      bankAccountNumber?: string;
      maritalStatus?: string;
      childrenCount?: number;
      bloodType?: string;
      educationLevel?: string;
      contractType?: string;
      socialSecurityNumber?: string;
      taxNumber?: string;
      weeklyHours?: number;
      probationMonths?: number;
      confidentialityYears?: number;
      nonCompeteMonths?: number;
      penaltyAmount?: number;
      equipmentList?: string;
      benefits?: string;
      performancePeriod?: string;
    },
  ) {
    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { email: (data.email || '').trim().toLowerCase() },
    });

    if (existing) {
      throw new Error('Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var.');
    }

    // In a real app, we would send an invitation email.
    // For now, we just create the user with a temporary password.
    const hashedPassword = await bcrypt.hash('ajans123', 10);

    return this.prisma.user.create({
      data: {
        email: (data.email || '').trim().toLowerCase(),
        name: data.name,
        password: hashedPassword,
        role: data.role || 'STAFF',
        tenantId,
        phone: data.phone,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        salary: data.salary,
        iban: data.iban,
        tckn: data.tckn,
        address: data.address,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        jobTitle: data.jobTitle,
        department: data.department,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        bankName: data.bankName,
        bankBranch: data.bankBranch,
        bankAccountNumber: data.bankAccountNumber,
        maritalStatus: data.maritalStatus,
        childrenCount: data.childrenCount,
        bloodType: data.bloodType,
        educationLevel: data.educationLevel,
        contractType: data.contractType,
        socialSecurityNumber: data.socialSecurityNumber,
        taxNumber: data.taxNumber,
        weeklyHours: data.weeklyHours,
        probationMonths: data.probationMonths,
        confidentialityYears: data.confidentialityYears,
        nonCompeteMonths: data.nonCompeteMonths,
        penaltyAmount: data.penaltyAmount,
        equipmentList: data.equipmentList,
        benefits: data.benefits,
        performancePeriod: data.performancePeriod,
      },
    });
  }

  async removeUser(tenantId: string, userId: string) {
    // Don't allow deleting the last admin
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    if (user.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: { tenantId, role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        throw new Error('Sistemdeki son yöneticiyi silemezsiniz.');
      }
    }

    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async updateUser(
    tenantId: string,
    userId: string,
    data: {
      name?: string;
      email?: string;
      role?: string;
      newPassword?: string;
    },
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const updateData: any = {};

    if (typeof data.name === 'string') {
      updateData.name = data.name;
    }

    if (typeof data.email === 'string') {
      const nextEmail = data.email.trim().toLowerCase();
      if (!nextEmail || !nextEmail.includes('@')) {
        throw new BadRequestException('Geçerli bir e-posta girin');
      }
      if (nextEmail !== user.email) {
        const existing = await this.prisma.user.findUnique({
          where: { email: nextEmail },
        });
        if (existing && existing.id !== user.id) {
          throw new BadRequestException('Bu e-posta adresi zaten kullanılıyor');
        }
        updateData.email = nextEmail;
      }
    }

    if (typeof data.role === 'string' && data.role) {
      const nextRole = data.role;
      if (user.role === 'ADMIN' && nextRole !== 'ADMIN') {
        const adminCount = await this.prisma.user.count({
          where: { tenantId, role: 'ADMIN' },
        });
        if (adminCount <= 1) {
          throw new BadRequestException(
            'Sistemdeki son yöneticiyi değiştiremezsiniz.',
          );
        }
      }
      updateData.role = nextRole;
    }

    if (typeof data.newPassword === 'string') {
      const nextPassword = data.newPassword;
      if (nextPassword.trim()) {
        if (nextPassword.length < 6) {
          throw new BadRequestException('Şifre en az 6 karakter olmalı');
        }
        updateData.password = await bcrypt.hash(nextPassword, 10);
      }
    }

    if (!Object.keys(updateData).length) {
      return { status: 'ok' };
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
  }
}
