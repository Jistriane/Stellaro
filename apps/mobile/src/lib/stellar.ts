import { Horizon, Networks } from '@stellar/stellar-sdk';
import Constants from 'expo-constants';

type ChainProviderMode = 'public-testnet' | 'local';
type StellarNetwork = 'public' | 'testnet';

function getChainProviderMode(): ChainProviderMode {
  return String(Constants.expoConfig?.extra?.CHAIN_PROVIDER_MODE || '').toLowerCase() === 'local'
    ? 'local'
    : 'public-testnet';
}

function getStellarNetwork(): StellarNetwork {
  const explicit = String(Constants.expoConfig?.extra?.STELLAR_NETWORK || '').toLowerCase();
  if (explicit === 'public' || explicit === 'mainnet') return 'public';
  return 'testnet';
}

function resolveHorizonUrl(): string {
  const explicit = Constants.expoConfig?.extra?.HORIZON_URL as string | undefined;
  if (explicit) return explicit;
  if (getChainProviderMode() === 'local') return 'http://localhost:8000';
  return getStellarNetwork() === 'public'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';
}

function resolvePassphrase(): string {
  const explicit = Constants.expoConfig?.extra?.STELLAR_NETWORK_PASSPHRASE as
    | string
    | undefined;
  if (explicit) return explicit;
  return getStellarNetwork() === 'public' ? Networks.PUBLIC : Networks.TESTNET;
}

const HORIZON_URL = resolveHorizonUrl();
const STELLAR_NETWORK_PASSPHRASE = resolvePassphrase();

export const horizon = new Horizon.Server(HORIZON_URL);

export const STELLAR_NETWORK = STELLAR_NETWORK_PASSPHRASE;

export const getHorizonUrl = (): string => HORIZON_URL;

export interface AssetBalance {
  code: string;
  issuer?: string;
  balance: string;
}

export const getAccountBalances = async (publicKey: string): Promise<AssetBalance[]> => {
  try {
    const account = await horizon.loadAccount(publicKey);
    return account.balances.map((b: any) => ({
      code: b.asset_type === 'native' ? 'XLM' : b.asset_code,
      issuer: b.asset_issuer,
      balance: b.balance,
    }));
  } catch (error) {
    console.error('Error loading account balances:', error);
    return [];
  }
};
