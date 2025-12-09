// Light utilities for Soroban with dynamic import
// Avoids breaking the build when SDK is not installed.

export type SorobanNetwork = "public" | "testnet";

// Minimal types for SorobanRpc
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
    // Dynamic import to not require dependency at build time
    const sdk = (await import("@stellar/stellar-sdk")) as SdkWithSorobanRpc;
    const url = getRpcUrl(network);
    const Server = sdk?.SorobanRpc?.Server;
    if (!Server) throw new Error("SorobanRpc not available in the installed SDK.");
    return new Server(url, { allowHttp: false });
  } catch {
    throw new Error("Package @stellar/stellar-sdk not found. Install it to use Soroban calls (npm i @stellar/stellar-sdk).");
  }
}
