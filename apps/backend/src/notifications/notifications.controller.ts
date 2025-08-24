import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  NotificationsService,
  NotificationChannel,
} from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('send')
  async send(
    @Body()
    body: {
      channel: NotificationChannel;
      to: string;
      subject: string;
      message: string;
    },
  ) {
    if (!body?.channel || !body.to || !body.subject || !body.message) {
      throw new HttpException(
        'channel, to, subject, message são obrigatórios',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.notifications.send(
      body.channel,
      body.to,
      body.subject,
      body.message,
    );
  }
}
