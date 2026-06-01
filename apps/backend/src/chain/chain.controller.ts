import { Controller, Get, Query } from '@nestjs/common';
import * as StellarSdk from '@stellar/stellar-sdk';
import { ChainService } from './chain.service';
import { SorobanService } from './soroban.service';

@Controller('chain')
export class ChainController {
  constructor(
    private readonly chain: ChainService,
    private readonly soroban: SorobanService,
  ) {}

  @Get('config')
  config() {
    const cfg = this.chain.getConfig();
    const passphrase =
      cfg.passphrase ??
      (cfg.network === 'mainnet' || cfg.network === 'public'
        ? 'Public Global Stellar Network ; September 2015'
        : 'Test SDF Network ; September 2015');

    return {
      network: cfg.network,
      rpcUrl: cfg.sorobanRpcUrl,
      horizonUrl: cfg.horizonUrl,
      networkPassphrase: passphrase,
      contracts: {
        stablecoin: process.env.STABLECOIN_CONTRACT_ID ?? null,
        vcRegistry: process.env.VC_REGISTRY_ID ?? null,
        zkVerifier: process.env.ZK_VERIFIER_CONTRACT_ID ?? null,
        loansPool:
          process.env.LOANSPOOL_CONTRACT_ID ??
          process.env.LOANS_POOL_CONTRACT_ID ??
          null,
        daoGovernance: process.env.DAO_GOVERNANCE_ID ?? null,
        rwaTokenizer: process.env.RWA_TOKENIZER_ID ?? null,
        rwaMarketplace: process.env.RWA_MARKETPLACE_ID ?? null,
        mevGuard: process.env.MEV_GUARD_ID ?? null,
        batchExecutor: process.env.BATCH_EXECUTOR_ID ?? null,
      },
    };
  }

  @Get('health')
  async health() {
    const cfg = this.chain.getConfig();
    const nodeEnv = process.env.NODE_ENV ?? 'development';
    const allowStub = nodeEnv.toLowerCase() !== 'production';

    // Tenta simulação real; se falhar, indica que SDK não está disponível ou RPC inacessível
    const real = await this.chain.simulateContractCallReal({
      contractId: 'health-check',
      method: 'ping',
      args: [],
    });

    const sdkAvailable = real.ok || real.estimatedFee !== 0; // se retornou algo coerente

    return {
      network: cfg.network,
      rpcUrl: cfg.sorobanRpcUrl,
      sdkAvailable,
      rpcOk: real.ok,
      estimatedFee: real.ok
        ? real.estimatedFee
        : allowStub
          ? (await this.chain.simulateContractCall({
              contractId: 'health-check',
              method: 'ping',
              args: [],
            })).estimatedFee
          : null,
    };
  }

  @Get('stablecoin/state')
  async stablecoinState(@Query('contractId') contractId?: string) {
    const configured = contractId || process.env.STABLECOIN_CONTRACT_ID || '';
    const supply = await this.soroban.getStablecoinSupply(configured);
    return {
      contractId: configured || null,
      supply,
      decimals: 7,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('loans-pool/params')
  async loansPoolParams(@Query('contractId') contractId?: string) {
    const configured =
      contractId ||
      process.env.LOANSPOOL_CONTRACT_ID ||
      process.env.LOANS_POOL_CONTRACT_ID ||
      '';

    const params: Record<string, unknown> | null = configured
      ? ((await this.soroban.getLoansPoolParams(configured)) as unknown as Record<
          string,
          unknown
        >)
      : null;

    let totalLiquidity: unknown = null;
    if (configured) {
      try {
        const res = await this.soroban.invokeContract(
          configured,
          'total_liquidity',
          [],
        );
        const toNative = (StellarSdk as any).scValToNative;
        totalLiquidity =
          typeof toNative === 'function' ? toNative(res) : res?.toString?.();
      } catch {
        totalLiquidity = null;
      }
    }

    return {
      contractId: configured || null,
      params,
      totalLiquidity,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('dao/proposals')
  async daoProposals(
    @Query('start') start?: string,
    @Query('limit') limit?: string,
  ) {
    const contractId = process.env.DAO_GOVERNANCE_ID || '';
    const timestamp = new Date().toISOString();
    if (!contractId) {
      return {
        contractId: null,
        total: 0,
        start: 0,
        end: 0,
        proposals: [],
        timestamp,
      };
    }

    const toNative = (StellarSdk as any).scValToNative as
      | ((val: unknown) => unknown)
      | undefined;

    const startNum = Math.max(1, Number(start ?? 1) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit ?? 20) || 20));

    const countSc = await this.soroban.invokeContract(
      contractId,
      'proposals_count',
      [],
    );
    const countNative = typeof toNative === 'function' ? toNative(countSc) : 0;
    const total = Number(countNative ?? 0) || 0;

    const endNum = Math.max(
      0,
      Math.min(total, startNum + limitNum - 1),
    );
    if (total === 0 || endNum < startNum) {
      return {
        contractId,
        total,
        start: startNum,
        end: endNum,
        proposals: [],
        timestamp,
      };
    }

    const listSc = await this.soroban.invokeContract(
      contractId,
      'list_proposals',
      [
        StellarSdk.nativeToScVal(startNum, { type: 'u32' }),
        StellarSdk.nativeToScVal(endNum, { type: 'u32' }),
      ],
    );
    const proposals =
      typeof toNative === 'function' ? toNative(listSc) : listSc?.toString?.();

    return {
      contractId,
      total,
      start: startNum,
      end: endNum,
      proposals: Array.isArray(proposals) ? proposals : [],
      timestamp,
    };
  }
}
