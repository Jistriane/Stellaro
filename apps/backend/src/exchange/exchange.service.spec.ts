import { Test } from '@nestjs/testing';
import { QuoteSide, QuoteSource } from '@prisma/client';
import { ComplianceService } from '../compliance/compliance.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExchangeProviderService } from './exchange-provider.service';
import { ExchangeService } from './exchange.service';
import { OrdersRepository } from './orders.repository';
import { QuotesRepository } from './quotes.repository';

describe('ExchangeService', () => {
  let service: ExchangeService;
  let provider: jest.Mocked<ExchangeProviderService>;
  let quotesRepository: jest.Mocked<QuotesRepository>;
  let ordersRepository: jest.Mocked<OrdersRepository>;
  let compliance: jest.Mocked<ComplianceService>;
  let prisma: { wallet: { findUnique: jest.Mock } };

  beforeEach(async () => {
    provider = {
      createQuote: jest.fn(),
      submitOrder: jest.fn(),
      getStatus: jest.fn(),
    } as unknown as jest.Mocked<ExchangeProviderService>;

    quotesRepository = {
      create: jest.fn(),
      findValidById: jest.fn(),
      listRecentByUser: jest.fn(),
    } as unknown as jest.Mocked<QuotesRepository>;

    ordersRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      listByUser: jest.fn(),
      markRouted: jest.fn(),
      markExecuting: jest.fn(),
      markSettling: jest.fn(),
      markSettled: jest.fn(),
      markFailed: jest.fn(),
    } as unknown as jest.Mocked<OrdersRepository>;

    compliance = {
      canRoutePixOrCard: jest.fn(),
      checkTravelRule: jest.fn(),
    } as unknown as jest.Mocked<ComplianceService>;

    prisma = {
      wallet: {
        findUnique: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        ExchangeService,
        { provide: ComplianceService, useValue: compliance },
        { provide: PrismaService, useValue: prisma },
        { provide: ExchangeProviderService, useValue: provider },
        { provide: QuotesRepository, useValue: quotesRepository },
        { provide: OrdersRepository, useValue: ordersRepository },
      ],
    }).compile();

    service = module.get(ExchangeService);
  });

  it('cria quote usando provider configuravel', async () => {
    provider.createQuote.mockResolvedValue({
      source: QuoteSource.EXCHANGE_PARTNER,
      amountOut: '190.00',
      rate: '5.20000000',
      feeAmount: '4.00',
      spreadBps: 45,
      metadata: { mocked: true },
    });
    quotesRepository.create.mockResolvedValue({ id: 'q1' } as any);

    await service.createQuote({
      userId: 'user-1',
      pair: 'BRL/USDT',
      baseAsset: 'BRL',
      quoteAsset: 'USDT',
      side: QuoteSide.BUY,
      amountIn: '1000.00',
    });

    expect(provider.createQuote).toHaveBeenCalledWith({
      pair: 'BRL/USDT',
      baseAsset: 'BRL',
      quoteAsset: 'USDT',
      side: QuoteSide.BUY,
      amountIn: '1000.00',
    });
    expect(quotesRepository.create).toHaveBeenCalled();
  });

  it('cria ordem e marca como routed ao receber providerOrderRef', async () => {
    quotesRepository.findValidById.mockResolvedValue({
      id: 'quote-1',
      pair: 'BRL/USDT',
      baseAsset: 'BRL',
      quoteAsset: 'USDT',
      side: QuoteSide.BUY,
      source: QuoteSource.EXCHANGE_PARTNER,
      amountIn: '1000.00',
      amountOut: '190.00',
      feeAmount: '4.00',
    } as any);
    compliance.canRoutePixOrCard.mockResolvedValue({
      ok: true,
      allowed: true,
      level: 'basic',
    });
    compliance.checkTravelRule.mockResolvedValue({
      ok: true,
      allowed: true,
      status: 'CLEARED',
      reason: null,
    } as any);
    prisma.wallet.findUnique.mockResolvedValue({
      id: 'wallet-1',
      address: 'GTEST123',
    });
    ordersRepository.create.mockResolvedValue({
      id: 'order-1',
      pair: 'BRL/USDT',
      side: QuoteSide.BUY,
      amountIn: '1000.00',
    } as any);
    provider.submitOrder.mockResolvedValue({
      route: QuoteSource.EXCHANGE_PARTNER,
      providerOrderRef: 'provider-123',
      metadata: { mocked: true },
    });
    ordersRepository.markRouted.mockResolvedValue({
      id: 'order-1',
      status: 'ROUTED',
    } as any);

    await service.createOrder({
      userId: 'user-1',
      quoteId: 'quote-1',
      walletId: 'wallet-1',
    });

    expect(provider.submitOrder).toHaveBeenCalledWith({
      orderId: 'order-1',
      pair: 'BRL/USDT',
      side: QuoteSide.BUY,
      amountIn: '1000.00',
      walletAddress: 'GTEST123',
    });
    expect(ordersRepository.markRouted).toHaveBeenCalledWith(
      'order-1',
      QuoteSource.EXCHANGE_PARTNER,
      'provider-123',
    );
  });
});
