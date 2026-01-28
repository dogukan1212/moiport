import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './auth.guard';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // console.log(`SubscriptionGuard: Public route detected for ${context.getHandler().name}`);
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // SUPER_ADMIN her zaman erişebilir
    if (user?.role === 'SUPER_ADMIN') {
      return true;
    }

    if (!user?.tenantId) {
      return true; // Tenant ID yoksa (örn. login/register) JwtAuthGuard zaten halleder veya public'tir
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { subscriptionStatus: true },
    });

    if (!tenant) {
      throw new ForbiddenException('Ajans bulunamadı.');
    }

    if (tenant.subscriptionStatus === 'SUSPENDED') {
      throw new ForbiddenException(
        'Aboneliğiniz askıya alınmıştır. Lütfen sistem yöneticisi ile iletişime geçin.',
      );
    }

    if (tenant.subscriptionStatus === 'CANCELED') {
      throw new ForbiddenException('Aboneliğiniz iptal edilmiştir.');
    }

    return true;
  }
}
