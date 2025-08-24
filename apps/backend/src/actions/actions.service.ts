import { Injectable } from '@nestjs/common';
import { ChainService } from '../chain/chain.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ActionsService {
  constructor(
    private readonly chain: ChainService,
    private readonly prisma: PrismaService,
  ) {}

  swap(params: Record<string, unknown>): {
    ok: true;
    action: 'swap';
    params: Record<string, unknown>;
  } {
    // TODO: integrar Soroban (swaps)
    return { ok: true, action: 'swap', params };
  }

  partialLiquidation(params: Record<string, unknown>): {
    ok: true;
    action: 'partialLiquidation';
    params: Record<string, unknown>;
  } {
    // TODO: liquidação parcial
    return { ok: true, action: 'partialLiquidation', params };
  }

  autoHedge(params: Record<string, unknown>): {
    ok: true;
    action: 'autoHedge';
    params: Record<string, unknown>;
  } {
    // TODO: hedge automático
    return { ok: true, action: 'autoHedge', params };
  }

  stableMigration(params: Record<string, unknown>): {
    ok: true;
    action: 'stableMigration';
    params: Record<string, unknown>;
  } {
    // TODO: migração de stablecoin
    return { ok: true, action: 'stableMigration', params };
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

  cardBlock(params: Record<string, unknown>): {
    ok: true;
    action: 'cardBlock';
    params: Record<string, unknown>;
  } {
    // TODO: bloqueio de cartões
    return { ok: true, action: 'cardBlock', params };
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
}
