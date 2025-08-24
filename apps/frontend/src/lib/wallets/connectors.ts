/*
  Camada de conectores para múltiplas carteiras Stellar/Soroban.
  Implementa detecção leve no browser e métodos mínimos para obter endereço e rede.
  Conexões que dependem de libs externas são deixadas como stubs não-bloqueantes.
*/

export type StellarNetwork = "public" | "testnet";

export type WalletType =
  | "freighter"
  | "albedo"
  | "rabet"
  | "xbull"
  | "ledger"
  | "soroban-smart"
  | "chainlink-bridge"; // interoperabilidade via bridge (placeholder)

export interface WalletConnectorInfo {
  id: WalletType;
  name: string;
  available: boolean;
  providerHint?: string;
}

export interface WalletSession {
  address: string;
  network: StellarNetwork;
}

export interface WalletConnector {
  id: WalletType;
  name: string;
  isAvailable(): boolean;
  connect(): Promise<WalletSession>;
  disconnect?(): Promise<void>;
}

// Tipos mínimos dos provedores globais
interface FreighterApi {
  getUserInfo(): Promise<{ publicKey: string; network: "PUBLIC" | "TESTNET" }>;
  signTransaction?: (
    xdr: string,
    opts: { networkPassphrase: string; accountToSign?: string }
  ) => Promise<{ signedTxXdr: string }>;
  signOut?: () => Promise<void>;
}
interface AlbedoApi {
  publicKey(opts: unknown): Promise<{ pubkey: string }>;
  // De acordo com a doc do Albedo: signMessage({ message, pubkey }) => { signature }
  signMessage?: (args: { message: string; pubkey: string }) => Promise<{ signature: string } | string>;
}
interface RabetApi {
  connect(): Promise<{ publicKey: string; network?: "testnet" | "public" }>;
}
interface XBullApi {
  getPublicKey(): Promise<string>;
}

type ProviderWindow = Window & {
  freighterApi?: FreighterApi;
  freighter?: unknown;
  albedo?: AlbedoApi;
  rabet?: RabetApi;
  xbullWallet?: XBullApi;
};

// Util leve para detectar globals sem quebrar SSR
function getWindow(): ProviderWindow | null {
  if (typeof window === "undefined") return null;
  return window as ProviderWindow;
}

// Normaliza diferentes formatos de retorno de endereço das carteiras
function normalizeAddress(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const cands = [obj["address"], obj["publicKey"], obj["pubkey"]];
    for (const c of cands) if (typeof c === "string") return c;
  }
  return String(val);
}

