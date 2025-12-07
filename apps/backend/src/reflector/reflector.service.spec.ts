import { of } from 'rxjs';
import { ReflectorService } from './reflector.service';

describe('ReflectorService', () => {
  const httpService = { get: jest.fn() } as any;
  const configService = { get: jest.fn((_, def) => def) } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('busca preço e reutiliza cache', async () => {
    httpService.get.mockReturnValueOnce(
      of({ data: { price: 10, last_update: 123 } }),
    );

    const service = new ReflectorService(httpService, configService);

    const first = await service.getPrice('XLM');
    const second = await service.getPrice('XLM');

    expect(first.price).toBe(10);
    expect(second).toEqual(first);
    expect(httpService.get).toHaveBeenCalledTimes(1);
  });

  it('usa cache expirado como fallback se a chamada falhar', async () => {
    const service = new ReflectorService(httpService, configService);
    const cacheKey = 'XLM:native';
    const cached = { symbol: 'XLM', price: 5, timestamp: 111, source: 'reflector' };
    (service as any).cache.set(cacheKey, { data: cached, expiresAt: Date.now() - 1 });

    httpService.get.mockImplementation(() => {
      throw new Error('network down');
    });

    const result = await service.getPrice('XLM');

    expect(result).toEqual(cached);
    expect(httpService.get).toHaveBeenCalledTimes(1);
  });
});
