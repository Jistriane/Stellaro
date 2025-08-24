import { Injectable } from '@nestjs/common';

export type NotificationChannel = 'email' | 'telegram' | 'whatsapp' | 'push';

@Injectable()
export class NotificationsService {
  async send(
    channel: NotificationChannel,
    to: string,
    subject: string,
    message: string,
  ) {
    // Stubs de envio; integrar provedores reais depois
    return { ok: true, channel, to, subject, message };
  }
}
