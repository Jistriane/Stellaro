import { Injectable } from '@nestjs/common';
import {
  ExchangeOrder,
  OrderStatus,
  Prisma,
  QuoteSide,
  QuoteSource,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    userId: string;
    walletId?: string | null;
    quoteId: string;
    pair: string;
    baseAsset: string;
    quoteAsset: string;
    side: QuoteSide;
    route: QuoteSource;
    amountIn: string;
    amountOut?: string | null;
    platformFee?: string;
    networkFee?: string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<ExchangeOrder> {
    return this.prisma.exchangeOrder.create({
      data: {
        status: OrderStatus.SUBMITTED,
        platformFee: '0',
        networkFee: '0',
        ...data,
      },
    });
  }

  findById(id: string) {
    return this.prisma.exchangeOrder.findUnique({
      where: { id },
      include: {
        quote: true,
        wallet: true,
        settlements: true,
      },
    });
  }

  listByUser(userId: string, take = 20) {
    return this.prisma.exchangeOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        settlements: true,
      },
    });
  }

  markRouted(id: string, route: QuoteSource, providerOrderRef?: string | null) {
    return this.prisma.exchangeOrder.update({
      where: { id },
      data: {
        status: OrderStatus.ROUTED,
        route,
        providerOrderRef: providerOrderRef ?? null,
      },
    });
  }

  markExecuting(id: string) {
    return this.prisma.exchangeOrder.update({
      where: { id },
      data: { status: OrderStatus.EXECUTING },
    });
  }

  markSettling(id: string) {
    return this.prisma.exchangeOrder.update({
      where: { id },
      data: { status: OrderStatus.SETTLING },
    });
  }

  markSettled(id: string, amountOut: string, networkFee?: string) {
    return this.prisma.exchangeOrder.update({
      where: { id },
      data: {
        status: OrderStatus.SETTLED,
        amountOut,
        networkFee: networkFee ?? undefined,
        settledAt: new Date(),
      },
    });
  }

  markFailed(id: string, reason: string) {
    return this.prisma.exchangeOrder.update({
      where: { id },
      data: {
        status: OrderStatus.FAILED,
        complianceBlockReason: reason,
      },
    });
  }
}
