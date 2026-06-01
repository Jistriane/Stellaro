import { Injectable, NotFoundException } from '@nestjs/common';
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
  private poolParamsCache: { params: any; timestamp: number } | null = null;
  private readonly POOL_PARAMS_CACHE_TTL = 300000; // 5 minutos

  constructor(
    private readonly horizon: HorizonService,
    private readonly soroban: SorobanService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Obtém parâmetros do LoansPool com cache de 5 minutos
   */
  private async getPoolParams(): Promise<{
    interest_bps?: number;
    poolId?: string;
  }> {
    const now = Date.now();

    // Verificar cache em memória
    if (
      this.poolParamsCache &&
      now - this.poolParamsCache.timestamp < this.POOL_PARAMS_CACHE_TTL
    ) {
      return this.poolParamsCache.params;
    }

    const loansPoolId =
      process.env.LOANSPOOL_CONTRACT_ID ?? process.env.LOANS_POOL_CONTRACT_ID;
    if (!loansPoolId) {
      return {};
    }

    try {
      // Tentar ler do contrato via Soroban
      const params = await this.soroban.getLoansPoolParams(loansPoolId);
      const result = {
        interest_bps: params.interest_bps,
        poolId: loansPoolId,
      };

      // Cachear em memória
      this.poolParamsCache = { params: result, timestamp: now };
      return result;
    } catch {
      // Fallback para env vars se falhar
      const interestBpsEnv = process.env.LOANSPOOL_INTEREST_BPS;
      const result = {
        interest_bps: interestBpsEnv ? Number(interestBpsEnv) : undefined,
        poolId: loansPoolId,
      };

      this.poolParamsCache = { params: result, timestamp: now };
      return result;
    }
  }

  async getPositions(address: string, quote = 'USD') {
    const cacheKey = `defi:blend:positions:${address}:${quote}`;
    const cached = await this.redis.get<{
      address: string;
      positions: Position[];
      totalUSD: number;
    }>(cacheKey);
    if (cached) return cached;

    let account: any;
    try {
      account = await this.horizon.getAccount(address);
    } catch (err: any) {
      // Mapear erro do Horizon (400/404) para resposta adequada
      const status = err?.response?.status;
      if (status === 404) {
        throw new NotFoundException('Account not found');
      }
      if (status === 400) {
        throw new NotFoundException('Invalid account');
      }
      throw err;
    }
    const balances: Array<{
      asset_type: string;
      asset_code?: string;
      balance: string;
    }> = account?.balances || [];

    const backendUrl =
      process.env.BACKEND_PUBLIC_URL ||
      process.env.BACKEND_URL ||
      'http://localhost:3001';
    const priceClient = axios.create({ baseURL: backendUrl, timeout: 8000 });

    const positions: Position[] = [];
    for (const b of balances) {
      const asset = b.asset_type === 'native' ? 'XLM' : `${b.asset_code}`;
      let price = 0;
      try {
        const { data } = await priceClient.get('/oracles/price', {
          params: { base: asset, quote },
        });
        price = Number(data?.value || 0);
      } catch {
        price = 0;
      }
      const balanceNum = parseFloat(b.balance || '0');
      positions.push({
        asset,
        balance: b.balance,
        valueUSD: balanceNum * price,
      });
    }

    // Enriquecimento dinâmico com parâmetros do contrato
    const poolConfig = await this.getPoolParams();
    if (poolConfig.poolId) {
      for (const p of positions) {
        p.poolId = poolConfig.poolId;

        if (
          typeof poolConfig.interest_bps === 'number' &&
          !Number.isNaN(poolConfig.interest_bps)
        ) {
          // Converter basis points para percentual (1500 bps = 15.00%)
          p.apy = Math.round((poolConfig.interest_bps / 100) * 100) / 100;
        }
      }
    }

    const totalUSD = positions.reduce((sum, p) => sum + (p.valueUSD || 0), 0);
    const result = { address, positions, totalUSD };
    await this.redis.set(cacheKey, result, 15); // cache por 15s para aliviar load
    return result;
  }
}
