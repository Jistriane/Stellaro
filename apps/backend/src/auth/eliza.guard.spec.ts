import { ForbiddenException } from '@nestjs/common';
import { ElizaGuard } from './eliza.guard';

const mockContext = (headers: Record<string, string | undefined>) => ({
  switchToHttp: () => ({
    getRequest: () => ({ headers }),
  }),
});

describe('ElizaGuard', () => {
  const original = process.env.ELIZA_WEBHOOK_SECRET;

  afterEach(() => {
    process.env.ELIZA_WEBHOOK_SECRET = original;
  });

  it('permite quando o segredo corresponde', async () => {
    process.env.ELIZA_WEBHOOK_SECRET = 'hook-secret';
    const guard = new ElizaGuard();
    const ctx: any = mockContext({ 'x-eliza-secret': 'hook-secret' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('falha quando o segredo não está configurado', async () => {
    delete process.env.ELIZA_WEBHOOK_SECRET;
    const guard = new ElizaGuard();
    const ctx: any = mockContext({});

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('falha quando o header é inválido', async () => {
    process.env.ELIZA_WEBHOOK_SECRET = 'hook-secret';
    const guard = new ElizaGuard();
    const ctx: any = mockContext({ 'x-eliza-secret': 'wrong' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
