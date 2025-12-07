import { ForbiddenException } from '@nestjs/common';
import { ComplianceGuard } from './payments.guard';

const mockContext = (body: any = {}, query: any = {}) => ({
  switchToHttp: () => ({
    getRequest: () => ({ body, query }),
  }),
});

describe('ComplianceGuard (Payments)', () => {
  const compliance = { canRoutePixOrCard: jest.fn() } as any;

  beforeEach(() => jest.clearAllMocks());

  it('permite rota quando compliance libera', async () => {
    compliance.canRoutePixOrCard.mockResolvedValue({ ok: true, allowed: true });
    const guard = new ComplianceGuard(compliance);
    const ctx: any = mockContext({ userId: 'user-1' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(compliance.canRoutePixOrCard).toHaveBeenCalledWith('user-1');
  });

  it('falha quando userId não é informado', async () => {
    const guard = new ComplianceGuard(compliance);
    const ctx: any = mockContext({}, {});

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('falha quando compliance bloqueia', async () => {
    compliance.canRoutePixOrCard.mockResolvedValue({ ok: true, allowed: false });
    const guard = new ComplianceGuard(compliance);
    const ctx: any = mockContext({}, { userId: 'user-2' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
