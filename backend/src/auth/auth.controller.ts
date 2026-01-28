import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/guards/auth.guard';
import { GetUser } from '../common/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('verify-phone')
  @HttpCode(HttpStatus.OK)
  verifyPhone(@Body() body: { token: string; code: string }) {
    return this.authService.verifyPhone(body);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() body: { token: string; code: string }) {
    return this.authService.verifyEmail(body);
  }

  @Public()
  @Post('verify-email-token')
  @HttpCode(HttpStatus.OK)
  verifyEmailToken(@Body() body: { token: string }) {
    return this.authService.verifyEmailToken(body);
  }

  @Public()
  @Post('resend-phone-verification')
  @HttpCode(HttpStatus.OK)
  resendPhoneVerification(@Body() body: { token: string }) {
    return this.authService.resendPhoneVerification(body);
  }

  @Public()
  @Post('resend-email-verification')
  @HttpCode(HttpStatus.OK)
  resendEmailVerification(@Body() body: { token: string }) {
    return this.authService.resendEmailVerification(body);
  }

  @Public()
  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  verifyTwoFactor(@Body() body: { token: string; code: string }) {
    return this.authService.verifyTwoFactor(body);
  }

  @Public()
  @Post('resend-2fa')
  @HttpCode(HttpStatus.OK)
  resendTwoFactor(@Body() body: { token: string }) {
    return this.authService.resendTwoFactor(body);
  }

  @Public()
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  requestPasswordReset(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body);
  }

  @Public()
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  confirmPasswordReset(
    @Body() body: { email: string; code: string; newPassword: string },
  ) {
    return this.authService.confirmPasswordReset(body);
  }

  @Public()
  @Post('bootstrap-admin')
  @HttpCode(HttpStatus.OK)
  bootstrapAdmin(
    @Body()
    data: {
      email?: string;
      password?: string;
      agencyName?: string;
      secret?: string;
    },
  ) {
    return this.authService.bootstrapAdmin(data);
  }

  @Public()
  @Post('reset-admin-password')
  @HttpCode(HttpStatus.OK)
  resetAdminPassword(
    @Body()
    data: {
      email: string;
      newPassword: string;
      secret?: string;
    },
  ) {
    return this.authService.resetAdminPassword(data);
  }

  @Get('me')
  getMe(@GetUser() user: any) {
    const userId =
      typeof user?.userId === 'string'
        ? user.userId
        : String(user?.userId ?? '');
    return this.authService.getMe(userId);
  }
}
