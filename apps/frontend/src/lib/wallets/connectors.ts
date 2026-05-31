/*
  Connector layer for multiple Stellar/Soroban wallets.
  Implements lightweight browser detection and minimal methods to get address and network.
  Connections that depend on external libs are left as non-blocking stubs.
*/

export type StellarNetwork = "public" | "testnet";

export type WalletType =
  | "freighter"
  | "albedo"
  | "rabet"
  | "xbull"
  | "ledger"
  | "soroban-smart";

export interface WalletConnectorInfo {
  id: WalletType;
  name: string;
  available: boolean;
  providerHint?: string;
}

export type WalletProviderHint =
  | "installed"
  | "needs-unlock"
  | "needs-open-extension"
  | "try-connect"
  | "web-wallet"
  | "absent"
  | "webhid-ready"
  | "webhid-unavailable";

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

// Minimal types of global providers
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

type FreighterApiCompat = {
  getPublicKey?: () => Promise<string>;
  getAddress?: () => Promise<string | { address?: string; error?: unknown }>;
  requestAccess?: () => Promise<string | { address?: string; error?: unknown }>;
  isAllowed?: () => Promise<boolean | { isAllowed?: boolean; error?: unknown }>;
  getNetworkDetails?: () => Promise<{ network: string; networkPassphrase?: string }>;
  getNetwork?: () => Promise<string | { network: string; networkPassphrase?: string }>;
  isConnected?: () => Promise<boolean | { isConnected?: boolean }>;
};

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

// Normalize different wallet address return formats
function normalizeAddress(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const cands = [obj["address"], obj["publicKey"], obj["pubkey"]];
    for (const c of cands) if (typeof c === "string") return c;
  }
  return String(val);
}

function extractBoolean(val: unknown, key = "isConnected"): boolean {
  if (typeof val === "boolean") return val;
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (typeof obj[key] === "boolean") return obj[key] as boolean;
  }
  return false;
}

function isValidStellarAddress(address: string): boolean {
  return typeof address === "string" && /^G[A-Z2-7]{55}$/.test(address);
}

function extractApiErrorMessage(val: unknown): string | null {
  if (!val || typeof val !== "object") return null;
  const obj = val as Record<string, unknown>;
  const errorVal = obj.error;
  if (!errorVal) return null;
  if (typeof errorVal === "string") return errorVal;
  if (typeof errorVal === "object" && errorVal !== null) {
    const maybeMsg = (errorVal as Record<string, unknown>).message;
    if (typeof maybeMsg === "string") return maybeMsg;
  }
  return String(errorVal);
}

let freighterApiLoader: Promise<FreighterApiCompat> | null = null;

async function loadFreighterApi(): Promise<FreighterApiCompat> {
  if (!freighterApiLoader) {
    freighterApiLoader = import("@stellar/freighter-api")
      .then((mod) => {
        const api = (mod as { default?: FreighterApiCompat }).default ?? (mod as unknown as FreighterApiCompat);
        return api;
      })
      .catch((error) => {
        // Reset cache so a new attempt can happen after HMR settles.
        freighterApiLoader = null;
        throw error;
      });
  }
  return freighterApiLoader;
}

