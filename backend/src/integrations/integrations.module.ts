import { Module } from '@nestjs/common';
import { FacebookController } from './facebook/facebook.controller';
import { FacebookService } from './facebook/facebook.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CrmModule } from '../crm/crm.module';
import { WhatsappController } from './whatsapp/whatsapp.controller';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { ParasutController } from './parasut/parasut.controller';
import { ParasutService } from './parasut/parasut.service';
import { VatansmsController } from './vatansms/vatansms.controller';
import { VatansmsService } from './vatansms/vatansms.service';
import { NetgsmController } from './netgsm/netgsm.controller';
import { NetgsmService } from './netgsm/netgsm.service';
import { PaytrController } from './paytr/paytr.controller';
import { PaytrService } from './paytr/paytr.service';
import { Smtp2goController } from './smtp2go/smtp2go.controller';
import { Smtp2goService } from './smtp2go/smtp2go.service';
import { TrelloController } from './trello/trello.controller';
import { TrelloService } from './trello/trello.service';
import { GoogleCalendarController } from './google-calendar/google-calendar.controller';
import { GoogleCalendarService } from './google-calendar/google-calendar.service';

@Module({
  imports: [PrismaModule, CrmModule],
  controllers: [
    FacebookController,
    WhatsappController,
    ParasutController,
    VatansmsController,
    NetgsmController,
    PaytrController,
    Smtp2goController,
    TrelloController,
    GoogleCalendarController,
  ],
  providers: [
    FacebookService,
    WhatsappService,
    ParasutService,
    VatansmsService,
    NetgsmService,
    PaytrService,
    Smtp2goService,
    TrelloService,
    GoogleCalendarService,
  ],
  exports: [
    FacebookService,
    WhatsappService,
    ParasutService,
    VatansmsService,
    NetgsmService,
    PaytrService,
    Smtp2goService,
    TrelloService,
    GoogleCalendarService,
  ],
})
export class IntegrationsModule {}
