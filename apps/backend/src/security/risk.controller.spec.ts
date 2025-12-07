import { RiskController } from './risk.controller';
import { SecurityService } from './security.service';

describe('SecurityRiskController', () => {
  let controller: RiskController;
  let service: jest.Mocked<SecurityService>;

  beforeEach(() => {
    service = {
      blockUser: jest.fn(),
      revokeSessions: jest.fn(),
      rotateTokens: jest.fn(),
      unblockUser: jest.fn(),
    } as unknown as jest.Mocked<SecurityService>;

    controller = new RiskController(service);
  });

  it('executa acoes configuradas', async () => {
    const body = {
      userId: 'u1',
      severity: 'high' as const,
      actions: ['block_user', 'revoke_sessions', 'rotate_tokens'],
      reason: 'anomaly',
    };

    const result = await controller.alert(body);

    expect(service.blockUser).toHaveBeenCalledWith('u1', 'anomaly');
    expect(service.revokeSessions).toHaveBeenCalledWith('u1');
    expect(service.rotateTokens).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ ok: true });
  });

  it('ignora acoes nao listadas', async () => {
    const body = { userId: 'u2', severity: 'low' as const, actions: [] };

    const result = await controller.alert(body as any);

    expect(service.blockUser).not.toHaveBeenCalled();
    expect(service.revokeSessions).not.toHaveBeenCalled();
    expect(service.rotateTokens).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });
});
