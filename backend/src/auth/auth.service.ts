import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { NetgsmService } from '../integrations/netgsm/netgsm.service';
import { randomUUID } from 'crypto';
import { Smtp2goService } from '../integrations/smtp2go/smtp2go.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private netgsmService: NetgsmService,
    private smtp2goService: Smtp2goService,
  ) {}

  private slugify(value: string) {
    const v = String(value || '')
      .trim()
      .toLowerCase();
    const normalized = v.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    const slug = normalized
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return slug || randomUUID().slice(0, 8);
  }

  private getFrontendUrl() {
    return process.env.FRONTEND_URL || 'https://kolayentegrasyon.com';
  }

  private normalizeUrlBase(url: string) {
    const v = String(url || '').trim();
    return v.endsWith('/') ? v.slice(0, -1) : v;
  }

  private getEmailLogoUrl() {
    const base = this.normalizeUrlBase(this.getFrontendUrl());
    return `${base}/api/email-logo?size=32`;
  }

  private buildEmailVerifyLink(token: string) {
    const base = this.normalizeUrlBase(this.getFrontendUrl());
    return `${base}/login?verifyEmailToken=${encodeURIComponent(token)}`;
  }

  private async getSystemConfig() {
    let config = await this.prisma.systemConfig.findFirst();
    if (!config) {
      config = await this.prisma.systemConfig.create({
        data: {
          paytrMerchantId: '',
          paytrMerchantKey: '',
          paytrMerchantSalt: '',
          paytrIsActive: false,
          paytrTestMode: true,
          netgsmUsercode: '',
          netgsmPassword: '',
          netgsmMsgheader: '',
          netgsmIsActive: false,
          registrationSmsVerificationEnabled: false,
        },
      });
    }
    return config;
  }

  private generateOtp(length = 6) {
    const digits = '0123456789';
    let out = '';
    for (let i = 0; i < length; i++) {
      out += digits[Math.floor(Math.random() * digits.length)];
    }
    return out;
  }

  private otpExpiresAt(minutes = 10) {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutes);
    return d;
  }

  private buildOtpEmailHtml(data: {
    title: string;
    subtitle: string;
    code: string;
    expiresMinutes: number;
    buttonLabel?: string;
    buttonUrl?: string;
  }) {
    const title = String(data.title || '').trim();
    const subtitle = String(data.subtitle || '').trim();
    const code = String(data.code || '').trim();
    const expiresMinutes = Number(data.expiresMinutes || 10);
    const buttonLabel = String(data.buttonLabel || '').trim();
    const buttonUrl = String(data.buttonUrl || '').trim();

    return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#0b0b0b;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
      <div style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
        <div style="padding:24px 24px 12px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr>
              <td style="vertical-align:middle;">
                <img src="${this.getEmailLogoUrl()}" width="32" height="32" alt="MOI PORT" style="display:block;width:32px;height:32px;border:0;outline:none;text-decoration:none;" />
              </td>
              <td style="vertical-align:middle;padding-left:16px;">
                <div style="font-size:14px;letter-spacing:0.08em;color:#8b8b8b;font-weight:700;">MOI PORT</div>
              </td>
            </tr>
          </table>
          <h1 style="margin:10px 0 0 0;font-size:22px;line-height:1.25;color:#fff;">${title}</h1>
          <div style="margin-top:8px;font-size:14px;line-height:1.5;color:#bdbdbd;">${subtitle}</div>
        </div>
        <div style="padding:16px 24px 24px 24px;">
          ${
            buttonUrl && buttonLabel
              ? `<div style="margin:0 0 14px 0;">
            <a href="${buttonUrl}" style="display:block;text-decoration:none;background:#00e676;color:#000;font-weight:800;text-align:center;padding:14px 16px;border-radius:14px;">
              ${buttonLabel}
            </a>
            <div style="margin-top:10px;font-size:12px;color:#8a8a8a;line-height:1.45;text-align:center;">
              Buton çalışmazsa bu linki açın: <span style="color:#bdbdbd;word-break:break-all;">${buttonUrl}</span>
            </div>
          </div>`
              : ''
          }
          <div style="background:#0a0a0a;border:1px solid rgba(255,255,255,0.10);border-radius:14px;padding:18px;text-align:center;">
            <div style="font-size:12px;color:#9a9a9a;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Doğrulama Kodu</div>
            <div style="margin-top:10px;font-size:34px;letter-spacing:0.18em;color:#00e676;font-weight:800;">${code}</div>
            <div style="margin-top:10px;font-size:12px;color:#9a9a9a;">Kodun geçerlilik süresi ${expiresMinutes} dakikadır.</div>
          </div>
          <div style="margin-top:14px;font-size:12px;line-height:1.5;color:#7f7f7f;">
            Bu işlemi siz başlatmadıysanız bu e-postayı yok sayabilirsiniz.
          </div>
        </div>
      </div>
      <div style="margin-top:14px;font-size:11px;line-height:1.5;color:#666;text-align:center;">
        © ${new Date().getFullYear()} MOI Port
      </div>
    </div>
  </body>
</html>`;
  }

  private async buildAuthResponseForUser(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      customerId: user.customerId,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        avatar: user.avatar,
        allowedModules: user.allowedModules,
        customerId: user.customerId,
      },
    };
  }

  async register(dto: RegisterDto) {
    const email = (dto.email || '').trim().toLowerCase();
    const phone = String(dto.phone || '').trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const otp = this.generateOtp(6);
    const codeHash = await bcrypt.hash(otp, 10);
    const token = randomUUID();
    const expiresAt = this.otpExpiresAt(10);

    let createdTenantId = '';
    let createdUserId = '';

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const now = new Date();
        const trialEnds = new Date(now);
        trialEnds.setDate(trialEnds.getDate() + 14);
        const baseSlug = this.slugify(dto.agencyName);
        let tenantSlug = baseSlug;
        let tenant:
          | {
              id: string;
              slug: string;
            }
          | undefined;
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            tenant = await tx.tenant.create({
              data: {
                name: dto.agencyName,
                slug: tenantSlug,
                subscriptionStatus: 'TRIAL',
                subscriptionPlan: 'PRO',
                subscriptionEndsAt: trialEnds,
                autoRenew: true,
                email,
                phone: phone || undefined,
              },
              select: { id: true, slug: true },
            });
            break;
          } catch (error: any) {
            if (String(error?.code || '') === 'P2002') {
              tenantSlug = `${baseSlug}-${randomUUID().slice(0, 6)}`;
              continue;
            }
            throw error;
          }
        }
        if (!tenant) {
          throw new ConflictException('Ajans adı kullanılamıyor');
        }

        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name: dto.name,
            role: 'ADMIN',
            tenantId: tenant.id,
            phone: phone || undefined,
          },
        });

        await tx.userVerification.create({
          data: {
            userId: user.id,
            token,
            purpose: 'REGISTRATION_EMAIL',
            codeHash,
            expiresAt,
          },
        });

        createdTenantId = tenant.id;
        createdUserId = user.id;

        return { requiresEmailVerification: true, token, expiresAt };
      });

      await this.smtp2goService.sendEmail({
        to: email,
        subject: 'MOI Port’a Hoş Geldiniz — Üyeliğinizi Onaylayın',
        text: `MOI Port’a hoş geldiniz!\n\nÜyeliğinizi onaylamak için doğrulama kodunuz: ${otp}\nKodun geçerlilik süresi 10 dakikadır.\n\nDilerseniz şu linkten de onaylayabilirsiniz: ${this.buildEmailVerifyLink(
          token,
        )}`,
        html: this.buildOtpEmailHtml({
          title: 'MOI Port’a Hoş Geldiniz',
          subtitle:
            'Üyeliğinizi onaylamak için aşağıdaki kodu girin veya butona tıklayın.',
          code: otp,
          expiresMinutes: 10,
          buttonLabel: 'Üyeliğimi Onayla',
          buttonUrl: this.buildEmailVerifyLink(token),
        }),
      });

      return result;
    } catch (error) {
      if (createdUserId) {
        await this.prisma.userVerification.deleteMany({
          where: { userId: createdUserId, purpose: 'REGISTRATION_EMAIL' },
        });
        await this.prisma.user.deleteMany({ where: { id: createdUserId } });
      }
      if (createdTenantId) {
        await this.prisma.tenant.deleteMany({ where: { id: createdTenantId } });
      }
      if (String(error?.code || '') === 'P2002') {
        throw new ConflictException('Kayıt bilgileri zaten kullanılıyor');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    if (!dto) {
      throw new UnauthorizedException('Giriş bilgileri eksik');
    }
    const email = (dto.email || '').trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Geçersiz e-posta veya şifre');
    }

    if (user.tenant && user.tenant.subscriptionStatus === 'SUSPENDED') {
      throw new UnauthorizedException(
        'Hesabınız askıya alınmıştır. Lütfen yönetici ile iletişime geçin.',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Geçersiz e-posta veya şifre');
    }

    if (!user.emailVerifiedAt) {
      const legacy = await this.prisma.userVerification.findFirst({
        where: { userId: user.id, purpose: 'REGISTRATION_EMAIL' },
        select: { id: true },
      });

      if (!legacy) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { emailVerifiedAt: new Date() },
        });
      } else {
        const otp = this.generateOtp(6);
        const codeHash = await bcrypt.hash(otp, 10);
        const expiresAt = this.otpExpiresAt(10);

        const existing = await this.prisma.userVerification.findFirst({
          where: {
            userId: user.id,
            purpose: 'REGISTRATION_EMAIL',
            usedAt: null,
          },
          orderBy: { createdAt: 'desc' },
        });

        const token = existing?.token || randomUUID();
        if (existing) {
          await this.prisma.userVerification.update({
            where: { id: existing.id },
            data: { codeHash, expiresAt },
          });
        } else {
          await this.prisma.userVerification.create({
            data: {
              userId: user.id,
              token,
              purpose: 'REGISTRATION_EMAIL',
              codeHash,
              expiresAt,
            },
          });
        }

        await this.smtp2goService.sendEmail({
          to: user.email,
          subject: 'MOI Port — E-posta Doğrulama',
          text: `Girişe devam etmek için e-posta doğrulama kodunuz: ${otp}\nKodun geçerlilik süresi 10 dakikadır.\n\nDilerseniz şu linkten de onaylayabilirsiniz: ${this.buildEmailVerifyLink(
            token,
          )}`,
          html: this.buildOtpEmailHtml({
            title: 'E-posta Doğrulama',
            subtitle:
              'Girişe devam etmek için kodu girin veya aşağıdaki butona tıklayın.',
            code: otp,
            expiresMinutes: 10,
            buttonLabel: 'E-postayı Onayla',
            buttonUrl: this.buildEmailVerifyLink(token),
          }),
        });

        return { requiresEmailVerification: true, token, expiresAt };
      }
    }

    if (user.tenant?.twoFactorEnabled) {
      if (!user.phone || !user.phoneVerifiedAt) {
        throw new UnauthorizedException(
          '2FA için doğrulanmış telefon numarası gereklidir',
        );
      }
      const sys = await this.getSystemConfig();
      if (!sys.netgsmIsActive) {
        throw new UnauthorizedException('2FA için SMS servisi aktif değil');
      }

      const otp = this.generateOtp(6);
      const otpHash = await bcrypt.hash(otp, 10);
      const token = randomUUID();
      const expiresAt = this.otpExpiresAt(5);
      await this.prisma.twoFactorAuth.create({
        data: {
          userId: user.id,
          token,
          otpHash,
          expiresAt,
        },
      });

      await this.netgsmService.sendSystemSms(
        user.phone,
        `MOI Port giriş doğrulama kodunuz: ${otp}`,
      );

      return { requiresTwoFactor: true, token, expiresAt };
    }

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      customerId: user.customerId,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        avatar: user.avatar,
        allowedModules: user.allowedModules,
        customerId: user.customerId,
      },
    };
  }

  async verifyEmail(data: { token: string; code: string }) {
    const token = String(data?.token || '').trim();
    const code = String(data?.code || '').trim();
    if (!token || !code) {
      throw new BadRequestException('Kod doğrulama bilgileri eksik');
    }

    const verification = await this.prisma.userVerification.findUnique({
      where: { token },
      include: { user: { include: { tenant: true } } },
    });
    if (!verification || verification.purpose !== 'REGISTRATION_EMAIL') {
      throw new BadRequestException('Doğrulama isteği bulunamadı');
    }
    if (verification.usedAt) {
      throw new BadRequestException('Doğrulama kodu zaten kullanılmış');
    }
    if (verification.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Doğrulama kodunun süresi doldu');
    }

    const ok = await bcrypt.compare(code, verification.codeHash);
    if (!ok) {
      throw new BadRequestException('Doğrulama kodu hatalı');
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: verification.userId },
        data: { emailVerifiedAt: now },
      });
      await tx.userVerification.update({
        where: { id: verification.id },
        data: { usedAt: now },
      });
    });

    const user = verification.user;
    return this.buildAuthResponseForUser(user);
  }

  async verifyEmailToken(data: { token: string }) {
    const token = String(data?.token || '').trim();
    if (!token) {
      throw new BadRequestException('Token zorunludur');
    }

    const verification = await this.prisma.userVerification.findUnique({
      where: { token },
      include: { user: { include: { tenant: true } } },
    });
    if (!verification || verification.purpose !== 'REGISTRATION_EMAIL') {
      throw new BadRequestException('Doğrulama isteği bulunamadı');
    }
    if (verification.usedAt) {
      throw new BadRequestException('Doğrulama isteği tamamlanmış');
    }
    if (verification.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Doğrulama linkinin süresi doldu');
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: verification.userId },
        data: { emailVerifiedAt: now },
      });
      await tx.userVerification.update({
        where: { id: verification.id },
        data: { usedAt: now },
      });
    });

    return this.buildAuthResponseForUser(verification.user);
  }

  async resendEmailVerification(data: { token: string }) {
    const token = String(data?.token || '').trim();
    if (!token) {
      throw new BadRequestException('Token zorunludur');
    }
    const verification = await this.prisma.userVerification.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!verification || verification.purpose !== 'REGISTRATION_EMAIL') {
      throw new BadRequestException('Doğrulama isteği bulunamadı');
    }
    if (verification.usedAt) {
      throw new BadRequestException('Doğrulama isteği tamamlanmış');
    }

    const otp = this.generateOtp(6);
    const codeHash = await bcrypt.hash(otp, 10);
    const expiresAt = this.otpExpiresAt(10);
    await this.prisma.userVerification.update({
      where: { id: verification.id },
      data: { codeHash, expiresAt },
    });

    await this.smtp2goService.sendEmail({
      to: verification.user.email,
      subject: 'E-posta doğrulama kodu',
      text: `E-posta doğrulama kodunuz: ${otp}\n\nKodun geçerlilik süresi 10 dakikadır.\n\nDilerseniz şu linkten de onaylayabilirsiniz: ${this.buildEmailVerifyLink(
        verification.token,
      )}`,
      html: this.buildOtpEmailHtml({
        title: 'E-posta Doğrulama',
        subtitle:
          'Doğrulamayı tamamlamak için kodu girin veya aşağıdaki butona tıklayın.',
        code: otp,
        expiresMinutes: 10,
        buttonLabel: 'E-postayı Onayla',
        buttonUrl: this.buildEmailVerifyLink(verification.token),
      }),
    });

    return { status: 'sent', expiresAt };
  }

  async verifyPhone(data: { token: string; code: string }) {
    const token = String(data?.token || '').trim();
    const code = String(data?.code || '').trim();
    if (!token || !code) {
      throw new BadRequestException('Kod doğrulama bilgileri eksik');
    }

    const verification = await this.prisma.userVerification.findUnique({
      where: { token },
      include: { user: { include: { tenant: true } } },
    });
    if (!verification || verification.purpose !== 'REGISTRATION_PHONE') {
      throw new UnauthorizedException('Doğrulama isteği bulunamadı');
    }
    if (verification.usedAt) {
      throw new UnauthorizedException('Doğrulama kodu zaten kullanılmış');
    }
    if (verification.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Doğrulama kodunun süresi doldu');
    }

    const ok = await bcrypt.compare(code, verification.codeHash);
    if (!ok) {
      throw new UnauthorizedException('Doğrulama kodu hatalı');
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: verification.userId },
        data: { phoneVerifiedAt: now },
      });
      await tx.userVerification.update({
        where: { id: verification.id },
        data: { usedAt: now },
      });
    });

    const user = verification.user;
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      customerId: user.customerId,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        avatar: user.avatar,
        allowedModules: user.allowedModules,
        customerId: user.customerId,
      },
    };
  }

  async resendPhoneVerification(data: { token: string }) {
    const token = String(data?.token || '').trim();
    if (!token) {
      throw new BadRequestException('Token zorunludur');
    }
    const verification = await this.prisma.userVerification.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!verification || verification.purpose !== 'REGISTRATION_PHONE') {
      throw new UnauthorizedException('Doğrulama isteği bulunamadı');
    }
    if (verification.usedAt) {
      throw new UnauthorizedException('Doğrulama isteği tamamlanmış');
    }
    const userPhone = String(verification.user.phone || '').trim();
    if (!userPhone) {
      throw new BadRequestException('Telefon bulunamadı');
    }
    const otp = this.generateOtp(6);
    const codeHash = await bcrypt.hash(otp, 10);
    const expiresAt = this.otpExpiresAt(10);
    await this.prisma.userVerification.update({
      where: { id: verification.id },
      data: { codeHash, expiresAt },
    });
    await this.netgsmService.sendSystemSms(
      userPhone,
      `MOI Port doğrulama kodunuz: ${otp}`,
    );
    return { status: 'sent', expiresAt };
  }

  async verifyTwoFactor(data: { token: string; code: string }) {
    const token = String(data?.token || '').trim();
    const code = String(data?.code || '').trim();
    if (!token || !code) {
      throw new BadRequestException('Kod doğrulama bilgileri eksik');
    }
    const rec = await this.prisma.twoFactorAuth.findUnique({
      where: { token },
      include: { user: { include: { tenant: true } } },
    });
    if (!rec) {
      throw new UnauthorizedException('2FA isteği bulunamadı');
    }
    if (rec.usedAt) {
      throw new UnauthorizedException('2FA kodu zaten kullanılmış');
    }
    if (rec.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('2FA kodunun süresi doldu');
    }
    const ok = await bcrypt.compare(code, rec.otpHash);
    if (!ok) {
      throw new UnauthorizedException('2FA kodu hatalı');
    }
    const now = new Date();
    await this.prisma.twoFactorAuth.update({
      where: { id: rec.id },
      data: { usedAt: now },
    });
    const user = rec.user;
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      customerId: user.customerId,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        avatar: user.avatar,
        allowedModules: user.allowedModules,
        customerId: user.customerId,
      },
    };
  }

  async resendTwoFactor(data: { token: string }) {
    const token = String(data?.token || '').trim();
    if (!token) {
      throw new BadRequestException('Token zorunludur');
    }
    const rec = await this.prisma.twoFactorAuth.findUnique({
      where: { token },
      include: { user: { include: { tenant: true } } },
    });
    if (!rec) {
      throw new UnauthorizedException('2FA isteği bulunamadı');
    }
    if (rec.usedAt) {
      throw new UnauthorizedException('2FA isteği tamamlanmış');
    }
    if (!rec.user.phone || !rec.user.phoneVerifiedAt) {
      throw new BadRequestException(
        '2FA için doğrulanmış telefon numarası gereklidir',
      );
    }
    const sys = await this.getSystemConfig();
    if (!sys.netgsmIsActive) {
      throw new UnauthorizedException('2FA için SMS servisi aktif değil');
    }

    const otp = this.generateOtp(6);
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = this.otpExpiresAt(5);
    await this.prisma.twoFactorAuth.update({
      where: { id: rec.id },
      data: { otpHash, expiresAt },
    });
    await this.netgsmService.sendSystemSms(
      rec.user.phone,
      `MOI Port giriş doğrulama kodunuz: ${otp}`,
    );
    return { status: 'sent', expiresAt };
  }

  async requestPasswordReset(data: { email: string }) {
    const email = String(data?.email || '')
      .trim()
      .toLowerCase();
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Geçerli bir e-posta girin');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { status: 'ok' };
    }

    await this.prisma.userVerification.updateMany({
      where: {
        userId: user.id,
        purpose: 'PASSWORD_RESET',
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    const otp = this.generateOtp(6);
    const codeHash = await bcrypt.hash(otp, 10);
    const expiresAt = this.otpExpiresAt(10);

    await this.prisma.userVerification.create({
      data: {
        userId: user.id,
        token: randomUUID(),
        purpose: 'PASSWORD_RESET',
        codeHash,
        expiresAt,
      },
    });

    await this.smtp2goService.sendEmail({
      to: user.email,
      subject: 'Şifre sıfırlama kodu',
      text: `Şifre sıfırlama kodunuz: ${otp}\n\nKodun geçerlilik süresi 10 dakikadır.`,
      html: this.buildOtpEmailHtml({
        title: 'Şifre Sıfırlama',
        subtitle: 'Şifrenizi sıfırlamak için aşağıdaki kodu girin.',
        code: otp,
        expiresMinutes: 10,
      }),
    });

    return { status: 'ok', expiresAt };
  }

  async confirmPasswordReset(data: {
    email: string;
    code: string;
    newPassword: string;
  }) {
    const email = String(data?.email || '')
      .trim()
      .toLowerCase();
    const code = String(data?.code || '').trim();
    const newPassword = String(data?.newPassword || '');

    if (!email || !email.includes('@') || !code || !newPassword) {
      throw new BadRequestException('Bilgiler eksik');
    }
    if (newPassword.length < 6) {
      throw new BadRequestException('Şifre en az 6 karakter olmalı');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new BadRequestException('Doğrulama kodu hatalı');
    }

    const verification = await this.prisma.userVerification.findFirst({
      where: {
        userId: user.id,
        purpose: 'PASSWORD_RESET',
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!verification) {
      throw new BadRequestException('Doğrulama kodu hatalı');
    }
    if (verification.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Doğrulama kodunun süresi doldu');
    }

    const ok = await bcrypt.compare(code, verification.codeHash);
    if (!ok) {
      throw new BadRequestException('Doğrulama kodu hatalı');
    }

    const now = new Date();
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      await tx.userVerification.update({
        where: { id: verification.id },
        data: { usedAt: now },
      });
    });

    return { status: 'ok' };
  }

  async bootstrapAdmin(data: {
    email?: string;
    password?: string;
    agencyName?: string;
    secret?: string;
  }) {
    /*
    const existingAdminCount = await this.prisma.user.count({
      where: { role: 'ADMIN' },
    });
    if (existingAdminCount > 0) {
      throw new UnauthorizedException('Admin already exists');
    }
    */
    const secret = data?.secret || process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!secret || secret.length < 6) {
      throw new UnauthorizedException('Bootstrap secret required');
    }
    const email = (data?.email || 'admin@ajans.local').trim().toLowerCase();
    const password = data?.password || 'ajans123';
    const agencyName = data?.agencyName || 'Ajans';

    const hashedPassword = await bcrypt.hash(password, 10);

    const tenants = await this.prisma.tenant.findMany({ take: 1 });
    const tenant =
      tenants[0] ||
      (await this.prisma.tenant.create({
        data: {
          name: agencyName,
          slug: agencyName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        },
      }));

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN',
        name: 'Yönetici',
        tenantId: tenant.id,
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        avatar: user.avatar,
      },
    };
  }

  async resetAdminPassword(data: {
    email: string;
    newPassword: string;
    secret?: string;
  }) {
    const secret = data?.secret || process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!secret || secret.length < 6) {
      throw new UnauthorizedException('Reset secret required');
    }
    const email = (data.email || '').trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.role !== 'ADMIN') {
      throw new UnauthorizedException(
        'Only ADMIN password can be reset via secret',
      );
    }
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    return { status: 'ok' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password: _password, ...result } = user;
    void _password;
    return result;
  }
}
