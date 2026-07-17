import { Injectable } from '@nestjs/common';
import { LedgerDirection, LedgerEntry } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  createEntry(data: {
    userId: string;
    referenceType: string;
    referenceId: string;
    currency: string;
    direction: LedgerDirection;
    amount: string;
    description?: string;
    metadata?: object;
  }): Promise<LedgerEntry> {
    return this.prisma.ledgerEntry.create({ data });
  }

  listByUser(userId: string, take = 50) {
    return this.prisma.ledgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async getBalanceByUserAndCurrency(userId: string, currency: string) {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { userId, currency },
      select: { amount: true, direction: true },
    });

    const balance = entries.reduce((acc, entry) => {
      const amount = Number(entry.amount);
      return entry.direction === LedgerDirection.CREDIT
        ? acc + amount
        : acc - amount;
    }, 0);

    return balance.toFixed(2);
  }
}
