import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

export type X402Mode = 'disabled' | 'stub' | 'live';

export type X402Status = {
  enabled: boolean;
  mode: X402Mode;
  configuredMode: string | null;
  network: string;
  acceptedAsset: string;
  resource: string;
  facilitatorUrl: string | null;
  providerContractId: string | null;
  recipient: string | null;
  apiKeyConfigured: boolean;
  fallbackActive: boolean;
  fallbackReason: string | null;
};

export type X402QuoteRequest = {
  amount: string;
  asset?: string;
  walletAddress?: string;
  memo?: string;
  intent?: 'deposit' | 'withdrawal' | 'subscription' | 'api-access';
};

export type X402QuoteResponse = {
  ok: true;
  quote: {
    sessionId: string;
    mode: X402Mode;
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
};

@Injectable()
export class X402Service {
  private readonly logger = new Logger(X402Service.name);

  constructor(private readonly configService: ConfigService) {}

  getStatus(): X402Status {
    const configuredMode = this.getString('X402_MODE')?.toLowerCase() ?? null;
    const resolved = this.resolveMode();
    const mode = resolved.mode;
    const facilitatorUrl = this.getString('X402_FACILITATOR_URL');
    const providerContractId = this.getString(
      'FACILITATOR_PROVIDER_CONTRACT_ID',
    );
    const recipient = this.getString('X402_RECIPIENT');
    const network =
      this.getString('X402_NETWORK') ??
      (process.env.STELLAR_NETWORK === 'mainnet' ||
      process.env.STELLAR_NETWORK === 'public'
        ? 'stellar:mainnet'
        : 'stellar:testnet');
    const acceptedAsset = this.getString('X402_ACCEPTED_ASSET') ?? 'STLT';
    const resource = this.getString('X402_RESOURCE') ?? '/payments/x402/settle';
    const apiKeyConfigured = !!this.getString('FACILITATOR_API_KEY');

    return {
      enabled: mode !== 'disabled',
      mode,
      configuredMode,
      network,
      acceptedAsset,
      resource,
      facilitatorUrl: facilitatorUrl ?? null,
      providerContractId: providerContractId ?? null,
      recipient: recipient ?? null,
      apiKeyConfigured,
      fallbackActive: mode !== 'live',
      fallbackReason: mode === 'live' ? null : resolved.reason,
    };
  }

  createQuote(params: X402QuoteRequest): X402QuoteResponse {
    const amount = Number(params.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    const status = this.getStatus();
    if (!status.enabled) {
      throw new BadRequestException('x402 integration disabled');
    }

    const feeBps = this.getNumber('X402_FEE_BPS') ?? 25;
    const ttlSeconds = this.getNumber('X402_TTL_SECONDS') ?? 900;
    const facilitatorUrl =
      status.facilitatorUrl ?? 'https://facilitator.stellaro.local';
    const providerContractId =
      status.providerContractId ?? 'stub-provider-contract';
    const recipient =
      status.recipient ??
      'GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX';
    const asset = (params.asset ?? status.acceptedAsset).trim().toUpperCase();
    const sessionId = randomUUID();
    const total = amount * (1 + feeBps / 10_000);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const memo =
      params.memo?.trim() ||
      `stellaro:${params.intent ?? 'deposit'}:${sessionId.slice(0, 8)}`;

    if (status.mode === 'live') {
      this.logger.log(
        `Generated live x402 quote ${sessionId} for ${asset} ${amount.toFixed(2)}`,
      );
    } else {
      this.logger.warn(
        `[X402_FALLBACK] action=create_quote mode=${status.mode} reason="${status.fallbackReason ?? 'non-live mode'}"`,
      );
    }

    return {
      ok: true,
      quote: {
        sessionId,
        mode: status.mode,
        facilitator: {
          url: facilitatorUrl,
          apiKeyConfigured: status.apiKeyConfigured,
        },
        resource: status.resource,
        settlement: {
          network: status.network,
          asset,
          amount: amount.toFixed(2),
          feeBps,
          total: total.toFixed(2),
          providerContractId,
          recipient,
          walletAddress: params.walletAddress?.trim() || null,
          memo,
          expiresAt,
        },
        headers: {
          'x402-version': '0.2',
          'x402-resource': status.resource,
          'x402-network': status.network,
          'x402-payment-url': `${facilitatorUrl.replace(/\/$/, '')}/quote/${sessionId}`,
        },
        guidance:
          status.mode === 'live'
            ? 'Live facilitator mode enabled. Forward this quote to the x402-capable client and complete settlement against the facilitator.'
            : 'Stub mode enabled. Use this quote to wire the frontend and replace facilitator credentials when moving to live settlement.',
      },
    };
  }

  private resolveMode(): { mode: X402Mode; reason: string | null } {
    const nodeEnv =
      this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? '';
    const allowStub = nodeEnv.toLowerCase() !== 'production';
    const configuredMode = this.getString('X402_MODE')?.toLowerCase();
    const facilitatorUrl = this.getString('X402_FACILITATOR_URL');
    const providerContractId = this.getString(
      'FACILITATOR_PROVIDER_CONTRACT_ID',
    );
    const apiKey = this.getString('FACILITATOR_API_KEY');
    const liveReady = !!facilitatorUrl && !!providerContractId && !!apiKey;

    if (configuredMode === 'disabled') {
      return { mode: 'disabled', reason: 'X402_MODE=disabled' };
    }

    if (configuredMode === 'live') {
      if (!liveReady) {
        this.logger.warn(
          'x402 live mode requested but facilitator configuration is incomplete',
        );
        return {
          mode: 'disabled',
          reason:
            'X402_MODE=live but X402_FACILITATOR_URL/FACILITATOR_PROVIDER_CONTRACT_ID/FACILITATOR_API_KEY is incomplete',
        };
      }
      return { mode: 'live', reason: null };
    }

    if (configuredMode === 'stub') {
      if (!allowStub) {
        return {
          mode: 'disabled',
          reason: 'X402_MODE=stub is not allowed in production',
        };
      }
      return { mode: 'stub', reason: 'X402_MODE=stub' };
    }

    if (liveReady) {
      return { mode: 'live', reason: null };
    }

    if (!allowStub) {
      return {
        mode: 'disabled',
        reason:
          'Facilitator config missing in production (X402_FACILITATOR_URL/FACILITATOR_PROVIDER_CONTRACT_ID/FACILITATOR_API_KEY)',
      };
    }

    return {
      mode: 'stub',
      reason:
        'Facilitator config missing (X402_FACILITATOR_URL/FACILITATOR_PROVIDER_CONTRACT_ID/FACILITATOR_API_KEY); using stub mode',
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
}
