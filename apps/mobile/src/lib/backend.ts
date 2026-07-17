import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { StellarWallet } from './stellar-wallet';

const TOKEN_KEY = 'stellaro_jwt_token';

export type BackendConfig = {
  apiBaseUrl: string;
  telemetryUrl: string;
};

function getWebApiBaseUrlOverride(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    const fromStorage =
      typeof window.localStorage !== 'undefined'
        ? window.localStorage.getItem('stellaro_backend_api_url')
        : null;
    if (fromStorage) return fromStorage;

    const url = new URL(window.location.href);
    const qs = url.searchParams;
    return (
      qs.get('apiBaseUrl') ||
      qs.get('backendApiUrl') ||
      qs.get('backend') ||
      qs.get('api') ||
      null
    );
  } catch {
    return null;
  }
}

export function getBackendConfig(): BackendConfig {
  const explicitApiBaseUrl = Constants.expoConfig?.extra?.BACKEND_API_URL as
    | string
    | undefined;
  const webOverrideApiBaseUrl = getWebApiBaseUrlOverride();

  const devHostUri =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any)?.expoGoConfig?.debuggerHost ||
    (Constants as any)?.manifest?.debuggerHost;

  const devHost =
    typeof devHostUri === 'string' && devHostUri.length
      ? devHostUri.split(':')[0]
      : Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.hostname
        : null;

  const apiBaseUrl =
    explicitApiBaseUrl ||
    webOverrideApiBaseUrl ||
    (__DEV__ && devHost ? `http://${devHost}:3001` : 'https://api.stellaro.io');
  const telemetryUrl =
    (Constants.expoConfig?.extra?.BACKEND_TELEMETRY_URL as string | undefined) ||
    `${apiBaseUrl.replace(/\/$/, '')}/v5/risk/telemetry`;

  return { apiBaseUrl: apiBaseUrl.replace(/\/$/, ''), telemetryUrl };
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined'
    ) {
      return window.localStorage.getItem(TOKEN_KEY);
    }
    throw new Error('Falha ao acessar o armazenamento seguro do token.');
  }
}

export async function setToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token, {
      keychainService: 'stellaro_vault',
    });
  } catch {
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined'
    ) {
      window.localStorage.setItem(TOKEN_KEY, token);
      return;
    }
    throw new Error('Falha ao acessar o armazenamento seguro do token.');
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY, { keychainService: 'stellaro_vault' });
  } catch {
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined'
    ) {
      window.localStorage.removeItem(TOKEN_KEY);
      return;
    }
    throw new Error('Falha ao acessar o armazenamento seguro do token.');
  }
}

