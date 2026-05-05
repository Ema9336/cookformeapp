import { Controller, Get, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { InAppNotificationsService } from './in-app-notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class InAppNotificationsController {
  constructor(private readonly notificationsService: InAppNotificationsService) {}

  @Get()
  async list(@Request() req: { user: { userId: string } }, @Query('limit') limit?: string) {
    const notifications = await this.notificationsService.listForUser(
      req.user.userId,
      limit ? parseInt(limit, 10) : 30,
    );
    const unread = await this.notificationsService.unreadCount(req.user.userId);
    return { notifications, unread };
  }

  @Patch(':id/read')
  async markRead(@Request() req: { user: { userId: string } }, @Param('id') id: string) {
    await this.notificationsService.markRead(req.user.userId, id);
    return { ok: true };
  }

  @Patch('read-all')
  async markAllRead(@Request() req: { user: { userId: string } }) {
    await this.notificationsService.markAllRead(req.user.userId);
    return { ok: true };
  }
}
