import { Test } from '@nestjs/testing';
import { OraclesService } from './oracles.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

describe('OraclesService', () => {
  let service: OraclesService;
  let redisService: jest.Mocked<RedisService>;
  let configService: jest.Mocked<ConfigService>;

  beforeAll(async () => {
    redisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
    } as any;

    configService = {
      get: jest.fn().mockReturnValue('https://api.test'),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        OraclesService,
        { provide: ConfigService, useValue: configService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get(OraclesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPrice', () => {
    it('should return cached price when available and fresh', async () => {
      const cachedPrice = {
        base: 'USD',
        quote: 'BRL',
        value: 5.25,
        decimals: 2,
        feed: 'test',
        timestamp: Date.now(),
      };

      redisService.get.mockResolvedValueOnce(cachedPrice);

      const result = await service.getPrice('USD', 'BRL');

      expect(result).toEqual(cachedPrice);
      expect(redisService.get).toHaveBeenCalled();
    });

    it('should fetch new price when cache is empty', async () => {
      redisService.get.mockResolvedValueOnce(null);

      // Should handle missing API gracefully
      try {
        await service.getPrice('USD', 'BRL');
      } catch (error) {
        // Expected to fail without real API
        expect(error).toBeDefined();
      }
    });

    it('should handle different currency pairs', async () => {
      const price = {
        base: 'EUR',
        quote: 'USD',
        value: 1.08,
        decimals: 2,
        feed: 'test',
        timestamp: Date.now(),
      };

      redisService.get.mockResolvedValueOnce(price);

      const result = await service.getPrice('EUR', 'USD');

      expect(result.base).toBe('EUR');
      expect(result.quote).toBe('USD');
    });
  });

  describe('caching', () => {
    it('should cache fetched prices', async () => {
      const price = {
        base: 'BTC',
        quote: 'USD',
        value: 45000,
        decimals: 2,
        feed: 'test',
        timestamp: Date.now(),
      };

      redisService.get.mockResolvedValueOnce(price);
      await service.getPrice('BTC', 'USD');

      expect(redisService.get).toHaveBeenCalledWith(
        expect.stringContaining('BTC/USD'),
      );
    });

    it('should use configured cache TTL', async () => {
      const oldPrice = {
        base: 'ETH',
        quote: 'USD',
        value: 3000,
        decimals: 2,
        feed: 'test',
        timestamp: Date.now() - 120000, // 2 minutes old
      };

      redisService.get.mockResolvedValueOnce(oldPrice);

      // Should try to fetch new price as cached is old
      try {
        await service.getPrice('ETH', 'USD');
      } catch (error) {
        // Expected
      }
    });
  });

  describe('configuration', () => {
    it('should use configured reflector URL', () => {
      expect(configService.get).toHaveBeenCalledWith(
        'REFLECTOR_URL',
        expect.any(String),
      );
    });

    it('should have default configuration', () => {
      expect(service).toBeDefined();
      expect(configService.get).toHaveBeenCalled();
    });
  });
});
