import { Horizon, Networks } from '@stellar/stellar-sdk';
import Constants from 'expo-constants';

// Em produção, o valor virá das variáveis de ambiente do Expo/EAS
const HORIZON_URL = Constants.expoConfig?.extra?.HORIZON_URL || 'https://horizon.stellar.org';
const STELLAR_NETWORK_PASSPHRASE = Constants.expoConfig?.extra?.STELLAR_NETWORK_PASSPHRASE || Networks.PUBLIC;

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
