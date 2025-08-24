"use client";
import { create } from "zustand";
import { AllConnectors, FreighterConnector, type WalletType, detectAvailable } from "../lib/wallets/connectors";

// Tipos básicos de rede
export type StellarNetwork = "public" | "testnet";

// API global opcional (mantém compatibilidade)
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

// Tipos mínimos para resposta do Horizon
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
  // soroban mínimos
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
  // Evita SSR mismatch: popula no cliente via refreshAvailable()
  available: [],
  activeType: null,

  connectByType: async (type: WalletType) => {
    try {
      set({ loading: true, error: null });
      // Seleciona conector
      const connector = AllConnectors.find((c) => c.id === type) ?? FreighterConnector;
      // Permite tentar conexão mesmo que isAvailable() seja false para freighter/xbull
      const canTry = connector.isAvailable() || type === "freighter" || type === "xbull";
      if (!canTry) {
        const msg = `Conector ${type} indisponível neste navegador.`;
        throw new Error(msg);
      }
      const session = await connector.connect();
      set({ connected: true, address: session.address, network: session.network, activeType: type });
      
      // Dispara evento personalizado para notificar conexão
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
      set({ error: message ?? "Falha ao conectar" });
    } finally {
      // Recalcula carteiras disponíveis (ex.: após instalar/ativar)
      set({ loading: false, available: detectAvailable() });
    }
  },

  refreshAvailable: () => {
    // Recalcula a lista de conectores disponíveis no contexto do cliente
    if (typeof window === "undefined") return;
    const list = detectAvailable();
    if (typeof console !== "undefined") console.debug("[wallet] detectAvailable (initial)", list);
    set({ available: list });

    // Escuta eventos customizados das carteiras para detecção em tempo real
    const handleWalletEvent = (event: Event) => {
      if (typeof console !== "undefined") console.debug('[wallet] wallet event received:', event.type);
      setTimeout(() => {
        const updated = detectAvailable();
        if (typeof console !== "undefined") console.debug('[wallet] updated after event:', updated);
        set({ available: updated });
      }, 100); // pequeno delay para garantir que a carteira foi inicializada
    };

    // Remove listeners existentes para evitar duplicação
    window.removeEventListener('freighter:ready', handleWalletEvent);
    window.removeEventListener('rabet:connected', handleWalletEvent);
    window.removeEventListener('xbull:ready', handleWalletEvent);
    window.removeEventListener('albedo:ready', handleWalletEvent);

    // Adiciona listeners para eventos de carteiras
    window.addEventListener('freighter:ready', handleWalletEvent);
    window.addEventListener('rabet:connected', handleWalletEvent);
    window.addEventListener('xbull:ready', handleWalletEvent);
    window.addEventListener('albedo:ready', handleWalletEvent);

    // Observer para mudanças no DOM que podem indicar injeção de extensões
    const observer = new MutationObserver((mutations) => {
      let foundWalletInjection = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Verifica se o script pode ser de uma extensão de carteira
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

    // Observa mudanças no document.head e document.body
    observer.observe(document.head, { childList: true, subtree: true });
    observer.observe(document.body, { childList: true, subtree: true });

    // Monitora mudanças nas propriedades do window object
    const checkWindowChanges = () => {
      const currentKeys = Object.keys(window).filter(key => {
        const lowerKey = key.toLowerCase();
        return lowerKey.includes('freighter') || 
               lowerKey.includes('albedo') || 
               lowerKey.includes('rabet') || 
               lowerKey.includes('xbull');
      });
      
      // Verifica se há novas propriedades relacionadas a carteiras
      if (currentKeys.length > 0) {
        if (typeof console !== "undefined") {
          console.debug('[wallet] Found new wallet properties on window:', currentKeys);
        }
        const updated = detectAvailable();
        set({ available: updated });
      }
    };

    // Verifica periodicamente por novas propriedades (backup do observer)
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

    // Verificação assíncrona adicional: Freighter via pacote oficial
    // Algumas vezes o Chrome não injeta window.freighterApi, mas a extensão está ativa.
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
    // Polling robusto: algumas extensões injetam o provider tardiamente após o load
    // Fazemos várias tentativas para capturar a injeção tardia de diferentes carteiras.
    const interesting = (arr: { id: WalletType; available: boolean }[]) =>
      arr.some((w) => w.available && (w.id === "freighter" || w.id === "xbull" || w.id === "albedo" || w.id === "rabet"));
    
    // Se já encontrou carteiras, ainda faz algumas tentativas para encontrar mais
    const initialWallets = list.filter(w => w.available).length;
    if (interesting(list) && initialWallets > 0) {
      if (typeof console !== "undefined") {
        console.debug('[wallet] Found wallets initially, doing short poll for more:', initialWallets);
      }
    }
    
    let attempts = 0;
    const maxAttempts = 60; // ~20s com 350ms - muito mais tempo para extensões lentas
    const interval = 350; // intervalo um pouco maior
    
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
      
      // Para mais cedo se encontrou carteiras OU se chegou no limite OU se página não está visível
      const shouldStop = attempts >= maxAttempts || 
                        document.visibilityState !== "visible" ||
                        (foundWallets.length > initialWallets && attempts > 10); // Para se encontrou mais carteiras após 10 tentativas
      
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
      // tenta desconectar no conector ativo se suportado
      const type = get().activeType;
      const conn = AllConnectors.find((c) => c.id === type);
      await conn?.disconnect?.();
    } catch {}
    
    // Dispara evento personalizado para notificar desconexão
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
      if (!res.ok) throw new Error("Falha ao obter conta no Horizon");
      const data: HorizonAccountResponse = await res.json();
      // saldo XLM é o primeiro balance com asset_type native
      const native = (data.balances || []).find((b: HorizonBalanceEntry) => b.asset_type === "native");
      const xlm = native ? parseFloat(native.balance) : 0;
      set({ balance: xlm });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      set({ error: message ?? "Falha ao atualizar saldo" });
    } finally {
      set({ loading: false });
    }
  },

  // Soroban mínimos
  getNetworkPassphrase: () => {
    const net = get().network;
    return net === "testnet" ? "Test SDF Network ; September 2015" : "Public Global Stellar Network ; September 2015";
  },

  signXdr: async (xdr: string) => {
    const { activeType, address } = get();
    if (!activeType || !address) throw new Error("Conecte uma carteira antes de assinar.");
    if (activeType !== "freighter") throw new Error(`Assinatura não suportada para ${activeType} ainda.`);
    const passphrase = get().getNetworkPassphrase();
    const api = typeof window !== "undefined" ? window.freighterApi : undefined;
    if (!api?.signTransaction) throw new Error("Freighter não suporta signTransaction neste ambiente.");
    const res = await api.signTransaction(xdr, { networkPassphrase: passphrase, accountToSign: address });
    return res.signedTxXdr as string;
  },

  invokeContract: async ({ contractId, functionName, argsXdr = [] }) => {
    const { connected, address, network } = get();
    if (!connected || !address) throw new Error("Conecte uma carteira para invocar o contrato.");
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
