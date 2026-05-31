import { PasskeyController } from './passkey.controller';
import { PasskeyService } from './passkey.service';

describe('PasskeyController', () => {
  let controller: PasskeyController;
  let service: jest.Mocked<PasskeyService>;

  beforeEach(() => {
    service = {
      initRegistration: jest.fn(),
      verifyRegistration: jest.fn(),
      initLogin: jest.fn(),
      verifyLogin: jest.fn(),
      initTx: jest.fn(),
      verifyTx: jest.fn(),
      initMfa: jest.fn(),
      verifyMfa: jest.fn(),
      getMfaStatus: jest.fn(),
      clearMfa: jest.fn(),
      revokeUserSessions: jest.fn(),
    } as unknown as jest.Mocked<PasskeyService>;

    controller = new PasskeyController(service);
  });

  it('inicia registro e verifica', async () => {
    const init = { challenge: 'c1' } as any;
    service.initRegistration.mockResolvedValue(init);
    service.verifyRegistration.mockResolvedValue({ ok: true } as any);

    const initResult = await controller.initReg({ userId: 'u1', email: 'a@b' });
    const verifyResult = await controller.verifyReg({ challenge: 'c1' });

    expect(service.initRegistration).toHaveBeenCalledWith('u1', 'a@b');
    expect(service.verifyRegistration).toHaveBeenCalledWith({
      challenge: 'c1',
    });
    expect(initResult).toBe(init);
    expect(verifyResult).toEqual({ ok: true });
  });

  it('forwards MFA status and clear', async () => {
    service.getMfaStatus.mockResolvedValue({
      ok: true,
      remainingMs: 10,
    } as any);
    service.clearMfa.mockResolvedValue({ ok: true } as any);

    const status = await controller.mfaStatus('u2');
    const cleared = await controller.mfaClear({ userId: 'u2' });

    expect(service.getMfaStatus).toHaveBeenCalledWith('u2');
    expect(service.clearMfa).toHaveBeenCalledWith('u2');
    expect(status).toEqual({ ok: true, remainingMs: 10 });
    expect(cleared).toEqual({ ok: true });
  });
});
