import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class HealthTourismService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Helper to notify all staff/admins of a tenant
  private async notifyTenant(tenantId: string, title: string, message: string, type: string, referenceId?: string, referenceType?: string, excludeUserId?: string) {
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        role: { in: ['ADMIN', 'STAFF', 'SUPER_ADMIN'] }, // Notify all staff
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
    const patient = await this.prisma.healthPatient.create({
      data: { ...data, tenantId },
    });
    await this.notifyTenant(tenantId, 'Yeni Hasta Kaydı', `${patient.fullName} isimli hasta sisteme eklendi.`, 'HEALTH_PATIENT_CREATED', patient.id, 'HEALTH_PATIENT', userId);
    return patient;
  }

  async updatePatient(tenantId: string, userId: string, id: string, data: any) {
    const patient = await this.prisma.healthPatient.update({
      where: { id, tenantId },
      data,
    });
    await this.notifyTenant(tenantId, 'Hasta Güncellendi', `${patient.fullName} isimli hastanın bilgileri güncellendi.`, 'HEALTH_PATIENT_UPDATED', patient.id, 'HEALTH_PATIENT', userId);
    return patient;
  }

  async deletePatient(tenantId: string, userId: string, id: string) {
    const patient = await this.prisma.healthPatient.delete({
      where: { id, tenantId },
    });
    await this.notifyTenant(tenantId, 'Hasta Silindi', `${patient.fullName} isimli hasta silindi.`, 'HEALTH_PATIENT_DELETED', undefined, 'HEALTH_PATIENT', userId);
    return patient;
  }

  async findAllPatients(tenantId: string) {
    return this.prisma.healthPatient.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        treatments: true,
        transfers: true,
        accommodations: true,
        appointments: true,
        documents: true,
      },
    });
  }

  async findOnePatient(tenantId: string, id: string) {
    const patient = await this.prisma.healthPatient.findUnique({
      where: { id, tenantId },
      include: {
        treatments: true,
        transfers: true,
        accommodations: true,
        appointments: true,
        documents: true,
      },
    });
    if (!patient) throw new NotFoundException('Hasta bulunamadı');
    return patient;
  }

  // --- Treatments ---

  async createTreatment(tenantId: string, userId: string, data: any) {
    const treatment = await this.prisma.healthTreatment.create({
      data: { ...data, tenantId },
      include: { patient: true },
    });
    await this.notifyTenant(tenantId, 'Yeni Tedavi Planı', `${treatment.patient.fullName} için ${treatment.procedureName} tedavisi oluşturuldu.`, 'HEALTH_TREATMENT_CREATED', treatment.id, 'HEALTH_TREATMENT', userId);
    return treatment;
  }

  async updateTreatment(tenantId: string, userId: string, id: string, data: any) {
    const treatment = await this.prisma.healthTreatment.update({
      where: { id, tenantId },
      data,
      include: { patient: true },
    });
    await this.notifyTenant(tenantId, 'Tedavi Güncellendi', `${treatment.patient.fullName} - ${treatment.procedureName} tedavisi güncellendi. Durum: ${treatment.status}`, 'HEALTH_TREATMENT_UPDATED', treatment.id, 'HEALTH_TREATMENT', userId);
    return treatment;
  }

  async deleteTreatment(tenantId: string, userId: string, id: string) {
    const treatment = await this.prisma.healthTreatment.delete({
      where: { id, tenantId },
      include: { patient: true },
    });
    await this.notifyTenant(tenantId, 'Tedavi Silindi', `${treatment.patient.fullName} - ${treatment.procedureName} tedavisi silindi.`, 'HEALTH_TREATMENT_DELETED', undefined, 'HEALTH_TREATMENT', userId);
    return treatment;
  }

  // --- Transfers ---

  async createTransfer(tenantId: string, userId: string, data: any) {
    const transfer = await this.prisma.healthTransfer.create({
      data: { ...data, tenantId },
      include: { patient: true },
    });
    await this.notifyTenant(tenantId, 'Yeni Transfer', `${transfer.patient.fullName} için transfer ayarlandı.`, 'HEALTH_TRANSFER_CREATED', transfer.id, 'HEALTH_TRANSFER', userId);
    return transfer;
  }

  async updateTransfer(tenantId: string, userId: string, id: string, data: any) {
    const transfer = await this.prisma.healthTransfer.update({
      where: { id, tenantId },
      data,
      include: { patient: true },
    });
    await this.notifyTenant(tenantId, 'Transfer Güncellendi', `${transfer.patient.fullName} transferi güncellendi. Durum: ${transfer.status}`, 'HEALTH_TRANSFER_UPDATED', transfer.id, 'HEALTH_TRANSFER', userId);
    return transfer;
  }

  async deleteTransfer(tenantId: string, userId: string, id: string) {
    const transfer = await this.prisma.healthTransfer.delete({
      where: { id, tenantId },
      include: { patient: true },
    });
    await this.notifyTenant(tenantId, 'Transfer Silindi', `${transfer.patient.fullName} transferi silindi.`, 'HEALTH_TRANSFER_DELETED', undefined, 'HEALTH_TRANSFER', userId);
    return transfer;
  }

  // --- Accommodations ---

  async createAccommodation(tenantId: string, userId: string, data: any) {
    const accommodation = await this.prisma.healthAccommodation.create({
      data: { ...data, tenantId },
      include: { patient: true },
    });
    await this.notifyTenant(tenantId, 'Yeni Konaklama', `${accommodation.patient.fullName} için ${accommodation.hotelName} rezervasyonu yapıldı.`, 'HEALTH_ACCOMMODATION_CREATED', accommodation.id, 'HEALTH_ACCOMMODATION', userId);
    return accommodation;
  }

  async updateAccommodation(tenantId: string, userId: string, id: string, data: any) {
    const accommodation = await this.prisma.healthAccommodation.update({
      where: { id, tenantId },
      data,
      include: { patient: true },
    });
    await this.notifyTenant(tenantId, 'Konaklama Güncellendi', `${accommodation.patient.fullName} - ${accommodation.hotelName} rezervasyonu güncellendi.`, 'HEALTH_ACCOMMODATION_UPDATED', accommodation.id, 'HEALTH_ACCOMMODATION', userId);
    return accommodation;
  }

  async deleteAccommodation(tenantId: string, userId: string, id: string) {
    const accommodation = await this.prisma.healthAccommodation.delete({
      where: { id, tenantId },
      include: { patient: true },
    });
    await this.notifyTenant(tenantId, 'Konaklama Silindi', `${accommodation.patient.fullName} - ${accommodation.hotelName} rezervasyonu silindi.`, 'HEALTH_ACCOMMODATION_DELETED', undefined, 'HEALTH_ACCOMMODATION', userId);
    return accommodation;
  }

  // --- Appointments ---

  async createAppointment(tenantId: string, userId: string, data: any) {
    const appointment = await this.prisma.healthAppointment.create({
      data: { ...data, tenantId },
      include: { patient: true },
    });
    await this.notifyTenant(tenantId, 'Yeni Randevu', `${appointment.patient.fullName} için randevu oluşturuldu.`, 'HEALTH_APPOINTMENT_CREATED', appointment.id, 'HEALTH_APPOINTMENT', userId);
    return appointment;
  }

  async updateAppointment(tenantId: string, userId: string, id: string, data: any) {
    const appointment = await this.prisma.healthAppointment.update({
      where: { id, tenantId },
      data,
      include: { patient: true },
    });
    await this.notifyTenant(tenantId, 'Randevu Güncellendi', `${appointment.patient.fullName} randevusu güncellendi. Durum: ${appointment.status}`, 'HEALTH_APPOINTMENT_UPDATED', appointment.id, 'HEALTH_APPOINTMENT', userId);
    return appointment;
  }

  async deleteAppointment(tenantId: string, userId: string, id: string) {
    const appointment = await this.prisma.healthAppointment.delete({
      where: { id, tenantId },
      include: { patient: true },
    });
    await this.notifyTenant(tenantId, 'Randevu Silindi', `${appointment.patient.fullName} randevusu silindi.`, 'HEALTH_APPOINTMENT_DELETED', undefined, 'HEALTH_APPOINTMENT', userId);
    return appointment;
  }

  // --- Documents ---

  async createDocument(tenantId: string, userId: string, data: any) {
    const document = await this.prisma.healthDocument.create({
      data: { ...data, tenantId },
      include: { patient: true },
    });
    await this.notifyTenant(tenantId, 'Yeni Belge', `${document.patient.fullName} için ${document.name} belgesi yüklendi.`, 'HEALTH_DOCUMENT_CREATED', document.id, 'HEALTH_DOCUMENT', userId);
    return document;
  }

  async updateDocument(tenantId: string, userId: string, id: string, data: any) {
    const document = await this.prisma.healthDocument.update({
      where: { id, tenantId },
      data,
      include: { patient: true },
    });
    await this.notifyTenant(tenantId, 'Belge Güncellendi', `${document.patient.fullName} - ${document.name} belgesi güncellendi. Durum: ${document.status}`, 'HEALTH_DOCUMENT_UPDATED', document.id, 'HEALTH_DOCUMENT', userId);
    return document;
  }

  async deleteDocument(tenantId: string, userId: string, id: string) {
    const document = await this.prisma.healthDocument.delete({
      where: { id, tenantId },
      include: { patient: true },
    });
    await this.notifyTenant(tenantId, 'Belge Silindi', `${document.patient.fullName} - ${document.name} belgesi silindi.`, 'HEALTH_DOCUMENT_DELETED', undefined, 'HEALTH_DOCUMENT', userId);
    return document;
  }

  // --- Automation Rules ---

  async createAutomationRule(tenantId: string, userId: string, data: any) {
    const rule = await this.prisma.healthAutomationRule.create({
      data: { ...data, tenantId },
    });
    await this.notifyTenant(tenantId, 'Yeni Otomasyon Kuralı', `${rule.name} kuralı oluşturuldu.`, 'HEALTH_AUTOMATION_CREATED', rule.id, 'HEALTH_AUTOMATION_RULE', userId);
    return rule;
  }

  async updateAutomationRule(tenantId: string, userId: string, id: string, data: any) {
    const rule = await this.prisma.healthAutomationRule.update({
      where: { id, tenantId },
      data,
    });
    await this.notifyTenant(tenantId, 'Otomasyon Kuralı Güncellendi', `${rule.name} kuralı güncellendi. Durum: ${rule.isActive ? 'Aktif' : 'Pasif'}`, 'HEALTH_AUTOMATION_UPDATED', rule.id, 'HEALTH_AUTOMATION_RULE', userId);
    return rule;
  }

  async deleteAutomationRule(tenantId: string, userId: string, id: string) {
    const rule = await this.prisma.healthAutomationRule.delete({
      where: { id, tenantId },
    });
    await this.notifyTenant(tenantId, 'Otomasyon Kuralı Silindi', `${rule.name} kuralı silindi.`, 'HEALTH_AUTOMATION_DELETED', undefined, 'HEALTH_AUTOMATION_RULE', userId);
    return rule;
  }

  async findAllAutomationRules(tenantId: string) {
    return this.prisma.healthAutomationRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
