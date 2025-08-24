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
    const w = getWindow();
    const ok = !!w?.freighterApi; // somente quando a API real estiver disponível
    if (typeof console !== 'undefined') console.debug('[wallet][detect] freighter available:', ok);
    return ok;
  },
  async connect() {
    // Tenta via pacote oficial primeiro (mais robusto no Chrome)
    try {
      // Suporta variações de export (default vs nomeado) e nomes de função (getPublicKey vs getAddress)
      type FreighterApiCompat = {
        getPublicKey?: () => Promise<string>;
        getAddress?: () => Promise<string>;
        getNetworkDetails?: () => Promise<{ network: string; networkPassphrase?: string }>;
        getNetwork?: () => Promise<string | { network: string; networkPassphrase?: string }>;
      };
      const mod = (await import("@stellar/freighter-api")) as unknown as FreighterApiCompat & { default?: FreighterApiCompat };
      const api: FreighterApiCompat = mod.default ?? mod;
      const getPk = api.getPublicKey ?? api.getAddress;
      const getNetDetails = api.getNetworkDetails ?? api.getNetwork;
      if (!getPk) throw new Error("API da Freighter indisponível (getPublicKey/getAddress não encontrados)");
      // Em algumas versões, isConnected() pode retornar false até chamar getPublicKey/getAddress
      const pkRes = await getPk();
      const address = normalizeAddress(pkRes);
      const details = getNetDetails ? await getNetDetails() : undefined;
      const netStr: string | undefined = typeof details === "string" ? details : details?.network;
      const network: StellarNetwork = netStr === "TESTNET" ? "testnet" : "public";
      return { address, network };
    } catch {
      // Fallback para a API global, caso exista
      const w = getWindow();
      const api = w?.freighterApi as FreighterApi | undefined;
      if (!api) {
        // Código curto para mapeamento via i18n no UI
        throw new Error("ERR_FREIGHTER_NOT_FOUND");
      }
      const info = await api.getUserInfo();
      const net: StellarNetwork = info.network === "TESTNET" ? "testnet" : "public";
      const address = normalizeAddress(info.publicKey);
      return { address, network: net };
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
    return !!w?.albedo;
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
    return !!w?.rabet;
  },
  async connect() {
    const w = getWindow();
    if (!w?.rabet) throw new Error("ERR_RABET_NOT_FOUND");
    const res = await w.rabet.connect();
    const address = normalizeAddress(res.publicKey);
    return { address, network: (res.network === "testnet" ? "testnet" : "public") };
  },
};

// xBull (https://xbull.app) – detecção básica
export const XBullConnector: WalletConnector = {
  id: "xbull",
  name: "xBull",
  isAvailable() {
    const w = getWindow();
    const ok = !!w?.xbullWallet; // somente quando a API real estiver disponível
    if (typeof console !== 'undefined') console.debug('[wallet][detect] xbull available:', ok);
    return ok;
  },
  async connect() {
    const w = getWindow();
    const api = w?.xbullWallet as XBullApi | undefined;
    if (!api) throw new Error("ERR_XBULL_NOT_FOUND");
    const res = await api.getPublicKey();
    const address = normalizeAddress(res);
    return { address, network: "public" };
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
  return AllConnectors.map((c) => ({ id: c.id, name: c.name, available: c.isAvailable() }))
    .sort((a, b) => Number(b.available) - Number(a.available));
}