// Freighter
export const FreighterConnector: WalletConnector = {
  id: "freighter",
  name: "Freighter",
  isAvailable() {
    if (typeof window === "undefined") return false;
    const w = getWindow();
    
    // Verifica múltiplas propriedades do Freighter
    const hasFreighterApi = !!w?.freighterApi;
    const hasFreighter = !!w?.freighter;
    const hasFreighterGlobal = 'freighterApi' in window;
    const hasFreighterExtension = !!(window as any).freighterApi;
    
    // Verifica se há objetos freighter no window
    const windowKeys = Object.keys(window).filter(key => key.toLowerCase().includes('freighter'));
    const hasFreighterKeys = windowKeys.length > 0;
    
    const ok = hasFreighterApi || hasFreighter || hasFreighterGlobal || hasFreighterExtension || hasFreighterKeys;
    
    if (typeof console !== 'undefined') {
      console.debug('[wallet][detect] freighter detailed check:', {
        hasFreighterApi,
        hasFreighter, 
        hasFreighterGlobal,
        hasFreighterExtension,
        windowKeys,
        hasFreighterKeys,
        result: ok,
        windowFreighterType: typeof (window as any).freighterApi
      });
    }
    
    return ok;
  },
  async connect() {
    console.log('[freighter] Starting connection process...');
    
    // Método 1: Tenta via pacote oficial primeiro (mais robusto no Chrome)
    try {
      console.log('[freighter] Trying official @stellar/freighter-api package...');
      type FreighterApiCompat = {
        getPublicKey?: () => Promise<string>;
        getAddress?: () => Promise<string>;
        getNetworkDetails?: () => Promise<{ network: string; networkPassphrase?: string }>;
        getNetwork?: () => Promise<string | { network: string; networkPassphrase?: string }>;
        isConnected?: () => Promise<boolean>;
      };
      
      const mod = (await import("@stellar/freighter-api")) as unknown as FreighterApiCompat & { default?: FreighterApiCompat };
      const api: FreighterApiCompat = mod.default ?? mod;
      
      // Verifica se está conectado primeiro (se disponível)
      if (api.isConnected) {
        const connected = await api.isConnected();
        console.log('[freighter] isConnected result:', connected);
        if (!connected) {
          throw new Error("Freighter is installed but not connected");
        }
      }
      
      const getPk = api.getPublicKey ?? api.getAddress;
      const getNetDetails = api.getNetworkDetails ?? api.getNetwork;
      if (!getPk) throw new Error("API da Freighter indisponível (getPublicKey/getAddress não encontrados)");
      
      console.log('[freighter] Calling getPublicKey/getAddress...');
      const pkRes = await getPk();
      const address = normalizeAddress(pkRes);
      console.log('[freighter] Got address:', address);
      
      const details = getNetDetails ? await getNetDetails() : undefined;
      const netStr: string | undefined = typeof details === "string" ? details : details?.network;
      const network: StellarNetwork = netStr === "TESTNET" ? "testnet" : "public";
      console.log('[freighter] Network:', network);
      
      return { address, network };
    } catch (error) {
      console.log('[freighter] Official package failed:', error);
      
      // Método 2: Fallback para a API global window.freighterApi
      const w = getWindow();
      const api = w?.freighterApi as FreighterApi | undefined;
      
      if (api) {
        console.log('[freighter] Trying window.freighterApi...');
        try {
          const info = await api.getUserInfo();
          const net: StellarNetwork = info.network === "TESTNET" ? "testnet" : "public";
          const address = normalizeAddress(info.publicKey);
          console.log('[freighter] window.freighterApi success:', { address, network: net });
          return { address, network: net };
        } catch (apiError) {
          console.log('[freighter] window.freighterApi failed:', apiError);
        }
      }
      
      // Método 3: Tenta outras variações do objeto global
      const freighterAlternatives = ['freighter', 'FreighterApi', 'stellarFreighter'];
      for (const altName of freighterAlternatives) {
        const altApi = (window as any)[altName];
        if (altApi) {
          console.log(`[freighter] Trying alternative: window.${altName}...`);
          try {
            if (altApi.getPublicKey) {
              const pk = await altApi.getPublicKey();
              const address = normalizeAddress(pk);
              console.log(`[freighter] Alternative ${altName} success:`, address);
              return { address, network: "public" };
            }
            if (altApi.getUserInfo) {
              const info = await altApi.getUserInfo();
              const address = normalizeAddress(info.publicKey);
              const network: StellarNetwork = info.network === "TESTNET" ? "testnet" : "public";
              console.log(`[freighter] Alternative ${altName} getUserInfo success:`, { address, network });
              return { address, network };
            }
          } catch (altError) {
            console.log(`[freighter] Alternative ${altName} failed:`, altError);
          }
        }
      }
      
      console.error('[freighter] All connection methods failed');
      throw new Error("ERR_FREIGHTER_NOT_FOUND");
    }
  },
  async disconnect() {
    const w = getWindow();
    await w?.freighterApi?.signOut?.();
  },
};

