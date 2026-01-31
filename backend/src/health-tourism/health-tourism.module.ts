import { Module } from '@nestjs/common';
import { HealthTourismService } from './health-tourism.service';
import { HealthTourismController } from './health-tourism.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [HealthTourismController],
  providers: [HealthTourismService],
  exports: [HealthTourismService],
})
export class HealthTourismModule {}
