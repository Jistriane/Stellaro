import { Injectable } from '@nestjs/common';
import { HorizonService } from '../../chain/horizon.service';
import { SorobanService } from '../../chain/soroban.service';
import { RedisService } from '../../redis/redis.service';
import axios from 'axios';

type Position = {
  asset: string;
  balance: string;
  valueUSD: number;
  apy?: number;
  poolId?: string;
};

@Injectable()
export class BlendPositionsService {
  constructor(
    private readonly horizon: HorizonService,
    private readonly soroban: SorobanService,
    private readonly redis: RedisService,
  ) {}

  async getPositions(address: string, quote = 'USD') {
    const cacheKey = `defi:blend:positions:${address}:${quote}`;
    const cached = await this.redis.get<{ address: string; positions: Position[]; totalUSD: number }>(cacheKey);
    if (cached) return cached;
    const account = await this.horizon.getAccount(address);
    const balances: Array<{ asset_type: string; asset_code?: string; balance: string }> = account?.balances || [];

    const backendUrl = process.env.BACKEND_PUBLIC_URL || process.env.BACKEND_URL || 'http://localhost:3001';
    const priceClient = axios.create({ baseURL: backendUrl, timeout: 8000 });

    const positions: Position[] = [];
    for (const b of balances) {
      const asset = b.asset_type === 'native' ? 'XLM' : `${b.asset_code}`;
      let price = 0;
      try {
        const { data } = await priceClient.get('/oracles/price', { params: { asset, quote } });
        price = Number(data?.price || 0);
      } catch {}
      const balanceNum = parseFloat(b.balance || '0');
      positions.push({ asset, balance: b.balance, valueUSD: balanceNum * price });
    }

    // Optional enrichment based on contract configuration
    const loansPoolId = process.env.LOANS_POOL_CONTRACT_ID;
    const interestBpsEnv = process.env.LOANSPOOL_INTEREST_BPS;
    const interestBps = interestBpsEnv ? Number(interestBpsEnv) : undefined; // e.g., 1500 = 15.00%
    if (loansPoolId) {
      for (const p of positions) {
        p.poolId = loansPoolId;
        if (typeof interestBps === 'number' && !Number.isNaN(interestBps)) {
          // Representa APY em bps (basis points) ou percentual simplificado
          // Aqui mantemos como percentual: 1500 -> 15.00
          p.apy = Math.round((interestBps / 100) * 100) / 100;
        }
      }
    }

    const totalUSD = positions.reduce((sum, p) => sum + (p.valueUSD || 0), 0);
    const result = { address, positions, totalUSD };
    await this.redis.set(cacheKey, result, 15); // cache por 15s para aliviar load
    return result;
  }
}