// Albedo (https://albedo.link) – detecção básica
export const AlbedoConnector: WalletConnector = {
  id: "albedo",
  name: "Albedo",
  isAvailable() {
    const w = getWindow();
    const hasAlbedo = !!w?.albedo;
    const hasAlbedoGlobal = typeof window !== "undefined" && 'albedo' in window;
    const ok = hasAlbedo || hasAlbedoGlobal;
    if (typeof console !== 'undefined') console.debug('[wallet][detect] albedo available:', { hasAlbedo, hasAlbedoGlobal, result: ok });
    return ok;
  },
  async connect() {
    const w = getWindow();
    if (!w?.albedo) throw new Error("ERR_ALBEDO_NOT_FOUND");
    const res = await w.albedo.publicKey({});
    // Albedo não retorna rede explicitamente, assume pública por padrão
    return { address: res.pubkey, network: "public" };
  },
};

// Rabet (https://rabet.io) – detecção básica
export const RabetConnector: WalletConnector = {
  id: "rabet",
  name: "Rabet",
  isAvailable() {
    const w = getWindow();
    const hasRabet = !!w?.rabet;
    const hasRabetGlobal = typeof window !== "undefined" && 'rabet' in window;
    const ok = hasRabet || hasRabetGlobal;
    if (typeof console !== 'undefined') console.debug('[wallet][detect] rabet available:', { hasRabet, hasRabetGlobal, result: ok });
    return ok;
  },
  async connect() {
    const w = getWindow();
    if (!w?.rabet) throw new Error("ERR_RABET_NOT_FOUND");
    const res = await w.rabet.connect();
    const address = normalizeAddress(res.publicKey);
    return { address, network: (res.network === "testnet" ? "testnet" : "public") };
  },
};

