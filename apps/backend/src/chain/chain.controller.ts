import { Controller, Get } from '@nestjs/common';
import { ChainService } from './chain.service';

@Controller('chain')
export class ChainController {
  constructor(private readonly chain: ChainService) {}

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

    // Tenta simulação real; se falhar, indica que SDK não está disponível ou RPC inacessível
    const real = await this.chain.simulateContractCallReal({
      contractId: 'health-check',
      method: 'ping',
      args: [],
    });

    const sdkAvailable = real.ok || real.estimatedFee !== 0; // se retornou algo coerente

    // Fallback simples (sempre ok no stub)
    const stub = await this.chain.simulateContractCall({
      contractId: 'health-check',
      method: 'ping',
      args: [],
    });

    return {
      network: cfg.network,
      rpcUrl: cfg.sorobanRpcUrl,
      sdkAvailable,
      rpcOk: real.ok,
      estimatedFee: real.ok ? real.estimatedFee : stub.estimatedFee,
    };
  }
}
