import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QuoteSide, QuoteSource } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';

export type ExchangeProviderMode = 'disabled' | 'stub' | 'live';

export type ExchangeQuoteRequest = {
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  side: QuoteSide;
  amountIn: string;
};

export type ExchangeQuoteResult = {
  source: QuoteSource;
  amountOut: string;
  rate: string;
  feeAmount: string;
  spreadBps: number;
  metadata?: Record<string, unknown>;
};

export type ExchangeOrderResult = {
  route: QuoteSource;
  providerOrderRef: string | null;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class ExchangeProviderService {
  private readonly logger = new Logger(ExchangeProviderService.name);
  private readonly client: AxiosInstance | null = null;
  private readonly mode: ExchangeProviderMode;

  constructor(private readonly configService: ConfigService) {
    const apiUrl = this.getString('EXCHANGE_API_URL');
    const apiKey = this.getString('EXCHANGE_API_KEY');
    const configuredMode = this.getString('EXCHANGE_MODE')?.toLowerCase();
    const nodeEnv =
      this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? '';
    const allowStub = nodeEnv.toLowerCase() !== 'production';
    const liveReady = !!apiUrl && !!apiKey;

    if (configuredMode === 'disabled') {
      this.mode = 'disabled';
    } else if (configuredMode === 'live') {
      this.mode = liveReady ? 'live' : 'disabled';
    } else if (configuredMode === 'stub') {
      this.mode = allowStub ? 'stub' : 'disabled';
    } else {
      this.mode = liveReady ? 'live' : allowStub ? 'stub' : 'disabled';
    }

    if (this.mode === 'live' && apiUrl) {
      this.client = axios.create({
        baseURL: apiUrl,
        timeout: 15000,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
    }
  }

  getStatus() {
    return {
      mode: this.mode,
      live: this.mode === 'live',
      fallbackActive: this.mode !== 'live',
      apiUrlConfigured: Boolean(this.getString('EXCHANGE_API_URL')),
      apiKeyConfigured: Boolean(this.getString('EXCHANGE_API_KEY')),
    };
  }

  async createQuote(params: ExchangeQuoteRequest): Promise<ExchangeQuoteResult> {
    if (this.mode === 'disabled') {
      throw new Error('Exchange provider disabled');
    }

    if (this.mode === 'live' && this.client) {
      const response = await this.client.post('/quotes', {
        pair: params.pair,
        baseAsset: params.baseAsset,
        quoteAsset: params.quoteAsset,
        side: params.side,
        amountIn: params.amountIn,
      });

      return {
        source:
          response.data?.source === 'AGGREGATOR'
            ? QuoteSource.AGGREGATOR
            : response.data?.source === 'OTC'
              ? QuoteSource.OTC
              : QuoteSource.EXCHANGE_PARTNER,
        amountOut: String(response.data.amountOut),
        rate: String(response.data.rate),
        feeAmount: String(response.data.feeAmount ?? '0'),
        spreadBps: Number(response.data.spreadBps ?? 0),
        metadata: {
          provider: response.data?.provider ?? 'live_exchange_api',
          raw: response.data,
        },
      };
    }

    const amountIn = Number(params.amountIn);
    const rateMap: Record<string, number> = {
      'BRL/USDT': 5.2,
      'BRL/USDC': 5.18,
      'BRL/BTC': 350000,
      'BRL/ETH': 18000,
      'BRL/USD': 5.21,
      'BRL/EUR': 5.72,
    };
    const rate = rateMap[params.pair] ?? 5.2;
    const spreadBps = 45;
    const feeAmount = (amountIn * 0.004).toFixed(8);
    const amountOut =
      params.side === QuoteSide.BUY
        ? ((amountIn - Number(feeAmount)) / rate).toFixed(8)
        : ((amountIn - Number(feeAmount)) * rate).toFixed(8);

    this.logger.warn(`[EXCHANGE_FALLBACK] createQuote pair=${params.pair} mode=${this.mode}`);
    return {
      source: QuoteSource.EXCHANGE_PARTNER,
      amountOut,
      rate: rate.toFixed(8),
      feeAmount,
      spreadBps,
      metadata: {
        provider: 'stub_exchange_provider',
        mocked: true,
      },
    };
  }

  async submitOrder(params: {
    orderId: string;
    pair: string;
    side: QuoteSide;
    amountIn: string;
    walletAddress?: string | null;
  }): Promise<ExchangeOrderResult> {
    if (this.mode === 'disabled') {
      throw new Error('Exchange provider disabled');
    }

    if (this.mode === 'live' && this.client) {
      const response = await this.client.post('/orders', params);
      return {
        route:
          response.data?.route === 'AGGREGATOR'
            ? QuoteSource.AGGREGATOR
            : response.data?.route === 'OTC'
              ? QuoteSource.OTC
              : QuoteSource.EXCHANGE_PARTNER,
        providerOrderRef: response.data?.providerOrderRef ?? null,
        metadata: {
          provider: response.data?.provider ?? 'live_exchange_api',
          raw: response.data,
        },
      };
    }

    this.logger.warn(`[EXCHANGE_FALLBACK] submitOrder orderId=${params.orderId} mode=${this.mode}`);
    return {
      route: QuoteSource.EXCHANGE_PARTNER,
      providerOrderRef: `stub-${params.orderId.slice(0, 8)}`,
      metadata: {
        provider: 'stub_exchange_provider',
        mocked: true,
      },
    };
  }

  private getString(key: string): string | undefined {
    const value = this.configService.get<string>(key) ?? process.env[key];
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}
