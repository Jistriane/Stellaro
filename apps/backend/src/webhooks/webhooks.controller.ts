import { Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, WebhookSource } from '@prisma/client';
import { Request } from 'express';

@Controller()
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('webhooks/pix')
  @HttpCode(200)
  async pix(
    @Body() body: unknown,
    @Headers() headers: Record<string, string>,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    const signature = headers['x-webhook-signature'] || headers['x-signature'];
    const eventId = (
      headers['x-event-id'] ||
      headers['x-request-id'] ||
      ''
    ).toString();
    this.webhooksService.verifySignature(
      req?.rawBody ?? body,
      typeof signature === 'string' ? signature : undefined,
    );
    await this.saveEvent(WebhookSource.celcoin, eventId, body, headers);
    return { received: true };
  }

  @Post('webhooks/cards')
  @HttpCode(200)
  async cards(
    @Body() body: unknown,
    @Headers() headers: Record<string, string>,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    const signature = headers['x-webhook-signature'] || headers['x-signature'];
    const eventId = (
      headers['x-event-id'] ||
      headers['x-request-id'] ||
      ''
    ).toString();
    this.webhooksService.verifySignature(
      req?.rawBody ?? body,
      typeof signature === 'string' ? signature : undefined,
    );
    await this.saveEvent(WebhookSource.dock, eventId, body, headers);
    return { received: true };
  }

  @Post('kyc/webhook')
  @HttpCode(200)
  async kyc(
    @Body() body: unknown,
    @Headers() headers: Record<string, string>,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    const signature = headers['x-webhook-signature'] || headers['x-signature'];
    const eventId = (
      headers['x-event-id'] ||
      headers['x-request-id'] ||
      ''
    ).toString();
    this.webhooksService.verifySignature(
      req?.rawBody ?? body,
      typeof signature === 'string' ? signature : undefined,
    );
    await this.saveEvent(WebhookSource.sumsub, eventId, body, headers);
    return { received: true };
  }

  private async saveEvent(
    source: WebhookSource,
    eventId: string,
    body: unknown,
    headers: Record<string, string>,
  ) {
    try {
      await this.prisma.webhookEvent.create({
        data: {
          source,
          eventId: eventId || `evt_${Date.now()}`,
          signature: (
            headers['x-webhook-signature'] ||
            headers['x-signature'] ||
            ''
          ).toString(),
          payload: { headers, body } as Prisma.InputJsonValue,
        },
      });
    } catch (e: unknown) {
      // Ignore unique constraint error (idempotency)
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      )
        return;
      throw e;
    }
  }
}
