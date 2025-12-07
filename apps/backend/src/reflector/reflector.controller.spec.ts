import { ReflectorController } from './reflector.controller';
import { ReflectorService } from './reflector.service';

describe('ReflectorController', () => {
  let controller: ReflectorController;
  let service: jest.Mocked<ReflectorService>;

  beforeEach(() => {
    service = {
      getPrice: jest.fn(),
      getPrices: jest.fn(),
      getUsdValue: jest.fn(),
      getHistoricalPrices: jest.fn(),
      clearCache: jest.fn(),
      getCacheStats: jest.fn(),
    } as unknown as jest.Mocked<ReflectorService>;

    controller = new ReflectorController(service);
  });

  it('retorna preco unico', async () => {
    service.getPrice.mockResolvedValue({ asset: 'XLM', price: 0.1 } as any);

    const res = await controller.getPrice('XLM', 'issuer');

    expect(service.getPrice).toHaveBeenCalledWith('XLM', 'issuer');
    expect(res).toEqual({ asset: 'XLM', price: 0.1 });
  });

  it('mapeia lista de precos de map para objeto', async () => {
    const priceMap = new Map<string, any>([
      ['XLM', { asset: 'XLM', price: 0.1 }],
      ['USDC', { asset: 'USDC', price: 1 }],
    ]);
    service.getPrices.mockResolvedValue(priceMap as any);

    const res = await controller.getPrices('XLM,USDC');

    expect(service.getPrices).toHaveBeenCalledWith(['XLM', 'USDC']);
    expect(res).toEqual({ XLM: { asset: 'XLM', price: 0.1 }, USDC: { asset: 'USDC', price: 1 } });
  });

  it('retorna historico e limpa cache', async () => {
    service.getHistoricalPrices.mockResolvedValue([{ price: 1 }] as any);
    service.getCacheStats.mockResolvedValue({ size: 1, keys: ['a'] } as any);

    const hist = await controller.getHistoricalPrices('XLM', '1', '2');
    const stats = await controller.getCacheStats();
    const clear = await controller.clearCache();

    expect(service.getHistoricalPrices).toHaveBeenCalledWith('XLM', 1, 2);
    expect(hist).toEqual([{ price: 1 }]);
    expect(stats).toEqual({ size: 1, keys: ['a'] });
    expect(service.clearCache).toHaveBeenCalledTimes(1);
    expect(clear).toBeUndefined();
  });
});
