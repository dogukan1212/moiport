"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const core_1 = require("@nestjs/core");
const subscription_guard_1 = require("./common/guards/subscription.guard");
const auth_guard_1 = require("./common/guards/auth.guard");
const tenants_module_1 = require("./tenants/tenants.module");
const customers_module_1 = require("./customers/customers.module");
const tasks_module_1 = require("./tasks/tasks.module");
const projects_module_1 = require("./projects/projects.module");
const finance_module_1 = require("./finance/finance.module");
const ai_module_1 = require("./ai/ai.module");
const social_media_module_1 = require("./social-media/social-media.module");
const proposals_module_1 = require("./proposals/proposals.module");
const services_module_1 = require("./services/services.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const chat_module_1 = require("./chat/chat.module");
const notifications_module_1 = require("./notifications/notifications.module");
const users_module_1 = require("./users/users.module");
const crm_module_1 = require("./crm/crm.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const integrations_module_1 = require("./integrations/integrations.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const wordpress_module_1 = require("./wordpress/wordpress.module");
const sms_module_1 = require("./sms/sms.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            tenants_module_1.TenantsModule,
            customers_module_1.CustomersModule,
            tasks_module_1.TasksModule,
            projects_module_1.ProjectsModule,
            finance_module_1.FinanceModule,
            ai_module_1.AIModule,
            social_media_module_1.SocialMediaModule,
            proposals_module_1.ProposalsModule,
            services_module_1.ServicesModule,
            dashboard_module_1.DashboardModule,
            chat_module_1.ChatModule,
            notifications_module_1.NotificationsModule,
            crm_module_1.CrmModule,
            webhooks_module_1.WebhooksModule,
            integrations_module_1.IntegrationsModule,
            sms_module_1.SmsModule,
            subscriptions_module_1.SubscriptionsModule,
            wordpress_module_1.WordpressModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: subscription_guard_1.SubscriptionGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map