import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheService } from './cache.service';

jest.mock('ioredis');

describe('CacheService', () => {
  let service: CacheService;
  let mockConfigService: Partial<ConfigService>;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRedis = {
      on: jest.fn().mockReturnThis(),
      connect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
      setex: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
      smembers: jest.fn().mockResolvedValue([]),
      disconnect: jest.fn(),
    } as any;

    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => mockRedis);

    mockConfigService = {
      get: jest.fn((key: string, defaultVal: any) => {
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        return defaultVal;
      }),
    } as any;

    service = new CacheService(mockConfigService as ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('set stores value in memory cache', async () => {
    await service.set('test-key', { value: 123 }, 300);
    expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 300, JSON.stringify({ value: 123 }));
  });

  it('get retrieves from memory on hit', async () => {
    await service.set('test-key', 'cached-value', 300);
    mockRedis.get.mockResolvedValue(null); // L2 miss
    const result = await service.get('test-key');
    expect(result).toBe('cached-value');
  });

  it('remember callback loads data if cache misses', async () => {
    const callback = jest.fn().mockResolvedValue({ fresh: true });
    mockRedis.get.mockResolvedValue(null);
    const result = await service.remember('missing-key', 300, callback);
    expect(result).toEqual({ fresh: true });
    expect(callback).toHaveBeenCalled();
  });

  it('invalidate removes keys by pattern', async () => {
    mockRedis.keys.mockResolvedValue(['k1', 'k2', 'k3']);
    mockRedis.del.mockResolvedValue(3);
    const count = await service.invalidate('k*');
    expect(mockRedis.keys).toHaveBeenCalledWith('k*');
  });

  it('getStats returns cache statistics', () => {
    const stats = service.getStats();
    expect(stats).toHaveProperty('hits');
    expect(stats).toHaveProperty('misses');
    expect(stats).toHaveProperty('hitRate');
  });

  it('resetStats clears statistics', () => {
    service.resetStats();
    const stats = service.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
  });
});