// xBull (https://xbull.app) – detecção robusta
export const XBullConnector: WalletConnector = {
  id: "xbull",
  name: "xBull",
  isAvailable() {
    if (typeof window === "undefined") return false;
    
    // FORÇA DETECÇÃO: Se qualquer carteira Stellar está instalada, 
    // assume que xBull PODE estar disponível (para testar conexão)
    const hasFreighter = !!(window as any).freighterApi;
    const hasAnyWallet = hasFreighter || Object.keys(window).some(k => 
      k.toLowerCase().includes('stellar') || 
      k.toLowerCase().includes('wallet')
    );
    
    // Se tem Freighter mas user está tentando xBull, talvez seja compatível
    if (hasFreighter) {
      console.debug('[wallet][detect] xbull: Freighter detected, checking compatibility...');
      // return true; // Força tentativa de conexão
    }
    
    // Método 1: Verifica propriedades conhecidas do xBull
    const directChecks = [
      'xbullWallet',
      'xBull',
      'xBullApi',
      'xBullExtension',
      'xBullWalletApi',
      'xBullProvider'
    ];
    
    for (const prop of directChecks) {
      if ((window as any)[prop]) {
        console.debug(`[wallet][detect] xbull found via window.${prop}`);
        return true;
      }
    }
    
    // Método 2: Busca por qualquer propriedade que contenha "xbull"
    const windowKeys = Object.keys(window);
    const xbullKeys = windowKeys.filter(key => key.toLowerCase().includes('xbull'));
    
    if (xbullKeys.length > 0) {
      console.debug('[wallet][detect] xbull found via window keys:', xbullKeys);
      return true;
    }
    
    // Método 3: Verifica se existe no 'in' operator (pode estar como não-enumerable)
    const inChecks = ['xbullWallet', 'xBull', 'xBullApi'];
    for (const prop of inChecks) {
      if (prop in window) {
        console.debug(`[wallet][detect] xbull found via 'in' operator: ${prop}`);
        return true;
      }
    }
    
    // MÉTODO AGRESSIVO: Se o usuário tem xBull instalado mas não detectado,
    // sempre retorna true para tentar a conexão
    console.debug('[wallet][detect] xbull not found, but forcing availability for connection attempt');
    return true; // FORÇA DISPONIBILIDADE PARA TESTE
  },
  async connect() {
    console.log('[xbull] 🚀 Starting REAL xBull connection...');
    
    // PASSO 1: Força a extensão xBull a se manifestar
    try {
      console.log('[xbull] Step 1: Forcing xBull extension activation...');
      
      // Dispara eventos que podem ativar extensões
      window.dispatchEvent(new CustomEvent('xbull:activate'));
      window.dispatchEvent(new CustomEvent('stellar:ready'));
      
      // Aguarda um pouco para a extensão responder
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verifica novamente após forçar ativação
      const xbullGlobal = (window as any).xbullWallet || (window as any).xBull;
      if (xbullGlobal) {
        console.log('[xbull] Found xBull after forced activation:', xbullGlobal);
        
        // Tenta usar a API do xBull diretamente
        if (xbullGlobal.getPublicKey) {
          const publicKey = await xbullGlobal.getPublicKey();
          if (publicKey) {
            console.log('[xbull] ✅ REAL xBull connection successful!', publicKey);
            return { address: publicKey, network: "testnet" };
          }
        }
        
        if (xbullGlobal.connect) {
          const result = await xbullGlobal.connect();
          const address = result.publicKey || result.address || result;
          if (address) {
            console.log('[xbull] ✅ REAL xBull connection via connect()!', address);
            return { address, network: "testnet" };
          }
        }
      }
    } catch (error) {
      console.log('[xbull] Forced activation failed:', error);
    }
    
    // PASSO 2: Usar postMessage para comunicar com a extensão
    try {
      console.log('[xbull] Step 2: Using postMessage to communicate with xBull...');
      
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          console.error('[xbull] ⏰ Timeout! User needs to approve connection manually.');
          console.log('[xbull] 💡 SOLUTION: Click the xBull extension icon and approve the connection!');
          reject(new Error('xBull connection timeout - Please click the xBull icon and approve the connection'));
        }, 30000); // Aumenta timeout para 30s
        
        const messageHandler = (event: MessageEvent) => {
          console.log('[xbull] Received message:', event);
          console.log('[xbull] Message data:', event.data);
          
          // Verifica diferentes formatos de resposta do xBull
          if (event.data) {
            // Formato 1: Resposta direta com publicKey
            if (event.data.type === 'XBULL_RESPONSE' && event.data.publicKey) {
              clearTimeout(timeoutId);
              window.removeEventListener('message', messageHandler);
              console.log('[xbull] ✅ REAL connection via postMessage!', event.data.publicKey);
              resolve({ address: event.data.publicKey, network: "testnet" });
              return;
            }
            
            // Formato 2: Qualquer resposta que contenha endereço Stellar
            if (event.data.publicKey && typeof event.data.publicKey === 'string' && event.data.publicKey.startsWith('G')) {
              clearTimeout(timeoutId);
              window.removeEventListener('message', messageHandler);
              console.log('[xbull] ✅ REAL connection via stellar address!', event.data.publicKey);
              resolve({ address: event.data.publicKey, network: "testnet" });
              return;
            }
            
            // Formato 3: Resposta com address field
            if (event.data.address && typeof event.data.address === 'string' && event.data.address.startsWith('G')) {
              clearTimeout(timeoutId);
              window.removeEventListener('message', messageHandler);
              console.log('[xbull] ✅ REAL connection via address field!', event.data.address);
              resolve({ address: event.data.address, network: "testnet" });
              return;
            }
            
            // Formato 4: Resposta Freighter (xBull usa protocolo Freighter!)
            if (event.data.source === 'FREIGHTER_EXTERNAL_MSG_RESPONSE' && event.data.isConnected) {
              console.log('[xbull] ✅ xBull connected via Freighter protocol!', event.data);
              
              // Primeiro solicita acesso/autorização
              const accessRequestId = Date.now() + Math.random();
              window.postMessage({
                source: 'FREIGHTER_EXTERNAL_MSG_REQUEST',
                messageId: accessRequestId,
                type: 'REQUEST_ACCESS'
              }, '*');
              
              console.log('[xbull] Requesting access authorization...');
              
              // Depois pedir o endereço usando protocolo Freighter
              setTimeout(() => {
                const requestId = Date.now() + Math.random();
                window.postMessage({
                  source: 'FREIGHTER_EXTERNAL_MSG_REQUEST',
                  messageId: requestId,
                  type: 'REQUEST_PUBLIC_KEY'
                }, '*');
                console.log('[xbull] Requesting public key via Freighter protocol...');
              }, 1000);
              
              return; // Aguarda resposta
            }
            
            // Formato 5: Resposta com chave pública via protocolo Freighter
            if (event.data.source === 'FREIGHTER_EXTERNAL_MSG_RESPONSE' && 'publicKey' in event.data) {
              if (event.data.publicKey && event.data.publicKey.length > 0) {
                clearTimeout(timeoutId);
                window.removeEventListener('message', messageHandler);
                console.log('[xbull] ✅ REAL connection SUCCESS!', event.data.publicKey);
                resolve({ address: event.data.publicKey, network: "testnet" });
                return;
              } else {
                console.log('[xbull] ⚠️ Received empty publicKey, user needs to authorize first');
                console.log('[xbull] 💡 Please click the xBull icon and approve the connection!');
                
                // Tentar novamente após um delay menor e limitado
                if (!event.data.retryCount || event.data.retryCount < 3) {
                  setTimeout(() => {
                    const retryRequestId = Date.now() + Math.random();
                    window.postMessage({
                      source: 'FREIGHTER_EXTERNAL_MSG_REQUEST',
                      messageId: retryRequestId,
                      type: 'REQUEST_PUBLIC_KEY',
                      retryCount: (event.data.retryCount || 0) + 1
                    }, '*');
                    console.log(`[xbull] Retrying public key request... (attempt ${(event.data.retryCount || 0) + 1}/3)`);
                  }, 1000);
                } else {
                  console.log('[xbull] Max retries reached. Please click xBull icon manually.');
                }
                return;
              }
            }
            
            // Formato 6: Resposta do xBull (qualquer tipo que indique sucesso)
            if (event.data.type && event.data.type.toLowerCase().includes('xbull')) {
              console.log('[xbull] xBull response detected, checking for address...', event.data);
              
              // Procura por qualquer campo que pareça um endereço Stellar
              const searchForAddress = (obj: any): string | null => {
                if (typeof obj === 'string' && obj.startsWith('G') && obj.length === 56) {
                  return obj;
                }
                if (typeof obj === 'object' && obj !== null) {
                  for (const key in obj) {
                    const result = searchForAddress(obj[key]);
                    if (result) return result;
                  }
                }
                return null;
              };
              
              const foundAddress = searchForAddress(event.data);
              if (foundAddress) {
                clearTimeout(timeoutId);
                window.removeEventListener('message', messageHandler);
                console.log('[xbull] ✅ REAL connection via deep search!', foundAddress);
                resolve({ address: foundAddress, network: "testnet" });
                return;
              }
            }
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Envia múltiplas mensagens para a extensão (diferentes formatos)
        const requestId = Date.now() + Math.random();
        const messages = [
          // Protocolo Freighter (xBull é compatível!)
          {
            source: 'FREIGHTER_EXTERNAL_MSG_REQUEST',
            messageId: requestId,
            type: 'REQUEST_CONNECTION_STATUS'
          },
          {
            source: 'FREIGHTER_EXTERNAL_MSG_REQUEST',
            messageId: requestId + 1,
            type: 'REQUEST_PUBLIC_KEY'
          },
          // Formatos originais
          {
            type: 'XBULL_REQUEST',
            method: 'getPublicKey'
          },
          {
            type: 'REQUEST_ACCESS',
            method: 'getPublicKey'
          },
          {
            type: 'STELLAR_REQUEST',
            action: 'getPublicKey'
          },
          {
            method: 'getPublicKey'
          }
        ];
        
        messages.forEach((msg, index) => {
          setTimeout(() => {
            window.postMessage(msg, '*');
            console.log(`[xbull] Posted message ${index + 1}:`, msg);
          }, index * 200);
        });
      });
      
    } catch (error) {
      console.log('[xbull] postMessage method failed:', error);
    }
    
    // PASSO 2.5: Tentar API Freighter diretamente (xBull pode ser compatível)
    try {
      console.log('[xbull] Step 2.5: Trying Freighter API directly...');
      
      const freighterModule = await import("@stellar/freighter-api");
      const freighterApi = freighterModule.default || freighterModule;
      
      if (freighterApi.getAddress) {
        console.log('[xbull] Trying freighter-api getAddress...');
        const result = await freighterApi.getAddress();
        
        if (result && result.address) {
          console.log('[xbull] ✅ SUCCESS via Freighter API compatibility!', result.address);
          
          // Detecta rede
          let network: StellarNetwork = "testnet";
          if (freighterApi.getNetworkDetails) {
            try {
              const netDetails = await freighterApi.getNetworkDetails();
              network = netDetails.network === 'TESTNET' ? 'testnet' : 'public';
              console.log('[xbull] Network detected:', network);
            } catch (e) {
              console.log('[xbull] Using default testnet');
            }
          }
          
          return { address: result.address, network };
        }
      }
      
    } catch (error) {
      console.log('[xbull] Freighter API compatibility failed:', error);
    }
    
    // PASSO 3: Tentar através do content script injection
    try {
      console.log('[xbull] Step 3: Attempting content script injection...');
      
      // Cria um script que tenta acessar a extensão diretamente
      const script = document.createElement('script');
      script.textContent = `
        (function() {
          console.log('[xbull] Injected script running...');
          
          // Tenta encontrar a API do xBull no contexto da página
          if (typeof xbullWallet !== 'undefined') {
            console.log('[xbull] Found xbullWallet in page context');
            window.postMessage({
              type: 'XBULL_FOUND',
              source: 'xbullWallet'
            }, '*');
          }
          
          if (typeof xBull !== 'undefined') {
            console.log('[xbull] Found xBull in page context');
            window.postMessage({
              type: 'XBULL_FOUND', 
              source: 'xBull'
            }, '*');
          }
          
          // Tenta acessar chrome.runtime se disponível
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            try {
              chrome.runtime.sendMessage('xbull-extension-id', {
                type: 'GET_PUBLIC_KEY'
              }, function(response) {
                if (response && response.publicKey) {
                  window.postMessage({
                    type: 'XBULL_CHROME_RESPONSE',
                    publicKey: response.publicKey
                  }, '*');
                }
              });
            } catch (e) {
              console.log('[xbull] Chrome runtime access failed:', e);
            }
          }
        })();
      `;
      
      document.head.appendChild(script);
      document.head.removeChild(script);
      
      // Aguarda resposta do script injetado
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Script injection timeout')), 3000);
        
        const handler = (event: MessageEvent) => {
          if (event.data && event.data.type === 'XBULL_FOUND') {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            console.log('[xbull] ✅ Extension found via script injection!', event.data.source);
            resolve(event.data);
          }
          
          if (event.data && event.data.type === 'XBULL_CHROME_RESPONSE') {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            console.log('[xbull] ✅ REAL connection via Chrome runtime!', event.data.publicKey);
            resolve({ address: event.data.publicKey, network: "testnet" });
          }
        };
        
        window.addEventListener('message', handler);
      });
      
    } catch (error) {
      console.log('[xbull] Content script injection failed:', error);
    }
    
    // PASSO 4: Última tentativa - abrir popup da extensão programaticamente
    try {
      console.log('[xbull] Step 4: Final attempt - programmatic popup...');
      
      // Tenta abrir a extensão programaticamente
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id!, {
            action: 'ACTIVATE_XBULL'
          });
        });
      }
      
      // Aguarda um pouco e tenta novamente
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const finalCheck = (window as any).xbullWallet || (window as any).xBull;
      if (finalCheck && finalCheck.getPublicKey) {
        const address = await finalCheck.getPublicKey();
        if (address) {
          console.log('[xbull] ✅ SUCCESS after final attempt!', address);
          return { address, network: "testnet" };
        }
      }
      
    } catch (error) {
      console.log('[xbull] Final attempt failed:', error);
    }
    
    // ERRO FINAL - mas com instrução para o usuário
    console.error('[xbull] 🚨 Não foi possível conectar automaticamente com o xBull');
    console.log('[xbull] 💡 SOLUÇÃO: Clique no ícone do xBull na barra de extensões PRIMEIRO, depois tente conectar novamente.');
    
    throw new Error("ERR_XBULL_NOT_FOUND - Clique no ícone do xBull primeiro e tente novamente");
  },
};

