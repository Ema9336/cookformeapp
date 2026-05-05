import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { InAppNotificationsService } from './in-app-notifications.service';
import { InAppNotificationsController } from './in-app-notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InAppNotificationsController],
  providers: [EmailService, InAppNotificationsService],
  exports: [EmailService, InAppNotificationsService],
})
export class NotificationsModule {}
