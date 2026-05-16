"use client";
import { create } from "zustand";
import { AllConnectors, FreighterConnector, type WalletType, detectAvailable, probeWalletHints } from "../lib/wallets/connectors";
import { getHorizonBaseUrl } from "../lib/soroban";

// Basic network types
export type StellarNetwork = "public" | "testnet";

// Optional global API (maintains compatibility)
declare global {
  interface FreighterApi {
    signTransaction(
      xdr: string,
      opts: { networkPassphrase: string; accountToSign: string }
    ): Promise<{ signedTxXdr: string }>;
  }
  interface Window {
    freighterApi?: FreighterApi;
    albedo?: unknown;
    rabet?: unknown;
    xbullWallet?: unknown;
    ethereum?: unknown;
  }
}

// Minimal types for Horizon response
interface HorizonBalanceEntry {
  asset_type: string;
  balance: string;
}

interface HorizonAccountResponse {
  balances: HorizonBalanceEntry[];
}

interface WalletState {
  connected: boolean;
  address: string | null;
  network: StellarNetwork;
  balance: number | null;
  loading: boolean;
  error: string | null;
  // multi-wallet
  available: { id: WalletType; name: string; available: boolean; providerHint?: string }[];
  activeType: WalletType | null;
  connectByType: (type: WalletType) => Promise<void>;
  connectFreighter: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshAvailable: () => void;
  // soroban minimal
  getNetworkPassphrase: () => string;
  signXdr: (xdr: string) => Promise<string>;
  invokeContract: (args: { contractId: string; functionName: string; argsXdr?: string[] }) => Promise<unknown>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  connected: false,
  address: null,
  network: "public",
  balance: null,
  loading: false,
  error: null,
  // Avoid SSR mismatch: populate on the client via refreshAvailable()
  available: [],
  activeType: null,

  connectByType: async (type: WalletType) => {
    set({ loading: true, error: null });
    // Select connector
    const connector = AllConnectors.find((c) => c.id === type);
    if (!connector) {
      const msg = `Connector ${type} not found.`;
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
    // Allow trying connection even if the provider has not been injected yet.
    const canTry = connector.isAvailable() || type === "freighter" || type === "xbull" || type === "albedo" || type === "rabet";
    if (!canTry) {
      const msg = `Connector ${type} unavailable in this browser.`;
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
    const session = await connector.connect();
    const validAddress = typeof session.address === "string" && /^G[A-Z2-7]{55}$/.test(session.address);
    if (!validAddress) {
      if (type === "freighter") {
        throw new Error("ERR_FREIGHTER_NO_PUBKEY");
      }
      throw new Error("Wallet returned an invalid address");
    }
    set({ connected: true, address: session.address, network: session.network, activeType: type });
    // Fires custom event to notify connection
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('wallet:connected', { 
        detail: { 
          type, 
          address: session.address, 
          network: session.network 
        } 
      }));
      console.log(`[wallet] Dispatched wallet:connected event for ${type}`, session);
    }
    await get().refreshBalance();
    set({ loading: false, available: detectAvailable() });
  },

  refreshAvailable: () => {
    // Recalculates list of available connectors in client context.
    if (typeof window === "undefined") return;

    const applyProbeHints = (
      baseList: { id: WalletType; name: string; available: boolean; providerHint?: string }[]
    ) => {
      void probeWalletHints()
        .then((hints) => {
          const merged = baseList.map((item) => ({
            ...item,
            providerHint: hints[item.id] ?? item.providerHint,
          }));
          set({ available: merged });
        })
        .catch(() => {
          // Keep base detection when hint probing fails.
          set({ available: baseList });
        });
    };

    const initial = detectAvailable();
    if (typeof console !== "undefined") {
      console.debug("[wallet] detectAvailable (initial)", initial);
    }
    set({ available: initial });
    applyProbeHints(initial);

    // Poll briefly to catch late wallet provider injection.
    let attempts = 0;
    const maxAttempts = 30;
    const timer = setInterval(() => {
      attempts += 1;
      const next = detectAvailable();
      set({ available: next });

      if (attempts === 1 || attempts % 6 === 0) {
        applyProbeHints(next);
      }

      if (attempts >= maxAttempts || document.visibilityState !== "visible") {
        clearInterval(timer);
      }
    }, 500);
  },

  connectFreighter: async () => {
    return get().connectByType("freighter");
  },

  disconnect: async () => {
    try {
      // Attempt to disconnect on the active connector if supported
      const type = get().activeType;
      const conn = AllConnectors.find((c) => c.id === type);
      await conn?.disconnect?.();
    } catch {}
    
    // Fires custom event to notify disconnection
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('wallet:disconnected', { 
        detail: { type: get().activeType } 
      }));
      console.log('[wallet] Dispatched wallet:disconnected event');
    }
    
    set({ connected: false, address: null, balance: null, activeType: null });
  },

  refreshBalance: async () => {
    const { address } = get();
    if (!address) return;
    try {
      set({ loading: true });
      const horizon = getHorizonBaseUrl();
      const res = await fetch(`${horizon}/accounts/${address}`);
      if (!res.ok) throw new Error("Failed to fetch account from Horizon");
      const data: HorizonAccountResponse = await res.json();
      // XLM balance is the first balance with asset_type native
      const native = (data.balances || []).find((b: HorizonBalanceEntry) => b.asset_type === "native");
      const xlm = native ? parseFloat(native.balance) : 0;
      set({ balance: xlm });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      set({ error: message ?? "Failed to update balance" });
    } finally {
      set({ loading: false });
    }
  },

  // Soroban minimums
  getNetworkPassphrase: () => {
    const net = get().network;
    return net === "testnet" ? "Test SDF Network ; September 2015" : "Public Global Stellar Network ; September 2015";
  },

  signXdr: async (xdr: string) => {
    const { activeType, address } = get();
    if (!activeType || !address) throw new Error("Connect a wallet before signing.");
    if (activeType !== "freighter") throw new Error(`Signing not supported for ${activeType} yet.`);
    const passphrase = get().getNetworkPassphrase();
    const api = typeof window !== "undefined" ? window.freighterApi : undefined;
    if (!api?.signTransaction) throw new Error("Freighter does not support signTransaction in this environment.");
    const res = await api.signTransaction(xdr, { networkPassphrase: passphrase, accountToSign: address });
    return res.signedTxXdr as string;
  },

  invokeContract: async ({ contractId, functionName, argsXdr = [] }) => {
    const { connected, address, network } = get();
    if (!connected || !address) throw new Error("Connect a wallet to invoke the contract.");
    const { buildInvokeTransaction, submitSignedXdr } = await import("../lib/soroban/invoke");
    const { tx } = await buildInvokeTransaction({
      network,
      sourceAddress: address,
      contractId,
      functionName,
      argsXdr,
    });
    const xdr = tx.toXDR();
    const signed = await get().signXdr(xdr);
    const res = await submitSignedXdr(network, signed);
    return res;
  },
}));
