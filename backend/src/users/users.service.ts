import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        role: { not: 'CLIENT' }, // Exclude clients from staff lists
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    const { password: _password, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, data: any) {
    const allowedUpdates: any = {
      name: data.name,
      phone: data.phone,
      address: data.address,
      tckn: data.tckn,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      bankName: data.bankName,
      bankBranch: data.bankBranch,
      bankAccountNumber: data.bankAccountNumber,
      iban: data.iban,
      maritalStatus: data.maritalStatus,
      bloodType: data.bloodType,
      educationLevel: data.educationLevel,
    };

    if (data.birthDate) {
      allowedUpdates.birthDate = new Date(data.birthDate);
    }
    if (data.childrenCount !== undefined) {
      allowedUpdates.childrenCount = Number(data.childrenCount);
    }

    // Clean undefined values
    Object.keys(allowedUpdates).forEach(
      (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key],
    );

    return this.prisma.user.update({
      where: { id: userId },
      data: allowedUpdates,
    });
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(oldPass, user.password);
    if (!isMatch) {
      throw new BadRequestException('Mevcut şifre yanlış');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Şifre başarıyla güncellendi' };
  }

  async create(data: any, tenantId: string) {
    // Limit kontrolü
    const [tenant, userCount] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { maxUsers: true },
      }),
      this.prisma.user.count({
        where: { tenantId, isActive: true },
      }),
    ]);

    if (tenant && tenant.maxUsers && userCount >= tenant.maxUsers) {
      throw new BadRequestException(
        `Kullanıcı limitine ulaşıldı (${tenant.maxUsers}). Lütfen paketinizi yükseltin.`,
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new BadRequestException('Bu e-posta adresi zaten kullanılıyor.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || 'STAFF',
        tenantId: tenantId,
        isActive: true,
      },
    });
  }
}
