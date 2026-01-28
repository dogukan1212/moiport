import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'ajans-gizli-anahtar-2026',
    });
  }

  async validate(payload: any) {
    const tenantId = payload?.tenantId;
    const userId = payload?.sub;
    if (!tenantId || !userId) {
      throw new UnauthorizedException('Geçersiz oturum.');
    }

    const [tenant, user] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          subscriptionStatus: true,
          subscriptionEndsAt: true,
        },
      }),
      this.prisma.user.findFirst({
        where: { id: userId, tenantId },
        select: {
          id: true,
          email: true,
          role: true,
          tenantId: true,
          customerId: true,
        },
      }),
    ]);

    if (!tenant || !user) {
      throw new UnauthorizedException(
        'Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.',
      );
    }

    if (tenant.subscriptionStatus === 'SUSPENDED') {
      // Allow GET requests to tenants/me and subscriptions endpoints
      // Note: Strategy doesn't have easy access to request context to check path without modifying validate signature
      // We will handle path-based exception skipping in a Guard or use a workaround.
      // However, standard JwtStrategy.validate is called before the request reaches the controller.
      // To properly implement "allow only specific routes for suspended users", we should move this check to a Guard.
      // But for quick fix, we can throw a specific error and handle it, OR we can attach status to user and check in Guard.
      // Better approach: Don't throw here. Attach status to user object.
      // Let a global Guard or specific Guards decide if SUSPENDED is allowed.
      // But to keep it simple and safe:
      // We will throw ForbiddenException, but we need to allow /dashboard/subscriptions which calls GET /subscriptions/me
    }

    let finalStatus = tenant.subscriptionStatus;
    if (finalStatus !== 'SUSPENDED' && tenant.subscriptionEndsAt) {
      const now = new Date();
      const endsAt = new Date(tenant.subscriptionEndsAt);
      if (now > endsAt) {
        finalStatus = finalStatus === 'TRIAL' ? 'TRIAL_ENDED' : 'EXPIRED';
      }
    }

    return {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      customerId: user.customerId,
      subscriptionStatus: finalStatus, // Attach status to user
    };
  }
}
