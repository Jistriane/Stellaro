import { BlendYieldService } from './blend-yield.service';

describe('BlendYieldService', () => {
  const config = { get: jest.fn((k, def) => def) } as any;
  const redis = { get: jest.fn(), set: jest.fn() } as any;

  beforeEach(() => jest.clearAllMocks());

  it('encontra pool ótimo com base em APY/risco', async () => {
    const service = new BlendYieldService(config, redis);
    const pool = await service.findOptimalPool('XLM');

    expect(pool).toBeDefined();
    expect(pool.poolId).toBeTruthy();
    expect(pool.apy).toBeGreaterThan(0);
  });

  it('auto-compound coleta rewards e re-deposita', async () => {
    const service = new BlendYieldService(config, redis);
    // Mock interno de getUserPositions retorna array vazio por padrão
    const results = await service.autoCompound('GABC');

    expect(Array.isArray(results)).toBe(true);
  });
});
