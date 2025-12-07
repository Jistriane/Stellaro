import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service;

  beforeEach(() => {
    service = new MetricsService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setRedisConnected', () => {
    it('should set connected state to 1', async () => {
      service.setRedisConnected(true);
      const metrics = await service.getMetrics();
      expect(metrics).toContain('redis_connected 1');
    });

    it('should set disconnected state to 0', async () => {
      service.setRedisConnected(false);
      const metrics = await service.getMetrics();
      expect(metrics).toContain('redis_connected 0');
    });
  });

  describe('incCacheHit', () => {
    it('should increment cache hits', async () => {
      service.incCacheHit();
      service.incCacheHit();
      const metrics = await service.getMetrics();
      expect(metrics).toContain('redis_cache_hits_total 2');
    });
  });

  describe('incCacheMiss', () => {
    it('should increment cache misses', async () => {
      service.incCacheMiss();
      const metrics = await service.getMetrics();
      expect(metrics).toContain('redis_cache_misses_total 1');
    });
  });

  describe('incRateLimited', () => {
    it('should increment rate limited counter', async () => {
      service.incRateLimited();
      service.incRateLimited();
      service.incRateLimited();
      const metrics = await service.getMetrics();
      expect(metrics).toContain('zk_rate_limited_total 3');
    });
  });

  describe('incZkVerify', () => {
    it('should increment ok counter when successful', async () => {
      service.incZkVerify(true);
      service.incZkVerify(true);
      const metrics = await service.getMetrics();
      expect(metrics).toContain('zk_verify_ok_total 2');
    });

    it('should increment error counter when failed', async () => {
      service.incZkVerify(false);
      const metrics = await service.getMetrics();
      expect(metrics).toContain('zk_verify_err_total 1');
    });

    it('should handle mixed success and failure', async () => {
      service.incZkVerify(true);
      service.incZkVerify(true);
      service.incZkVerify(false);
      const metrics = await service.getMetrics();
      expect(metrics).toContain('zk_verify_ok_total 2');
      expect(metrics).toContain('zk_verify_err_total 1');
    });
  });

  describe('incZkScore', () => {
    it('should increment ok counter when successful', async () => {
      service.incZkScore(true);
      service.incZkScore(true);
      service.incZkScore(true);
      const metrics = await service.getMetrics();
      expect(metrics).toContain('zk_score_ok_total 3');
    });

    it('should increment error counter when failed', async () => {
      service.incZkScore(false);
      service.incZkScore(false);
      const metrics = await service.getMetrics();
      expect(metrics).toContain('zk_score_err_total 2');
    });
  });

  describe('observeZkVerifyDuration', () => {
    it('should record verification duration', async () => {
      service.observeZkVerifyDuration(0.15);
      service.observeZkVerifyDuration(0.25);
      const metrics = await service.getMetrics();
      expect(metrics).toContain('zk_verify_duration_seconds');
      expect(metrics).toContain('zk_verify_duration_seconds_count 2');
    });

    it('should record fast verification', async () => {
      service.observeZkVerifyDuration(0.005);
      const metrics = await service.getMetrics();
      expect(metrics).toContain('zk_verify_duration_seconds_count 1');
    });
  });

  describe('observeZkScoreDuration', () => {
    it('should record score fetch duration', async () => {
      service.observeZkScoreDuration(0.1);
      service.observeZkScoreDuration(0.3);
      const metrics = await service.getMetrics();
      expect(metrics).toContain('zk_score_duration_seconds');
      expect(metrics).toContain('zk_score_duration_seconds_count 2');
    });

    it('should record slow score fetch', async () => {
      service.observeZkScoreDuration(1.5);
      const metrics = await service.getMetrics();
      expect(metrics).toContain('zk_score_duration_seconds_count 1');
    });
  });

  describe('getMetrics', () => {
    it('should return Prometheus format metrics', async () => {
      service.setRedisConnected(true);
      service.incCacheHit();
      service.incZkVerify(true);
      
      const metrics = await service.getMetrics();
      
      expect(typeof metrics).toBe('string');
      expect(metrics).toContain('# HELP');
      expect(metrics).toContain('# TYPE');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should include all metric types', async () => {
      service.setRedisConnected(true);
      service.incCacheHit();
      service.incCacheMiss();
      service.incRateLimited();
      service.incZkVerify(true);
      service.incZkScore(false);
      service.observeZkVerifyDuration(0.1);
      
      const metrics = await service.getMetrics();
      
      expect(metrics).toContain('redis_connected');
      expect(metrics).toContain('redis_cache_hits_total');
      expect(metrics).toContain('redis_cache_misses_total');
      expect(metrics).toContain('zk_rate_limited_total');
      expect(metrics).toContain('zk_verify_ok_total');
      expect(metrics).toContain('zk_score_err_total');
      expect(metrics).toContain('zk_verify_duration_seconds');
    });
  });
});
