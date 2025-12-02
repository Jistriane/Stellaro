import { Controller, Get, Header } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('redis')
export class RedisController {
  constructor(private readonly redis: RedisService) {}

  @Get('health')
  health() {
    return this.redis.getStats();
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  metrics(): string {
    const s = this.redis.getStats();
    return [
      `# HELP redis_connected Whether Redis client is connected (1=yes,0=no)`,
      `# TYPE redis_connected gauge`,
      `redis_connected ${s.connected ? 1 : 0}`,
      `# HELP redis_cache_hits_total Total cache hits`,
      `# TYPE redis_cache_hits_total counter`,
      `redis_cache_hits_total ${s.hits}`,
      `# HELP redis_cache_misses_total Total cache misses`,
      `# TYPE redis_cache_misses_total counter`,
      `redis_cache_misses_total ${s.misses}`,
      `# HELP zk_rate_limited_total Total times ZK verify was rate-limited`,
      `# TYPE zk_rate_limited_total counter`,
      `zk_rate_limited_total ${s.rateLimitedTotal}`,
      `# HELP zk_verify_ok_total Successful ZK verifications`,
      `# TYPE zk_verify_ok_total counter`,
      `zk_verify_ok_total ${s.zkVerifyOk}`,
      `# HELP zk_verify_err_total Failed ZK verifications`,
      `# TYPE zk_verify_err_total counter`,
      `zk_verify_err_total ${s.zkVerifyErr}`,
      `# HELP zk_score_ok_total Successful score fetches`,
      `# TYPE zk_score_ok_total counter`,
      `zk_score_ok_total ${s.zkScoreOk}`,
      `# HELP zk_score_err_total Failed score fetches`,
      `# TYPE zk_score_err_total counter`,
      `zk_score_err_total ${s.zkScoreErr}`,
    ].join('\n');
  }
}
