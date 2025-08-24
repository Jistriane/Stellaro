import { Injectable } from '@nestjs/common';
import { ChainService } from '../chain/chain.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class GovernanceService {
  constructor(
    private readonly chain: ChainService,
    private readonly prisma: PrismaService,
  ) {}

  private getContractId(): string {
    return process.env.GOVERNANCE_CONTRACT_ID ?? 'demo-governance-contract';
  }

  async setPause(params: {
    stablecoin: string;
    paused: boolean;
    dryRun?: boolean;
    userId?: string;
    proposalId?: string;
  }): Promise<{
    ok: boolean;
    method: 'set_paused';
    contractId: string;
    dryRun?: { estimatedFee: number };
    txHash?: string;
    error?: string;
  }> {
    const contractId = this.getContractId();
    const args = [params.stablecoin, params.paused];
    if (params.dryRun) {
      const sim = await this.chain.simulateContractCallReal({
        contractId,
        method: 'set_paused',
        args,
      });
      await this.audit(
        'governance.set_paused',
        contractId,
        'set_paused',
        params,
        false,
        undefined,
        true,
      );
      return {
        ok: sim.ok,
        method: 'set_paused',
        contractId,
        dryRun: { estimatedFee: sim.estimatedFee },
      };
    }
    const res = await this.chain.submitTxReal({
      contractId,
      method: 'set_paused',
      args,
    });
    await this.audit(
      'governance.set_paused',
      contractId,
      'set_paused',
      params,
      res.ok,
      res.txHash,
      false,
      res.error,
    );
    return {
      ok: res.ok,
      method: 'set_paused',
      contractId,
      txHash: res.txHash,
      error: res.error,
    };
  }

  async setMintEnabled(params: {
    stablecoin: string;
    enabled: boolean;
    dryRun?: boolean;
    userId?: string;
    proposalId?: string;
  }): Promise<{
    ok: boolean;
    method: 'set_mint_enabled';
    contractId: string;
    dryRun?: { estimatedFee: number };
    txHash?: string;
    error?: string;
  }> {
    const contractId = this.getContractId();
    const args = [params.stablecoin, params.enabled];
    if (params.dryRun) {
      const sim = await this.chain.simulateContractCallReal({
        contractId,
        method: 'set_mint_enabled',
        args,
      });
      await this.audit(
        'governance.set_mint_enabled',
        contractId,
        'set_mint_enabled',
        params,
        false,
        undefined,
        true,
      );
      return {
        ok: sim.ok,
        method: 'set_mint_enabled',
        contractId,
        dryRun: { estimatedFee: sim.estimatedFee },
      };
    }
    const res = await this.chain.submitTxReal({
      contractId,
      method: 'set_mint_enabled',
      args,
    });
    await this.audit(
      'governance.set_mint_enabled',
      contractId,
      'set_mint_enabled',
      params,
      res.ok,
      res.txHash,
      false,
      res.error,
    );
    return {
      ok: res.ok,
      method: 'set_mint_enabled',
      contractId,
      txHash: res.txHash,
      error: res.error,
    };
  }

  async setBurnEnabled(params: {
    stablecoin: string;
    enabled: boolean;
    dryRun?: boolean;
    userId?: string;
    proposalId?: string;
  }): Promise<{
    ok: boolean;
    method: 'set_burn_enabled';
    contractId: string;
    dryRun?: { estimatedFee: number };
    txHash?: string;
    error?: string;
  }> {
    const contractId = this.getContractId();
    const args = [params.stablecoin, params.enabled];
    if (params.dryRun) {
      const sim = await this.chain.simulateContractCallReal({
        contractId,
        method: 'set_burn_enabled',
        args,
      });
      await this.audit(
        'governance.set_burn_enabled',
        contractId,
        'set_burn_enabled',
        params,
        false,
        undefined,
        true,
      );
      return {
        ok: sim.ok,
        method: 'set_burn_enabled',
        contractId,
        dryRun: { estimatedFee: sim.estimatedFee },
      };
    }
    const res = await this.chain.submitTxReal({
      contractId,
      method: 'set_burn_enabled',
      args,
    });
    await this.audit(
      'governance.set_burn_enabled',
      contractId,
      'set_burn_enabled',
      params,
      res.ok,
      res.txHash,
      false,
      res.error,
    );
    return {
      ok: res.ok,
      method: 'set_burn_enabled',
      contractId,
      txHash: res.txHash,
      error: res.error,
    };
  }

  async setRiskThreshold(params: {
    stablecoin: string;
    riskBps: number;
    dryRun?: boolean;
    userId?: string;
    proposalId?: string;
  }): Promise<{
    ok: boolean;
    method: 'set_risk_threshold';
    contractId: string;
    dryRun?: { estimatedFee: number };
    txHash?: string;
    error?: string;
  }> {
    const contractId = this.getContractId();
    const args = [params.stablecoin, params.riskBps];
    if (params.dryRun) {
      const sim = await this.chain.simulateContractCallReal({
        contractId,
        method: 'set_risk_threshold',
        args,
      });
      await this.audit(
        'governance.set_risk_threshold',
        contractId,
        'set_risk_threshold',
        params,
        false,
        undefined,
        true,
      );
      return {
        ok: sim.ok,
        method: 'set_risk_threshold',
        contractId,
        dryRun: { estimatedFee: sim.estimatedFee },
      };
    }
    const res = await this.chain.submitTxReal({
      contractId,
      method: 'set_risk_threshold',
      args,
    });
    await this.audit(
      'governance.set_risk_threshold',
      contractId,
      'set_risk_threshold',
      params,
      res.ok,
      res.txHash,
      false,
      res.error,
    );
    return {
      ok: res.ok,
      method: 'set_risk_threshold',
      contractId,
      txHash: res.txHash,
      error: res.error,
    };
  }

  async proposeFlag(params: {
    proposer: string;
    target: string;
    method: string; // método no contrato alvo
    value: boolean;
    start: number; // timestamp (u64)
    end: number; // timestamp (u64)
    quorum: number; // u32
    dryRun?: boolean;
    userId?: string;
    proposalId?: string;
  }) {
    const contractId = this.getContractId();
    const sym = { sym: params.method } as any; // será convertido para scval.symbol()
    const args = [
      params.proposer,
      params.target,
      sym,
      params.value,
      BigInt(params.start),
      BigInt(params.end),
      params.quorum,
    ];
    if (params.dryRun) {
      const sim = await this.chain.simulateContractCallReal({
        contractId,
        method: 'propose_flag',
        args,
      });
      await this.audit(
        'governance.propose_flag',
        contractId,
        'propose_flag',
        params,
        false,
        undefined,
        true,
      );
      return {
        ok: sim.ok,
        method: 'propose_flag',
        contractId,
        dryRun: { estimatedFee: sim.estimatedFee },
      };
    }
    const res = await this.chain.submitTxReal({
      contractId,
      method: 'propose_flag',
      args,
    });
    await this.audit(
      'governance.propose_flag',
      contractId,
      'propose_flag',
      params,
      res.ok,
      res.txHash,
      false,
      res.error,
    );
    return {
      ok: res.ok,
      method: 'propose_flag',
      contractId,
      txHash: res.txHash,
      error: res.error,
    };
  }

  async proposeU32(params: {
    proposer: string;
    target: string;
    method: string; // método no contrato alvo
    value: number; // u32
    start: number; // timestamp (u64)
    end: number; // timestamp (u64)
    quorum: number; // u32
    dryRun?: boolean;
    userId?: string;
    proposalId?: string;
  }) {
    const contractId = this.getContractId();
    const sym = { sym: params.method } as any;
    const args = [
      params.proposer,
      params.target,
      sym,
      params.value,
      BigInt(params.start),
      BigInt(params.end),
      params.quorum,
    ];
    if (params.dryRun) {
      const sim = await this.chain.simulateContractCallReal({
        contractId,
        method: 'propose_u32',
        args,
      });
      await this.audit(
        'governance.propose_u32',
        contractId,
        'propose_u32',
        params,
        false,
        undefined,
        true,
      );
      return {
        ok: sim.ok,
        method: 'propose_u32',
        contractId,
        dryRun: { estimatedFee: sim.estimatedFee },
      };
    }
    const res = await this.chain.submitTxReal({
      contractId,
      method: 'propose_u32',
      args,
    });
    await this.audit(
      'governance.propose_u32',
      contractId,
      'propose_u32',
      params,
      res.ok,
      res.txHash,
      false,
      res.error,
    );
    return {
      ok: res.ok,
      method: 'propose_u32',
      contractId,
      txHash: res.txHash,
      error: res.error,
    };
  }

  async vote(params: {
    voter: string;
    proposalId: number;
    support: boolean;
    weight: number; // u32
    dryRun?: boolean;
    userId?: string;
  }) {
    const contractId = this.getContractId();
    const args = [
      params.voter,
      params.proposalId,
      params.support,
      params.weight,
    ];
    if (params.dryRun) {
      const sim = await this.chain.simulateContractCallReal({
        contractId,
        method: 'vote',
        args,
      });
      await this.audit(
        'governance.vote',
        contractId,
        'vote',
        params,
        false,
        undefined,
        true,
      );
      return {
        ok: sim.ok,
        method: 'vote',
        contractId,
        dryRun: { estimatedFee: sim.estimatedFee },
      };
    }
    const res = await this.chain.submitTxReal({
      contractId,
      method: 'vote',
      args,
    });
    await this.audit(
      'governance.vote',
      contractId,
      'vote',
      params,
      res.ok,
      res.txHash,
      false,
      res.error,
    );
    return {
      ok: res.ok,
      method: 'vote',
      contractId,
      txHash: res.txHash,
      error: res.error,
    };
  }

  async execute(params: {
    proposalId: number;
    dryRun?: boolean;
    userId?: string;
  }) {
    const contractId = this.getContractId();
    const args = [params.proposalId];
    if (params.dryRun) {
      const sim = await this.chain.simulateContractCallReal({
        contractId,
        method: 'execute',
        args,
      });
      await this.audit(
        'governance.execute',
        contractId,
        'execute',
        params,
        false,
        undefined,
        true,
      );
      return {
        ok: sim.ok,
        method: 'execute',
        contractId,
        dryRun: { estimatedFee: sim.estimatedFee },
      };
    }
    const res = await this.chain.submitTxReal({
      contractId,
      method: 'execute',
      args,
    });
    await this.audit(
      'governance.execute',
      contractId,
      'execute',
      params,
      res.ok,
      res.txHash,
      false,
      res.error,
    );
    return {
      ok: res.ok,
      method: 'execute',
      contractId,
      txHash: res.txHash,
      error: res.error,
    };
  }
  private async audit(
    action: string,
    contractId: string,
    method: string,
    params: unknown,
    executed: boolean,
    txHash?: string,
    dryRun?: boolean,
    error?: string,
  ) {
    await this.prisma.riskExecution.create({
      data: {
        userId: (params as any).userId ?? 'system',
        proposalId: (params as any).proposalId,
        action,
        params: params as Prisma.InputJsonValue,
        executed,
        txHash,
        contractId,
        method,
        network: this.chain.getConfig().network,
        dryRun: !!dryRun,
      },
    });

    // AuditLog (dual: off-chain e on-chain quando houver tx)
    await this.prisma.auditLog.create({
      data: {
        userId: (params as any).userId ?? null,
        channel: dryRun ? 'OFFCHAIN' : 'BOTH',
        level: error ? 'ERROR' : 'INFO',
        action,
        resourceType: 'contract',
        resourceId: contractId,
        metadata: {
          method,
          params,
          executed,
          txHash,
          error,
        } as unknown as Prisma.InputJsonValue,
        network: this.chain.getConfig().network,
        contractId,
        method,
        txHash,
      },
    });
  }
}