// Freighter
export const FreighterConnector: WalletConnector = {
  id: "freighter",
  name: "Freighter",
  isAvailable() {
    if (typeof window === "undefined") return false;
    const w = getWindow();
    
    // Check multiple Freighter properties
    const hasFreighterApi = !!w?.freighterApi;
    const hasFreighter = !!w?.freighter;
    const hasFreighterGlobal = 'freighterApi' in window;
    const hasFreighterExtension = !!(window as any).freighterApi;
    
    // Check if freighter objects exist on window
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
    
    // Method 1: Try via official package first (more robust in Chrome)
    try {
      console.log('[freighter] Trying official @stellar/freighter-api package...');
      let api: FreighterApiCompat;
      try {
        api = await loadFreighterApi();
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message.includes('deleted by an HMR update')) {
          // Retry once after invalidating cache; common during Fast Refresh.
          freighterApiLoader = null;
          api = await loadFreighterApi();
        } else {
          throw e;
        }
      }
      
      // Check connection status first (when available), but do not fail early:
      // requestAccess/getAddress below can establish authorization.
      if (api.isConnected) {
        const connectedRes = await api.isConnected();
        const connected = extractBoolean(connectedRes);
        console.log('[freighter] isConnected result:', connectedRes);
        if (!connected) {
          console.log('[freighter] Not connected yet, attempting requestAccess/getAddress flow...');
        }
      }
      
      const getNetDetails = api.getNetworkDetails ?? api.getNetwork;

      const tryReadAddress = async (fn: (() => Promise<unknown>) | undefined, label: string): Promise<string | null> => {
        if (!fn) return null;
        const res = await fn();
        const apiErr = extractApiErrorMessage(res);
        const address = normalizeAddress(res).trim();
        console.log(`[freighter] ${label} result:`, res);
        if (apiErr) {
          throw new Error(`ERR_FREIGHTER_API:${apiErr}`);
        }
        if (isValidStellarAddress(address)) {
          return address;
        }
        return null;
      };

      let address: string | null = null;

      // v4 flow: first try existing authorization state.
      address = await tryReadAddress(api.getAddress, "getAddress");

      // If not authorized yet, request access explicitly and capture address from response.
      if (!address) {
        const allowedRes = api.isAllowed ? await api.isAllowed() : null;
        const isAllowed = extractBoolean(allowedRes, "isAllowed");
        console.log('[freighter] isAllowed result:', allowedRes);

        if (!isAllowed && api.requestAccess) {
          address = await tryReadAddress(api.requestAccess, "requestAccess");
        }
      }

      // Compatibility fallback.
      if (!address) {
        address = await tryReadAddress(api.getPublicKey, "getPublicKey");
      }

      if (!address) {
        throw new Error("ERR_FREIGHTER_NO_PUBKEY");
      }
      
      const details = getNetDetails ? await getNetDetails() : undefined;
      const netStr: string | undefined = typeof details === "string" ? details : details?.network;
      const network: StellarNetwork = netStr === "TESTNET" ? "testnet" : "public";
      console.log('[freighter] Network:', network);
      
      return { address, network };
    } catch (error) {
      let lastError: unknown = error;
      console.log('[freighter] Official package failed:', error);
      
      // Method 2: Fallback to global window.freighterApi API
      const w = getWindow();
      const api = w?.freighterApi as FreighterApi | undefined;
      
      if (api) {
        console.log('[freighter] Trying window.freighterApi...');
        try {
          const info = await api.getUserInfo();
          const net: StellarNetwork = info.network === "TESTNET" ? "testnet" : "public";
          const address = normalizeAddress(info.publicKey);
          if (!isValidStellarAddress(address)) {
            throw new Error("ERR_FREIGHTER_NO_PUBKEY");
          }
          console.log('[freighter] window.freighterApi success:', { address, network: net });
          return { address, network: net };
        } catch (apiError) {
          lastError = apiError;
          console.log('[freighter] window.freighterApi failed:', apiError);
        }
      }
      
      // Method 3: Try other variations of the global object
      const freighterAlternatives = ['freighter', 'FreighterApi', 'stellarFreighter'];
      for (const altName of freighterAlternatives) {
        const altApi = (window as any)[altName];
        if (altApi) {
          console.log(`[freighter] Trying alternative: window.${altName}...`);
          try {
            if (altApi.getPublicKey) {
              const pk = await altApi.getPublicKey();
              const address = normalizeAddress(pk);
              if (!isValidStellarAddress(address)) {
                throw new Error("ERR_FREIGHTER_NO_PUBKEY");
              }
              console.log(`[freighter] Alternative ${altName} success:`, address);
              return { address, network: "public" };
            }
            if (altApi.getUserInfo) {
              const info = await altApi.getUserInfo();
              const address = normalizeAddress(info.publicKey);
              if (!isValidStellarAddress(address)) {
                throw new Error("ERR_FREIGHTER_NO_PUBKEY");
              }
              const network: StellarNetwork = info.network === "TESTNET" ? "testnet" : "public";
              console.log(`[freighter] Alternative ${altName} getUserInfo success:`, { address, network });
              return { address, network };
            }
          } catch (altError) {
            lastError = altError;
            console.log(`[freighter] Alternative ${altName} failed:`, altError);
          }
        }
      }
      
      console.warn('[freighter] All connection methods failed');
      if (lastError instanceof Error && lastError.message) {
        throw lastError;
      }
      throw new Error("ERR_FREIGHTER_NOT_FOUND");
    }
  },
  async disconnect() {
    const w = getWindow();
    await w?.freighterApi?.signOut?.();
  },
};

