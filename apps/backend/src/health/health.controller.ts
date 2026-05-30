import { Controller, Get } from '@nestjs/common';
import { EtherfuseService } from '../payments/etherfuse.service';
import { PixService } from '../payments/pix.service';
import { X402Service } from '../payments/x402.service';

type IntegrationCheck = {
  rail: 'pix' | 'x402' | 'etherfuse';
  ok: boolean;
  level: 'error' | 'warn';
  code: string;
  message: string;
};

@Controller('health')
export class HealthController {
  constructor(
    private readonly pixService: PixService,
    private readonly x402Service: X402Service,
    private readonly etherfuseService: EtherfuseService,
  ) {}

  @Get()
  get() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('integrations/financial')
  getFinancialIntegrationsReadiness() {
    const pix = this.pixService.getStatus();
    const x402 = this.x402Service.getStatus();
    const etherfuse = this.etherfuseService.getStatus();
    const requireLive = String(
      process.env.FINANCIAL_INTEGRATIONS_REQUIRE_LIVE || '',
    ).toLowerCase() === 'true';

    const checks: IntegrationCheck[] = [];

    if (requireLive && pix.mode !== 'live') {
      checks.push({
        rail: 'pix',
        ok: false,
        level: 'error',
        code: 'PIX_MODE_NOT_LIVE',
        message: 'PIX must be in live mode when FINANCIAL_INTEGRATIONS_REQUIRE_LIVE=true',
      });
    }

    if (requireLive && x402.mode !== 'live') {
      checks.push({
        rail: 'x402',
        ok: false,
        level: 'error',
        code: 'X402_MODE_NOT_LIVE',
        message: 'x402 must be in live mode when FINANCIAL_INTEGRATIONS_REQUIRE_LIVE=true',
      });
    }

    if (requireLive && etherfuse.mode !== 'live') {
      checks.push({
        rail: 'etherfuse',
        ok: false,
        level: 'error',
        code: 'ETHERFUSE_MODE_NOT_LIVE',
        message: 'Etherfuse must be in live mode when FINANCIAL_INTEGRATIONS_REQUIRE_LIVE=true',
      });
    }

    if (pix.mode === 'live' && (!pix.apiKeyConfigured || !pix.apiUrlConfigured)) {
      checks.push({
        rail: 'pix',
        ok: false,
        level: 'error',
        code: 'PIX_LIVE_CREDENTIALS_INVALID',
        message: 'PIX live mode requires PIX_API_KEY and PIX_API_URL',
      });
    }

    if (
      x402.mode === 'live' &&
      (!x402.apiKeyConfigured || !x402.facilitatorUrl || !x402.providerContractId)
    ) {
      checks.push({
        rail: 'x402',
        ok: false,
        level: 'error',
        code: 'X402_LIVE_CREDENTIALS_INVALID',
        message:
          'x402 live mode requires FACILITATOR_API_KEY, X402_FACILITATOR_URL and FACILITATOR_PROVIDER_CONTRACT_ID',
      });
    }

    if (
      etherfuse.mode === 'live' &&
      (!etherfuse.apiKeyConfigured || !etherfuse.customerIdConfigured)
    ) {
      checks.push({
        rail: 'etherfuse',
        ok: false,
        level: 'error',
        code: 'ETHERFUSE_LIVE_CREDENTIALS_INVALID',
        message:
          'Etherfuse live mode requires ETHERFUSE_API_KEY and ETHERFUSE_CUSTOMER_ID',
      });
    }

    if (pix.mode !== 'live') {
      checks.push({
        rail: 'pix',
        ok: true,
        level: 'warn',
        code: 'PIX_NON_LIVE_MODE',
        message: pix.fallbackReason ?? 'PIX is operating in non-live mode',
      });
    }

    if (x402.mode !== 'live') {
      checks.push({
        rail: 'x402',
        ok: true,
        level: 'warn',
        code: 'X402_NON_LIVE_MODE',
        message: x402.fallbackReason ?? 'x402 is operating in non-live mode',
      });
    }

    if (etherfuse.mode !== 'live') {
      checks.push({
        rail: 'etherfuse',
        ok: true,
        level: 'warn',
        code: 'ETHERFUSE_NON_LIVE_MODE',
        message: etherfuse.fallbackReason ?? 'Etherfuse is operating in non-live mode',
      });
    }

    const hasError = checks.some((item) => item.level === 'error' && !item.ok);
    const hasWarn = checks.some((item) => item.level === 'warn');
    const liveRails = [pix.mode, x402.mode, etherfuse.mode].filter(
      (mode) => mode === 'live',
    ).length;

    return {
      status: hasError ? 'failed' : hasWarn ? 'degraded' : 'ok',
      strictLiveRequired: requireLive,
      summary: {
        liveRails,
        totalRails: 3,
      },
      rails: {
        pix,
        x402,
        etherfuse,
      },
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}
