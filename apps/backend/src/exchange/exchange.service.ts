import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, QuoteSide, TravelRuleStatus } from '@prisma/client';
import { ComplianceService } from '../compliance/compliance.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExchangeProviderService } from './exchange-provider.service';
import { OrdersRepository } from './orders.repository';
import { QuotesRepository } from './quotes.repository';

@Injectable()
export class ExchangeService {
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly prisma: PrismaService,
    private readonly exchangeProvider: ExchangeProviderService,
    private readonly quotesRepository: QuotesRepository,
    private readonly ordersRepository: OrdersRepository,
  ) {}

  async createQuote(params: {
    userId: string;
    pair: string;
    baseAsset: string;
    quoteAsset: string;
    side: QuoteSide;
    amountIn: string;
    expiresInSeconds?: number;
  }) {
    const expiresInSeconds = params.expiresInSeconds ?? 30;
    const providerQuote = await this.exchangeProvider.createQuote({
      pair: params.pair,
      baseAsset: params.baseAsset,
      quoteAsset: params.quoteAsset,
      side: params.side,
      amountIn: params.amountIn,
    });
    return this.quotesRepository.create({
      userId: params.userId,
      pair: params.pair,
      baseAsset: params.baseAsset,
      quoteAsset: params.quoteAsset,
      side: params.side,
      amountIn: params.amountIn,
      amountOut: providerQuote.amountOut,
      rate: providerQuote.rate,
      feeAmount: providerQuote.feeAmount,
      spreadBps: providerQuote.spreadBps,
      source: providerQuote.source,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
      metadata: providerQuote.metadata as Prisma.InputJsonValue | undefined,
    });
  }

  async createOrder(params: {
    userId: string;
    quoteId: string;
    walletId?: string | null;
    metadata?: Prisma.InputJsonValue;
  }) {
    const quote = await this.quotesRepository.findValidById(params.quoteId);
    if (!quote) {
      throw new NotFoundException('Quote not found or expired');
    }

    const routingCheck =
      await this.complianceService.canRoutePixOrCard(params.userId);
    if (!routingCheck.allowed) {
      throw new BadRequestException('User is not cleared for routing');
    }

    const wallet = params.walletId
      ? await this.prisma.wallet.findUnique({ where: { id: params.walletId } })
      : null;

    const baseMetadata =
      params.metadata &&
      typeof params.metadata === 'object' &&
      !Array.isArray(params.metadata)
        ? (params.metadata as Record<string, unknown>)
        : {};

    const travelRulePayload: Record<string, unknown> = {
      status: TravelRuleStatus.NOT_REQUIRED,
      reason: 'no_destination_wallet',
      providerRef: null,
      checkedAt: new Date().toISOString(),
    };

    if (wallet?.address) {
      const travelRule = await this.complianceService.checkTravelRule({
        userId: params.userId,
        walletAddress: wallet.address,
        direction: 'OUTBOUND',
        asset: quote.quoteAsset,
        amount: quote.amountOut ?? quote.amountIn,
      });

      travelRulePayload.status = travelRule.status;
      travelRulePayload.reason = travelRule.reason;
      travelRulePayload.providerRef = travelRule.providerRef ?? null;

      if (!travelRule.allowed) {
        throw new BadRequestException(
          travelRule.reason ?? `Travel rule status ${travelRule.status}`,
        );
      }
    }

    const order = await this.ordersRepository.create({
      userId: params.userId,
      walletId: params.walletId ?? null,
      quoteId: quote.id,
      pair: quote.pair,
      baseAsset: quote.baseAsset,
      quoteAsset: quote.quoteAsset,
      side: quote.side,
      route: quote.source,
      amountIn: quote.amountIn,
      amountOut: quote.amountOut,
      platformFee: quote.feeAmount,
      metadata: {
        ...baseMetadata,
        travelRule: travelRulePayload,
      } as Prisma.InputJsonValue,
    });

    try {
      const routed = await this.exchangeProvider.submitOrder({
        orderId: order.id,
        pair: order.pair,
        side: order.side,
        amountIn: order.amountIn,
        walletAddress: wallet?.address ?? null,
      });

      return this.ordersRepository.markRouted(
        order.id,
        routed.route,
        routed.providerOrderRef,
      );
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Failed to route order';
      await this.ordersRepository.markFailed(order.id, reason);
      throw new BadRequestException(reason);
    }
  }

  getOrderById(orderId: string) {
    return this.ordersRepository.findById(orderId);
  }

  listOrdersByUser(userId: string, take?: number) {
    return this.ordersRepository.listByUser(userId, take);
  }

  listQuotesByUser(userId: string, take?: number) {
    return this.quotesRepository.listRecentByUser(userId, take);
  }

  getProviderStatus() {
    return this.exchangeProvider.getStatus();
  }
}
