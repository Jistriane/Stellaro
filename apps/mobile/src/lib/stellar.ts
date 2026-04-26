import { Horizon, Networks } from '@stellar/stellar-sdk';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';

export const horizon = new Horizon.Server(HORIZON_URL);

export const STELLAR_NETWORK = Networks.TESTNET;

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
