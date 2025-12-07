import { ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

const mockContext = (headers: Record<string, string | undefined>) => ({
  switchToHttp: () => ({
    getRequest: () => ({ headers }),
  }),
});

describe('AdminGuard', () => {
  const originalEnv = process.env.ADMIN_TOKEN;

  beforeEach(() => {
    process.env.ADMIN_TOKEN = 'secret';
  });

  afterEach(() => {
    process.env.ADMIN_TOKEN = originalEnv;
  });

  it('permite quando o header corresponde ao token', () => {
    const guard = new AdminGuard();
    const ctx: any = mockContext({ 'x-admin-token': 'secret' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejeita quando o token está ausente ou inválido', () => {
    const guard = new AdminGuard();
    const ctx: any = mockContext({ 'x-admin-token': 'wrong' });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