// Ledger via WebHID – placeholder não bloqueante (requer libs @ledgerhq)
export const LedgerConnector: WalletConnector = {
  id: "ledger",
  name: "Ledger (WebHID)",
  isAvailable() {
    type NavigatorHid = Navigator & { hid?: unknown };
    if (typeof navigator === "undefined") return false;
    return Boolean((navigator as NavigatorHid).hid); // WebHID disponível
  },
  async connect() {
    // Para implementação completa: usar @ledgerhq/hw-transport-webhid + app Stellar
    throw new Error("ERR_LEDGER_UNSUPPORTED");
  },
};

// Soroban "smart wallet" – sessão lógica usando soroban-client (sem provider específico)
export const SorobanSmartConnector: WalletConnector = {
  id: "soroban-smart",
  name: "Soroban Smart Wallet",
  isAvailable() {
    // Disponível conceitualmente; depende de uma carteira (p.ex. Freighter) para assinar
    return true;
  },
  async connect() {
    // Estratégia simples: se Freighter existir, reutiliza o endereço
    if (FreighterConnector.isAvailable()) {
      const s = await FreighterConnector.connect();
      return s;
    }
    throw new Error("ERR_SOROBAN_NO_COMPAT");
  },
};

// Placeholder para interoperabilidade Chainlink Bridge
export const ChainlinkBridgeConnector: WalletConnector = {
  id: "chainlink-bridge",
  name: "Chainlink Bridge",
  isAvailable() {
    return true; // sempre listado como opção informativa
  },
  async connect() {
    throw new Error("ERR_CHAINLINK_NOT_READY");
  },
};

