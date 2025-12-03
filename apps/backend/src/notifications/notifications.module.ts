import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [ConfigModule],
  providers: [NotificationsService, NotificationService],
  controllers: [NotificationsController],
  exports: [NotificationsService, NotificationService],
})
export class NotificationsModule {}
