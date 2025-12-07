import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';

describe('SecurityController', () => {
  let controller: SecurityController;
  let service: jest.Mocked<SecurityService>;

  beforeEach(() => {
    service = {
      blockUser: jest.fn(),
      unblockUser: jest.fn(),
      revokeSessions: jest.fn(),
      rotateTokens: jest.fn(),
    } as unknown as jest.Mocked<SecurityService>;

    controller = new SecurityController(service);
  });

  it('blocks user with optional reason', async () => {
    service.blockUser.mockResolvedValue({ ok: true } as any);

    const result = await controller.block({ userId: 'u1', reason: 'fraud' });

    expect(service.blockUser).toHaveBeenCalledWith('u1', 'fraud');
    expect(result).toEqual({ ok: true });
  });

  it('unblocks user', async () => {
    service.unblockUser.mockResolvedValue({ ok: true } as any);

    const result = await controller.unblock({ userId: 'u2' });

    expect(service.unblockUser).toHaveBeenCalledWith('u2');
    expect(result).toEqual({ ok: true });
  });

  it('revokes sessions', async () => {
    service.revokeSessions.mockResolvedValue({ ok: true } as any);

    const result = await controller.revoke({ userId: 'u3' });

    expect(service.revokeSessions).toHaveBeenCalledWith('u3');
    expect(result).toEqual({ ok: true });
  });

  it('rotates tokens', async () => {
    service.rotateTokens.mockResolvedValue({ ok: true } as any);

    const result = await controller.rotate({ userId: 'u4' });

    expect(service.rotateTokens).toHaveBeenCalledWith('u4');
    expect(result).toEqual({ ok: true });
  });
});