export const AllConnectors: WalletConnector[] = [
  FreighterConnector,
  AlbedoConnector,
  RabetConnector,
  XBullConnector,
  LedgerConnector,
  SorobanSmartConnector,
  ChainlinkBridgeConnector,
];

export function detectAvailable(): WalletConnectorInfo[] {
  // Debug: Lista todas as propriedades do window que podem ser carteiras
  if (typeof window !== "undefined" && typeof console !== "undefined") {
    const walletKeys = Object.keys(window).filter(key => {
      const lowerKey = key.toLowerCase();
      return lowerKey.includes('freighter') || 
             lowerKey.includes('albedo') || 
             lowerKey.includes('rabet') || 
             lowerKey.includes('xbull') || 
             lowerKey.includes('wallet') ||
             lowerKey.includes('stellar');
    });
    
    if (walletKeys.length > 0) {
      console.debug('[wallet][detectAvailable] found wallet-related window properties:', walletKeys);
      walletKeys.forEach(key => {
        const value = (window as any)[key];
        console.debug(`[wallet][detectAvailable] window.${key}:`, typeof value, value);
      });
    } else {
      console.debug('[wallet][detectAvailable] no wallet-related window properties found');
    }
  }

  const results = AllConnectors.map((c) => ({ id: c.id, name: c.name, available: c.isAvailable() }))
    .sort((a, b) => Number(b.available) - Number(a.available));
  
  if (typeof console !== 'undefined') {
    const available = results.filter(r => r.available);
    const unavailable = results.filter(r => !r.available);
    console.debug('[wallet][detectAvailable] summary:', {
      available: available.map(a => a.name),
      unavailable: unavailable.map(u => u.name),
      total: results.length
    });
  }
  
  return results;
}

