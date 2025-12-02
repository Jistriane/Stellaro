import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from '@stellar/stellar-sdk';
import { RedisService } from '../redis/redis.service';

export interface PoolAnalysis {
  poolId: string;
  apy: number;
  tvl: number;
  utilization: number;
  risk: number;
  supplyAPY: number;
  borrowAPY: number;
  totalSupply: number;
  totalBorrow: number;
}

export interface CompoundResult {
  poolId: string;
  rewardsClaimed?: number;
  redeposited?: number;
  txHash?: string;
  newAPY?: number;
  error?: string;
  status?: 'SUCCESS' | 'FAILED';
}

export interface Position {
  poolId: string;
  asset: string;
  amount: number;
  valueUSD: number;
  apy: number;
}

/**
 * Blend Protocol Yield Optimizer
 * Auto-compound, rebalancing e yield maximization
 */
@Injectable()
export class BlendYieldService {
  private readonly logger = new Logger(BlendYieldService.name);
  private readonly rpcServer: StellarSdk.rpc.Server;
  private readonly networkPassphrase: string;

  // Simulação de pools Blend (em produção, usar Blend SDK real)
  private readonly MOCK_POOLS = [
    {
      id: 'blend-xlm-usdc',
      asset: 'XLM',
      supplyAPY: 5.2,
      borrowAPY: 8.5,
      tvl: 1_000_000,
      utilization: 65,
      totalSupply: 1_500_000,
      totalBorrow: 975_000,
    },
    {
      id: 'blend-usdc-xlm',
      asset: 'USDC',
      supplyAPY: 4.8,
      borrowAPY: 7.2,
      tvl: 2_500_000,
      utilization: 70,
      totalSupply: 3_500_000,
      totalBorrow: 2_450_000,
    },
  ];

  constructor(
    private config: ConfigService,
    private redis: RedisService,
  ) {
    const rpcUrl = this.config.get<string>(
      'SOROBAN_RPC_URL',
      'https://soroban-testnet.stellar.org',
    );
    const network = this.config.get<string>('STELLAR_NETWORK', 'testnet');

    this.rpcServer = new StellarSdk.rpc.Server(rpcUrl);
    this.networkPassphrase =
      network === 'testnet'
        ? StellarSdk.Networks.TESTNET
        : StellarSdk.Networks.PUBLIC;
  }

  /**
   * Encontra melhor pool baseado em APY e risco
   */
  async findOptimalPool(asset: string): Promise<PoolAnalysis> {
    this.logger.log(`Finding optimal pool for ${asset}...`);

    // Em produção: buscar pools reais via Blend SDK
    const pools = this.MOCK_POOLS.filter((p) => p.asset === asset);

    if (pools.length === 0) {
      throw new Error(`No pools found for asset ${asset}`);
    }

    // Analisa cada pool
    const analyses = pools.map((pool) => {
      const risk = this.calculateRiskScore({
        utilization: pool.utilization,
        tvl: pool.tvl,
        supplyAPY: pool.supplyAPY,
        borrowAPY: pool.borrowAPY,
      });

      return {
        poolId: pool.id,
        apy: pool.supplyAPY,
        tvl: pool.tvl,
        utilization: pool.utilization,
        risk,
        supplyAPY: pool.supplyAPY,
        borrowAPY: pool.borrowAPY,
        totalSupply: pool.totalSupply,
        totalBorrow: pool.totalBorrow,
      };
    });

    // Ordena por score composto (APY/Risco)
    analyses.sort((a, b) => {
      const scoreA = a.apy / Math.max(a.risk, 1);
      const scoreB = b.apy / Math.max(b.risk, 1);
      return scoreB - scoreA;
    });

    return analyses[0];
  }

  /**
   * Auto-compound: coleta rewards e re-deposita
   */
  async autoCompound(userAddress: string): Promise<CompoundResult[]> {
    this.logger.log(`Auto-compounding for user ${userAddress}...`);

    const positions = await this.getUserPositions(userAddress);
    const results: CompoundResult[] = [];

    for (const position of positions) {
      try {
        // 1. Simula coleta de rewards
        const rewards = await this.claimRewards(position.poolId, userAddress);

        if (rewards > 0) {
          // 2. Re-deposita automaticamente
          const txHash = await this.supplyToPool(
            position.poolId,
            position.asset,
            rewards,
          );

          // 3. Atualiza APY
          const newAPY = await this.getUpdatedAPY(position.poolId);

          results.push({
            poolId: position.poolId,
            rewardsClaimed: rewards,
            redeposited: rewards,
            txHash,
            newAPY,
            status: 'SUCCESS',
          });

          // Cache do resultado
          await this.redis.set(
            `compound:${userAddress}:${position.poolId}`,
            results[results.length - 1],
            3600,
          );
        }
      } catch (error) {
        this.logger.error(
          `Auto-compound failed for pool ${position.poolId}: ${error.message}`,
        );
        results.push({
          poolId: position.poolId,
          error: error.message,
          status: 'FAILED',
        });
      }
    }

    return results;
  }