// Albedo (https://albedo.link) – basic detection
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
    // Albedo does not return network explicitly, assume public by default
    return { address: res.pubkey, network: "public" };
  },
};

// Rabet (https://rabet.io) – basic detection
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

// xBull (https://xbull.app) – robust detection
export const XBullConnector: WalletConnector = {
  id: "xbull",
  name: "xBull",
  isAvailable() {
    if (typeof window === "undefined") return false;
    
    // FORCE DETECTION: If any Stellar wallet is installed,
    // assume xBull MIGHT be available (to test connection)
    const hasFreighter = !!(window as any).freighterApi;
    const hasAnyWallet = hasFreighter || Object.keys(window).some(k => 
      k.toLowerCase().includes('stellar') || 
      k.toLowerCase().includes('wallet')
    );
    
    // If Freighter exists but the user is trying xBull, it might still be compatible
    if (hasFreighter) {
      console.debug('[wallet][detect] xbull: Freighter detected, checking compatibility...');
      // return true; // Force connection attempt
    }
    
    // Method 1: Check known xBull properties
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
    
    // Method 2: Search for any property containing "xbull"
    const windowKeys = Object.keys(window);
    const xbullKeys = windowKeys.filter(key => key.toLowerCase().includes('xbull'));
    
    if (xbullKeys.length > 0) {
      console.debug('[wallet][detect] xbull found via window keys:', xbullKeys);
      return true;
    }
    
    // Method 3: Check if exists in 'in' operator (may be non-enumerable)
    const inChecks = ['xbullWallet', 'xBull', 'xBullApi'];
    for (const prop of inChecks) {
      if (prop in window) {
        console.debug(`[wallet][detect] xbull found via 'in' operator: ${prop}`);
        return true;
      }
    }
    
    console.debug('[wallet][detect] xbull not found');
    return false;
  },
  async connect() {
    console.log('[xbull] 🚀 Starting REAL xBull connection...');
    
    // STEP 1: Force the xBull extension to surface
    try {
      console.log('[xbull] Step 1: Forcing xBull extension activation...');
      
      // Dispatch events that might activate extensions
      window.dispatchEvent(new CustomEvent('xbull:activate'));
      window.dispatchEvent(new CustomEvent('stellar:ready'));
      
      // Wait briefly for the extension to respond
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check again after forced activation
      const xbullGlobal = (window as any).xbullWallet || (window as any).xBull;
      if (xbullGlobal) {
        console.log('[xbull] Found xBull after forced activation:', xbullGlobal);
        
        // Try to use xBull API directly
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
    
    // STEP 2: Use postMessage to communicate with the extension
    try {
      console.log('[xbull] Step 2: Using postMessage to communicate with xBull...');
      
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          console.error('[xbull] ⏰ Timeout! User needs to approve connection manually.');
          console.log('[xbull] 💡 SOLUTION: Click the xBull extension icon and approve the connection!');
          reject(new Error('xBull connection timeout - Please click the xBull icon and approve the connection'));
        }, 30000); // Increase timeout to 30s
        
        const messageHandler = (event: MessageEvent) => {
          console.log('[xbull] Received message:', event);
          console.log('[xbull] Message data:', event.data);
          
          // Check different response formats from xBull
          if (event.data) {
            // Format 1: Direct response with publicKey
            if (event.data.type === 'XBULL_RESPONSE' && event.data.publicKey) {
              clearTimeout(timeoutId);
              window.removeEventListener('message', messageHandler);
              console.log('[xbull] ✅ REAL connection via postMessage!', event.data.publicKey);
              resolve({ address: event.data.publicKey, network: "testnet" });
              return;
            }
            
            // Format 2: Any response containing a Stellar address
            if (event.data.publicKey && typeof event.data.publicKey === 'string' && event.data.publicKey.startsWith('G')) {
              clearTimeout(timeoutId);
              window.removeEventListener('message', messageHandler);
              console.log('[xbull] ✅ REAL connection via stellar address!', event.data.publicKey);
              resolve({ address: event.data.publicKey, network: "testnet" });
              return;
            }
            
            // Format 3: Response with address field
            if (event.data.address && typeof event.data.address === 'string' && event.data.address.startsWith('G')) {
              clearTimeout(timeoutId);
              window.removeEventListener('message', messageHandler);
              console.log('[xbull] ✅ REAL connection via address field!', event.data.address);
              resolve({ address: event.data.address, network: "testnet" });
              return;
            }
            
            // Format 4: Freighter-style response (xBull uses the Freighter protocol!)
            if (event.data.source === 'FREIGHTER_EXTERNAL_MSG_RESPONSE' && event.data.isConnected) {
              console.log('[xbull] ✅ xBull connected via Freighter protocol!', event.data);
              
              // Request access/authorization first
              const accessRequestId = Date.now() + Math.random();
              window.postMessage({
                source: 'FREIGHTER_EXTERNAL_MSG_REQUEST',
                messageId: accessRequestId,
                type: 'REQUEST_ACCESS'
              }, '*');
              
              console.log('[xbull] Requesting access authorization...');
              
              // Then request the address using the Freighter protocol
              setTimeout(() => {
                const requestId = Date.now() + Math.random();
                window.postMessage({
                  source: 'FREIGHTER_EXTERNAL_MSG_REQUEST',
                  messageId: requestId,
                  type: 'REQUEST_PUBLIC_KEY'
                }, '*');
                console.log('[xbull] Requesting public key via Freighter protocol...');
              }, 1000);
              
              return; // Wait for response
            }
            
            // Format 5: Response with public key via Freighter protocol
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
                
                // Retry after a short, limited delay
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
            
            // Format 6: xBull response (any type indicating success)
            if (event.data.type && event.data.type.toLowerCase().includes('xbull')) {
              console.log('[xbull] xBull response detected, checking for address...', event.data);
              
              // Search for any field that looks like a Stellar address
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
        
        // Send multiple messages to the extension (different formats)
        const requestId = Date.now() + Math.random();
        const messages = [
          // Freighter protocol (xBull is compatible!)
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
    
    // NÃO fazer fallback para Freighter. Se xBull não for detectado, mostrar erro claro.
    // O usuário deve ativar/clicar na extensão xBull manualmente.
    console.error('[xbull] 🚨 xBull não detectado ou não autorizado. Ative/click na extensão xBull e tente novamente.');
    throw new Error("ERR_XBULL_NOT_FOUND - xBull não detectado ou não autorizado. Por favor, clique no ícone da extensão xBull e aprove a conexão.");
    
    // STEP 3: Try via content script injection
    try {
      console.log('[xbull] Step 3: Attempting content script injection...');
      
      // Create a script that tries to access the extension directly
      const script = document.createElement('script');
      script.textContent = `
        (function() {
          console.log('[xbull] Injected script running...');
          
          // Try to find the xBull API in the page context
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
          
          // Try to access chrome.runtime if available
          const chromeApi = (globalThis as unknown as {
            chrome?: {
              runtime?: {
                sendMessage: (
                  extensionId: string,
                  message: Record<string, unknown>,
                  callback: (response: unknown) => void
                ) => void;
              };
              tabs?: {
                query: (
                  queryInfo: { active?: boolean; currentWindow?: boolean },
                  callback: (tabs: Array<{ id?: number }>) => void
                ) => void;
                sendMessage: (tabId: number, message: Record<string, unknown>) => void;
              };
            };
          }).chrome;

          if (chromeApi?.runtime) {
            try {
              chromeApi.runtime.sendMessage('xbull-extension-id', {
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
      if (script.parentNode === document.head) {
        script.remove();
      }
      
      // Wait for response from the injected script
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
    
    // STEP 4: Final attempt - open the extension popup programmatically
    try {
      console.log('[xbull] Step 4: Final attempt - programmatic popup...');
      
      // Try to open the extension programmatically
      const chromeApi = (globalThis as unknown as {
        chrome?: {
          tabs?: {
            query: (
              queryInfo: { active?: boolean; currentWindow?: boolean },
              callback: (tabs: Array<{ id?: number }>) => void
            ) => void;
            sendMessage: (tabId: number, message: Record<string, unknown>) => void;
          };
        };
      }).chrome;

      const tabsApi = chromeApi?.tabs;
      if (tabsApi) {
        tabsApi?.query({ active: true, currentWindow: true }, (tabs) => {
          const tabId = tabs[0]?.id;
          if (typeof tabId !== 'number') return;
          tabsApi?.sendMessage(tabId, {
            action: 'ACTIVATE_XBULL'
          });
        });
      }
      
      // Wait a bit and try again
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
    
    // FINAL ERROR - with instruction for the user
    console.error('[xbull] 🚨 Could not connect automatically with xBull');
    console.log('[xbull] 💡 SOLUTION: Click the xBull icon in the extensions bar FIRST, then try connecting again.');
    
    throw new Error("ERR_XBULL_NOT_FOUND - Click the xBull icon first and try again");
  },
};

// Ledger via WebHID – non-blocking placeholder (requires @ledgerhq libs)
export const LedgerConnector: WalletConnector = {
  id: "ledger",
  name: "Ledger (WebHID)",
  isAvailable() {
    // Keep disabled until full Ledger transport/sign flow is implemented.
    return false;
  },
  async connect() {
    // For a complete implementation: use @ledgerhq/hw-transport-webhid + Stellar app
    throw new Error("ERR_LEDGER_UNSUPPORTED");
  },
};

// Soroban "smart wallet" – logical session using soroban-client (no specific provider)
export const SorobanSmartConnector: WalletConnector = {
  id: "soroban-smart",
  name: "Soroban Smart Wallet",
  isAvailable() {
    // Conceptually available; depends on a wallet (e.g., Freighter) to sign
    return true;
  },
  async connect() {
    // Simple strategy: reuse the address if Freighter exists
    if (FreighterConnector.isAvailable()) {
      const s = await FreighterConnector.connect();
      return s;
    }
    throw new Error("ERR_SOROBAN_NO_COMPAT");
  },
};



export const AllConnectors: WalletConnector[] = [
  FreighterConnector,
  AlbedoConnector,
  RabetConnector,
  XBullConnector,
  LedgerConnector,
  SorobanSmartConnector,
];

export async function probeWalletHints(): Promise<
  Partial<Record<WalletType, WalletProviderHint>>
> {
  const hints: Partial<Record<WalletType, WalletProviderHint>> = {};

  if (typeof window === "undefined") return hints;

  if (FreighterConnector.isAvailable()) {
    hints.freighter = "installed";
  } else if (typeof (window as ProviderWindow).freighterApi !== "undefined") {
    hints.freighter = "needs-open-extension";
  } else {
    // Keep probe import-free to avoid Turbopack HMR async-loader churn.
    hints.freighter = "try-connect";
  }

  hints.albedo = AlbedoConnector.isAvailable() ? "installed" : "web-wallet";
  hints.rabet = RabetConnector.isAvailable() ? "installed" : "absent";

  if (XBullConnector.isAvailable()) {
    hints.xbull = "installed";
  } else if (typeof (window as ProviderWindow).freighterApi !== "undefined") {
    hints.xbull = "needs-open-extension";
  } else {
    hints.xbull = "absent";
  }

  hints.ledger = LedgerConnector.isAvailable() ? "webhid-ready" : "webhid-unavailable";

  return hints;
}

export function detectAvailable(): WalletConnectorInfo[] {
  // Debug: List all window properties that might be wallets
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

  const browserWallets = new Set<WalletType>(["freighter", "albedo", "rabet", "xbull"]);

  const results: WalletConnectorInfo[] = AllConnectors
    .map((c): WalletConnectorInfo => {
      const detected = c.isAvailable();

      // Browser wallets can often be connected even before their provider is injected.
      // Keep them selectable so the user can trigger the extension flow manually.
      const available = detected || browserWallets.has(c.id);

      return {
        id: c.id,
        name: c.name,
        available,
        providerHint: detected ? undefined : (browserWallets.has(c.id) ? "try-connect" : undefined),
      };
    })
    .sort((a: WalletConnectorInfo, b: WalletConnectorInfo) => Number(b.available) - Number(a.available));
  
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

// Additional function to force re-detection with delay
export function forceWalletDetection(): Promise<WalletConnectorInfo[]> {
  return new Promise((resolve) => {
    // Wait a bit for slow extensions
    setTimeout(() => {
      const results = detectAvailable();
      if (typeof console !== 'undefined') {
        console.debug('[wallet][forceDetection] results:', results);
      }
      resolve(results);
    }, 500);
  });
}

// Specific function for xBull debugging
export function debugXBullDetection(): void {
  if (typeof window === "undefined") {
    console.log('[xbull][debug] Running on server side, no window object');
    return;
  }

  console.log('[xbull][debug] Starting comprehensive xBull detection...');
  
  // List all window properties
  const allKeys = Object.keys(window);
  const xbullRelatedKeys = allKeys.filter(key => 
    key.toLowerCase().includes('xbull') || 
    key.toLowerCase().includes('bull') ||
    key.toLowerCase().includes('stellar')
  );
  
  console.log('[xbull][debug] All window keys (first 100):', allKeys.slice(0, 100));
  console.log('[xbull][debug] xBull related keys:', xbullRelatedKeys);
  
  // If there are no related keys, show more information
  if (xbullRelatedKeys.length === 0) {
    console.log('[xbull][debug] No xBull-related keys found. Checking common wallet patterns...');
    const walletKeys = allKeys.filter(key => 
      key.toLowerCase().includes('wallet') ||
      key.toLowerCase().includes('extension') ||
      key.toLowerCase().includes('provider')
    );
    console.log('[xbull][debug] Wallet-related keys:', walletKeys);
  }
  
  // Check specific known xBull properties
  const checks = [
    'xbullWallet',
    'xBull', 
    'xBullApi',
    'xBullWalletApi',
    'xBullProvider',
    'xBullExtension',
    'stellarXBull',
    'xBullStellar',
    // Possible variations
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
  
  // Check for any Stellar extension
  console.log('[xbull][debug] Checking for any Stellar extension...');
  console.log('[xbull][debug] window.freighterApi:', !!(window as any).freighterApi);
  console.log('[xbull][debug] window.albedo:', !!(window as any).albedo);
  console.log('[xbull][debug] window.rabet:', !!(window as any).rabet);
  
  // Check xBull custom events
  const events = ['xbull:ready', 'xBull:initialized', 'xbull:connected', 'xBull:ready'];
  events.forEach(eventName => {
    console.log(`[xbull][debug] Setting up event listener for: ${eventName}`);
    window.addEventListener(eventName, (event) => {
      console.log(`[xbull][debug] 🎉 Event ${eventName} fired!`, event);
      debugXBullDetection(); // Re-run detection
    }, { once: true });
  });
  
  // Try to run detection
  const result = XBullConnector.isAvailable();
  console.log('[xbull][debug] Final detection result:', result);
  
  // Additional information about the page state
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

// The debug helper stays exported, but is no longer attached to window automatically.
