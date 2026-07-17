import { Injectable } from '@nestjs/common';
import { ComplianceService } from '../compliance/compliance.service';
import { ExchangeService } from '../exchange/exchange.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettlementService } from '../settlement/settlement.service';

@Injectable()
export class HistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchangeService: ExchangeService,
    private readonly settlementService: SettlementService,
    private readonly complianceService: ComplianceService,
  ) {}

  async getUnifiedHistory(userId: string, limit = 20) {
    const [
      orders,
      settlements,
      deposits,
      withdrawals,
      threads,
      exchangeProvider,
      settlementProvider,
      travelRuleProvider,
    ] = await Promise.all([
      this.prisma.exchangeOrder.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          settlements: true,
        },
      }),
      this.prisma.settlement.findMany({
        where: {
          order: {
            userId,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.pixPayment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.pixWithdrawal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.supportThread.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      Promise.resolve(this.exchangeService.getProviderStatus()),
      Promise.resolve(this.settlementService.getProviderStatus()),
      Promise.resolve(this.complianceService.getTravelRuleProviderStatus()),
    ]);

    const items = [
      ...orders.map((order) => ({
        id: order.id,
        type: 'order',
        status: order.status,
        createdAt: order.createdAt,
        summary: `${order.side} ${order.pair}`,
        data: order,
      })),
      ...settlements.map((settlement) => ({
        id: settlement.id,
        type: 'settlement',
        status: settlement.status,
        createdAt: settlement.createdAt,
        summary: `Settlement ${settlement.asset} -> ${settlement.destinationAddress.slice(0, 6)}...`,
        data: settlement,
      })),
      ...deposits.map((deposit) => ({
        id: deposit.id,
        type: 'pix_deposit',
        status: deposit.status,
        createdAt: deposit.createdAt,
        summary: `PIX deposito ${deposit.amount} BRL`,
        data: deposit,
      })),
      ...withdrawals.map((withdrawal) => ({
        id: withdrawal.id,
        type: 'pix_withdrawal',
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
        summary: `PIX saque ${withdrawal.amount} BRL`,
        data: withdrawal,
      })),
      ...threads.map((thread) => ({
        id: thread.id,
        type: 'support',
        status: thread.status,
        createdAt: thread.updatedAt,
        summary: thread.messages[0]?.messageText ?? thread.subject ?? 'Support thread',
        data: thread,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return {
      userId,
      items,
      providers: {
        exchange: exchangeProvider,
        settlement: settlementProvider,
        travelRule: travelRuleProvider,
      },
      pagination: {
        limit,
        hasMore: false,
      },
    };
  }
}