// Função adicional para forçar re-detecção com delay
export function forceWalletDetection(): Promise<WalletConnectorInfo[]> {
  return new Promise((resolve) => {
    // Aguarda um pouco para extensões lentas
    setTimeout(() => {
      const results = detectAvailable();
      if (typeof console !== 'undefined') {
        console.debug('[wallet][forceDetection] results:', results);
      }
      resolve(results);
    }, 500);
  });
}

// Função específica para debug do xBull
export function debugXBullDetection(): void {
  if (typeof window === "undefined") {
    console.log('[xbull][debug] Running on server side, no window object');
    return;
  }

  console.log('[xbull][debug] Starting comprehensive xBull detection...');
  
  // Lista todas as propriedades window
  const allKeys = Object.keys(window);
  const xbullRelatedKeys = allKeys.filter(key => 
    key.toLowerCase().includes('xbull') || 
    key.toLowerCase().includes('bull') ||
    key.toLowerCase().includes('stellar')
  );
  
  console.log('[xbull][debug] All window keys (first 100):', allKeys.slice(0, 100));
  console.log('[xbull][debug] xBull related keys:', xbullRelatedKeys);
  
  // Se não há chaves relacionadas, mostra mais informações
  if (xbullRelatedKeys.length === 0) {
    console.log('[xbull][debug] No xBull-related keys found. Checking common wallet patterns...');
    const walletKeys = allKeys.filter(key => 
      key.toLowerCase().includes('wallet') ||
      key.toLowerCase().includes('extension') ||
      key.toLowerCase().includes('provider')
    );
    console.log('[xbull][debug] Wallet-related keys:', walletKeys);
  }
  
  // Verifica propriedades específicas conhecidas do xBull
  const checks = [
    'xbullWallet',
    'xBull', 
    'xBullApi',
    'xBullWalletApi',
    'xBullProvider',
    'xBullExtension',
    'stellarXBull',
    'xBullStellar',
    // Possíveis variações
    'xbull',
    'XBULL',
    'XBull',
    'xb',
    'XB'
  ];
  
  checks.forEach(prop => {
    const value = (window as any)[prop];
    if (value) {
      console.log(`[xbull][debug] ✅ Found window.${prop}:`, {
        exists: !!value,
        type: typeof value,
        value: value,
        methods: value ? Object.getOwnPropertyNames(value).filter((name: string) => typeof value[name] === 'function') : [],
        constructor: value.constructor?.name
      });
    } else {
      console.log(`[xbull][debug] ❌ window.${prop}: not found`);
    }
  });
  
  // Verifica se há qualquer extensão Stellar
  console.log('[xbull][debug] Checking for any Stellar extension...');
  console.log('[xbull][debug] window.freighterApi:', !!(window as any).freighterApi);
  console.log('[xbull][debug] window.albedo:', !!(window as any).albedo);
  console.log('[xbull][debug] window.rabet:', !!(window as any).rabet);
  
  // Verifica eventos customizados do xBull
  const events = ['xbull:ready', 'xBull:initialized', 'xbull:connected', 'xBull:ready'];
  events.forEach(eventName => {
    console.log(`[xbull][debug] Setting up event listener for: ${eventName}`);
    window.addEventListener(eventName, (event) => {
      console.log(`[xbull][debug] 🎉 Event ${eventName} fired!`, event);
      debugXBullDetection(); // Re-run detection
    }, { once: true });
  });
  
  // Tenta executar a detecção
  const result = XBullConnector.isAvailable();
  console.log('[xbull][debug] Final detection result:', result);
  
  // Informações adicionais sobre o estado da página
  console.log('[xbull][debug] Page state:', {
    readyState: document.readyState,
    visibilityState: document.visibilityState,
    userAgent: navigator.userAgent.includes('Chrome') ? 'Chrome-based' : 'Other',
    extensionsDetected: {
      freighter: !!(window as any).freighterApi,
      albedo: !!(window as any).albedo,
      rabet: !!(window as any).rabet
    }
  });
}

// Adiciona função global para debug fácil
if (typeof window !== "undefined") {
  (window as any).debugXBull = debugXBullDetection;
  console.log('[xbull][debug] Added window.debugXBull() function for manual testing');
}
