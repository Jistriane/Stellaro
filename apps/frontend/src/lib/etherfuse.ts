const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type EtherfuseStatus = {
  enabled: boolean;
  mode: 'disabled' | 'stub' | 'live';
  apiBaseUrl: string;
  blockchain: 'stellar' | 'solana' | 'base' | 'polygon' | 'monad';
  defaultQuoteType: 'onramp' | 'offramp' | 'swap';
  defaultSourceAsset: string;
  defaultTargetAsset: string;
  customerIdConfigured: boolean;
  walletAddressConfigured: boolean;
  apiKeyConfigured: boolean;
};

export type EtherfuseQuote = {
  id: string;
  mode: 'disabled' | 'stub' | 'live';
  blockchain: string;
  quoteType: 'onramp' | 'offramp' | 'swap';
  sourceAsset: string;
  targetAsset: string;
  sourceAmount: string;
  destinationAmount: string;
  exchangeRate: string;
  feeBps: string | null;
  expiresAt: string;
  provider: {
    apiBaseUrl: string;
    apiKeyConfigured: boolean;
  };
  raw: unknown;
  guidance: string;
};

export type EtherfuseOrder = {
  id: string;
  mode: 'disabled' | 'stub' | 'live';
  quoteId: string;
  status: 'created' | 'pending';
  direction: 'onramp' | 'offramp' | 'swap' | 'unknown';
  provider: {
    apiBaseUrl: string;
    apiKeyConfigured: boolean;
  };
  raw: unknown;
  guidance: string;
};

export async function getEtherfuseStatus(): Promise<EtherfuseStatus> {
  try {
    const response = await fetch(`${apiUrl}/payments/etherfuse/status`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Etherfuse status');
    }

    return (await response.json()) as EtherfuseStatus;
  } catch {
    return {
      enabled: false,
      mode: 'disabled',
      apiBaseUrl: '',
      blockchain: 'stellar',
      defaultQuoteType: 'onramp',
      defaultSourceAsset: '',
      defaultTargetAsset: '',
      customerIdConfigured: false,
      walletAddressConfigured: false,
      apiKeyConfigured: false,
    };
  }
}

export async function createEtherfuseQuote(params: {
  amount: string;
  quoteType?: 'onramp' | 'offramp' | 'swap';
  sourceAsset?: string;
  targetAsset?: string;
  customerId?: string;
  walletAddress?: string;
}): Promise<{ ok: boolean; quote?: EtherfuseQuote; error?: string }> {
  try {
    const response = await fetch(`${apiUrl}/payments/etherfuse/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const body = (await response.json()) as { ok?: boolean; quote?: EtherfuseQuote; message?: string };
    if (!response.ok) {
      return {
        ok: false,
        error: body.message || 'Could not generate Etherfuse quote.',
      };
    }

    return {
      ok: true,
      quote: body.quote,
    };
  } catch {
    return {
      ok: false,
      error: 'Could not generate Etherfuse quote.',
    };
  }
}

export async function createEtherfuseOrder(params: {
  quoteId: string;
  bankAccountId?: string;
  walletAddress?: string;
  customerId?: string;
  memo?: string;
}): Promise<{ ok: boolean; order?: EtherfuseOrder; error?: string }> {
  try {
    const response = await fetch(`${apiUrl}/payments/etherfuse/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const body = (await response.json()) as { ok?: boolean; order?: EtherfuseOrder; message?: string };
    if (!response.ok) {
      return {
        ok: false,
        error: body.message || 'Could not create Etherfuse order.',
      };
    }

    return {
      ok: true,
      order: body.order,
    };
  } catch {
    return {
      ok: false,
      error: 'Could not create Etherfuse order.',
    };
  }
}
