import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Registry, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;

  // Gauge
  private readonly redisConnected: Gauge<string>;

  // Counters
  private readonly cacheHits: Counter<string>;
  private readonly cacheMisses: Counter<string>;
  private readonly rateLimited: Counter<string>;
  private readonly zkVerifyOk: Counter<string>;
  private readonly zkVerifyErr: Counter<string>;
  private readonly zkScoreOk: Counter<string>;
  private readonly zkScoreErr: Counter<string>;

  // Histograms
  private readonly zkVerifyDuration: Histogram<string>;
  private readonly zkScoreDuration: Histogram<string>;

  constructor() {
    this.registry = new Registry();

    // Connection gauge
    this.redisConnected = new Gauge({
      name: 'redis_connected',
      help: 'Whether Redis client is connected (1=yes, 0=no)',
      registers: [this.registry],
    });

    // Cache counters
    this.cacheHits = new Counter({
      name: 'redis_cache_hits_total',
      help: 'Total cache hits',
      registers: [this.registry],
    });

    this.cacheMisses = new Counter({
      name: 'redis_cache_misses_total',
      help: 'Total cache misses',
      registers: [this.registry],
    });

    this.rateLimited = new Counter({
      name: 'zk_rate_limited_total',
      help: 'Total times ZK verify was rate-limited',
      registers: [this.registry],
    });

    // ZK counters
    this.zkVerifyOk = new Counter({
      name: 'zk_verify_ok_total',
      help: 'Successful ZK verifications',
      registers: [this.registry],
    });

    this.zkVerifyErr = new Counter({
      name: 'zk_verify_err_total',
      help: 'Failed ZK verifications',
      registers: [this.registry],
    });

    this.zkScoreOk = new Counter({
      name: 'zk_score_ok_total',
      help: 'Successful score fetches',
      registers: [this.registry],
    });

    this.zkScoreErr = new Counter({
      name: 'zk_score_err_total',
      help: 'Failed score fetches',
      registers: [this.registry],
    });

    // Latency histograms
    this.zkVerifyDuration = new Histogram({
      name: 'zk_verify_duration_seconds',
      help: 'ZK verify endpoint latency in seconds',
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });

    this.zkScoreDuration = new Histogram({
      name: 'zk_score_duration_seconds',
      help: 'ZK score endpoint latency in seconds',
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });
  }

  setRedisConnected(connected: boolean) {
    this.redisConnected.set(connected ? 1 : 0);
  }

  incCacheHit() {
    this.cacheHits.inc();
  }

  incCacheMiss() {
    this.cacheMisses.inc();
  }

  incRateLimited() {
    this.rateLimited.inc();
  }

  incZkVerify(ok: boolean) {
    if (ok) this.zkVerifyOk.inc();
    else this.zkVerifyErr.inc();
  }

  incZkScore(ok: boolean) {
    if (ok) this.zkScoreOk.inc();
    else this.zkScoreErr.inc();
  }

  observeZkVerifyDuration(durationSeconds: number) {
    this.zkVerifyDuration.observe(durationSeconds);
  }

  observeZkScoreDuration(durationSeconds: number) {
    this.zkScoreDuration.observe(durationSeconds);
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
