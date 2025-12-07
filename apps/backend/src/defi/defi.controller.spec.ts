import { DefiController } from './defi.controller';
import { DefiService } from './defi.service';
import { BlendYieldService } from './blend-yield.service';

describe('DefiController', () => {
  let controller: DefiController;
  let service: jest.Mocked<DefiService>;
  let blend: jest.Mocked<BlendYieldService>;

  beforeEach(() => {
    service = {
      stake: jest.fn(),
      unstake: jest.fn(),
      addLiquidity: jest.fn(),
      removeLiquidity: jest.fn(),
      flashLoanGuard: jest.fn(),
      loanByScore: jest.fn(),
    } as unknown as jest.Mocked<DefiService>;
    blend = {
      autoCompound: jest.fn(),
      findOptimalPool: jest.fn(),
      rebalancePortfolio: jest.fn(),
    } as unknown as jest.Mocked<BlendYieldService>;

    controller = new DefiController(service, blend);
  });

  it('delegates stake', async () => {
    const body: any = { poolId: 'p1', amount: 10 };
    service.stake.mockResolvedValue({ ok: true } as any);

    const res = await controller.stake(body);

    expect(service.stake).toHaveBeenCalledWith(body);
    expect(res).toEqual({ ok: true });
  });

  it('delegates blend autoCompound and findOptimalPool', async () => {
    blend.autoCompound.mockResolvedValue([{ poolId: 'p', status: 'SUCCESS' }] as any);
    blend.findOptimalPool.mockResolvedValue({ poolId: 'p', apy: 1 } as any);

    const ac = await controller.autoCompound({ userAddress: 'G1' } as any);
    const opt = await controller.findOptimalPool('USDC');

    expect(blend.autoCompound).toHaveBeenCalledWith('G1');
    expect(blend.findOptimalPool).toHaveBeenCalledWith('USDC');
    expect(ac).toEqual([{ poolId: 'p', status: 'SUCCESS' }]);
    expect(opt).toEqual({ poolId: 'p', apy: 1 });
  });
});
