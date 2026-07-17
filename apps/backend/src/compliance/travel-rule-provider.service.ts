import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TravelRuleStatus } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';

export type TravelRuleProviderMode = 'disabled' | 'stub' | 'live';

export type TravelRuleCheckRequest = {
  userId: string;
  walletAddress?: string | null;
  vaspCode?: string | null;
  direction: 'OUTBOUND' | 'INBOUND';
  asset?: string | null;
  amount?: string | null;
};

export type TravelRuleCheckResult = {
  status: TravelRuleStatus;
  providerRef?: string | null;
  reason?: string | null;
  payload?: Record<string, unknown>;
};

@Injectable()
export class TravelRuleProviderService {
  private readonly logger = new Logger(TravelRuleProviderService.name);
  private readonly client: AxiosInstance | null = null;
  private readonly mode: TravelRuleProviderMode;
  private readonly fallbackReason: string | null;

  constructor(private readonly configService: ConfigService) {
    const apiUrl = this.getString('TRAVEL_RULE_API_URL');
    const apiKey = this.getString('TRAVEL_RULE_API_KEY');
    const configuredMode = this.getString('TRAVEL_RULE_MODE')?.toLowerCase();
    const nodeEnv =
      this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? '';
    const allowStub = nodeEnv.toLowerCase() !== 'production';
    const liveReady = !!apiUrl && !!apiKey;

    if (configuredMode === 'disabled') {
      this.mode = 'disabled';
      this.fallbackReason = null;
    } else if (configuredMode === 'live') {
      if (liveReady) {
        this.mode = 'live';
        this.fallbackReason = null;
      } else {
        this.mode = 'disabled';
        this.fallbackReason =
          'TRAVEL_RULE_MODE=live but TRAVEL_RULE_API_URL/TRAVEL_RULE_API_KEY is missing';
      }
    } else if (configuredMode === 'stub') {
      if (allowStub) {
        this.mode = 'stub';
        this.fallbackReason = null;
      } else {
        this.mode = 'disabled';
        this.fallbackReason =
          'TRAVEL_RULE_MODE=stub is not allowed in production';
      }
    } else if (liveReady) {
      this.mode = 'live';
      this.fallbackReason = null;
    } else if (allowStub) {
      this.mode = 'stub';
      this.fallbackReason =
        'TRAVEL_RULE credentials not configured; using implicit stub mode';
    } else {
      this.mode = 'disabled';
      this.fallbackReason = 'TRAVEL_RULE credentials missing in production';
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
      fallbackReason: this.mode === 'live' ? null : this.fallbackReason,
      apiUrlConfigured: Boolean(this.getString('TRAVEL_RULE_API_URL')),
      apiKeyConfigured: Boolean(this.getString('TRAVEL_RULE_API_KEY')),
    };
  }

  async checkTransfer(
    params: TravelRuleCheckRequest,
  ): Promise<TravelRuleCheckResult> {
    if (this.mode === 'disabled') {
      return {
        status: TravelRuleStatus.NOT_REQUIRED,
        reason: 'provider_disabled',
        payload: { mode: this.mode },
      };
    }

    if (this.mode === 'live' && this.client) {
      const response = await this.client.post('/travel-rule/check', params);
      const statusRaw = String(response.data?.status ?? 'PENDING').toUpperCase();
      const normalized =
        statusRaw in TravelRuleStatus
          ? TravelRuleStatus[statusRaw as keyof typeof TravelRuleStatus]
          : TravelRuleStatus.PENDING;

      return {
        status: normalized,
        providerRef: response.data?.providerRef ?? null,
        reason: response.data?.reason ?? null,
        payload: {
          provider: response.data?.provider ?? 'live_travel_rule_api',
          raw: response.data,
        },
      };
    }

    const address = (params.walletAddress ?? '').toLowerCase();
    const amount = Number(params.amount ?? '0');

    if (!params.walletAddress && !params.vaspCode) {
      return {
        status: TravelRuleStatus.NOT_REQUIRED,
        reason: 'no_counterparty_information',
        payload: { mode: this.mode, mocked: true },
      };
    }

    if (address.includes('blocked') || address.includes('sanction')) {
      this.logger.warn(
        `[TRAVEL_RULE_FALLBACK] blocked walletAddress=${params.walletAddress}`,
      );
      return {
        status: TravelRuleStatus.BLOCKED,
        reason: 'counterparty_flagged',
        payload: { mode: this.mode, mocked: true },
      };
    }

    if (amount >= 100000 && !params.vaspCode) {
      return {
        status: TravelRuleStatus.MANUAL_REVIEW,
        reason: 'high_value_transfer_without_vasp',
        payload: { mode: this.mode, mocked: true },
      };
    }

    return {
      status: TravelRuleStatus.CLEARED,
      providerRef: `tr-${Date.now()}`,
      reason: null,
      payload: { mode: this.mode, mocked: true },
    };
  }

  private getString(key: string): string | undefined {
    const value = this.configService.get<string>(key) ?? process.env[key];
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}
