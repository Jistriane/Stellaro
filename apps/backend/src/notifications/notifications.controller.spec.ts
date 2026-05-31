import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { HttpException } from '@nestjs/common';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;

  beforeEach(() => {
    service = {
      send: jest.fn(),
    } as unknown as jest.Mocked<NotificationsService>;
    controller = new NotificationsController(service);
  });

  it('envia notificacao quando payload eh valido', async () => {
    service.send.mockResolvedValue({ ok: true } as any);

    const res = await controller.send({
      channel: 'email',
      to: 'a@b',
      subject: 's',
      message: 'm',
    } as any);

    expect(service.send).toHaveBeenCalledWith('email', 'a@b', 's', 'm');
    expect(res).toEqual({ ok: true });
  });

  it('rejeita payload invalido', async () => {
    await expect(
      controller.send({
        channel: 'email',
        to: '',
        subject: '',
        message: '',
      } as any),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
