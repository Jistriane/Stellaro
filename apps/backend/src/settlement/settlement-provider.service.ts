import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export type SettlementProviderMode = 'disabled' | 'stub' | 'live';

type BroadcastSettlementParams = {
  settlementId: string;
  chain: string;
  asset: string;
  destinationAddress: string;
  amount?: string | null;
};

type BroadcastSettlementResult = {
  txHash: string;
  mocked?: boolean;
  metadata?: Record<string, unknown>;
};

type SyncSettlementResult = {
  confirmations: number;
  confirmed: boolean;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class SettlementProviderService {
  private readonly logger = new Logger(SettlementProviderService.name);
  private readonly client: AxiosInstance | null = null;
  private readonly mode: SettlementProviderMode;

  constructor(private readonly configService: ConfigService) {
    const apiUrl = this.getString('SETTLEMENT_API_URL');
    const apiKey = this.getString('SETTLEMENT_API_KEY');
    const configuredMode = this.getString('SETTLEMENT_MODE')?.toLowerCase();
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
        timeout: 20000,
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
      apiUrlConfigured: Boolean(this.getString('SETTLEMENT_API_URL')),
      apiKeyConfigured: Boolean(this.getString('SETTLEMENT_API_KEY')),
    };
  }

  async broadcastSettlement(
    params: BroadcastSettlementParams,
  ): Promise<BroadcastSettlementResult> {
    if (this.mode === 'disabled') {
      throw new Error('Settlement provider disabled');
    }

    if (this.mode === 'live' && this.client) {
      const response = await this.client.post('/settlements/broadcast', params);
      return {
        txHash: String(response.data?.txHash),
        mocked: Boolean(response.data?.mocked),
        metadata: {
          provider: response.data?.provider ?? 'live_settlement_api',
          raw: response.data,
        },
      };
    }

    const txHash = `stub_tx_${params.settlementId.replace(/-/g, '').slice(0, 16)}`;
    this.logger.warn(
      `[SETTLEMENT_FALLBACK] broadcast settlementId=${params.settlementId} mode=${this.mode}`,
    );
    return {
      txHash,
      mocked: true,
      metadata: { provider: 'stub_settlement_provider', mocked: true },
    };
  }

  async syncSettlement(txHash: string): Promise<SyncSettlementResult> {
    if (this.mode === 'disabled') {
      throw new Error('Settlement provider disabled');
    }

    if (this.mode === 'live' && this.client) {
      const response = await this.client.get('/settlements/status', {
        params: { txHash },
      });
      return {
        confirmations: Number(response.data?.confirmations ?? 0),
        confirmed: Boolean(response.data?.confirmed),
        metadata: {
          provider: response.data?.provider ?? 'live_settlement_api',
          raw: response.data,
        },
      };
    }

    this.logger.warn(`[SETTLEMENT_FALLBACK] sync txHash=${txHash} mode=${this.mode}`);
    return {
      confirmations: 3,
      confirmed: true,
      metadata: { provider: 'stub_settlement_provider', mocked: true },
    };
  }

  private getString(key: string): string | undefined {
    const value = this.configService.get<string>(key) ?? process.env[key];
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}
