import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: jest.Mocked<PrismaService>;
  let cache: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: {
            dashboardSnapshot: {
              findMany: jest.fn(),
            },
            ledgerMirror: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get(PrismaService);
    cache = module.get(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return cached overview if available', async () => {
      const cachedData = {
        tvl: '1000000',
        volume24h: '500000',
        mintBurnRatio: 0.95,
      };
      cache.get.mockResolvedValueOnce(cachedData);

      const result = await service.getOverview();

      expect(result).toEqual(cachedData);
      expect(cache.get).toHaveBeenCalledWith('dash:overview');
      expect(prisma.dashboardSnapshot.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database if cache miss', async () => {
      const snapshots = [
        { key: 'tvl', value: '2000000', createdAt: new Date() },
        { key: 'volume24h', value: '600000', createdAt: new Date() },
        { key: 'mint_burn_ratio', value: 0.98, createdAt: new Date() },
      ];
      cache.get.mockResolvedValueOnce(null);
      prisma.dashboardSnapshot.findMany.mockResolvedValueOnce(snapshots as any);

      const result = await service.getOverview();

      expect(result.tvl).toBe('2000000');
      expect(result.volume24h).toBe('600000');
      expect(result.mintBurnRatio).toBe(0.98);
      expect(cache.set).toHaveBeenCalledWith(
        'dash:overview',
        expect.any(Object),
        15,
      );
    });

    it('should handle missing snapshot keys gracefully', async () => {
      cache.get.mockResolvedValueOnce(null);
      prisma.dashboardSnapshot.findMany.mockResolvedValueOnce([]);

      const result = await service.getOverview();

      expect(result.tvl).toBeNull();
      expect(result.volume24h).toBeNull();
      expect(result.mintBurnRatio).toBeNull();
    });
  });

  describe('getStablecoin', () => {
    it('should return cached stablecoin data if available', async () => {
      const contractId = 'CONTRACT_123';
      const cachedData = { supply: '5000000', balance: '1000000' };
      cache.get.mockResolvedValueOnce(cachedData);

      const result = await service.getStablecoin(contractId);

      expect(result).toEqual(cachedData);
      expect(cache.get).toHaveBeenCalledWith(`dash:stablecoin:${contractId}`);
      expect(prisma.ledgerMirror.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database if cache miss', async () => {
      const contractId = 'CONTRACT_456';
      const ledgerRows = [
        { key: 'supply', value: '3000000', scope: `stablecoin:${contractId}` },
        { key: 'burned', value: '500000', scope: `stablecoin:${contractId}` },
      ];
      cache.get.mockResolvedValueOnce(null);
      prisma.ledgerMirror.findMany.mockResolvedValueOnce(ledgerRows as any);

      const result = await service.getStablecoin(contractId);

      expect(result.supply).toBe('3000000');
      expect(result.burned).toBe('500000');
      expect(cache.set).toHaveBeenCalledWith(
        `dash:stablecoin:${contractId}`,
        expect.any(Object),
        10,
      );
    });

    it('should return empty object for non-existent stablecoin', async () => {
      const contractId = 'INVALID_ID';
      cache.get.mockResolvedValueOnce(null);
      prisma.ledgerMirror.findMany.mockResolvedValueOnce([]);

      const result = await service.getStablecoin(contractId);

      expect(result).toEqual({});
    });

    it('should handle multiple ledger entries correctly', async () => {
      const contractId = 'MULTI_CONTRACT';
      const ledgerRows = [
        { key: 'supply', value: '5000000', scope: `stablecoin:${contractId}` },
        { key: 'burned', value: '1000000', scope: `stablecoin:${contractId}` },
        { key: 'minted', value: '2000000', scope: `stablecoin:${contractId}` },
        { key: 'fees', value: '50000', scope: `stablecoin:${contractId}` },
      ];
      cache.get.mockResolvedValueOnce(null);
      prisma.ledgerMirror.findMany.mockResolvedValueOnce(ledgerRows as any);

      const result = await service.getStablecoin(contractId);

      expect(Object.keys(result).length).toBe(4);
      expect(result.supply).toBe('5000000');
      expect(result.burned).toBe('1000000');
      expect(result.minted).toBe('2000000');
      expect(result.fees).toBe('50000');
    });
  });
});
