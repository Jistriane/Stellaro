import * as StellarSdk from '@stellar/stellar-sdk';

export type ChainProviderMode = 'public-testnet' | 'local';

function normalizeMode(value?: string | null): ChainProviderMode {
  return String(value || '').toLowerCase() === 'local'
    ? 'local'
    : 'public-testnet';
}

function normalizeNetwork(value?: string | null): 'public' | 'testnet' {
  const normalized = String(value || '').toLowerCase();
  return normalized === 'mainnet' || normalized === 'public'
    ? 'public'
    : 'testnet';
}

export function getChainRuntimeConfig() {
  const network = normalizeNetwork(process.env.STELLAR_NETWORK);
  const mode = normalizeMode(process.env.CHAIN_PROVIDER_MODE);
  const isPublic = network === 'public';

  const sorobanRpcUrl =
    process.env.SOROBAN_RPC_URL ||
    (mode === 'local'
      ? 'http://quickstart:8000/rpc'
      : isPublic
        ? 'https://rpc.ankr.com/stellar_soroban'
        : 'https://soroban-testnet.stellar.org');

  const horizonUrl =
    process.env.STELLAR_HORIZON ||
    process.env.HORIZON_URL ||
    (mode === 'local'
      ? 'http://quickstart:8000'
      : isPublic
        ? 'https://horizon.stellar.org'
        : 'https://horizon-testnet.stellar.org');

  const passphrase =
    process.env.STELLAR_NETWORK_PASSPHRASE ||
    process.env.SOROBAN_NETWORK_PASSPHRASE ||
    (isPublic ? StellarSdk.Networks.PUBLIC : StellarSdk.Networks.TESTNET);

  return {
    mode,
    network,
    sorobanRpcUrl,
    horizonUrl,
    passphrase,
  };
}
