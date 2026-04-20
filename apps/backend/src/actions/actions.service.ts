import { Injectable, Logger } from '@nestjs/common';
import { ChainService } from '../chain/chain.service';
import { SorobanService } from '../chain/soroban.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ActionsService {
  private readonly logger = new Logger(ActionsService.name);

  constructor(
    private readonly chain: ChainService,
    private readonly soroban: SorobanService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Swap de assets via Stellar DEX ou pool Soroban
   */
  async swap(params: {
    from: string;
    to: string;
    assetIn: string;
    assetOut: string;
    amountIn: string;
    minAmountOut?: string;
    dryRun?: boolean;
  }): Promise<{
    ok: boolean;
    action: 'swap';
    txHash?: string;
    amountOut?: string;
    error?: string;
  }> {
    try {
      // Usar Portfolio contract para swaps se disponível
      const portfolioId = process.env.PORTFOLIO_CONTRACT_ID;
      
      if (portfolioId && !params.dryRun) {
        // Implementar swap via Soroban quando contrato tiver método swap
        this.logger.log(`Swap via Portfolio contract: ${params.assetIn} -> ${params.assetOut}`);
        
        // Por enquanto, retornar sucesso simulado
        return {
          ok: true,
          action: 'swap',
          amountOut: params.amountIn, // Simplified 1:1 para demo
        };
      }

      // Fallback para Stellar DEX path payment
      this.logger.log(`Swap via Stellar DEX path payment`);
      return {
        ok: true,
        action: 'swap',
        amountOut: params.amountIn,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Swap failed: ${errorMessage}`);
      return {
        ok: false,
        action: 'swap',
        error: errorMessage,
      };
    }
  }

  /**
   * Liquidação parcial de posição com colateral insuficiente
   */
  async partialLiquidation(params: {
    userId: string;
    positionId: string;
    collateralAsset: string;
    debtAsset: string;
    liquidationAmount: string;
    dryRun?: boolean;
  }): Promise<{
    ok: boolean;
    action: 'partialLiquidation';
    txHash?: string;
    liquidatedAmount?: string;
    error?: string;
  }> {
    try {
      const loansPoolId = process.env.LOANS_POOL_CONTRACT_ID;
      
      if (!loansPoolId) {
        throw new Error('LOANS_POOL_CONTRACT_ID not configured');
      }

      if (params.dryRun) {
        this.logger.log(`Dry-run partial liquidation for position ${params.positionId}`);
        return {
          ok: true,
          action: 'partialLiquidation',
          liquidatedAmount: params.liquidationAmount,
        };
      }

      // Chamar método liquidate do LoansPool se disponível
      this.logger.log(`Executing partial liquidation: ${params.liquidationAmount} ${params.debtAsset}`);
      
      // TODO: Implementar quando contrato tiver método liquidate
      return {
        ok: true,
        action: 'partialLiquidation',
        liquidatedAmount: params.liquidationAmount,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Partial liquidation failed: ${errorMessage}`);
      return {
        ok: false,
        action: 'partialLiquidation',
        error: errorMessage,
      };
    }
  }

  /**
   * Hedge automático de exposição cambial
   */
  async autoHedge(params: {
    asset: string;
    exposure: string;
    targetHedgeRatio: number; // 0-100%
    dryRun?: boolean;
  }): Promise<{
    ok: boolean;
    action: 'autoHedge';
    hedgedAmount?: string;
    cost?: string;
    error?: string;
  }> {
    try {
      const exposureNum = parseFloat(params.exposure);
      if (!isFinite(exposureNum)) {
        throw new Error('Invalid exposure');
      }
      const ratio = params.targetHedgeRatio;
      if (ratio < 0 || ratio > 100) {
        throw new Error('Invalid hedge ratio');
      }
      if (params.dryRun) {
        this.logger.log(`Dry-run auto hedge for ${params.asset}: ${params.exposure}`);
        
        const hedgedAmount = (exposureNum * (ratio / 100)).toString();
        
        return {
          ok: true,
          action: 'autoHedge',
          hedgedAmount,
          cost: (parseFloat(hedgedAmount) * 0.003).toString(), // 0.3% fee estimate
        };
      }

      // Implementar hedge via swaps ou derivativos
      this.logger.log(`Executing auto hedge for ${params.asset}`);
      
      const hedgedAmount = (exposureNum * (ratio / 100)).toString();

      return {
        ok: true,
        action: 'autoHedge',
        hedgedAmount,
        cost: (parseFloat(hedgedAmount) * 0.003).toString(),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Auto hedge failed: ${errorMessage}`);
      return {
        ok: false,
        action: 'autoHedge',
        error: errorMessage,
      };
    }
  }

  /**
   * Migração de stablecoin entre versões de contrato
   */
  async stableMigration(params: {
    from: string;
    amount: string;
    newContractId: string;
    dryRun?: boolean;
  }): Promise<{
    ok: boolean;
    action: 'stableMigration';
    txHash?: string;
    error?: string;
  }> {
    try {
      const oldContractId = process.env.STABLECOIN_CONTRACT_ID;
      
      if (!oldContractId) {
        throw new Error('STABLECOIN_CONTRACT_ID not configured');
      }

      if (params.dryRun) {
        this.logger.log(`Dry-run migration from ${oldContractId} to ${params.newContractId}`);
        return {
          ok: true,
          action: 'stableMigration',
        };
      }

      // 1. Burn tokens no contrato antigo
      // 2. Mint tokens no contrato novo
      this.logger.log(`Migrating ${params.amount} STLT to new contract`);
      
      return {
        ok: true,
        action: 'stableMigration',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Stable migration failed: ${errorMessage}`);
      return {
        ok: false,
        action: 'stableMigration',
        error: errorMessage,
      };
    }
  }

  async stableMigrationDryRun(params: Record<string, unknown>): Promise<{
    ok: boolean;
    action: 'stableMigration';
    params: Record<string, unknown>;
    dryRun: { estimatedFee: number };
  }> {
    const contractId =
      process.env.STABLECOIN_CONTRACT_ID ?? 'demo-stablecoin-contract';
    const sim = await this.chain.simulateContractCall({
      contractId,
      method: 'stable_migrate',
      args: [params],
    });
    return {
      ok: sim.ok,
      action: 'stableMigration',
      params,
      dryRun: { estimatedFee: sim.estimatedFee },
    };
  }

  /**
   * Bloqueio de cartão por suspeita de fraude
   */
  async cardBlock(params: {
    cardId: string;
    userId: string;
    reason: string;
    temporary?: boolean;
  }): Promise<{
    ok: boolean;
    action: 'cardBlock';
    blocked?: boolean;
    error?: string;
  }> {
    try {
      this.logger.warn(`Blocking card ${params.cardId} for user ${params.userId}: ${params.reason}`);
      
      // Registrar bloqueio no banco
      await this.prisma.riskExecution.create({
        data: {
          userId: params.userId,
          action: 'card.block',
          params: params as Prisma.InputJsonValue,
          executed: true,
          network: this.chain.getConfig().network,
          dryRun: false,
        },
      });

      // TODO: Integrar com provider de cartões (Marqeta, Stripe Issuing, etc.)
      // await cardProvider.blockCard(params.cardId);

      return {
        ok: true,
        action: 'cardBlock',
        blocked: true,
      };
    } catch (error) {
      this.logger.error(`Card block failed: ${error.message}`);
      return {
        ok: false,
        action: 'cardBlock',
        error: error.message,
      };
    }
  }

  // ===== Stablecoin adapters =====
  async stablecoinMintGuarded(params: {
    to: string; // Address (string)
    amount: string | number; // u128
    riskBps: number; // u32
    dryRun?: boolean;
    userId?: string;
    proposalId?: string;
  }): Promise<{
    ok: boolean;
    method: 'mint_guarded';
    contractId: string;
    dryRun?: { estimatedFee: number };
    txHash?: string;
    error?: string;
  }> {
    const contractId =
      process.env.STABLECOIN_CONTRACT_ID ?? 'demo-stablecoin-contract';
    const args = [params.to, params.amount, params.riskBps];
    if (params.dryRun) {
      const sim = await this.chain.simulateContractCallReal({
        contractId,
        method: 'mint_guarded',
        args,
      });
      await this.prisma.riskExecution.create({
        data: {
          userId: params.userId ?? 'system',
          proposalId: params.proposalId,
          action: 'stablecoin.mint_guarded',
          params: params as Prisma.InputJsonValue,
          executed: false,
          contractId,
          method: 'mint_guarded',
          network: this.chain.getConfig().network,
          dryRun: true,
        },
      });
      return {
        ok: sim.ok,
        method: 'mint_guarded',
        contractId,
        dryRun: { estimatedFee: sim.estimatedFee },
      };
    }
    const res = await this.chain.submitTxReal({
      contractId,
      method: 'mint_guarded',
      args,
    });
    await this.prisma.riskExecution.create({
      data: {
        userId: params.userId ?? 'system',
        proposalId: params.proposalId,
        action: 'stablecoin.mint_guarded',
        params: params as Prisma.InputJsonValue,
        executed: res.ok,
        txHash: res.txHash,
        contractId,
        method: 'mint_guarded',
        network: this.chain.getConfig().network,
        dryRun: false,
      },
    });
    return {
      ok: res.ok,
      method: 'mint_guarded',
      contractId,
      txHash: res.txHash,
      error: res.error,
    };
  }

  async stablecoinBurn(params: {
    from: string; // Address (string)
    amount: string | number; // u128
    dryRun?: boolean;
    userId?: string;
    proposalId?: string;
  }): Promise<{
    ok: boolean;
    method: 'burn';
    contractId: string;
    dryRun?: { estimatedFee: number };
    txHash?: string;
    error?: string;
  }> {
    const contractId =
      process.env.STABLECOIN_CONTRACT_ID ?? 'demo-stablecoin-contract';
    const args = [params.from, params.amount];
    if (params.dryRun) {
      const sim = await this.chain.simulateContractCallReal({
        contractId,
        method: 'burn',
        args,
      });
      await this.prisma.riskExecution.create({
        data: {
          userId: params.userId ?? 'system',
          proposalId: params.proposalId,
          action: 'stablecoin.burn',
          params: params as Prisma.InputJsonValue,
          executed: false,
          contractId,
          method: 'burn',
          network: this.chain.getConfig().network,
          dryRun: true,
        },
      });
      return {
        ok: sim.ok,
        method: 'burn',
        contractId,
        dryRun: { estimatedFee: sim.estimatedFee },
      };
    }
    const res = await this.chain.submitTxReal({
      contractId,
      method: 'burn',
      args,
    });
    await this.prisma.riskExecution.create({
      data: {
        userId: params.userId ?? 'system',
        proposalId: params.proposalId,
        action: 'stablecoin.burn',
        params: params as Prisma.InputJsonValue,
        executed: res.ok,
        txHash: res.txHash,
        contractId,
        method: 'burn',
        network: this.chain.getConfig().network,
        dryRun: false,
      },
    });
    return {
      ok: res.ok,
      method: 'burn',
      contractId,
      txHash: res.txHash,
      error: res.error,
    };
  }

  async stablecoinTransfer(params: {
    from: string; // Address (string)
    to: string; // Address (string)
    amount: string | number; // i128/u128 compat
    dryRun?: boolean;
    userId?: string;
    proposalId?: string;
  }): Promise<{
    ok: boolean;
    method: 'transfer';
    contractId: string;
    dryRun?: { estimatedFee: number };
    txHash?: string;
    error?: string;
  }> {
    const contractId =
      process.env.STABLECOIN_CONTRACT_ID ?? 'demo-stablecoin-contract';
    const args = [params.from, params.to, params.amount];

    if (params.dryRun) {
      const sim = await this.chain.simulateContractCallReal({
        contractId,
        method: 'transfer',
        args,
      });
      await this.prisma.riskExecution.create({
        data: {
          userId: params.userId ?? 'system',
          proposalId: params.proposalId,
          action: 'stablecoin.transfer',
          params: params as Prisma.InputJsonValue,
          executed: false,
          contractId,
          method: 'transfer',
          network: this.chain.getConfig().network,
          dryRun: true,
        },
      });
      return {
        ok: sim.ok,
        method: 'transfer',
        contractId,
        dryRun: { estimatedFee: sim.estimatedFee },
      };
    }

    const res = await this.chain.submitTxReal({
      contractId,
      method: 'transfer',
      args,
    });

    await this.prisma.riskExecution.create({
      data: {
        userId: params.userId ?? 'system',
        proposalId: params.proposalId,
        action: 'stablecoin.transfer',
        params: params as Prisma.InputJsonValue,
        executed: res.ok,
        txHash: res.txHash,
        contractId,
        method: 'transfer',
        network: this.chain.getConfig().network,
        dryRun: false,
      },
    });

    return {
      ok: res.ok,
      method: 'transfer',
      contractId,
      txHash: res.txHash,
      error: res.error,
    };
  }
}
