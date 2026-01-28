import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [
    PassportModule,
    IntegrationsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'ajans-gizli-anahtar-2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
