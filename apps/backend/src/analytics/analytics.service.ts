import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private cache: RedisService,
  ) {}

  private key(k: string) {
    return `dash:${k}`;
  }

  async getOverview() {
    // Redis-first; fallback DB
    const cached = await this.cache.get<any>(this.key('overview'));
    if (cached) return cached;

    // Fallback simples lendo snapshots mais recentes
    const snap = await this.prisma.dashboardSnapshot.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    const data = {
      tvl: snap.find((s) => s.key === 'tvl')?.value ?? null,
      volume24h: snap.find((s) => s.key === 'volume24h')?.value ?? null,
      mintBurnRatio:
        snap.find((s) => s.key === 'mint_burn_ratio')?.value ?? null,
    };
    await this.cache.set(this.key('overview'), data, 15);
    return data;
  }

  async getStablecoin(contractId: string) {
    const cacheKey = this.key(`stablecoin:${contractId}`);
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const rows = await this.prisma.ledgerMirror.findMany({
      where: { scope: `stablecoin:${contractId}` },
    });
    const obj: Record<string, any> = {};
    for (const r of rows) obj[r.key] = r.value;
    await this.cache.set(cacheKey, obj, 10);
    return obj;
  }
}