  /**
   * Rebalanceamento inteligente entre pools
   */
  async rebalancePortfolio(
    userAddress: string,
    targetAllocation: Map<string, number>,
  ): Promise<{ operations: any[]; estimatedGain: number }> {
    this.logger.log(`Rebalancing portfolio for ${userAddress}...`);

    const currentPositions = await this.getUserPositions(userAddress);
    const totalValue = currentPositions.reduce(
      (sum, p) => sum + p.valueUSD,
      0,
    );

    const rebalanceOps: any[] = [];
    let estimatedGain = 0;

    for (const [asset, targetPercent] of targetAllocation) {
      const currentPercent = this.getCurrentAllocation(
        currentPositions,
        asset,
      );
      const diff = targetPercent - currentPercent;

      if (Math.abs(diff) > 0.05) {
        // 5% threshold
        const amountUSD = totalValue * (diff / 100);

        if (diff > 0) {
          // Precisa aumentar exposição
          const optimalPool = await this.findOptimalPool(asset);
          rebalanceOps.push({
            action: 'SUPPLY',
            poolId: optimalPool.poolId,
            asset,
            amountUSD,
            expectedAPY: optimalPool.apy,
          });
          estimatedGain += (amountUSD * optimalPool.apy) / 100;
        } else {
          // Precisa reduzir exposição
          const position = currentPositions.find((p) => p.asset === asset);
          if (position) {
            rebalanceOps.push({
              action: 'WITHDRAW',
              poolId: position.poolId,
              asset,
              amountUSD: Math.abs(amountUSD),
            });
          }
        }
      }
    }

    return { operations: rebalanceOps, estimatedGain };
  }

  /**
   * Obtém posições do usuário (simulado)
   */
  private async getUserPositions(userAddress: string): Promise<Position[]> {
    // Cache check
    const cached = await this.redis.get<Position[]>(
      `positions:${userAddress}`,
    );
    if (cached) return cached;

    // Em produção: buscar do Blend SDK
    const positions: Position[] = [
      {
        poolId: 'blend-xlm-usdc',
        asset: 'XLM',
        amount: 10000,
        valueUSD: 1250,
        apy: 5.2,
      },
    ];

    // Cache por 5 minutos
    await this.redis.set(`positions:${userAddress}`, positions, 300);

    return positions;
  }

  /**
   * Simula coleta de rewards
   */
  private async claimRewards(
    poolId: string,
    userAddress: string,
  ): Promise<number> {
    // Simulação: retorna rewards acumulados
    // Em produção: invocar contrato Blend via Soroban RPC
    const daysSinceLastClaim = 7;
    const position = (await this.getUserPositions(userAddress)).find(
      (p) => p.poolId === poolId,
    );

    if (!position) return 0;

    const dailyRate = position.apy / 365 / 100;
    const rewards = position.amount * dailyRate * daysSinceLastClaim;

    this.logger.log(
      `Claimed ${rewards} ${position.asset} from pool ${poolId}`,
    );
    return rewards;
  }

  /**
   * Simula supply para pool
   */
  private async supplyToPool(
    poolId: string,
    asset: string,
    amount: number,
  ): Promise<string> {
    // Simulação: em produção, criar tx Soroban real
    const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    this.logger.log(`Supplied ${amount} ${asset} to pool ${poolId}: ${txHash}`);
    return txHash;
  }

  /**
   * Obtém APY atualizado do pool
   */
  private async getUpdatedAPY(poolId: string): Promise<number> {
    const pool = this.MOCK_POOLS.find((p) => p.id === poolId);
    return pool?.supplyAPY || 0;
  }

  /**
   * Calcula alocação atual de um asset
   */
  private getCurrentAllocation(
    positions: Position[],
    asset: string,
  ): number {
    const totalValue = positions.reduce((sum, p) => sum + p.valueUSD, 0);
    const assetValue =
      positions
        .filter((p) => p.asset === asset)
        .reduce((sum, p) => sum + p.valueUSD, 0) || 0;

    return (assetValue / totalValue) * 100;
  }

  /**
   * Calcula score de risco do pool
   */
  private calculateRiskScore(metrics: {
    utilization: number;
    tvl: number;
    supplyAPY: number;
    borrowAPY: number;
  }): number {
    // Score 0-100 (0=baixo risco, 100=alto risco)
    let risk = 0;

    // Utilização >80% = risco alto
    if (metrics.utilization > 80) risk += 40;
    else if (metrics.utilization > 60) risk += 20;

    // TVL baixo = risco de liquidez
    if (metrics.tvl < 500_000) risk += 30;
    else if (metrics.tvl < 1_000_000) risk += 15;

    // Spread alto entre supply/borrow = risco de mercado
    const spread = metrics.borrowAPY - metrics.supplyAPY;
    if (spread > 5) risk += 20;
    else if (spread > 3) risk += 10;

    return Math.min(risk, 100);
  }
}
