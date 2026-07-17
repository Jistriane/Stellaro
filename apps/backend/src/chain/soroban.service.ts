import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as StellarSdk from '@stellar/stellar-sdk';

const getRpcNamespace = () =>
  (StellarSdk as any).rpc ?? (StellarSdk as any).SorobanRpc;

interface LoansPoolParams {
  interest_bps: number;
  ltv_bps: number;
  max_loan_amount: string;
  [key: string]: any;
}

type VcIssuanceStatus = {
  available: boolean;
  reason: string | null;
  checks: {
    vcRegistryConfigured: boolean;
    masterSecretConfigured: boolean;
    masterSecretValid: boolean;
  };
};

@Injectable()
export class SorobanService {
  private readonly logger = new Logger(SorobanService.name);
  private readonly client: AxiosInstance;
  private readonly rpcAvailable: boolean;
  private readonly horizonUrl: string;
  private readonly networkPassphrase: string;

  constructor() {
    const baseURL = process.env.SOROBAN_RPC_URL;
    const network = process.env.STELLAR_NETWORK ?? 'testnet';
    const isMainnet = network === 'mainnet' || network === 'public';
    this.horizonUrl =
      process.env.HORIZON_URL ||
      (isMainnet
        ? 'https://horizon.stellar.org'
        : 'https://horizon-testnet.stellar.org');
    this.networkPassphrase =
      process.env.STELLAR_NETWORK_PASSPHRASE ||
      (isMainnet ? StellarSdk.Networks.PUBLIC : StellarSdk.Networks.TESTNET);

    if (!baseURL) {
      this.logger.warn(
        'SOROBAN_RPC_URL not set; Soroban running in degraded mode',
      );
      this.rpcAvailable = false;
      // Create a client with empty baseURL to avoid accidental calls
      this.client = axios.create({ baseURL: '', timeout: 10000 });
    } else {
      this.rpcAvailable = true;
      this.client = axios.create({ baseURL, timeout: 10000 });
    }
  }

  async getEvents(
    contractId: string,
    startLedger?: number,
    endLedger?: number,
    paginationToken?: string,
  ) {
    // Soroban JSON-RPC: "getEvents"
    const payload: any = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'getEvents',
      params: {
        startLedger: startLedger ?? 0,
        filters: [{ type: 'contract', contractIds: [contractId] }],
      },
    };
    if (endLedger) payload.params.endLedger = endLedger;
    if (paginationToken) payload.params.paginationToken = paginationToken;

