import { Test } from '@nestjs/testing';
import { RedisController } from './redis.controller';
import { RedisService } from './redis.service';

describe('RedisController', () => {
  let controller;
  let redisService;

  beforeEach(async () => {
    const mockRedisService = {
      getStats: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [RedisController],
      providers: [{ provide: RedisService, useValue: mockRedisService }],
    }).compile();

    controller = module.get(RedisController);
    redisService = module.get(RedisService);
  });

  describe('health', () => {
    it('should return Redis stats', () => {
      const stats = {
        connected: true,
        hits: 100,
        misses: 20,
        rateLimitedTotal: 5,
        zkVerifyOk: 50,
        zkVerifyErr: 2,
        zkScoreOk: 30,
        zkScoreErr: 1,
      };

      redisService.getStats.mockReturnValueOnce(stats);

      const result = controller.health();

      expect(result).toEqual(stats);
      expect(redisService.getStats).toHaveBeenCalled();
    });

    it('should return disconnected state', () => {
      const stats = {
        connected: false,
        hits: 0,
        misses: 0,
        rateLimitedTotal: 0,
        zkVerifyOk: 0,
        zkVerifyErr: 0,
        zkScoreOk: 0,
        zkScoreErr: 0,
      };

      redisService.getStats.mockReturnValueOnce(stats);

      const result = controller.health();

      expect(result.connected).toBe(false);
    });
  });

  describe('metrics', () => {
    it('should return Prometheus-format metrics when connected', () => {
      const stats = {
        connected: true,
        hits: 150,
        misses: 30,
        rateLimitedTotal: 8,
        zkVerifyOk: 75,
        zkVerifyErr: 3,
        zkScoreOk: 45,
        zkScoreErr: 2,
      };

      redisService.getStats.mockReturnValueOnce(stats);

      const result = controller.metrics();

      expect(result).toContain('redis_connected 1');
      expect(result).toContain('redis_cache_hits_total 150');
      expect(result).toContain('redis_cache_misses_total 30');
      expect(result).toContain('zk_rate_limited_total 8');
      expect(result).toContain('zk_verify_ok_total 75');
      expect(result).toContain('zk_verify_err_total 3');
      expect(result).toContain('zk_score_ok_total 45');
      expect(result).toContain('zk_score_err_total 2');
    });

    it('should return metrics with disconnected state', () => {
      const stats = {
        connected: false,
        hits: 200,
        misses: 50,
        rateLimitedTotal: 12,
        zkVerifyOk: 100,
        zkVerifyErr: 5,
        zkScoreOk: 60,
        zkScoreErr: 3,
      };

      redisService.getStats.mockReturnValueOnce(stats);

      const result = controller.metrics();

      expect(result).toContain('redis_connected 0');
      expect(result).toContain('redis_cache_hits_total 200');
    });

    it('should include HELP and TYPE metadata', () => {
      const stats = {
        connected: true,
        hits: 10,
        misses: 5,
        rateLimitedTotal: 1,
        zkVerifyOk: 8,
        zkVerifyErr: 0,
        zkScoreOk: 6,
        zkScoreErr: 0,
      };

      redisService.getStats.mockReturnValueOnce(stats);

      const result = controller.metrics();

      expect(result).toContain('# HELP redis_connected');
      expect(result).toContain('# TYPE redis_connected gauge');
      expect(result).toContain('# HELP redis_cache_hits_total');
      expect(result).toContain('# TYPE redis_cache_hits_total counter');
      expect(result).toContain('# HELP zk_verify_ok_total');
      expect(result).toContain('# TYPE zk_verify_ok_total counter');
    });

    it('should handle zero values correctly', () => {
      const stats = {
        connected: true,
        hits: 0,
        misses: 0,
        rateLimitedTotal: 0,
        zkVerifyOk: 0,
        zkVerifyErr: 0,
        zkScoreOk: 0,
        zkScoreErr: 0,
      };

      redisService.getStats.mockReturnValueOnce(stats);

      const result = controller.metrics();

      expect(result).toContain('redis_cache_hits_total 0');
      expect(result).toContain('redis_cache_misses_total 0');
      expect(result).toContain('zk_rate_limited_total 0');
    });
  });
});
