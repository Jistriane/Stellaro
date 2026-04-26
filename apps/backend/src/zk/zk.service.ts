import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from '@stellar/stellar-sdk';
import { VerifyZkDto } from './dto/verify-zk.dto';
import { RedisService } from '../redis/redis.service';
import { ChainService } from '../chain/chain.service';

@Injectable()
export class ZkService {
  private readonly logger = new Logger(ZkService.name);
  private readonly rpcServer: StellarSdk.rpc.Server;
  private readonly contractId: string | undefined;
  private readonly networkPassphrase: string;

  constructor(
    private configService: ConfigService,
    private redis: RedisService,
    private readonly chain: ChainService,
  ) {
    const rpcUrl =
      this.configService.get<string>(
        'SOROBAN_RPC_URL',
        'https://soroban-testnet.stellar.org',
      ) || 'https://soroban-testnet.stellar.org';
    const network =
      this.configService.get<string>('STELLAR_NETWORK', 'testnet') || 'testnet';

    this.rpcServer = new StellarSdk.rpc.Server(rpcUrl);
    this.networkPassphrase =
      network === 'testnet'
        ? StellarSdk.Networks.TESTNET
        : StellarSdk.Networks.PUBLIC;

    this.contractId = this.configService.get<string>('ZK_VERIFIER_CONTRACT_ID');

    if (!this.contractId) {
      this.logger.warn(
        'ZK_VERIFIER_CONTRACT_ID not configured - ZK verification disabled',
      );
    } else {
      this.logger.log(`ZK Verifier initialized: ${this.contractId}`);
    }
  }

  async verify(dto: VerifyZkDto): Promise<{ ok: boolean; reason?: string }> {
    const now = Date.now();

    // Rate limit simples por nonce (TTL 30s)
    const rlKey = `zk:rl:${dto.nonce}`;
    const already = await this.redis.get<boolean>(rlKey);
    if (already) {
      this.redis.incRateLimited();
      return { ok: false, reason: 'rate-limited' };
    }
    await this.redis.set(rlKey, true, 30);

    // Validação: proof expirado
    if (dto.expiresAt <= now) {
      this.logger.warn(`ZK proof expired for nonce ${dto.nonce}`);
      return { ok: false, reason: 'expired' };
    }

    // Validação: contract ID configurado
    if (!this.contractId) {
      this.logger.error('ZK_VERIFIER_CONTRACT_ID not configured');
      return { ok: false, reason: 'missing-contract-id' };
    }

    // Validação: dados mínimos presentes
    if (dto.score < 0) {
      return { ok: false, reason: 'invalid-score' };
    }
    if (!dto.nonce) {
      return { ok: false, reason: 'missing-nonce' };
    }
    if (!dto.proof || dto.proof.length === 0) {
      return { ok: false, reason: 'missing-proof' };
    }
    if (!dto.publicInputs || dto.publicInputs.length === 0) {
      return { ok: false, reason: 'missing-public-inputs' };
    }

    try {
      // Invoca verify_proof no contrato Soroban
      const result = await this.invokeVerifyProof({
        userId: dto.userAddress,
        proof: dto.proof,
        publicSignals: [dto.publicInputs], // Adaptando conforme esperado pelo contrato
        nonce: dto.nonce,
      });

      if (result.ok) {
        this.logger.log(
          `ZK proof verified successfully for nonce ${dto.nonce}, score ${dto.score}`,
        );
        this.redis.incZkVerify(true);
        return { ok: true };
      } else {
        this.logger.warn(`ZK proof verification failed: ${result.error}`);
        this.redis.incZkVerify(false);
        return { ok: false, reason: result.error || 'verification-failed' };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      this.logger.error(`Error verifying ZK proof: ${msg}`);
      this.redis.incZkVerify(false);
      return { ok: false, reason: 'internal-error' };
    }
  }

  /**
   * Invoca o método verify_proof no contrato ZK Verifier via Soroban RPC
   */
  async invokeVerifyProof(params: {
    userId: string;
    proof: string;
    publicSignals: string[];
    nonce: string;
  }): Promise<{ ok: boolean; txHash?: string; error?: string }> {
    if (!this.contractId) {
      return { ok: false, error: 'missing-contract-id' };
    }

    this.logger.log(`Invoking verify_proof for user: ${params.userId}`);

    const result = await this.chain.submitTxReal({
      contractId: this.contractId,
      method: 'verify_proof',
      args: [params.userId, params.proof, params.publicSignals, params.nonce],
    });

    if (result.ok) {
      this.logger.log(`✅ ZK Proof verified and stored for ${params.userId}`);
    } else {
      this.logger.error(`❌ ZK Verification failed: ${result.error}`);
    }

    return result;
  }

  /**
   * Recupera o credit score de um usuário do contrato
   */
  async getScore(
    userAddress: string,
  ): Promise<{ score?: number; error?: string }> {
    if (!this.contractId) {
      return { error: 'missing-contract-id' };
    }

    try {
      // Cache por endereço (TTL 60s)
      const cacheKey = `zk:score:${userAddress}`;
      const cached = await this.redis.get<{ score?: number }>(cacheKey);
      if (cached && typeof cached.score !== 'undefined') {
        this.redis.incZkScore(true);
        return { score: cached.score };
      }

      const contract = new StellarSdk.Contract(this.contractId);
      const userScVal = new StellarSdk.Address(userAddress).toScVal();

      // Conta fonte para simulação
      const sourceKeypair = StellarSdk.Keypair.random();
      const sourceAccount = new StellarSdk.Account(
        sourceKeypair.publicKey(),
        '0',
      );

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contract.call('get_score', userScVal))
        .setTimeout(30)
        .build();

      const simulationResponse =
        await this.rpcServer.simulateTransaction(transaction);

      if (StellarSdk.rpc.Api.isSimulationError(simulationResponse)) {
        this.redis.incZkScore(false);
        return { error: 'simulation-failed' };
      }

      if (simulationResponse.result) {
        const result = simulationResponse.result;
        if (result.retval) {
          // Parse o retval (Option<CreditScore>)
          const retval = result.retval;

          // Se for Some, extrai o score
          if (retval.switch().name === 'scvVec') {
            const scoreStruct = StellarSdk.scValToNative(retval) as unknown as {
              score?: number;
            };
            const score = scoreStruct?.score;
            if (typeof score !== 'undefined') {
              await this.redis.set(cacheKey, { score }, 60);
            }
            this.redis.incZkScore(typeof score !== 'undefined');
            return { score };
          }

          // Se for None
          this.redis.incZkScore(false);
          return { score: undefined };
        }
      }

      this.redis.incZkScore(false);
      return { error: 'no-result' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      this.logger.error(`Error getting score: ${msg}`);
      this.redis.incZkScore(false);
      return { error: msg };
    }
  }
}
