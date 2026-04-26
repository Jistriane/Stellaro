import * as StellarSdk from '@stellar/stellar-sdk';
import * as SecureStore from 'expo-secure-store';

export class StellarWallet {
  private static readonly SEED_KEY = 'stellaro_wallet_seed';

  /**
   * Inicializa ou recupera a carteira do armazenamento seguro.
   */
  static async getOrCreateWallet(): Promise<StellarSdk.Keypair> {
    let seed = await SecureStore.getItemAsync(this.SEED_KEY);
    
    if (!seed) {
      const keypair = StellarSdk.Keypair.random();
      seed = keypair.secret();
      await SecureStore.setItemAsync(this.SEED_KEY, seed);
    }
    
    return StellarSdk.Keypair.fromSecret(seed);
  }

  /**
   * Assina uma transação XDR.
   */
  static async signTransaction(xdr: string, network: string = 'TESTNET'): Promise<string> {
    const keypair = await this.getOrCreateWallet();
    const passphrase = network === 'MAINNET' 
      ? StellarSdk.Networks.PUBLIC 
      : StellarSdk.Networks.TESTNET;
      
    const tx = StellarSdk.TransactionBuilder.fromXDR(xdr, passphrase);
    tx.sign(keypair);
    
    return tx.toXDR();
  }

  /**
   * Retorna a chave pública da carteira.
   */
  static async getPublicKey(): Promise<string> {
    const keypair = await this.getOrCreateWallet();
    return keypair.publicKey();
  }
}
