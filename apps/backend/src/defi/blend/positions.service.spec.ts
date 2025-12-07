import { NotFoundException } from '@nestjs/common';
import { BlendPositionsService } from './positions.service';

describe('BlendPositionsService', () => {
  const horizon = { getAccount: jest.fn() } as any;
  const soroban = { getLoansPoolParams: jest.fn() } as any;
  const redis = { get: jest.fn(), set: jest.fn() } as any;

  beforeEach(() => jest.clearAllMocks());

  it('retorna posições do usuário e cacheia resultado', async () => {
    redis.get.mockResolvedValue(null);
    horizon.getAccount.mockResolvedValue({
      balances: [{ asset_type: 'native', balance: '100' }],
    });
    soroban.getLoansPoolParams.mockResolvedValue({ interest_bps: 1500 });
    process.env.LOANS_POOL_CONTRACT_ID = 'pool123';

    const service = new BlendPositionsService(horizon, soroban, redis);
    const result = await service.getPositions('GABC');

    expect(result.positions.length).toBeGreaterThan(0);
    expect(redis.set).toHaveBeenCalled();
  });

  it('lança NotFoundException se conta não existir', async () => {
    redis.get.mockResolvedValue(null);
    horizon.getAccount.mockRejectedValue({ response: { status: 404 } });

    const service = new BlendPositionsService(horizon, soroban, redis);

    await expect(service.getPositions('GABC')).rejects.toBeInstanceOf(NotFoundException);
  });
});
