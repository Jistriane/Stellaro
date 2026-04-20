// Helper functions to invoke Soroban contracts using @stellar/stellar-sdk
// Keep dynamic imports to not break SSR.
import { getNetworkPassphrase, getRpcUrl } from "./client";
import type { SorobanNetwork } from "./client";

export type InvokeArgs = {
  network: SorobanNetwork;
  sourceAddress: string; // user account (e.g. Freighter)
  contractId: string;
  functionName: string;
  // arguments already in xdr format (base64) or ready values for SDK; for simplicity we'll use xdr strings
  argsXdr?: string[];
};

interface SorobanRpcServerOptions { allowHttp?: boolean }
interface SorobanRpcServer {
  getAccount(address: string): Promise<unknown>;
  simulateTransaction(tx: import("@stellar/stellar-sdk").Transaction): Promise<unknown>;
  sendTransaction(tx: import("@stellar/stellar-sdk").Transaction): Promise<{ hash: string; errorResult?: string }>;
  getTransaction(hash: string): Promise<{ status: "NOT_FOUND" | string }>;
}
interface SorobanRpcApi { isSimulationError: (sim: unknown) => boolean }
interface SorobanRpcNS {
  Server: new (url: string, opts?: SorobanRpcServerOptions) => SorobanRpcServer;
  Api: SorobanRpcApi;
  assembleTransaction: (
    tx: import("@stellar/stellar-sdk").Transaction,
    sim: unknown
  ) => import("@stellar/stellar-sdk").Transaction;
}
type SdkWithRpc = typeof import("@stellar/stellar-sdk") & {
  rpc?: SorobanRpcNS;
  SorobanRpc?: SorobanRpcNS;
};

function getRpcNamespace(sdk: SdkWithRpc): SorobanRpcNS {
  const rpc = sdk.rpc ?? sdk.SorobanRpc;
  if (!rpc) {
    throw new Error("Soroban RPC namespace not available in @stellar/stellar-sdk.");
  }
  return rpc;
}

export async function buildInvokeTransaction({ network, sourceAddress, contractId, functionName, argsXdr = [] }: InvokeArgs): Promise<{ tx: import("@stellar/stellar-sdk").Transaction; passphrase: string }> {
  const sdk = (await import("@stellar/stellar-sdk")) as SdkWithRpc;
  const rpc = getRpcNamespace(sdk);
  const passphrase = getNetworkPassphrase(network);
  const rpcUrl = getRpcUrl(network);
  const server = new rpc.Server(rpcUrl, { allowHttp: false });

  // Load user account
  const account = (await server.getAccount(sourceAddress)) as unknown as import("@stellar/stellar-sdk").Account;

  // Build invocation
  const contract = new sdk.Contract(contractId);
  const args = argsXdr.map((a: string) => sdk.xdr.ScVal.fromXDR(a, "base64"));

  const tx = new sdk.TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: passphrase,
  })
    // invoke()
    .addOperation(contract.call(functionName, ...args))
    // recommended for Soroban
    .setTimeout(30)
    .build();

  // Simulate to obtain footprint and adjust
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error("Failed to simulate Soroban transaction: " + JSON.stringify(sim, null, 2));
  }

  const prepared = rpc.assembleTransaction(tx, sim);
  return { tx: prepared, passphrase };
}

export async function submitSignedXdr(network: SorobanNetwork, signedXdr: string) {
  const sdk = (await import("@stellar/stellar-sdk")) as SdkWithRpc;
  const rpc = getRpcNamespace(sdk);
  const rpcUrl = getRpcUrl(network);
  const server = new rpc.Server(rpcUrl, { allowHttp: false });
  const tx = sdk.TransactionBuilder.fromXDR(signedXdr, getNetworkPassphrase(network)) as import("@stellar/stellar-sdk").Transaction;
  const send = await server.sendTransaction(tx);
  if (send.errorResult) {
    throw new Error("Send failed: " + send.errorResult);
  }
  // If transaction modifies state, we must wait for confirmation
  let getResp = await server.getTransaction(send.hash);
  while (getResp.status === "NOT_FOUND") {
    await new Promise((r) => setTimeout(r, 1000));
    getResp = await server.getTransaction(send.hash);
  }
  return getResp;
}
