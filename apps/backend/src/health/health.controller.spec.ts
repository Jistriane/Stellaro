import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PixService } from '../payments/pix.service';
import { X402Service } from '../payments/x402.service';
import { EtherfuseService } from '../payments/etherfuse.service';

describe('HealthController', () => {
  let controller: HealthController;
  let pixService: { getStatus: jest.Mock };
  let x402Service: { getStatus: jest.Mock };
  let etherfuseService: { getStatus: jest.Mock };

  beforeAll(async () => {
    const mockPixService = { getStatus: jest.fn() };
    const mockX402Service = { getStatus: jest.fn() };
    const mockEtherfuseService = { getStatus: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PixService, useValue: mockPixService },
        { provide: X402Service, useValue: mockX402Service },
        { provide: EtherfuseService, useValue: mockEtherfuseService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    pixService = module.get(PixService);
    x402Service = module.get(X402Service);
    etherfuseService = module.get(EtherfuseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.FINANCIAL_INTEGRATIONS_REQUIRE_LIVE;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return ok status and fields', () => {
    const res = controller.get();
    expect(res.status).toBe('ok');
    expect(typeof res.uptime).toBe('number');
    expect(typeof res.timestamp).toBe('string');
  });

  it('should return degraded readiness when rails are non-live and strict mode is off', () => {
    pixService.getStatus.mockReturnValue({
      enabled: true,
      mode: 'stub',
      apiUrlConfigured: false,
      apiKeyConfigured: false,
      webhookSecretConfigured: true,
      fallbackActive: true,
      fallbackReason: 'PIX credentials not configured; using implicit stub mode',
    });
    x402Service.getStatus.mockReturnValue({
      enabled: true,
      mode: 'stub',
      configuredMode: null,
      network: 'stellar:testnet',
      acceptedAsset: 'STLT',
      resource: '/payments/x402/settle',
      facilitatorUrl: null,
      providerContractId: null,
      recipient: null,
      apiKeyConfigured: false,
      fallbackActive: true,
      fallbackReason: 'Facilitator config missing',
    });
    etherfuseService.getStatus.mockReturnValue({
      enabled: true,
      mode: 'stub',
      configuredMode: null,
      apiBaseUrl: 'https://api.sand.etherfuse.com',
      blockchain: 'stellar',
      defaultQuoteType: 'onramp',
      defaultSourceAsset: 'MXN',
      defaultTargetAsset: 'USDC:ISSUER',
      customerIdConfigured: false,
      walletAddressConfigured: false,
      apiKeyConfigured: false,
      fallbackActive: true,
      fallbackReason: 'ETHERFUSE credentials not fully configured; using implicit stub mode',
    });

    const res = controller.getFinancialIntegrationsReadiness();

    expect(res.status).toBe('degraded');
    expect(res.strictLiveRequired).toBe(false);
    expect(res.summary).toMatchObject({ liveRails: 0, totalRails: 3 });
    expect(res.checks.some((item) => item.code === 'PIX_NON_LIVE_MODE')).toBe(
      true,
    );
    expect(res.checks.some((item) => item.code === 'X402_NON_LIVE_MODE')).toBe(
      true,
    );
    expect(
      res.checks.some((item) => item.code === 'ETHERFUSE_NON_LIVE_MODE'),
    ).toBe(true);
  });

  it('should fail readiness in strict mode when any rail is not live', () => {
    process.env.FINANCIAL_INTEGRATIONS_REQUIRE_LIVE = 'true';

    pixService.getStatus.mockReturnValue({
      enabled: true,
      mode: 'live',
      apiUrlConfigured: true,
      apiKeyConfigured: true,
      webhookSecretConfigured: true,
      fallbackActive: false,
      fallbackReason: null,
    });
    x402Service.getStatus.mockReturnValue({
      enabled: true,
      mode: 'stub',
      configuredMode: 'stub',
      network: 'stellar:testnet',
      acceptedAsset: 'STLT',
      resource: '/payments/x402/settle',
      facilitatorUrl: null,
      providerContractId: null,
      recipient: null,
      apiKeyConfigured: false,
      fallbackActive: true,
      fallbackReason: 'X402_MODE=stub',
    });
    etherfuseService.getStatus.mockReturnValue({
      enabled: true,
      mode: 'live',
      configuredMode: 'live',
      apiBaseUrl: 'https://api.sand.etherfuse.com',
      blockchain: 'stellar',
      defaultQuoteType: 'onramp',
      defaultSourceAsset: 'MXN',
      defaultTargetAsset: 'USDC:ISSUER',
      customerIdConfigured: true,
      walletAddressConfigured: true,
      apiKeyConfigured: true,
      fallbackActive: false,
      fallbackReason: null,
    });

    const res = controller.getFinancialIntegrationsReadiness();

    expect(res.status).toBe('failed');
    expect(res.strictLiveRequired).toBe(true);
    expect(
      res.checks.some((item) => item.code === 'X402_MODE_NOT_LIVE' && !item.ok),
    ).toBe(true);
  });

  it('should fail readiness when live mode has invalid credentials', () => {
    pixService.getStatus.mockReturnValue({
      enabled: true,
      mode: 'live',
      apiUrlConfigured: false,
      apiKeyConfigured: true,
      webhookSecretConfigured: true,
      fallbackActive: false,
      fallbackReason: null,
    });
    x402Service.getStatus.mockReturnValue({
      enabled: true,
      mode: 'live',
      configuredMode: 'live',
      network: 'stellar:testnet',
      acceptedAsset: 'STLT',
      resource: '/payments/x402/settle',
      facilitatorUrl: 'https://facilitator.example.com',
      providerContractId: null,
      recipient: 'GRECIPIENT',
      apiKeyConfigured: true,
      fallbackActive: false,
      fallbackReason: null,
    });
    etherfuseService.getStatus.mockReturnValue({
      enabled: true,
      mode: 'live',
      configuredMode: 'live',
      apiBaseUrl: 'https://api.sand.etherfuse.com',
      blockchain: 'stellar',
      defaultQuoteType: 'onramp',
      defaultSourceAsset: 'MXN',
      defaultTargetAsset: 'USDC:ISSUER',
      customerIdConfigured: false,
      walletAddressConfigured: true,
      apiKeyConfigured: true,
      fallbackActive: false,
      fallbackReason: null,
    });

    const res = controller.getFinancialIntegrationsReadiness();

    expect(res.status).toBe('failed');
    expect(
      res.checks.some((item) => item.code === 'PIX_LIVE_CREDENTIALS_INVALID'),
    ).toBe(true);
    expect(
      res.checks.some((item) => item.code === 'X402_LIVE_CREDENTIALS_INVALID'),
    ).toBe(true);
    expect(
      res.checks.some(
        (item) => item.code === 'ETHERFUSE_LIVE_CREDENTIALS_INVALID',
      ),
    ).toBe(true);
  });
});
