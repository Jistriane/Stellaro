const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type X402Status = {
  enabled: boolean;
  mode: 'disabled' | 'stub' | 'live';
  network: string;
  acceptedAsset: string;
  resource: string;
  facilitatorUrl: string | null;
  providerContractId: string | null;
  recipient: string | null;
  apiKeyConfigured: boolean;
};

export type X402Quote = {
  sessionId: string;
  mode: 'disabled' | 'stub' | 'live';
  facilitator: {
    url: string;
    apiKeyConfigured: boolean;
  };
  resource: string;
  settlement: {
    network: string;
    asset: string;
    amount: string;
    feeBps: number;
    total: string;
    providerContractId: string;
    recipient: string;
    walletAddress: string | null;
    memo: string;
    expiresAt: string;
  };
  headers: Record<string, string>;
  guidance: string;
};

export async function getX402Status(): Promise<X402Status> {
  try {
    const response = await fetch(`${apiUrl}/payments/x402/status`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch x402 status');
    }

    return (await response.json()) as X402Status;
  } catch {
    return {
      enabled: false,
      mode: 'disabled',
      network: 'stellar:testnet',
      acceptedAsset: 'STLT',
      resource: '/payments/x402/settle',
      facilitatorUrl: null,
      providerContractId: null,
      recipient: null,
      apiKeyConfigured: false,
    };
  }
}

export async function createX402Quote(params: {
  amount: string;
  asset?: string;
  walletAddress?: string;
  memo?: string;
  intent?: 'deposit' | 'withdrawal' | 'subscription' | 'api-access';
}): Promise<{ ok: boolean; quote?: X402Quote; error?: string }> {
  try {
    const response = await fetch(`${apiUrl}/payments/x402/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const body = (await response.json()) as { ok?: boolean; quote?: X402Quote; message?: string };
    if (!response.ok) {
      return {
        ok: false,
        error: body.message || 'Could not generate x402 quote.',
      };
    }

    return {
      ok: true,
      quote: body.quote,
    };
  } catch {
    return {
      ok: false,
      error: 'Could not generate x402 quote.',
    };
  }
}