import { Module } from '@nestjs/common';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { CrmGateway } from './crm.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    NotificationsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'ajans-gizli-anahtar-2026',
    }),
  ],
  controllers: [CrmController],
  providers: [CrmService, CrmGateway],
  exports: [CrmService, CrmGateway],
})
export class CrmModule {}
