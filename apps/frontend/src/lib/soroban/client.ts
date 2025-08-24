// Utilitários leves para Soroban com import dinâmico
// Evita quebrar o build quando o SDK não está instalado.

export type SorobanNetwork = "public" | "testnet";

// Tipos mínimos para SorobanRpc
interface SorobanRpcServerOptions { allowHttp?: boolean }
export interface SorobanRpcServer {
  getAccount(address: string): Promise<unknown>;
  simulateTransaction(tx: import("@stellar/stellar-sdk").Transaction): Promise<unknown>;
  sendTransaction(tx: import("@stellar/stellar-sdk").Transaction): Promise<{ hash: string; errorResult?: string }>;
  getTransaction(hash: string): Promise<{ status: "NOT_FOUND" | string }>;
}
interface SorobanRpcNS {
  Server: new (url: string, opts?: SorobanRpcServerOptions) => SorobanRpcServer;
}
type SdkWithSorobanRpc = typeof import("@stellar/stellar-sdk") & { SorobanRpc?: SorobanRpcNS };

export function getRpcUrl(network: SorobanNetwork): string {
  return network === "testnet"
    ? "https://soroban-testnet.stellar.org"
    : "https://soroban-rpc.mainnet.stellar.network";
}

export function getNetworkPassphrase(network: SorobanNetwork): string {
  return network === "testnet"
    ? "Test SDF Network ; September 2015"
    : "Public Global Stellar Network ; September 2015";
}

export async function getSorobanServer(network: SorobanNetwork): Promise<SorobanRpcServer> {
  try {
    // Import dinâmico para não exigir dependência em tempo de build
    const sdk = (await import("@stellar/stellar-sdk")) as SdkWithSorobanRpc;
    const url = getRpcUrl(network);
    const Server = sdk?.SorobanRpc?.Server;
    if (!Server) throw new Error("SorobanRpc não disponível no SDK instalado.");
    return new Server(url, { allowHttp: false });
  } catch {
    throw new Error("Pacote @stellar/stellar-sdk não encontrado. Instale-o para usar chamadas Soroban (npm i @stellar/stellar-sdk).");
  }
}
