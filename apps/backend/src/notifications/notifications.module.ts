import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from './notification.service';

@Module({
  providers: [NotificationsService, NotificationService],
  controllers: [NotificationsController],
  exports: [NotificationsService, NotificationService],
})
export class NotificationsModule {}
