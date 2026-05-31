import * as StellarSdk from '@stellar/stellar-sdk';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export class StellarWallet {
  private static readonly SEED_KEY = 'stellaro_wallet_seed';

  private static canUseWebStorage(): boolean {
    return (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined'
    );
  }

  private static async getSeed(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.SEED_KEY);
    } catch (error) {
      if (!this.canUseWebStorage()) throw error;
      return window.localStorage.getItem(this.SEED_KEY);
    }
  }

  private static async setSeed(seed: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.SEED_KEY, seed, { keychainService: 'stellaro_vault' });
      return;
    } catch (error) {
      if (!this.canUseWebStorage()) throw error;
      window.localStorage.setItem(this.SEED_KEY, seed);
    }
  }

  /**
   * Inicializa ou recupera a carteira do armazenamento seguro.
   * RWA Compliance: Garante que a chave nunca saia do enclave seguro sem necessidade.
   */
  static async getOrCreateWallet(): Promise<StellarSdk.Keypair> {
    try {
      let seed = await this.getSeed();
      
      if (!seed) {
        const keypair = StellarSdk.Keypair.random();
        seed = keypair.secret();
        await this.setSeed(seed);
      }
      
      return StellarSdk.Keypair.fromSecret(seed);
    } catch (error) {
      console.error('SecureStore Error:', error);
      throw new Error('Falha ao acessar o armazenamento seguro da carteira.');
    }
  }

  static async getSecretSeed(): Promise<string> {
    const seed = await this.getSeed();
    if (!seed) {
      const kp = await this.getOrCreateWallet();
      return kp.secret();
    }
    return seed;
  }

  /**
   * Assina uma transação XDR.
   */
  static async signTransaction(xdr: string, network: 'MAINNET' | 'TESTNET' = 'MAINNET'): Promise<string> {
    const keypair = await this.getOrCreateWallet();
    const passphrase = network === 'MAINNET' 
      ? StellarSdk.Networks.PUBLIC 
      : StellarSdk.Networks.TESTNET;
      
    // @ts-ignore - Stellar SDK types sometimes mismatch on XDR parsing
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
