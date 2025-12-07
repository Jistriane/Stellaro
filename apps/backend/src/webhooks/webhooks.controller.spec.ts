import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookSource } from '@prisma/client';

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let service: jest.Mocked<WebhooksService>;
  let prisma: { webhookEvent: { create: jest.Mock } };

  beforeEach(() => {
    service = { verifySignature: jest.fn() } as unknown as jest.Mocked<WebhooksService>;
    prisma = { webhookEvent: { create: jest.fn() } } as any;
    controller = new WebhooksController(service, prisma as unknown as PrismaService);
  });

  it('processes PIX webhook using raw body and stores event', async () => {
    const rawBody = Buffer.from('body');
    prisma.webhookEvent.create.mockResolvedValue({ id: '1' });

    const result = await controller.pix(
      { sample: true },
      { 'x-webhook-signature': 'sig-123', 'x-event-id': 'evt-1' },
      { rawBody } as any,
    );

    expect(service.verifySignature).toHaveBeenCalledWith(rawBody, 'sig-123');
    expect(prisma.webhookEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ source: WebhookSource.celcoin, eventId: 'evt-1' }),
      }),
    );
    expect(result).toEqual({ received: true });
  });

  it('ignores duplicate events (P2002) and still returns received', async () => {
    const error: any = new Error('Unique constraint failed');
    error.code = 'P2002';
    prisma.webhookEvent.create.mockRejectedValue(error);

    const result = await controller.cards(
      { value: 1 },
      { 'x-signature': 'sig-2', 'x-request-id': 'req-2' },
      { rawBody: undefined } as any,
    );

    expect(service.verifySignature).toHaveBeenCalledWith({ value: 1 }, 'sig-2');
    expect(result).toEqual({ received: true });
  });
});
