import * as StellarSdk from '@stellar/stellar-sdk';

const getRpcNamespace = () =>
  (StellarSdk as any).rpc ?? (StellarSdk as any).SorobanRpc;

export type SorobanNetworkConfig = {
  rpcUrl: string;
  networkPassphrase: string;
};

export type InvokeWriteParams = SorobanNetworkConfig & {
  signerSecret: string;
  contractId: string;
  method: string;
  args: StellarSdk.xdr.ScVal[];
};

export type InvokeReadParams = SorobanNetworkConfig & {
  sourcePublicKey: string;
  contractId: string;
  method: string;
  args: StellarSdk.xdr.ScVal[];
};

function scValToNativeSafe(val: any): any {
  const fn = (StellarSdk as any).scValToNative;
  if (typeof fn === 'function') return fn(val);
  return val;
}

export async function invokeRead(params: InvokeReadParams): Promise<any> {
  const rpc = getRpcNamespace();
  if (!rpc || typeof rpc.Server !== 'function') {
    throw new Error('Soroban RPC SDK unavailable');
  }

  const server = new rpc.Server(params.rpcUrl);
  const contract = new StellarSdk.Contract(params.contractId);
  const op = contract.call(params.method, ...params.args);

  const account = await server.getAccount(params.sourcePublicKey);
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: params.networkPassphrase,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed: ${JSON.stringify(sim)}`);
  }
  return scValToNativeSafe(sim.result?.retval);
}

export async function invokeWrite(params: InvokeWriteParams): Promise<string> {
  const rpc = getRpcNamespace();
  if (!rpc || typeof rpc.Server !== 'function') {
    throw new Error('Soroban RPC SDK unavailable');
  }

  const server = new rpc.Server(params.rpcUrl);
  const kp = StellarSdk.Keypair.fromSecret(params.signerSecret);
  const contract = new StellarSdk.Contract(params.contractId);
  const op = contract.call(params.method, ...params.args);

  const account = await server.getAccount(kp.publicKey());
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: params.networkPassphrase,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed: ${JSON.stringify(sim)}`);
  }

  const prepared = rpc.assembleTransaction(tx, sim).build();
  prepared.sign(kp);

  const sent = await server.sendTransaction(prepared);
  if (!sent?.hash) {
    throw new Error(`Submit failed: ${JSON.stringify(sent)}`);
  }

  let getRes = await server.getTransaction(sent.hash);
  let retries = 0;
  while ((getRes.status === 'NOT_FOUND' || getRes.status === 'PENDING') && retries < 12) {
    await new Promise((r) => setTimeout(r, 2000));
    getRes = await server.getTransaction(sent.hash);
    retries += 1;
  }
  if (getRes.status !== 'SUCCESS') {
    throw new Error(`Tx not confirmed: ${getRes.status}`);
  }
  return sent.hash;
}
