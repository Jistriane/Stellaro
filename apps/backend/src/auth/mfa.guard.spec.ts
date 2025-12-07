import { ForbiddenException } from '@nestjs/common';
import { MfaGuard } from './mfa.guard';

const mockContext = (req: any) => ({
  switchToHttp: () => ({
    getRequest: () => req,
  }),
});

describe('MfaGuard', () => {
  const redis = { get: jest.fn() } as any;

  beforeEach(() => jest.clearAllMocks());

  it('permite quando usuário possui MFA liberada', async () => {
    redis.get.mockResolvedValue({ ok: true, ts: Date.now() });
    const guard = new MfaGuard(redis);
    const ctx: any = mockContext({ user: { id: 'u1' } });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(redis.get).toHaveBeenCalledWith('mfa:ok:u1');
  });

  it('falha quando req.user está ausente', async () => {
    const guard = new MfaGuard(redis);
    const ctx: any = mockContext({});

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('falha quando não há flag de MFA', async () => {
    redis.get.mockResolvedValue(null);
    const guard = new MfaGuard(redis);
    const ctx: any = mockContext({ user: { id: 'u1' } });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
