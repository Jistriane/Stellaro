import { Controller, Get } from '@nestjs/common';
import { ChainService } from './chain.service';

@Controller('chain')
export class ChainController {
  constructor(private readonly chain: ChainService) {}

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
