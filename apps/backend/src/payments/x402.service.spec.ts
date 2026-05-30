import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { X402Service } from './x402.service';

describe('X402Service', () => {
  function createService(values: Record<string, string | undefined>) {
    const configService = {
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;

    return new X402Service(configService);
  }

  it('should default to stub mode when facilitator config is missing', () => {
    const service = createService({});

    expect(service.getStatus()).toMatchObject({
      enabled: true,
      mode: 'stub',
      fallbackActive: true,
      acceptedAsset: 'STLT',
      network: 'stellar:testnet',
    });
  });

  it('should expose live mode when facilitator config is complete', () => {
    const service = createService({
      X402_MODE: 'live',
      X402_FACILITATOR_URL: 'https://facilitator.example.com',
      FACILITATOR_PROVIDER_CONTRACT_ID: 'C_PROVIDER_123',
      FACILITATOR_API_KEY: 'secret',
      X402_RECIPIENT: 'GRECIPIENT',
    });

    expect(service.getStatus()).toMatchObject({
      enabled: true,
      mode: 'live',
      fallbackActive: false,
      facilitatorUrl: 'https://facilitator.example.com',
      providerContractId: 'C_PROVIDER_123',
      recipient: 'GRECIPIENT',
      apiKeyConfigured: true,
    });
  });

  it('should disable explicit live mode when required config is incomplete', () => {
    const service = createService({
      X402_MODE: 'live',
      X402_FACILITATOR_URL: 'https://facilitator.example.com',
    });

    expect(service.getStatus()).toMatchObject({
      enabled: false,
      mode: 'disabled',
      fallbackActive: true,
    });
  });

  it('should expose fallback reason when implicit stub is used', () => {
    const service = createService({});

    expect(service.getStatus().fallbackReason).toContain('Facilitator config missing');
  });

  it('should create a quote with settlement details', () => {
    const service = createService({
      X402_MODE: 'stub',
      X402_RESOURCE: '/payments/x402/settle',
      X402_FEE_BPS: '30',
      X402_TTL_SECONDS: '1200',
    });

    const result = service.createQuote({
      amount: '125.5',
      walletAddress: 'GABC123',
      intent: 'deposit',
    });

    expect(result.ok).toBe(true);
    expect(result.quote.settlement).toMatchObject({
      asset: 'STLT',
      amount: '125.50',
      feeBps: 30,
      walletAddress: 'GABC123',
      network: 'stellar:testnet',
    });
    expect(result.quote.headers['x402-resource']).toBe('/payments/x402/settle');
  });

  it('should reject invalid amounts', () => {
    const service = createService({});

    expect(() => service.createQuote({ amount: '0' })).toThrow(BadRequestException);
  });
});