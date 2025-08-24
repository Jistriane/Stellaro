// Funções auxiliares para invocar contratos Soroban usando @stellar/stellar-sdk
// Mantém imports dinâmicos para não quebrar SSR.
import { getNetworkPassphrase, getRpcUrl } from "./client";
import type { SorobanNetwork } from "./client";

export type InvokeArgs = {
  network: SorobanNetwork;
  sourceAddress: string; // conta do usuário (ex.: Freighter)
  contractId: string;
  functionName: string;
  // argumentos já em formato de xdr (base64) ou valores prontos para o SDK; para simplicidade usaremos xdr strings
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
type SdkWithSorobanRpc = typeof import("@stellar/stellar-sdk") & { SorobanRpc: SorobanRpcNS };

export async function buildInvokeTransaction({ network, sourceAddress, contractId, functionName, argsXdr = [] }: InvokeArgs): Promise<{ tx: import("@stellar/stellar-sdk").Transaction; passphrase: string }> {
  const sdk = (await import("@stellar/stellar-sdk")) as SdkWithSorobanRpc;
  const passphrase = getNetworkPassphrase(network);
  const rpcUrl = getRpcUrl(network);
  const server = new sdk.SorobanRpc.Server(rpcUrl, { allowHttp: false });

  // Carrega conta do usuário
  const account = (await server.getAccount(sourceAddress)) as unknown as import("@stellar/stellar-sdk").Account;

  // Monta invocação
  const contract = new sdk.Contract(contractId);
  const args = argsXdr.map((a: string) => sdk.xdr.ScVal.fromXDR(a, "base64"));

  const tx = new sdk.TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: passphrase,
  })
    // invoke()
    .addOperation(contract.call(functionName, ...args))
    // recomendado para soroban
    .setTimeout(30)
    .build();

  // Simula para obter footprint e ajustar
  const sim = await server.simulateTransaction(tx);
  if (sdk.SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error("Falha ao simular transação Soroban: " + JSON.stringify(sim, null, 2));
  }

  const prepared = sdk.SorobanRpc.assembleTransaction(tx, sim);
  return { tx: prepared, passphrase };
}

export async function submitSignedXdr(network: SorobanNetwork, signedXdr: string) {
  const sdk = (await import("@stellar/stellar-sdk")) as SdkWithSorobanRpc;
  const rpcUrl = getRpcUrl(network);
  const server = new sdk.SorobanRpc.Server(rpcUrl, { allowHttp: false });
  const tx = sdk.TransactionBuilder.fromXDR(signedXdr, getNetworkPassphrase(network)) as import("@stellar/stellar-sdk").Transaction;
  const send = await server.sendTransaction(tx);
  if (send.errorResult) {
    throw new Error("Envio falhou: " + send.errorResult);
  }
  // Se for transação que modifica estado, devemos aguardar confirmação
  let getResp = await server.getTransaction(send.hash);
  while (getResp.status === "NOT_FOUND") {
    await new Promise((r) => setTimeout(r, 1000));
    getResp = await server.getTransaction(send.hash);
  }
  return getResp;
}
