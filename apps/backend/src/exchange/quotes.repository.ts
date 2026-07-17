import { Injectable } from '@nestjs/common';
import { Prisma, Quote, QuoteSide, QuoteSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    userId: string;
    pair: string;
    baseAsset: string;
    quoteAsset: string;
    side: QuoteSide;
    amountIn: string;
    amountOut: string;
    rate: string;
    feeAmount?: string;
    spreadBps?: number;
    source: QuoteSource;
    expiresAt: Date;
    metadata?: Prisma.InputJsonValue;
  }): Promise<Quote> {
    return this.prisma.quote.create({
      data: {
        feeAmount: '0',
        spreadBps: 0,
        ...data,
      },
    });
  }

  findValidById(id: string, now = new Date()) {
    return this.prisma.quote.findFirst({
      where: {
        id,
        expiresAt: { gt: now },
      },
    });
  }

  listRecentByUser(userId: string, take = 20) {
    return this.prisma.quote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
