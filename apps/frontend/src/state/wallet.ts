"use client";
import { create } from "zustand";
import { AllConnectors, FreighterConnector, type WalletType, detectAvailable } from "../lib/wallets/connectors";

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
  available: { id: WalletType; name: string; available: boolean }[];
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
    try {
      set({ loading: true, error: null });
      // Select connector
      const connector = AllConnectors.find((c) => c.id === type) ?? FreighterConnector;
      // Allow trying connection even if isAvailable() is false for freighter/xbull
      const canTry = connector.isAvailable() || type === "freighter" || type === "xbull";
      if (!canTry) {
        const msg = `Connector ${type} unavailable in this browser.`;
        throw new Error(msg);
      }
      const session = await connector.connect();
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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      set({ error: message ?? "Failed to connect" });
    } finally {
      // Recalculates available wallets (e.g., after installing/activating)
      set({ loading: false, available: detectAvailable() });
    }
  },

  refreshAvailable: () => {
    // Recalculates list of available connectors in client context
    if (typeof window === "undefined") return;
    const list = detectAvailable();
    if (typeof console !== "undefined") console.debug("[wallet] detectAvailable (initial)", list);
    set({ available: list });

    // Listens to custom wallet events for real-time detection
    const handleWalletEvent = (event: Event) => {
      if (typeof console !== "undefined") console.debug('[wallet] wallet event received:', event.type);
      setTimeout(() => {
        const updated = detectAvailable();
        if (typeof console !== "undefined") console.debug('[wallet] updated after event:', updated);
        set({ available: updated });
      }, 100); // small delay to ensure the wallet is initialized
    };

    // Remove existing listeners to avoid duplication
    window.removeEventListener('freighter:ready', handleWalletEvent);
    window.removeEventListener('rabet:connected', handleWalletEvent);
    window.removeEventListener('xbull:ready', handleWalletEvent);
    window.removeEventListener('albedo:ready', handleWalletEvent);

    // Add listeners for wallet events
    window.addEventListener('freighter:ready', handleWalletEvent);
    window.addEventListener('rabet:connected', handleWalletEvent);
    window.addEventListener('xbull:ready', handleWalletEvent);
    window.addEventListener('albedo:ready', handleWalletEvent);

    // Observer for DOM changes that may indicate extension injection
    const observer = new MutationObserver((mutations) => {
      let foundWalletInjection = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Check if script could be from a wallet extension
              if (element.tagName === 'SCRIPT' && element.hasAttribute('src')) {
                const src = element.getAttribute('src') || '';
                if (src.includes('freighter') || src.includes('xbull') || src.includes('albedo') || src.includes('rabet')) {
                  foundWalletInjection = true;
                }
              }
            }
          });
        }
      });
      
      if (foundWalletInjection) {
        if (typeof console !== "undefined") console.debug('[wallet] detected wallet script injection, re-checking...');
        setTimeout(() => {
          const updated = detectAvailable();
          set({ available: updated });
        }, 500);
      }
    });

    // Observe changes in document.head and document.body
    observer.observe(document.head, { childList: true, subtree: true });
    observer.observe(document.body, { childList: true, subtree: true });

    // Monitor changes in window properties
    const checkWindowChanges = () => {
      const currentKeys = Object.keys(window).filter(key => {
        const lowerKey = key.toLowerCase();
        return lowerKey.includes('freighter') || 
               lowerKey.includes('albedo') || 
               lowerKey.includes('rabet') || 
               lowerKey.includes('xbull');
      });
      
      // Check if there are new wallet-related properties
      if (currentKeys.length > 0) {
        if (typeof console !== "undefined") {
          console.debug('[wallet] Found new wallet properties on window:', currentKeys);
        }
        const updated = detectAvailable();
        set({ available: updated });
      }
    };

    // Periodically check for new properties (observer backup)
    const windowCheckInterval = setInterval(checkWindowChanges, 2000);
    
    // Cleanup function
    const cleanup = () => {
      observer.disconnect();
      clearInterval(windowCheckInterval);
      window.removeEventListener('freighter:ready', handleWalletEvent);
      window.removeEventListener('rabet:connected', handleWalletEvent);
      window.removeEventListener('xbull:ready', handleWalletEvent);
      window.removeEventListener('albedo:ready', handleWalletEvent);
    };

    // Store cleanup function for potential future use
    (window as any).__walletDetectionCleanup = cleanup;

    // Additional async check: Freighter via official package
    // Sometimes Chrome doesn't inject window.freighterApi, but the extension is active.
    (async () => {
      try {
        const freighter = (await import("@stellar/freighter-api")) as unknown as {
          isConnected: () => Promise<boolean>;
        };
        const ok = await freighter.isConnected();
        if (ok) {
          set((prev) => {
            const updated = (prev.available || list).map((w) =>
              w.id === "freighter" ? { ...w, available: true } : w
            );
            if (typeof console !== "undefined") console.debug("[wallet] freighter isConnected=true (async)");
            return { available: updated };
          });
        }
      } catch {}
    })();
    // Robust polling: some extensions inject provider late after load
    // We make multiple attempts to catch late injection of different wallets.
    const interesting = (arr: { id: WalletType; available: boolean }[]) =>
      arr.some((w) => w.available && (w.id === "freighter" || w.id === "xbull" || w.id === "albedo" || w.id === "rabet"));
    
    // If already found wallets, still makes some attempts to find more
    const initialWallets = list.filter(w => w.available).length;
    if (interesting(list) && initialWallets > 0) {
      if (typeof console !== "undefined") {
        console.debug('[wallet] Found wallets initially, doing short poll for more:', initialWallets);
      }
    }
    
    let attempts = 0;
    const maxAttempts = 60; // ~20s with 350ms - more time for slow extensions
    const interval = 350; // slightly longer interval
    
    const timer = setInterval(() => {
      attempts++;
      const next = detectAvailable();
      const foundWallets = next.filter(w => w.available).map(w => w.id);
      
      if (typeof console !== "undefined") {
        console.debug(`[wallet] detectAvailable retry ${attempts}/${maxAttempts}`, { 
          foundWallets, 
          totalAvailable: foundWallets.length,
          visibilityState: document.visibilityState,
          initialWallets 
        });
      }
      
      set({ available: next });
      
      // Stops earlier if found wallets OR reached limit OR page is not visible
      const shouldStop = attempts >= maxAttempts || 
                        document.visibilityState !== "visible" ||
                        (foundWallets.length > initialWallets && attempts > 10); // Stop if found more wallets after 10 attempts
      
      if (shouldStop) {
        clearInterval(timer);
        if (typeof console !== "undefined") {
          console.debug('[wallet] polling finished:', { 
            attempts, 
            finalWallets: foundWallets, 
            reason: attempts >= maxAttempts ? 'max_attempts' : 
                   document.visibilityState !== 'visible' ? 'not_visible' : 'found_more_wallets'
          });
        }
      }
    }, interval);
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
    const { address, network } = get();
    if (!address) return;
    try {
      set({ loading: true });
      const horizon = network === "testnet" ? "https://horizon-testnet.stellar.org" : "https://horizon.stellar.org";
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
