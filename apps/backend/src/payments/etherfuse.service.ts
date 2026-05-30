import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

export type EtherfuseMode = 'disabled' | 'stub' | 'live';

export type EtherfuseStatus = {
  enabled: boolean;
  mode: EtherfuseMode;
  configuredMode: string | null;
  apiBaseUrl: string;
  blockchain: 'stellar' | 'solana' | 'base' | 'polygon' | 'monad';
  defaultQuoteType: 'onramp' | 'offramp' | 'swap';
  defaultSourceAsset: string;
  defaultTargetAsset: string;
  customerIdConfigured: boolean;
  walletAddressConfigured: boolean;
  apiKeyConfigured: boolean;
  fallbackActive: boolean;
  fallbackReason: string | null;
};

export type EtherfuseQuoteRequest = {
  amount: string;
  quoteType?: 'onramp' | 'offramp' | 'swap';
  sourceAsset?: string;
  targetAsset?: string;
  customerId?: string;
  walletAddress?: string;
};

export type EtherfuseQuoteResponse = {
  ok: true;
  quote: {
    id: string;
    mode: EtherfuseMode;
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
};

export type EtherfuseOrderRequest = {
  quoteId: string;
  bankAccountId?: string;
  walletAddress?: string;
  customerId?: string;
  memo?: string;
};

export type EtherfuseOrderResponse = {
  ok: true;
  order: {
    id: string;
    mode: EtherfuseMode;
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
};

@Injectable()
export class EtherfuseService {
  private readonly logger = new Logger(EtherfuseService.name);

  constructor(private readonly configService: ConfigService) {}

  getStatus(): EtherfuseStatus {
    const configuredMode = this.getString('ETHERFUSE_MODE')?.toLowerCase() ?? null;
    const resolved = this.resolveMode();
    const mode = resolved.mode;
    const apiBaseUrl = this.getString('ETHERFUSE_API_BASE_URL') ?? 'https://api.sand.etherfuse.com';
    const blockchain = this.getBlockchain();
    const defaultQuoteType = this.getQuoteType('ETHERFUSE_DEFAULT_QUOTE_TYPE') ?? 'onramp';
    const defaultSourceAsset = this.getString('ETHERFUSE_SOURCE_ASSET') ?? 'MXN';
    const defaultTargetAsset = this.getString('ETHERFUSE_TARGET_ASSET') ?? 'USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

    return {
      enabled: mode !== 'disabled',
      mode,
      configuredMode,
      apiBaseUrl,
      blockchain,
      defaultQuoteType,
      defaultSourceAsset,
      defaultTargetAsset,
      customerIdConfigured: !!this.getString('ETHERFUSE_CUSTOMER_ID'),
      walletAddressConfigured: !!this.getString('ETHERFUSE_WALLET_ADDRESS'),
      apiKeyConfigured: !!this.getString('ETHERFUSE_API_KEY'),
      fallbackActive: mode !== 'live',
      fallbackReason: mode === 'live' ? null : resolved.reason,
    };
  }

  async createQuote(params: EtherfuseQuoteRequest): Promise<EtherfuseQuoteResponse> {
    const amount = Number(params.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    const status = this.getStatus();
    if (!status.enabled) {
      throw new BadRequestException('Etherfuse integration disabled');
    }

    if (status.mode === 'live') {
      return this.createLiveQuote(params, status);
    }

    this.logger.warn(
      `[ETHERFUSE_FALLBACK] action=create_quote mode=${status.mode} reason="${status.fallbackReason ?? 'non-live mode'}"`,
    );

    return this.createStubQuote(params, status);
  }

  async createOrder(params: EtherfuseOrderRequest): Promise<EtherfuseOrderResponse> {
    const quoteId = params.quoteId?.trim();
    if (!quoteId) {
      throw new BadRequestException('quoteId is required');
    }

    const status = this.getStatus();
    if (!status.enabled) {
      throw new BadRequestException('Etherfuse integration disabled');
    }

    if (status.mode === 'live') {
      return this.createLiveOrder(params, status);
    }

    this.logger.warn(
      `[ETHERFUSE_FALLBACK] action=create_order mode=${status.mode} reason="${status.fallbackReason ?? 'non-live mode'}"`,
    );

    return this.createStubOrder(params, status);
  }

  private async createLiveQuote(
    params: EtherfuseQuoteRequest,
    status: EtherfuseStatus,
  ): Promise<EtherfuseQuoteResponse> {
    const apiKey = this.getString('ETHERFUSE_API_KEY');
    const customerId = params.customerId ?? this.getString('ETHERFUSE_CUSTOMER_ID');
    const walletAddress = params.walletAddress ?? this.getString('ETHERFUSE_WALLET_ADDRESS');

    if (!apiKey || !customerId) {
      throw new BadRequestException('Etherfuse live mode requires ETHERFUSE_API_KEY and ETHERFUSE_CUSTOMER_ID');
    }

    const quoteId = randomUUID();
    const quoteType = params.quoteType ?? status.defaultQuoteType;
    const sourceAsset = params.sourceAsset ?? status.defaultSourceAsset;
    const targetAsset = params.targetAsset ?? status.defaultTargetAsset;

    const payload = {
      quoteId,
      customerId,
      blockchain: status.blockchain,
      quoteAssets: {
        type: quoteType,
        sourceAsset,
        targetAsset,
      },
      sourceAmount: params.amount,
      walletAddress: walletAddress ?? undefined,
    };

    const response = await fetch(`${status.apiBaseUrl.replace(/\/$/, '')}/ramp/quote`, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Etherfuse quote failed (${response.status}): ${errorBody}`);
      throw new BadRequestException('Could not create Etherfuse quote');
    }

    const liveQuote = (await response.json()) as Record<string, unknown>;

    return {
      ok: true,
      quote: {
        id: this.asString(liveQuote.quoteId) ?? quoteId,
        mode: 'live',
        blockchain: this.asString(liveQuote.blockchain) ?? status.blockchain,
        quoteType,
        sourceAsset,
        targetAsset,
        sourceAmount: this.asString(liveQuote.sourceAmount) ?? params.amount,
        destinationAmount: this.asString(liveQuote.destinationAmount) ?? '0',
        exchangeRate: this.asString(liveQuote.exchangeRate) ?? '0',
        feeBps: this.asString(liveQuote.feeBps),
        expiresAt: this.asString(liveQuote.expiresAt) ?? new Date(Date.now() + 10 * 60_000).toISOString(),
        provider: {
          apiBaseUrl: status.apiBaseUrl,
          apiKeyConfigured: true,
        },
        raw: liveQuote,
        guidance:
          'Live Etherfuse quote created. Proceed with order creation in your orchestration layer (POST /ramp/order) using this quoteId.',
      },
    };
  }

  private createStubQuote(params: EtherfuseQuoteRequest, status: EtherfuseStatus): EtherfuseQuoteResponse {
    const quoteType = params.quoteType ?? status.defaultQuoteType;
    const sourceAsset = params.sourceAsset ?? status.defaultSourceAsset;
    const targetAsset = params.targetAsset ?? status.defaultTargetAsset;
    const sourceAmount = Number(params.amount);
    const stubRate = this.getNumber('ETHERFUSE_STUB_EXCHANGE_RATE') ?? 0.19;
    const feeBps = this.getNumber('ETHERFUSE_STUB_FEE_BPS') ?? 35;

    const grossDestination = sourceAmount * stubRate;
    const destinationAfterFee = grossDestination * (1 - feeBps / 10_000);

    return {
      ok: true,
      quote: {
        id: randomUUID(),
        mode: status.mode,
        blockchain: status.blockchain,
        quoteType,
        sourceAsset,
        targetAsset,
        sourceAmount: sourceAmount.toFixed(2),
        destinationAmount: destinationAfterFee.toFixed(6),
        exchangeRate: stubRate.toFixed(6),
        feeBps: String(feeBps),
        expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
        provider: {
          apiBaseUrl: status.apiBaseUrl,
          apiKeyConfigured: status.apiKeyConfigured,
        },
        raw: {
          stub: true,
          quoteAssets: {
            type: quoteType,
            sourceAsset,
            targetAsset,
          },
        },
        guidance:
          status.mode === 'stub'
            ? 'Stub quote generated. Configure ETHERFUSE_API_KEY and ETHERFUSE_CUSTOMER_ID to switch to live mode.'
            : 'Stub quote generated while integration is not in live mode.',
      },
    };
  }

  private async createLiveOrder(
    params: EtherfuseOrderRequest,
    status: EtherfuseStatus,
  ): Promise<EtherfuseOrderResponse> {
    const apiKey = this.getString('ETHERFUSE_API_KEY');
    const customerId = params.customerId ?? this.getString('ETHERFUSE_CUSTOMER_ID');
    const bankAccountId = params.bankAccountId ?? this.getString('ETHERFUSE_BANK_ACCOUNT_ID');
    const publicKey = params.walletAddress ?? this.getString('ETHERFUSE_WALLET_ADDRESS');

    if (!apiKey || !customerId) {
      throw new BadRequestException('Etherfuse live mode requires ETHERFUSE_API_KEY and ETHERFUSE_CUSTOMER_ID');
    }

    if (!bankAccountId) {
      throw new BadRequestException('bankAccountId is required in live mode (or set ETHERFUSE_BANK_ACCOUNT_ID)');
    }

    const orderId = randomUUID();
    const payload = {
      orderId,
      bankAccountId,
      quoteId: params.quoteId,
      publicKey: publicKey ?? null,
      memo: params.memo?.trim() || null,
      useAnchor: false,
    };

    const response = await fetch(`${status.apiBaseUrl.replace(/\/$/, '')}/ramp/order`, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Etherfuse order failed (${response.status}): ${errorBody}`);
      throw new BadRequestException('Could not create Etherfuse order');
    }

    const liveOrder = (await response.json()) as Record<string, unknown>;
    const onramp = this.asObject(liveOrder.onramp);
    const offramp = this.asObject(liveOrder.offramp);
    const swap = this.asObject(liveOrder.swap);
    const direction: 'onramp' | 'offramp' | 'swap' | 'unknown' = onramp
      ? 'onramp'
      : offramp
      ? 'offramp'
      : swap
      ? 'swap'
      : 'unknown';

    const nestedId = this.asString(onramp?.orderId) ?? this.asString(offramp?.orderId) ?? this.asString(swap?.orderId);

    return {
      ok: true,
      order: {
        id: nestedId ?? orderId,
        mode: 'live',
        quoteId: params.quoteId,
        status: 'created',
        direction,
        provider: {
          apiBaseUrl: status.apiBaseUrl,
          apiKeyConfigured: true,
        },
        raw: liveOrder,
        guidance:
          'Live Etherfuse order created. Continue by polling order status or handling webhooks for settlement completion.',
      },
    };
  }

  private createStubOrder(params: EtherfuseOrderRequest, status: EtherfuseStatus): EtherfuseOrderResponse {
    return {
      ok: true,
      order: {
        id: randomUUID(),
        mode: status.mode,
        quoteId: params.quoteId,
        status: 'pending',
        direction: 'onramp',
        provider: {
          apiBaseUrl: status.apiBaseUrl,
          apiKeyConfigured: status.apiKeyConfigured,
        },
        raw: {
          stub: true,
          bankAccountId: params.bankAccountId ?? null,
          walletAddress: params.walletAddress ?? null,
        },
        guidance:
          status.mode === 'stub'
            ? 'Stub order created. Configure live credentials and bank account to submit real Etherfuse orders.'
            : 'Stub order created while integration is not in live mode.',
      },
    };
  }

  private resolveMode(): { mode: EtherfuseMode; reason: string | null } {
    const configuredMode = this.getString('ETHERFUSE_MODE')?.toLowerCase();
    const apiBaseUrl = this.getString('ETHERFUSE_API_BASE_URL');
    const apiKey = this.getString('ETHERFUSE_API_KEY');
    const liveReady = !!apiBaseUrl && !!apiKey;

    if (configuredMode === 'disabled') {
      return { mode: 'disabled', reason: 'ETHERFUSE_MODE=disabled' };
    }

    if (configuredMode === 'live') {
      if (!liveReady) {
        this.logger.warn('Etherfuse live mode requested but ETHERFUSE_API_BASE_URL or ETHERFUSE_API_KEY is missing');
        return {
          mode: 'disabled',
          reason: 'ETHERFUSE_MODE=live but ETHERFUSE_API_BASE_URL or ETHERFUSE_API_KEY is missing',
        };
      }
      return { mode: 'live', reason: null };
    }

    if (configuredMode === 'stub') {
      return { mode: 'stub', reason: 'ETHERFUSE_MODE=stub' };
    }

    if (liveReady) {
      return { mode: 'live', reason: null };
    }

    return {
      mode: 'stub',
      reason: 'ETHERFUSE credentials not fully configured; using implicit stub mode',
    };
  }

  private getString(key: string): string | undefined {
    const value = this.configService.get<string>(key) ?? process.env[key];
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private getNumber(key: string): number | undefined {
    const value = this.getString(key);
    if (!value) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private getQuoteType(
    key: string,
  ): 'onramp' | 'offramp' | 'swap' | undefined {
    const value = this.getString(key)?.toLowerCase();
    if (value === 'onramp' || value === 'offramp' || value === 'swap') {
      return value;
    }
    return undefined;
  }

  private getBlockchain(): 'stellar' | 'solana' | 'base' | 'polygon' | 'monad' {
    const value = this.getString('ETHERFUSE_BLOCKCHAIN')?.toLowerCase();
    if (value === 'stellar' || value === 'solana' || value === 'base' || value === 'polygon' || value === 'monad') {
      return value;
    }
    return 'stellar';
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private asObject(value: unknown): Record<string, unknown> | undefined {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return undefined;
    }
    return value as Record<string, unknown>;
  }
}
