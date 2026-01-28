"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsModule = void 0;
const common_1 = require("@nestjs/common");
const facebook_controller_1 = require("./facebook/facebook.controller");
const facebook_service_1 = require("./facebook/facebook.service");
const prisma_module_1 = require("../prisma/prisma.module");
const crm_module_1 = require("../crm/crm.module");
const whatsapp_controller_1 = require("./whatsapp/whatsapp.controller");
const whatsapp_service_1 = require("./whatsapp/whatsapp.service");
const parasut_controller_1 = require("./parasut/parasut.controller");
const parasut_service_1 = require("./parasut/parasut.service");
const vatansms_controller_1 = require("./vatansms/vatansms.controller");
const vatansms_service_1 = require("./vatansms/vatansms.service");
const netgsm_controller_1 = require("./netgsm/netgsm.controller");
const netgsm_service_1 = require("./netgsm/netgsm.service");
const paytr_controller_1 = require("./paytr/paytr.controller");
const paytr_service_1 = require("./paytr/paytr.service");
const smtp2go_controller_1 = require("./smtp2go/smtp2go.controller");
const smtp2go_service_1 = require("./smtp2go/smtp2go.service");
const trello_controller_1 = require("./trello/trello.controller");
const trello_service_1 = require("./trello/trello.service");
const google_calendar_controller_1 = require("./google-calendar/google-calendar.controller");
const google_calendar_service_1 = require("./google-calendar/google-calendar.service");
let IntegrationsModule = class IntegrationsModule {
};
exports.IntegrationsModule = IntegrationsModule;
exports.IntegrationsModule = IntegrationsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, crm_module_1.CrmModule],
        controllers: [
            facebook_controller_1.FacebookController,
            whatsapp_controller_1.WhatsappController,
            parasut_controller_1.ParasutController,
            vatansms_controller_1.VatansmsController,
            netgsm_controller_1.NetgsmController,
            paytr_controller_1.PaytrController,
            smtp2go_controller_1.Smtp2goController,
            trello_controller_1.TrelloController,
            google_calendar_controller_1.GoogleCalendarController,
        ],
        providers: [
            facebook_service_1.FacebookService,
            whatsapp_service_1.WhatsappService,
            parasut_service_1.ParasutService,
            vatansms_service_1.VatansmsService,
            netgsm_service_1.NetgsmService,
            paytr_service_1.PaytrService,
            smtp2go_service_1.Smtp2goService,
            trello_service_1.TrelloService,
            google_calendar_service_1.GoogleCalendarService,
        ],
        exports: [
            facebook_service_1.FacebookService,
            whatsapp_service_1.WhatsappService,
            parasut_service_1.ParasutService,
            vatansms_service_1.VatansmsService,
            netgsm_service_1.NetgsmService,
            paytr_service_1.PaytrService,
            smtp2go_service_1.Smtp2goService,
            trello_service_1.TrelloService,
            google_calendar_service_1.GoogleCalendarService,
        ],
    })
], IntegrationsModule);
//# sourceMappingURL=integrations.module.js.map