async function backendFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const { apiBaseUrl } = getBackendConfig();
  const url = `${apiBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers = new Headers(init?.headers);
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');

  const token = await getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(url, {
      ...init,
      headers,
      signal: init?.signal ?? controller.signal,
    });
    clearTimeout(timeout);
    return res;
  } catch (error: any) {
    const isAbort = String(error?.name || '').toLowerCase() === 'aborterror';
    if (isAbort) {
      throw new Error('Tempo esgotado ao chamar o backend. Verifique se o backend está rodando.');
    }
    throw new Error(
      'Backend indisponível. Inicie o serviço apps/backend na porta 3001. Se estiver no celular ou em outra máquina, aponte o app para http://<IP-DO-BACKEND>:3001 (query ?apiBaseUrl=... no Web ou localStorage stellaro_backend_api_url).',
    );
  }
}

export async function ensureWalletSession(): Promise<{
  ok: boolean;
  token?: string;
  userId?: string;
  pubkey?: string;
}> {
  const token = await getToken();
  if (token) {
    const me = await backendFetch('/auth/me', { method: 'GET' });
    const payload = await me.json();
    if (payload?.authenticated && payload?.user?.id) {
      return { ok: true, token, userId: payload.user.id, pubkey: payload.user.wallet ?? undefined };
    }
    await clearToken();
  }

  const pubkey = await StellarWallet.getPublicKey();
  if (!pubkey) return { ok: false };

  const nonceRes = await backendFetch('/auth/nonce', {
    method: 'POST',
    body: JSON.stringify({ pubkey }),
  });
  if (!nonceRes.ok) return { ok: false };
  const { nonce } = await nonceRes.json();
  if (!nonce) return { ok: false };

  const kp = await StellarWallet.getOrCreateWallet();
  const sig = kp.sign(Buffer.from(nonce, 'utf8'));
  const signature = Buffer.from(sig).toString('base64');

  const verifyRes = await backendFetch('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ pubkey, nonce, signature, provider: 'mobile' }),
  });
  if (!verifyRes.ok) return { ok: false };
  const verifyPayload = await verifyRes.json();
  if (!verifyPayload?.token) return { ok: false };

  await setToken(verifyPayload.token);
  return {
    ok: true,
    token: verifyPayload.token,
    userId: verifyPayload.userId,
    pubkey: verifyPayload.pubkey,
  };
}

export async function getChainConfig(): Promise<any> {
  const res = await backendFetch('/chain/config', { method: 'GET' });
  if (!res.ok) throw new Error('failed to load chain config');
  return await res.json();
}

async function backendJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await backendFetch(path, init);
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      payload?.message ||
      payload?.error?.message ||
      `Falha na requisição ${path} (${res.status})`;
    throw new Error(message);
  }
  return payload as T;
}

export async function getMyKyc(): Promise<any> {
  const res = await backendFetch('/compliance/kyc/me', { method: 'GET' });
  return await res.json();
}

export async function submitBasicKyc(params: { document: string; name: string }): Promise<any> {
  const res = await backendFetch('/compliance/kyc', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return await res.json();
}

export async function reportTelemetry(event: {
  type: string;
  userId: string;
  status: string;
  metadata?: any;
}): Promise<void> {
  const { telemetryUrl } = getBackendConfig();
  if (!telemetryUrl) return;
  await fetch(telemetryUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
}

export type ExchangeQuoteResponse = {
  ok: boolean;
  quote: {
    id: string;
    pair: string;
    baseAsset: string;
    quoteAsset: string;
    amountIn: string;
    amountOut: string;
    rate: string;
    feeAmount: string;
    source: string;
    expiresAt: string;
  };
};

export type ExchangeOrderResponse = {
  ok: boolean;
  order: {
    id: string;
    pair: string;
    status: string;
    route: string;
    amountIn: string;
    amountOut?: string | null;
    createdAt?: string;
  };
};

export async function getExchangeProviderStatus(): Promise<any> {
  await ensureWalletSession();
  return backendJson('/exchange/status', { method: 'GET' });
}

export async function getExchangeQuote(params: {
  from: string;
  to: string;
  amount: string;
  side: 'BUY' | 'SELL';
}): Promise<ExchangeQuoteResponse> {
  await ensureWalletSession();
  const search = new URLSearchParams(params).toString();
  return backendJson(`/exchange/quotes?${search}`, { method: 'GET' });
}

export async function createExchangeOrder(params: {
  quoteId: string;
  walletId?: string;
  clientRequestId?: string;
}): Promise<ExchangeOrderResponse> {
  await ensureWalletSession();
  return backendJson('/exchange/orders', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getExchangeOrders(): Promise<{ ok: boolean; orders: any[] }> {
  await ensureWalletSession();
  return backendJson('/exchange/orders', { method: 'GET' });
}

export async function getExchangeOrder(
  orderId: string,
): Promise<{ ok: boolean; order: any }> {
  await ensureWalletSession();
  return backendJson(`/exchange/orders/${orderId}`, { method: 'GET' });
}

export async function getSettlements(
  limit = 20,
): Promise<{ ok: boolean; settlements: any[] }> {
  await ensureWalletSession();
  return backendJson(`/settlements?limit=${limit}`, { method: 'GET' });
}

export async function retrySettlement(
  settlementId: string,
): Promise<{ ok: boolean; settlement: any }> {
  await ensureWalletSession();
  return backendJson(`/settlements/${settlementId}/retry`, {
    method: 'POST',
  });
}

export async function getSettlementProviderStatus(): Promise<any> {
  await ensureWalletSession();
  return backendJson('/settlements/status', { method: 'GET' });
}

export async function getPortfolio(): Promise<{ ok: boolean; portfolio: any }> {
  await ensureWalletSession();
  return backendJson('/portfolio/me', { method: 'GET' });
}

export async function getUnifiedHistory(limit = 20): Promise<{ ok: boolean; history: any }> {
  await ensureWalletSession();
  return backendJson(`/history/me?limit=${limit}`, { method: 'GET' });
}

export async function startSupportChat(params: {
  message: string;
  subject?: string;
  threadId?: string;
}): Promise<{ ok: boolean; thread: any }> {
  await ensureWalletSession();
  return backendJson('/support/chat', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getSupportThread(
  threadId: string,
): Promise<{ ok: boolean; thread: any }> {
  await ensureWalletSession();
  return backendJson(`/support/threads/${threadId}`, { method: 'GET' });
}

export async function getSupportThreads(
  limit = 20,
): Promise<{ ok: boolean; threads: any[] }> {
  await ensureWalletSession();
  return backendJson(`/support/threads?limit=${limit}`, { method: 'GET' });
}

export async function escalateSupportThread(
  threadId: string,
): Promise<{ ok: boolean; thread: any }> {
  await ensureWalletSession();
  return backendJson(`/support/threads/${threadId}/escalate`, {
    method: 'POST',
  });
}