    const { data } = await this.client.post('', payload);
    if (data.error) throw new Error(data.error?.message || 'Soroban RPC error');
    return data.result;
  }

  /**
   * Invoca um método read-only (view function) em um contrato Soroban.
   * @param contractId - ID do contrato
   * @param method - Nome do método a ser invocado
   * @param args - Argumentos do método (ScVals)
   * @returns Resultado decodificado
   */
  async invokeContract(
    contractId: string,
    method: string,
    args: StellarSdk.xdr.ScVal[] = [],
  ): Promise<any> {
    try {
      const rpc = getRpcNamespace();
      // Evita acessar SorobanRpc em modo degradado ou quando lib não possui SorobanRpc
      if (!this.rpcAvailable || !rpc || typeof rpc.Server !== 'function') {
        this.logger.warn(
          `Soroban RPC unavailable; skipping invoke ${method} on ${contractId}`,
        );
        return null;
      }
      const contract = new StellarSdk.Contract(contractId);
      const baseUrl = this.client.defaults.baseURL || '';
      const allowHttp = baseUrl.startsWith('http://');
      const server = new rpc.Server(baseUrl, allowHttp ? { allowHttp: true } : undefined);

      // Construir operação de invocação
      const operation = contract.call(method, ...args);

      // Simular a transação para obter o resultado (read-only)
      const account = new StellarSdk.Account(
        // Usar uma source account dummy para simulação
        'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
        '0',
      );

      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulation = await server.simulateTransaction(tx);

      if (rpc.Api.isSimulationSuccess(simulation)) {
        return simulation.result?.retval;
      } else {
        this.logger.error(
          `Contract simulation failed: ${JSON.stringify(simulation)}`,
        );
        throw new Error(`Contract simulation failed for ${method}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to invoke contract ${contractId}.${method}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Lê parâmetros do contrato LoansPool.
   * @param contractId - ID do contrato LoansPool
   * @returns Objeto com interest_bps, ltv_bps, max_loan_amount, etc.
   */
  async getLoansPoolParams(contractId: string): Promise<LoansPoolParams> {
    try {
      const result = await this.invokeContract(contractId, 'params', []);

      // Decodificar ScVal retornado (esperado: ScMap com chaves como símbolos)
      if (!result || result.switch().name !== 'scvMap') {
        throw new Error('Invalid params() response from LoansPool');
      }

      const map = result.map();
      const params: any = {};

      map.forEach((entry: any) => {
        const key = entry.key().sym().toString();
        const val = entry.val();

        // Decodificar valores conforme tipo
        switch (val.switch().name) {
          case 'scvU32':
            params[key] = val.u32();
            break;
          case 'scvU64':
            params[key] = val.u64().toString();
            break;
          case 'scvI128':
            params[key] = val.i128().toString();
            break;
          default:
            params[key] = val.toString();
        }
      });

      return params as LoansPoolParams;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch LoansPool params, falling back to env: ${error.message}`,
      );
      // Fallback para valores de ambiente
      return {
        interest_bps: Number(process.env.LOANSPOOL_INTEREST_BPS) || 0,
        ltv_bps: Number(process.env.LOANSPOOL_LTV_BPS) || 7000,
        max_loan_amount: process.env.LOANSPOOL_MAX_LOAN || '1000000',
      };
    }
  }

  /**
   * Obtém o total supply da stablecoin.
   * @param contractId - ID do contrato Stablecoin
   * @returns Total supply em unidades (stroops)
   */
  async getStablecoinSupply(contractId: string): Promise<number> {
    try {
      if (!contractId) {
        this.logger.warn(
          'Stablecoin contractId missing; returning 0 supply in dev/test',
        );
        return 0;
      }
      const result = await this.invokeContract(contractId, 'total_supply', []);

      if (result && result.switch().name === 'scvI128') {
        // Converter i128 para número (assumindo 7 decimals como padrão Stellar)
        const supply = BigInt(result.i128().toString());
        return Number(supply) / 10000000; // 7 decimais
      }

      throw new Error('Invalid total_supply response');
    } catch (error) {
      this.logger.error(`Failed to fetch stablecoin supply: ${error.message}`);
      // Em dev/test evitar propagar erro para não quebrar snapshots/reserves
      return 0;
    }
  }

  /**
   * Executa uma transação de escrita (invoke) em um contrato Soroban.
   */
  async executeContractCall(
    contractId: string,
    method: string,
    args: StellarSdk.xdr.ScVal[],
    signerSecret: string,
  ): Promise<string> {
    try {
      const rpc = getRpcNamespace();
      if (!this.rpcAvailable || !rpc || typeof rpc.Server !== 'function') {
        throw new Error('Soroban RPC unavailable');
      }

      const baseUrl = this.client.defaults.baseURL || '';
      const allowHttp = baseUrl.startsWith('http://');
      const server = new rpc.Server(baseUrl, allowHttp ? { allowHttp: true } : undefined);
      const keypair = StellarSdk.Keypair.fromSecret(signerSecret);
      const contract = new StellarSdk.Contract(contractId);
      const operation = contract.call(method, ...args);

      const account = await server.getAccount(keypair.publicKey());
      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulation = await server.simulateTransaction(tx);
      if (!rpc.Api.isSimulationSuccess(simulation)) {
        throw new Error(
          `Simulation failed for ${method}: ${JSON.stringify(simulation)}`,
        );
      }

      const prepared = rpc.assembleTransaction(tx, simulation).build();
      prepared.sign(keypair);

      const response = await server.sendTransaction(prepared);
      if (response.status === 'ERROR') {
        throw new Error(
          `Transaction submission error: ${JSON.stringify(response.errorResultXdr)}`,
        );
      }

      // Aguardar confirmação
      let getResponse = await server.getTransaction(response.hash);
      let retries = 0;
      while (
        (getResponse.status === 'NOT_FOUND' ||
          getResponse.status === 'PENDING') &&
        retries < 10
      ) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        getResponse = await server.getTransaction(response.hash);
        retries++;
      }

      if (getResponse.status === 'SUCCESS') {
        return response.hash;
      }

      throw new Error(`Transaction confirmation failed: ${getResponse.status}`);
    } catch (error) {
      this.logger.error(
        `Failed to execute ${method} on ${contractId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * RWA: Mints tokens para um usuário.
   */
  async mintRwa(to: string, amount: string): Promise<string> {
    const contractId = process.env.RWA_TOKENIZER_ID;
    const adminSecret =
      process.env.MASTER_SECRET_KEY ?? process.env.STELLAR_SECRET_KEY;
    if (!contractId || !adminSecret)
      throw new Error('RWA configuration missing');

    const args = [
      StellarSdk.Address.fromString(to).toScVal(),
      StellarSdk.nativeToScVal(amount, { type: 'i128' }),
    ];

    return this.executeContractCall(contractId, 'mint', args, adminSecret);
  }

  /**
   * VC Registry: Registra uma credencial para um usuário.
   */
  async registerUserVc(user: string, vcHash: string): Promise<string> {
    const contractId = process.env.VC_REGISTRY_ID;
    const issuerSecret =
      process.env.MASTER_SECRET_KEY ?? process.env.STELLAR_SECRET_KEY;
    if (!contractId) throw new Error('VC_REGISTRY_ID is not configured');
    if (
      !issuerSecret ||
      !StellarSdk.StrKey.isValidEd25519SecretSeed(issuerSecret)
    ) {
      throw new Error(
        'MASTER_SECRET_KEY is missing or invalid for VC issuance',
      );
    }

    const args = [
      StellarSdk.Address.fromString(
        StellarSdk.Keypair.fromSecret(issuerSecret).publicKey(),
      ).toScVal(),
      StellarSdk.Address.fromString(user).toScVal(),
      StellarSdk.xdr.ScVal.scvBytes(Buffer.from(vcHash, 'hex')),
    ];

    return this.executeContractCall(
      contractId,
      'register_user_vc',
      args,
      issuerSecret,
    );
  }

  getVcIssuanceStatus(): VcIssuanceStatus {
    const contractId = process.env.VC_REGISTRY_ID;
    const issuerSecret =
      process.env.MASTER_SECRET_KEY ?? process.env.STELLAR_SECRET_KEY;
    const vcRegistryConfigured = Boolean(contractId);
    const masterSecretConfigured = Boolean(issuerSecret);
    const masterSecretValid = Boolean(
      issuerSecret && StellarSdk.StrKey.isValidEd25519SecretSeed(issuerSecret),
    );

    if (!vcRegistryConfigured) {
      return {
        available: false,
        reason: 'VC_REGISTRY_ID is not configured',
        checks: {
          vcRegistryConfigured,
          masterSecretConfigured,
          masterSecretValid,
        },
      };
    }

    if (!masterSecretConfigured || !masterSecretValid) {
      return {
        available: false,
        reason: 'MASTER_SECRET_KEY is missing or invalid for VC issuance',
        checks: {
          vcRegistryConfigured,
          masterSecretConfigured,
          masterSecretValid,
        },
      };
    }

    return {
      available: true,
      reason: null,
      checks: {
        vcRegistryConfigured,
        masterSecretConfigured,
        masterSecretValid,
      },
    };
  }

  /**
   * VC Registry: Verifica se o usuário tem VC válida.
   */
  async hasValidVc(user: string): Promise<boolean> {
    const contractId = process.env.VC_REGISTRY_ID;
    if (!contractId) return false;

    try {
      const args = [StellarSdk.Address.fromString(user).toScVal()];
      const result = await this.invokeContract(
        contractId,
        'has_valid_vc',
        args,
      );
      return result && result.switch().name === 'scvBool' ? result.b() : false;
    } catch (error) {
      this.logger.error(`VC check failed for ${user}: ${error.message}`);
      return false;
    }
  }

  /**
   * DAO: Cria uma nova proposta.
   */
  async createProposal(
    target: string,
    action: string,
    description: string,
    creatorSecret: string,
  ): Promise<string> {
    const contractId = process.env.DAO_GOVERNANCE_ID;
    if (!contractId) throw new Error('DAO Governance ID missing');

    const keypair = StellarSdk.Keypair.fromSecret(creatorSecret);
    const args = [
      StellarSdk.Address.fromString(keypair.publicKey()).toScVal(),
      StellarSdk.Address.fromString(target).toScVal(),
      StellarSdk.xdr.ScVal.scvSymbol(action),
      StellarSdk.xdr.ScVal.scvSymbol(description),
    ];

    return this.executeContractCall(contractId, 'propose', args, creatorSecret);
  }

  /**
   * DAO: Vota em uma proposta.
   */
  async voteOnProposal(
    proposalId: number,
    support: boolean,
    voterSecret: string,
  ): Promise<string> {
    const contractId = process.env.DAO_GOVERNANCE_ID;
    if (!contractId) throw new Error('DAO Governance ID missing');

    const keypair = StellarSdk.Keypair.fromSecret(voterSecret);
    const args = [
      StellarSdk.Address.fromString(keypair.publicKey()).toScVal(),
      StellarSdk.nativeToScVal(proposalId, { type: 'u32' }),
      StellarSdk.nativeToScVal(support, { type: 'bool' }),
    ];

    return this.executeContractCall(contractId, 'vote', args, voterSecret);
  }

  /**
   * DAO: Executa uma proposta aprovada.
   */
  async executeProposal(
    proposalId: number,
    signerSecret: string,
  ): Promise<string> {
    const contractId = process.env.DAO_GOVERNANCE_ID;
    if (!contractId) throw new Error('DAO Governance ID missing');

    const args = [StellarSdk.nativeToScVal(proposalId, { type: 'u32' })];

    return this.executeContractCall(contractId, 'execute', args, signerSecret);
  }

  /**
   * Subscriptions: Autoriza um pagamento recorrente.
   */
  async authorizeSubscription(
    userSecret: string,
    merchant: string,
    token: string,
    amount: string,
    frequencyLedgers: number,
  ): Promise<string> {
    const contractId = process.env.RECURRING_PAYMENTS_ID;
    if (!contractId) throw new Error('Recurring Payments ID missing');

    const keypair = StellarSdk.Keypair.fromSecret(userSecret);
    const args = [
      StellarSdk.Address.fromString(keypair.publicKey()).toScVal(),
      StellarSdk.Address.fromString(merchant).toScVal(),
      StellarSdk.Address.fromString(token).toScVal(),
      StellarSdk.nativeToScVal(amount, { type: 'i128' }),
      StellarSdk.nativeToScVal(frequencyLedgers, { type: 'u32' }),
    ];

    return this.executeContractCall(contractId, 'authorize', args, userSecret);
  }

  /**
   * Subscriptions: Executa a cobrança de um pagamento recorrente (Withdraw).
   * Requer autorização do Merchant.
   */
  async executeSubscriptionWithdraw(
    merchantSecret: string,
    user: string,
  ): Promise<string> {
    const contractId = process.env.RECURRING_PAYMENTS_ID;
    if (!contractId) throw new Error('Recurring Payments ID missing');

    const merchantKeypair = StellarSdk.Keypair.fromSecret(merchantSecret);
    const args = [
      StellarSdk.Address.fromString(user).toScVal(),
      StellarSdk.Address.fromString(merchantKeypair.publicKey()).toScVal(),
    ];

    return this.executeContractCall(
      contractId,
      'withdraw',
      args,
      merchantSecret,
    );
  }

  /**
   * Insurance: Realiza depósito no pool de seguros.
   */
  async depositInsurance(userSecret: string, amount: string): Promise<string> {
    const contractId = process.env.INSURANCE_POOL_ID;
    if (!contractId) throw new Error('Insurance Pool ID missing');

    const keypair = StellarSdk.Keypair.fromSecret(userSecret);
    const args = [
      StellarSdk.Address.fromString(keypair.publicKey()).toScVal(),
      StellarSdk.nativeToScVal(amount, { type: 'i128' }),
    ];

    return this.executeContractCall(contractId, 'deposit', args, userSecret);
  }

  /**
   * DeFi: Encontra o melhor caminho de troca (Pathfinding) usando Horizon.
   */
  async findBestPath(
    fromAsset: string,
    toAsset: string,
    amount: string,
  ): Promise<any> {
    try {
      // Simplificado: Em um cenário real, converteríamos os nomes dos ativos para Asset objects
      // Para fins de demonstração, buscamos caminhos estritos de envio
      const issuer =
        process.env.MASTER_PUBLIC_KEY ?? process.env.STELLAR_PUBLIC_KEY ?? '';
      const url = `${this.horizonUrl}/paths/strict-send?source_asset_type=native&destination_asset_type=credit_alphanum4&destination_asset_code=${toAsset}&destination_asset_issuer=${issuer}&source_amount=${amount}`;

      const { data } = await axios.get(url);
      if (data._embedded && data._embedded.records.length > 0) {
        return data._embedded.records[0]; // Retorna o caminho com maior retorno
      }
      return null;
    } catch (error) {
      this.logger.error(`Pathfinding failed: ${error.message}`);
      return null;
    }
  }

  /**
   * DeFi: Executa um swap de tokens (usado pelo Robo-Advisor).
   */
  async executeSwap(
    userId: string,
    fromAsset: string,
    toAsset: string,
    amount: bigint,
  ): Promise<string> {
    const contractId =
      process.env.BATCH_EXECUTOR_ID || process.env.MEV_GUARD_ID;
    const adminSecret = process.env.MASTER_SECRET_KEY;
    if (!contractId || !adminSecret)
      throw new Error('Swap infrastructure missing');

    const amountStr = (Number(amount) / 10000000).toString();
    const bestPath = await this.findBestPath(fromAsset, toAsset, amountStr);

    this.logger.log(
      `Executing AI Swap with Pathfinding: ${fromAsset} -> ${toAsset} (Best Path: ${bestPath ? bestPath.path.map((p: any) => p.asset_code).join('->') : 'Direct'})`,
    );

    const args = [
      StellarSdk.Address.fromString(userId).toScVal(),
      StellarSdk.xdr.ScVal.scvSymbol(fromAsset),
      StellarSdk.xdr.ScVal.scvSymbol(toAsset),
      StellarSdk.nativeToScVal(amount, { type: 'i128' }),
      // Passamos o path real como argumento se o contrato suportar
      StellarSdk.xdr.ScVal.scvVec(
        bestPath
          ? bestPath.path.map((p: any) =>
              StellarSdk.xdr.ScVal.scvSymbol(p.asset_code || 'XLM'),
            )
          : [],
      ),
    ];

    return this.executeContractCall(
      contractId,
      'execute_swap_with_path',
      args,
      adminSecret,
    );
  }

  /**
   * Congela ou descongela minting da stablecoin
   */
  async setMintingEnabled(
    contractId: string,
    enabled: boolean,
    signerSecret: string,
  ): Promise<string> {
    const args = [StellarSdk.nativeToScVal(enabled, { type: 'bool' })];
    return this.executeContractCall(
      contractId,
      'set_minting_enabled',
      args,
      signerSecret,
    );
  }

  /**
   * Pausa ou despausa um contrato qualquer (Admin).
   */
  async setContractPaused(
    contractId: string,
    paused: boolean,
    adminSecret: string,
  ): Promise<string> {
    const args = [StellarSdk.nativeToScVal(paused, { type: 'bool' })];
    return this.executeContractCall(
      contractId,
      'set_paused',
      args,
      adminSecret,
    );
  }

  /**
   * RWA Marketplace: Inicia um novo leilão
   */
  async startAuction(
    sellerSecret: string,
    assetToken: string,
    amount: string,
    minBid: string,
    duration: number,
  ): Promise<string> {
    const contractId = process.env.RWA_MARKETPLACE_ID;
    if (!contractId) throw new Error('RWA Marketplace ID missing');

    const keypair = StellarSdk.Keypair.fromSecret(sellerSecret);
    const args = [
      StellarSdk.Address.fromString(keypair.publicKey()).toScVal(),
      StellarSdk.Address.fromString(assetToken).toScVal(),
      StellarSdk.nativeToScVal(amount, { type: 'i128' }),
      StellarSdk.nativeToScVal(minBid, { type: 'i128' }),
      StellarSdk.nativeToScVal(duration, { type: 'u64' }),
    ];

    return this.executeContractCall(
      contractId,
      'start_auction',
      args,
      sellerSecret,
    );
  }

  /**
   * RWA Marketplace: Coloca um lance em um leilão
   */
  async placeBid(
    bidderSecret: string,
    auctionId: number,
    bidAmount: string,
  ): Promise<string> {
    const contractId = process.env.RWA_MARKETPLACE_ID;
    if (!contractId) throw new Error('RWA Marketplace ID missing');

    const keypair = StellarSdk.Keypair.fromSecret(bidderSecret);
    const args = [
      StellarSdk.Address.fromString(keypair.publicKey()).toScVal(),
      StellarSdk.nativeToScVal(auctionId, { type: 'u32' }),
      StellarSdk.nativeToScVal(bidAmount, { type: 'i128' }),
    ];

    return this.executeContractCall(
      contractId,
      'place_bid',
      args,
      bidderSecret,
    );
  }
}
