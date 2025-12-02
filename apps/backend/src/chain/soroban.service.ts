import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as StellarSdk from '@stellar/stellar-sdk';

interface LoansPoolParams {
  interest_bps: number;
  ltv_bps: number;
  max_loan_amount: string;
  [key: string]: any;
}

@Injectable()
export class SorobanService {
  private readonly logger = new Logger(SorobanService.name);
  private readonly client: AxiosInstance;

  constructor() {
    const baseURL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
    this.client = axios.create({ baseURL, timeout: 10000 });
  }

  async getEvents(contractId: string, startLedger?: number, endLedger?: number, paginationToken?: string) {
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
  async invokeContract(contractId: string, method: string, args: StellarSdk.xdr.ScVal[] = []): Promise<any> {
    try {
      const contract = new StellarSdk.Contract(contractId);
      const server = new StellarSdk.SorobanRpc.Server(this.client.defaults.baseURL || '');
      
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
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulation = await server.simulateTransaction(tx);
      
      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulation)) {
        return simulation.result?.retval;
      } else {
        this.logger.error(`Contract simulation failed: ${JSON.stringify(simulation)}`);
        throw new Error(`Contract simulation failed for ${method}`);
      }
    } catch (error) {
      this.logger.error(`Failed to invoke contract ${contractId}.${method}: ${error.message}`);
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
      this.logger.warn(`Failed to fetch LoansPool params, falling back to env: ${error.message}`);
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
      const result = await this.invokeContract(contractId, 'total_supply', []);
      
      if (result && result.switch().name === 'scvI128') {
        // Converter i128 para número (assumindo 7 decimals como padrão Stellar)
        const supply = BigInt(result.i128().toString());
        return Number(supply) / 10000000; // 7 decimais
      }

      throw new Error('Invalid total_supply response');
    } catch (error) {
      this.logger.error(`Failed to fetch stablecoin supply: ${error.message}`);
      throw error;
    }
  }

  /**
   * Congela/descongela minting no contrato Stablecoin.
   * @param contractId - ID do contrato Stablecoin
   * @param enabled - true para habilitar minting, false para congelar
   * @param signerSecret - Secret key do admin autorizado
   */
  async setMintingEnabled(contractId: string, enabled: boolean, signerSecret: string): Promise<string> {
    try {
      const contract = new StellarSdk.Contract(contractId);
      const server = new StellarSdk.SorobanRpc.Server(this.client.defaults.baseURL || '');
      const keypair = StellarSdk.Keypair.fromSecret(signerSecret);
      
      // Construir operação de invocação
      const enabledVal = StellarSdk.nativeToScVal(enabled, { type: 'bool' });
      const operation = contract.call('set_mint_enabled', enabledVal);
      
      // Carregar account do signer
      const account = await server.getAccount(keypair.publicKey());
      
      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      // Simular para obter auth e resource fees
      const simulation = await server.simulateTransaction(tx);
      
      if (!StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulation)) {
        throw new Error(`Simulation failed: ${JSON.stringify(simulation)}`);
      }

      // Preparar transação com auth
      const prepared = StellarSdk.SorobanRpc.assembleTransaction(tx, simulation).build();
      prepared.sign(keypair);

      // Submeter
      const response = await server.sendTransaction(prepared);
      
      if (response.status === 'PENDING') {
        // Aguardar confirmação
        let getResponse = await server.getTransaction(response.hash);
        while (getResponse.status === 'NOT_FOUND') {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          getResponse = await server.getTransaction(response.hash);
        }
        
        if (getResponse.status === 'SUCCESS') {
          this.logger.log(`Minting ${enabled ? 'enabled' : 'disabled'} on contract ${contractId}`);
          return response.hash;
        }
      }

      throw new Error(`Transaction failed: ${response.status}`);
    } catch (error) {
      this.logger.error(`Failed to set minting enabled=${enabled}: ${error.message}`);
      throw error;
    }
  }
}
