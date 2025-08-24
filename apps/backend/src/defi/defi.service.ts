import { Injectable } from '@nestjs/common';
import { ChainService } from '../chain/chain.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DefiService {
  constructor(
    private readonly chain: ChainService,
    private readonly prisma: PrismaService,
  ) {}

  private async audit(
    action: string,
    params: unknown,
    executed: boolean,
    info: Partial<{
      txHash: string;
      contractId: string;
      method: string;
      dryRun: boolean;
      error: string;
    }>,
  ) {
    await this.prisma.riskExecution.create({
      data: {
        userId: (params as any).userId ?? 'system',
        proposalId: (params as any).proposalId,
        action,
        params: params as Prisma.InputJsonValue,
        executed,
        txHash: info.txHash,
        contractId: info.contractId,
        method: info.method,
        network: this.chain.getConfig().network,
        dryRun: !!info.dryRun,
      },
    });
  }

  // ===== Yield adapter (stub com contrato opcional) =====
  async stake(params: {
    poolId: string;
    amount: string | number;
    dryRun?: boolean;
    userId?: string;
    proposalId?: string;
  }) {
    const contractId = process.env.YIELD_CONTRACT_ID ?? 'demo-yield-contract';
    const args = [params.poolId, params.amount];
    if (params.dryRun) {
      const sim = await this.chain.simulateContractCallReal({
        contractId,
        method: 'stake',
        args,
      });
      await this.audit('defi.stake', params, false, {
        contractId,
        method: 'stake',
        dryRun: true,
      });
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId ?? null,
          channel: 'OFFCHAIN',
          level: 'INFO',
          action: 'defi.stake',
          resourceType: 'contract',
          resourceId: contractId,
          metadata: { method: 'stake', params },
          network: this.chain.getConfig().network,
          contractId,
          method: 'stake',
        },
      });
      return {
        ok: sim.ok,
        action: 'stake',
        contractId,
        dryRun: { estimatedFee: sim.estimatedFee },
      };
    }
    const res = await this.chain.submitTxReal({
      contractId,
      method: 'stake',
      args,
    });
    await this.audit('defi.stake', params, res.ok, {
      ...res,
      contractId,
      method: 'stake',
    });
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        channel: res.ok ? 'BOTH' : 'OFFCHAIN',
        level: res.error ? 'ERROR' : 'INFO',
        action: 'defi.stake',
        resourceType: 'contract',
        resourceId: contractId,
        metadata: { method: 'stake', params, error: res.error },
        network: this.chain.getConfig().network,
        contractId,
        method: 'stake',
        txHash: res.txHash,
      },
    });
    return {
      ok: res.ok,
      action: 'stake',
      contractId,
      txHash: res.txHash,
      error: res.error,
    };
  }

  async unstake(params: {
    poolId: string;
    amount: string | number;
    dryRun?: boolean;
    userId?: string;
    proposalId?: string;
  }) {
    const contractId = process.env.YIELD_CONTRACT_ID ?? 'demo-yield-contract';
    const args = [params.poolId, params.amount];
    if (params.dryRun) {
      const sim = await this.chain.simulateContractCallReal({
        contractId,
        method: 'unstake',
        args,
      });
      await this.audit('defi.unstake', params, false, {
        contractId,
        method: 'unstake',
        dryRun: true,
      });
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId ?? null,
          channel: 'OFFCHAIN',
          level: 'INFO',
          action: 'defi.unstake',
          resourceType: 'contract',
          resourceId: contractId,
          metadata: { method: 'unstake', params },
          network: this.chain.getConfig().network,
          contractId,
          method: 'unstake',
        },
      });
      return {
        ok: sim.ok,
        action: 'unstake',
        contractId,
        dryRun: { estimatedFee: sim.estimatedFee },
      };
    }
    const res = await this.chain.submitTxReal({
      contractId,
      method: 'unstake',
      args,
    });
    await this.audit('defi.unstake', params, res.ok, {
      ...res,
      contractId,
      method: 'unstake',
    });
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        channel: res.ok ? 'BOTH' : 'OFFCHAIN',
        level: res.error ? 'ERROR' : 'INFO',
        action: 'defi.unstake',
        resourceType: 'contract',
        resourceId: contractId,
        metadata: { method: 'unstake', params, error: res.error },
        network: this.chain.getConfig().network,
        contractId,
        method: 'unstake',
        txHash: res.txHash,
      },
    });
    return {
      ok: res.ok,
      action: 'unstake',
      contractId,
      txHash: res.txHash,
      error: res.error,
    };
  }

  // ===== LP management (stub) =====
  async addLiquidity(params: {
    poolId: string;
    amounts: Array<string | number>;
    dryRun?: boolean;
    userId?: string;
    proposalId?: string;
  }) {
    const contractId = process.env.LP_CONTRACT_ID ?? 'demo-lp-contract';
    const args = [params.poolId, params.amounts];
    if (params.dryRun) {
      const sim = await this.chain.simulateContractCallReal({
        contractId,
        method: 'add_liquidity',
        args,
      });
      await this.audit('defi.add_liquidity', params, false, {
        contractId,
        method: 'add_liquidity',
        dryRun: true,
      });
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId ?? null,
          channel: 'OFFCHAIN',
          level: 'INFO',
          action: 'defi.add_liquidity',
          resourceType: 'contract',
          resourceId: contractId,
          metadata: { method: 'add_liquidity', params },
          network: this.chain.getConfig().network,
          contractId,
          method: 'add_liquidity',
        },
      });
      return {
        ok: sim.ok,
        action: 'add_liquidity',
        contractId,
        dryRun: { estimatedFee: sim.estimatedFee },
      };
    }
    const res = await this.chain.submitTxReal({
      contractId,
      method: 'add_liquidity',
      args,
    });
    await this.audit('defi.add_liquidity', params, res.ok, {
      ...res,
      contractId,
      method: 'add_liquidity',
    });
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        channel: res.ok ? 'BOTH' : 'OFFCHAIN',
        level: res.error ? 'ERROR' : 'INFO',
        action: 'defi.add_liquidity',
        resourceType: 'contract',
        resourceId: contractId,
        metadata: { method: 'add_liquidity', params, error: res.error },
        network: this.chain.getConfig().network,
        contractId,
        method: 'add_liquidity',
        txHash: res.txHash,
      },
    });
    return {
      ok: res.ok,
      action: 'add_liquidity',
      contractId,
      txHash: res.txHash,
      error: res.error,
    };
  }

  async removeLiquidity(params: {
    poolId: string;
    share: string | number;
    dryRun?: boolean;
    userId?: string;
    proposalId?: string;
  }) {
    const contractId = process.env.LP_CONTRACT_ID ?? 'demo-lp-contract';
    const args = [params.poolId, params.share];
    if (params.dryRun) {
      const sim = await this.chain.simulateContractCallReal({
        contractId,
        method: 'remove_liquidity',
        args,
      });
      await this.audit('defi.remove_liquidity', params, false, {
        contractId,
        method: 'remove_liquidity',
        dryRun: true,
      });
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId ?? null,
          channel: 'OFFCHAIN',
          level: 'INFO',
          action: 'defi.remove_liquidity',
          resourceType: 'contract',
          resourceId: contractId,
          metadata: { method: 'remove_liquidity', params },
          network: this.chain.getConfig().network,
          contractId,
          method: 'remove_liquidity',
        },
      });
      return {
        ok: sim.ok,
        action: 'remove_liquidity',
        contractId,
        dryRun: { estimatedFee: sim.estimatedFee },
      };
    }
    const res = await this.chain.submitTxReal({
      contractId,
      method: 'remove_liquidity',
      args,
    });
    await this.audit('defi.remove_liquidity', params, res.ok, {
      ...res,
      contractId,
      method: 'remove_liquidity',
    });
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        channel: res.ok ? 'BOTH' : 'OFFCHAIN',
        level: res.error ? 'ERROR' : 'INFO',
        action: 'defi.remove_liquidity',
        resourceType: 'contract',
        resourceId: contractId,
        metadata: { method: 'remove_liquidity', params, error: res.error },
        network: this.chain.getConfig().network,
        contractId,
        method: 'remove_liquidity',
        txHash: res.txHash,
      },
    });
    return {
      ok: res.ok,
      action: 'remove_liquidity',
      contractId,
      txHash: res.txHash,
      error: res.error,
    };
  }

  // ===== Flash-loan guard (off-chain policy stub) =====
  async flashLoanGuard(params: {
    txPreview: unknown;
    maxAmount: number;
    riskBps: number;
    userId?: string;
    proposalId?: string;
  }) {
    const allowed = params.riskBps < 700 && params.maxAmount <= 100_000; // regra demo
    await this.audit('defi.flash_loan_guard', params, allowed, {
      contractId: undefined,
      method: 'policy',
      dryRun: true,
    });
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        channel: 'OFFCHAIN',
        level: 'INFO',
        action: 'defi.flash_loan_guard',
        resourceType: 'policy',
        resourceId: 'flash_loan',
        metadata: {
          params: {
            ...params,
            // unknown não é JSON-serializável em tipo; armazenamos um placeholder seguro
            txPreview: params.txPreview ? '[omitted]' : null,
          },
          allowed,
        },
      },
    });
    return { ok: allowed, reason: allowed ? 'allowed' : 'blocked_by_policy' };
  }

  // ===== Lending by score (stub) =====
  async loanByScore(params: {
    userScore: number;
    amount: number;
    userId?: string;
    proposalId?: string;
  }) {
    const approved = params.userScore >= 650 && params.amount <= 50_000; // regra demo
    await this.audit('defi.loan_by_score', params, approved, {
      contractId: undefined,
      method: 'policy',
      dryRun: true,
    });
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        channel: 'OFFCHAIN',
        level: 'INFO',
        action: 'defi.loan_by_score',
        resourceType: 'policy',
        resourceId: 'loan_by_score',
        metadata: { params, approved },
      },
    });
    return { ok: approved, limit: approved ? params.amount : 0 };
  }
}
