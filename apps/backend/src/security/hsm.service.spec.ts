import { HsmService } from './hsm.service';

describe('HsmService', () => {
  it('retorna assinatura stub para operação', async () => {
    const hsm = new HsmService();
    const res = await hsm.signOperation({ type: 'transfer', payload: { amount: 10 } });

    expect(res).toEqual({ ok: true, signature: 'hsm_stub_signature' });
  });
});
