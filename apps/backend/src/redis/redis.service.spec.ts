import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';

// Testes para paths de fallback em memória e métricas
describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    delete process.env.REDIS_URL;
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fallback in-memory mode', () => {
    it('should set and get value from memory', async () => {
      await service.set('test-key', { foo: 'bar' }, 60);
      const val = await service.get<{ foo: string }>('test-key');

      expect(val).toEqual({ foo: 'bar' });
    });

    it('should return null for missing key', async () => {
      const val = await service.get('missing-key');
      expect(val).toBeNull();
    });

    it('should delete key from memory', async () => {
      await service.set('del-key', { test: true }, 60);
      const deleted = await service.del('del-key');
      expect(deleted).toBe(1);

      const val = await service.get('del-key');
      expect(val).toBeNull();
    });

    it('should publish to memory (no-op in fallback)', async () => {
      const res = await service.publish('channel', { event: 'test' });
      expect(res).toBe(0); // fallback retorna 0
    });
  });

  describe('stats', () => {
    it('should track hits and misses', async () => {
      await service.get('miss-1'); // miss
      await service.set('hit-1', { val: 1 }, 60);
      await service.get('hit-1'); // hit

      const stats = service.getStats();
      expect(stats.hits).toBeGreaterThanOrEqual(1);
      expect(stats.misses).toBeGreaterThanOrEqual(1);
    });

    it('should track rate limit events', () => {
      service.incRateLimited();
      const stats = service.getStats();
      expect(stats.rateLimitedTotal).toBeGreaterThanOrEqual(1);
    });

    it('should track ZK verify events', () => {
      service.incZkVerify(true);
      service.incZkVerify(false);
      const stats = service.getStats();
      expect(stats.zkVerifyOk).toBeGreaterThanOrEqual(1);
      expect(stats.zkVerifyErr).toBeGreaterThanOrEqual(1);
    });

    it('should track ZK score events', () => {
      service.incZkScore(true);
      service.incZkScore(false);
      const stats = service.getStats();
      expect(stats.zkScoreOk).toBeGreaterThanOrEqual(1);
      expect(stats.zkScoreErr).toBeGreaterThanOrEqual(1);
    });

    it('should report stats in fallback mode', () => {
      const stats = service.getStats();
      expect(stats.connected).toBe(false);
      expect(stats.memoryItems).toBeGreaterThanOrEqual(0);
    });
  });
});
