import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DentalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Helper to notify
  private async notifyTenant(tenantId: string, title: string, message: string, type: string, referenceId?: string, referenceType?: string, excludeUserId?: string) {
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        role: { in: ['ADMIN', 'STAFF', 'SUPER_ADMIN'] },
        id: excludeUserId ? { not: excludeUserId } : undefined,
      },
      select: { id: true },
    });

    for (const user of users) {
      await this.notificationsService.create(tenantId, {
        userId: user.id,
        title,
        message,
        type,
        referenceId,
        referenceType,
      });
    }
  }

  // --- Patients ---

  async createPatient(tenantId: string, userId: string, data: any) {
    const patient = await this.prisma.dentalPatient.create({
      data: { ...data, tenantId },
    });
    await this.notifyTenant(tenantId, 'Yeni Diş Hastası', `${patient.fullName} sisteme eklendi.`, 'DENTAL_PATIENT_CREATED', patient.id, 'DENTAL_PATIENT', userId);
    return patient;
  }

  async updatePatient(tenantId: string, userId: string, id: string, data: any) {
    const patient = await this.prisma.dentalPatient.update({
      where: { id, tenantId },
      data,
    });
    await this.notifyTenant(tenantId, 'Hasta Güncellendi', `${patient.fullName} güncellendi.`, 'DENTAL_PATIENT_UPDATED', patient.id, 'DENTAL_PATIENT', userId);
    return patient;
  }

  async deletePatient(tenantId: string, userId: string, id: string) {
    const patient = await this.prisma.dentalPatient.delete({
      where: { id, tenantId },
    });
    await this.notifyTenant(tenantId, 'Hasta Silindi', `${patient.fullName} silindi.`, 'DENTAL_PATIENT_DELETED', undefined, 'DENTAL_PATIENT', userId);
    return patient;
  }

  async findAllPatients(tenantId: string) {
    return this.prisma.dentalPatient.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        teeth: true,
        treatments: true,
        labOrders: true,
        images: true,
      },
    });
  }

  async findOnePatient(tenantId: string, id: string) {
    const patient = await this.prisma.dentalPatient.findUnique({
      where: { id, tenantId },
      include: {
        teeth: true,
        treatments: true,
        labOrders: true,
        images: true,
      },
    });
    if (!patient) throw new NotFoundException('Hasta bulunamadı');
    return patient;
  }

  async updateTooth(tenantId: string, userId: string, patientId: string, toothNumber: number, data: any) {
    // Upsert logic because tooth might not exist yet if lazy loaded or default
    const tooth = await this.prisma.dentalTooth.upsert({
      where: {
        patientId_number: {
          patientId,
          number: toothNumber,
        },
      },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        ...data,
        patientId,
        number: toothNumber,
        tenantId,
      },
    });

    // Add history log
    await this.prisma.dentalToothHistory.create({
      data: {
        toothId: tooth.id,
        action: data.condition || 'UPDATE',
        notes: data.notes,
        date: new Date(),
      },
    });

    return tooth;
  }

  // --- Treatments ---

  async createTreatment(tenantId: string, userId: string, data: any) {
    const treatment = await this.prisma.dentalTreatment.create({
      data: { ...data, tenantId },
      include: { patient: true },
    });
    await this.notifyTenant(tenantId, 'Yeni Tedavi', `${treatment.patient.fullName} için ${treatment.procedureName} tedavisi eklendi.`, 'DENTAL_TREATMENT_CREATED', treatment.id, 'DENTAL_TREATMENT', userId);
    return treatment;
  }

  async updateTreatment(tenantId: string, userId: string, id: string, data: any) {
    const treatment = await this.prisma.dentalTreatment.update({
      where: { id, tenantId },
      data,
      include: { patient: true },
    });
    return treatment;
  }

  async deleteTreatment(tenantId: string, userId: string, id: string) {
    const treatment = await this.prisma.dentalTreatment.delete({
      where: { id, tenantId },
      include: { patient: true },
    });
    return treatment;
  }

  // --- Lab Orders ---

  async createLabOrder(tenantId: string, userId: string, data: any) {
    const order = await this.prisma.dentalLabOrder.create({
      data: { ...data, tenantId },
      include: { patient: true },
    });
    await this.notifyTenant(tenantId, 'Laboratuvar Siparişi', `${order.patient.fullName} için ${order.labName} siparişi oluşturuldu.`, 'DENTAL_LAB_ORDER_CREATED', order.id, 'DENTAL_LAB_ORDER', userId);
    return order;
  }

  async updateLabOrder(tenantId: string, userId: string, id: string, data: any) {
    return this.prisma.dentalLabOrder.update({
      where: { id, tenantId },
      data,
    });
  }

  async deleteLabOrder(tenantId: string, userId: string, id: string) {
    return this.prisma.dentalLabOrder.delete({
      where: { id, tenantId },
    });
  }

  // --- Images ---

  async createImage(tenantId: string, userId: string, data: any) {
    const image = await this.prisma.dentalImage.create({
      data: { ...data, tenantId },
    });
    return image;
  }

  async deleteImage(tenantId: string, userId: string, id: string) {
    return this.prisma.dentalImage.delete({
      where: { id, tenantId },
    });
  }
}
