import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { SessionGuard } from './session.guard';

const mockContext = (headers: Record<string, string | undefined>) => {
  const req: any = { headers };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  };
};

describe('SessionGuard', () => {
  const redis = {
    get: jest.fn(),
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('autoriza sessão válida e injeta req.user', async () => {
    redis.get
      .mockResolvedValueOnce({ userId: 'u1' })
      .mockResolvedValueOnce(null); // nenhum bloqueio

    const guard = new SessionGuard(redis);
    const ctx: any = mockContext({ authorization: 'Bearer token-123' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(redis.get).toHaveBeenNthCalledWith(1, 'sess:token-123');
    expect(redis.get).toHaveBeenNthCalledWith(2, 'block:user:u1');
    expect(ctx.switchToHttp().getRequest().user).toEqual({
      id: 'u1',
      token: 'token-123',
    });
  });

  it('rejeita quando bearer está ausente', async () => {
    const guard = new SessionGuard(redis);
    const ctx: any = mockContext({});

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejeita quando a sessão não existe', async () => {
    redis.get.mockResolvedValueOnce(null);
    const guard = new SessionGuard(redis);
    const ctx: any = mockContext({ authorization: 'Bearer missing' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejeita quando o usuário está bloqueado', async () => {
    redis.get
      .mockResolvedValueOnce({ userId: 'u1' })
      .mockResolvedValueOnce({ reason: 'fraud' });

    const guard = new SessionGuard(redis);
    const ctx: any = mockContext({ authorization: 'Bearer token-123' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
