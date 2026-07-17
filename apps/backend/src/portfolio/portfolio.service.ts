import { Injectable } from '@nestjs/common';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  async getPortfolioByUser(userId: string) {
    const [wallets, recentOrders, fiatAvailable] = await Promise.all([
      this.prisma.wallet.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.exchangeOrder.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          settlements: true,
        },
      }),
      this.ledgerService.getBalanceByUserAndCurrency(userId, 'BRL'),
    ]);

    const balances = recentOrders
      .filter((order) => order.status === 'SETTLED')
      .reduce<Record<string, number>>((acc, order) => {
        const asset = order.quoteAsset;
        const amount = Number(order.amountOut ?? '0');
        acc[asset] = (acc[asset] ?? 0) + amount;
        return acc;
      }, {});

    return {
      wallets,
      fiatAvailable,
      balances: Object.entries(balances).map(([asset, amount]) => ({
        asset,
        amount: amount.toFixed(8),
      })),
      recentOrders,
    };
  }
}
