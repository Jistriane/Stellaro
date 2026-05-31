import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarWallet } from './stellar-wallet';

const TOKEN_KEY = 'stellaro_jwt_token';

export type BackendConfig = {
  apiBaseUrl: string;
  telemetryUrl: string;
};

export function getBackendConfig(): BackendConfig {
  const apiBaseUrl =
    (Constants.expoConfig?.extra?.BACKEND_API_URL as string | undefined) ||
    'https://api.stellaro.io';
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

  return await fetch(url, { ...init, headers });
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
