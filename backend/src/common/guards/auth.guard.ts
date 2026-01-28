import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    if (err || !user) {
      throw err || new ForbiddenException('Yetkisiz erişim');
    }

    if (
      ['SUSPENDED', 'TRIAL_ENDED', 'EXPIRED'].includes(user.subscriptionStatus)
    ) {
      const request = context.switchToHttp().getRequest();
      const path = request.route.path;
      const method = request.method;

      // Allow read-only access to essential endpoints for billing
      const allowedPaths = [
        '/tenants/me',
        '/subscriptions/me',
        '/subscriptions/plans',
        '/subscriptions/checkout-session', // Assuming this exists
      ];

      // Simple check: Allow if path is in allowed list OR starts with /subscriptions
      // Also allow specific tenant updates if needed for re-activation? usually automatic via webhook

      // Check exact matches or startsWith
      const isAllowed =
        allowedPaths.includes(path) || path.startsWith('/subscriptions');

      if (!isAllowed) {
        let msg = 'Hesabınız askıya alınmıştır. Lütfen ödeme yapın.';
        if (user.subscriptionStatus === 'TRIAL_ENDED') {
          msg = 'Deneme süreniz sona ermiştir. Lütfen bir plan seçin.';
        } else if (user.subscriptionStatus === 'EXPIRED') {
          msg = 'Abonelik süreniz dolmuştur. Lütfen paketinizi yenileyin.';
        }
        throw new ForbiddenException(msg);
      }
    }

    return user;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role?.includes(role));
  }
}

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
