import { Module } from '@nestjs/common';
import { DentalService } from './dental.service';
import { DentalController } from './dental.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [DentalController],
  providers: [DentalService],
})
export class DentalModule {}
