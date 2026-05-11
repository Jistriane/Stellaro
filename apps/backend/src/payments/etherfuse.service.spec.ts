import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EtherfuseService } from './etherfuse.service';

describe('EtherfuseService', () => {
  function createService(values: Record<string, string | undefined>) {
    const configService = {
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;

    return new EtherfuseService(configService);
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should default to stub mode when api config is missing', () => {
    const service = createService({});

    expect(service.getStatus()).toMatchObject({
      enabled: true,
      mode: 'stub',
      blockchain: 'stellar',
    });
  });

  it('should expose live mode when api config is complete', () => {
    const service = createService({
      ETHERFUSE_MODE: 'live',
      ETHERFUSE_API_BASE_URL: 'https://api.sand.etherfuse.com',
      ETHERFUSE_API_KEY: 'test-key',
      ETHERFUSE_CUSTOMER_ID: 'customer-123',
    });

    expect(service.getStatus()).toMatchObject({
      enabled: true,
      mode: 'live',
      apiKeyConfigured: true,
      customerIdConfigured: true,
    });
  });

  it('should generate stub quote in stub mode', async () => {
    const service = createService({
      ETHERFUSE_MODE: 'stub',
      ETHERFUSE_STUB_EXCHANGE_RATE: '0.2',
      ETHERFUSE_STUB_FEE_BPS: '50',
    });

    const result = await service.createQuote({
      amount: '100',
      quoteType: 'onramp',
      sourceAsset: 'MXN',
      targetAsset: 'USDC:ISSUER',
    });

    expect(result.ok).toBe(true);
    expect(result.quote).toMatchObject({
      mode: 'stub',
      sourceAmount: '100.00',
      exchangeRate: '0.200000',
      feeBps: '50',
    });
  });

  it('should call Etherfuse quote endpoint in live mode', async () => {
    const service = createService({
      ETHERFUSE_MODE: 'live',
      ETHERFUSE_API_BASE_URL: 'https://api.sand.etherfuse.com',
      ETHERFUSE_API_KEY: 'test-key',
      ETHERFUSE_CUSTOMER_ID: 'customer-123',
    });

    const fetchMock = jest
      .spyOn(globalThis, 'fetch' as keyof typeof globalThis)
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          quoteId: 'quote-1',
          blockchain: 'stellar',
          sourceAmount: '50',
          destinationAmount: '9.5',
          exchangeRate: '0.19',
          feeBps: '20',
          expiresAt: '2026-01-01T00:00:00.000Z',
        }),
      } as Response);

    const result = await service.createQuote({ amount: '50' });

    expect(fetchMock).toHaveBeenCalled();
    expect(result.ok).toBe(true);
    expect(result.quote).toMatchObject({
      id: 'quote-1',
      mode: 'live',
      destinationAmount: '9.5',
    });
  });

  it('should create stub order from quoteId', async () => {
    const service = createService({
      ETHERFUSE_MODE: 'stub',
    });

    const result = await service.createOrder({
      quoteId: 'quote-123',
      walletAddress: 'GABC123',
    });

    expect(result.ok).toBe(true);
    expect(result.order).toMatchObject({
      mode: 'stub',
      quoteId: 'quote-123',
      status: 'pending',
    });
  });

  it('should call Etherfuse order endpoint in live mode', async () => {
    const service = createService({
      ETHERFUSE_MODE: 'live',
      ETHERFUSE_API_BASE_URL: 'https://api.sand.etherfuse.com',
      ETHERFUSE_API_KEY: 'test-key',
      ETHERFUSE_CUSTOMER_ID: 'customer-123',
      ETHERFUSE_BANK_ACCOUNT_ID: 'bank-123',
      ETHERFUSE_WALLET_ADDRESS: 'GTEST',
    });

    const fetchMock = jest
      .spyOn(globalThis, 'fetch' as keyof typeof globalThis)
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          onramp: {
            orderId: 'order-1',
          },
        }),
      } as Response);

    const result = await service.createOrder({ quoteId: 'quote-1' });

    expect(fetchMock).toHaveBeenCalled();
    expect(result.ok).toBe(true);
    expect(result.order).toMatchObject({
      id: 'order-1',
      mode: 'live',
      direction: 'onramp',
    });
  });

  it('should reject order creation without quoteId', async () => {
    const service = createService({ ETHERFUSE_MODE: 'stub' });

    await expect(service.createOrder({ quoteId: '' })).rejects.toThrow(BadRequestException);
  });

  it('should reject invalid amounts', async () => {
    const service = createService({});

    await expect(service.createQuote({ amount: '0' })).rejects.toThrow(BadRequestException);
  });
});
