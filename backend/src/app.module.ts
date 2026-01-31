import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { JwtAuthGuard } from './common/guards/auth.guard';
import { TenantsModule } from './tenants/tenants.module';
import { CustomersModule } from './customers/customers.module';
import { TasksModule } from './tasks/tasks.module';
import { ProjectsModule } from './projects/projects.module';
import { FinanceModule } from './finance/finance.module';
import { AIModule } from './ai/ai.module';
import { SocialMediaModule } from './social-media/social-media.module';
import { ProposalsModule } from './proposals/proposals.module';
import { ServicesModule } from './services/services.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
import { CrmModule } from './crm/crm.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { WordpressModule } from './wordpress/wordpress.module';
import { SmsModule } from './sms/sms.module';
import { StorageModule } from './storage/storage.module';
import { HealthTourismModule } from './health-tourism/health-tourism.module';
import { DentalModule } from './dental/dental.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    CustomersModule,
    TasksModule,
    ProjectsModule,
    FinanceModule,
    AIModule,
    SocialMediaModule,
    ProposalsModule,
    ServicesModule,
    DashboardModule,
    ChatModule,
    NotificationsModule,
    CrmModule,
    WebhooksModule,
    IntegrationsModule,
    SmsModule,
    StorageModule,
    HealthTourismModule,
    DentalModule,
    SubscriptionsModule,
    WordpressModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
  ],
})
export class AppModule {}
