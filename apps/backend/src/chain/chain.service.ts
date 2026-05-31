import { Injectable, Logger } from '@nestjs/common';
import * as StellarSdk from '@stellar/stellar-sdk';

export interface ChainConfig {
  network: string;
  sorobanRpcUrl: string;
  horizonUrl: string;
  passphrase?: string;
  secretKey?: string;
}

@Injectable()
export class ChainService {
  private readonly logger = new Logger(ChainService.name);

  getConfig(): ChainConfig {
    const network = process.env.STELLAR_NETWORK ?? 'testnet';
    const isMainnet = network === 'mainnet' || network === 'public';

    return {
      network,
      sorobanRpcUrl:
        process.env.SOROBAN_RPC_URL ??
        (isMainnet
          ? 'https://rpc.ankr.com/stellar_soroban'
          : 'https://soroban-testnet.stellar.org'),
      horizonUrl:
        process.env.STELLAR_HORIZON ??
        process.env.HORIZON_URL ??
        (isMainnet
          ? 'https://horizon.stellar.org'
          : 'https://horizon-testnet.stellar.org'),
      passphrase:
        process.env.STELLAR_NETWORK_PASSPHRASE ??
        process.env.SOROBAN_NETWORK_PASSPHRASE,
      secretKey:
        process.env.STELLAR_SECRET_KEY ??
        process.env.MASTER_SECRET_KEY ??
        process.env.WALLET_SECRET_DEV,
    };
  }

  // Utilitários de encode de argumentos para Soroban
  private async encodeArgs(rawArgs: unknown[]): Promise<any[]> {
    const scval = (StellarSdk as any).scVal;

    const toScVal = (v: any): any => {
      if (typeof v === 'boolean') return scval.bool(v);
      if (typeof v === 'string') {
        // Assume Address (account ou contract). Address lida com ambos.
        try {
          const addr = new StellarSdk.Address(v);
          return addr.toScVal();
        } catch {
          // Fallback como string
          return scval.string(v);
        }
      }
      if (typeof v === 'object' && v !== null) {
        // Convenção para símbolos Soroban vindos do backend
        if (typeof v.sym === 'string') {
          return scval.symbol(v.sym);
        }
        if (v.type === 'symbol' && typeof v.value === 'string') {
          return scval.symbol(v.value);
        }
      }
      if (typeof v === 'number') {
        if (Number.isInteger(v) && v >= 0 && v <= 0xffffffff)
          return scval.u32(v);
        // Para inteiros maiores, tentar u128
        const big = BigInt(Math.trunc(v));
        return scval.u128(big);
      }
      if (typeof v === 'bigint') return scval.u128(v);
      if (Array.isArray(v)) return scval.vec(v.map((i) => toScVal(i)));
      // Fallback genérico
      return scval.sym(JSON.stringify(v).slice(0, 9));
    };

    return rawArgs.map((a) => toScVal(a));
  }

  // Stub simples para ambientes sem SDK instalado
  async simulateContractCall(_input: {
    contractId: string;
    method: string;
    args: unknown[];
  }): Promise<{ estimatedFee: number; ok: boolean }> {
    void _input;
    return { ok: true, estimatedFee: 100_000 };
  }

  // Simulação real usando importação dinâmica do SDK (evita erro de build sem dependência)
  async simulateContractCallReal(input: {
    contractId: string;
    method: string;
    args: unknown[];
  }): Promise<{ ok: boolean; estimatedFee: number }> {
    try {
      const cfg = this.getConfig();
      const rpc = (StellarSdk as any).rpc ?? (StellarSdk as any).SorobanRpc;
      if (!rpc || typeof rpc.Server !== 'function') {
        throw new Error('Soroban RPC SDK unavailable');
      }
      const server = new rpc.Server(cfg.sorobanRpcUrl, {
        allowHttp: true,
      });

      // Construir operação de chamada ao contrato
      const contract = new StellarSdk.Contract(input.contractId);
      const scArgs = await this.encodeArgs(input.args);
      const op = contract.call(input.method, ...scArgs);

      // Conta de origem (carteira do executor)
      const kp = StellarSdk.Keypair.fromSecret(cfg.secretKey ?? '');
      const source = await server.getAccount(kp.publicKey());
      const tx = new StellarSdk.TransactionBuilder(source, {
        fee: '100000',
        networkPassphrase: cfg.passphrase ?? StellarSdk.Networks.TESTNET,
      })
        .addOperation(op)
        .setTimeout(60)
        .build();

      // prepareTransaction (simulação + footprint)
      const prepared = await server.prepareTransaction(tx);
      // Retornar fee estimado do prepared ou default
      const est = Number(prepared.fee) || 100_000;
      return { ok: true, estimatedFee: est };
    } catch (e) {
      this.logger.warn(
        `simulateContractCallReal fallback: ${(e as Error).message}`,
      );
      return { ok: false, estimatedFee: 0 };
    }
  }

  async submitTxReal(_params: {
    contractId: string;
    method: string;
    args: unknown[];
  }): Promise<{ ok: boolean; txHash?: string; error?: string }> {
    try {
      const cfg = this.getConfig();
      if (!cfg.secretKey) {
        return {
          ok: false,
          error: 'missing STELLAR_SECRET_KEY (or MASTER_SECRET_KEY)',
        };
      }
      const rpc = (StellarSdk as any).rpc ?? (StellarSdk as any).SorobanRpc;
      if (!rpc || typeof rpc.Server !== 'function') {
        return { ok: false, error: 'Soroban RPC SDK unavailable' };
      }
      const server = new rpc.Server(cfg.sorobanRpcUrl, {
        allowHttp: true,
      });

      const contract = new StellarSdk.Contract(_params.contractId);
      const scArgs = await this.encodeArgs(_params.args);
      const op = contract.call(_params.method, ...scArgs);

      const kp = StellarSdk.Keypair.fromSecret(cfg.secretKey);
      const source = await server.getAccount(kp.publicKey());
      const tx = new StellarSdk.TransactionBuilder(source, {
        fee: '100000',
        networkPassphrase: cfg.passphrase ?? StellarSdk.Networks.TESTNET,
      })
        .addOperation(op)
        .setTimeout(60)
        .build();

      const prepared = await server.prepareTransaction(tx);
      prepared.sign(kp);
      const res = await server.sendTransaction(prepared);
      if (res.status === 'SUCCESS' || res.hash) {
        return { ok: true, txHash: res.hash ?? 'unknown_hash' };
      }
      return {
        ok: false,
        error: res.errorResultXdr?.toString?.() ?? 'unknown_error',
      };
    } catch (e) {
      const msg = (e as Error).message;
      this.logger.error(`submitTxReal error: ${msg}`);
      return { ok: false, error: msg };
    }
  }
}
