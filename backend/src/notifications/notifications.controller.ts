import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { GetUser, GetTenantId } from '../common/decorators/user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Query('limit') limit?: string,
  ) {
    const userId =
      typeof user?.userId === 'string'
        ? user.userId
        : typeof user?.id === 'string'
          ? user.id
          : String(user?.userId ?? user?.id ?? '');
    return this.notificationsService.findAll(
      tenantId,
      userId,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('unread-count')
  getUnreadCount(@GetTenantId() tenantId: string, @GetUser() user: any) {
    const userId =
      typeof user?.userId === 'string'
        ? user.userId
        : typeof user?.id === 'string'
          ? user.id
          : String(user?.userId ?? user?.id ?? '');
    return this.notificationsService.getUnreadCount(tenantId, userId);
  }

  @Patch(':id/read')
  markAsRead(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    const userId =
      typeof user?.userId === 'string'
        ? user.userId
        : typeof user?.id === 'string'
          ? user.id
          : String(user?.userId ?? user?.id ?? '');
    return this.notificationsService.markAsRead(tenantId, userId, id);
  }

  @Post('read-all')
  markAllAsRead(@GetTenantId() tenantId: string, @GetUser() user: any) {
    const userId =
      typeof user?.userId === 'string'
        ? user.userId
        : typeof user?.id === 'string'
          ? user.id
          : String(user?.userId ?? user?.id ?? '');
    return this.notificationsService.markAllAsRead(tenantId, userId);
  }
}
