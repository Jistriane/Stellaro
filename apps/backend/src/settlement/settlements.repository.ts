import { Injectable } from '@nestjs/common';
import { Prisma, Settlement, SettlementStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettlementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.settlement.findUnique({
      where: { id },
      include: { order: true },
    });
  }

  listByUser(userId: string, take = 20) {
    return this.prisma.settlement.findMany({
      where: {
        order: {
          userId,
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: { order: true },
    });
  }

  create(data: {
    orderId: string;
    chain: string;
    asset: string;
    destinationAddress: string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<Settlement> {
    return this.prisma.settlement.create({
      data: {
        status: SettlementStatus.PENDING,
        ...data,
      },
    });
  }

  markBroadcasted(
    id: string,
    txHash: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.prisma.settlement.update({
      where: { id },
      data: {
        txHash,
        status: SettlementStatus.BROADCASTED,
        broadcastedAt: new Date(),
        metadata: metadata ?? undefined,
      },
    });
  }

  markConfirmed(id: string, confirmations: number) {
    return this.prisma.settlement.update({
      where: { id },
      data: {
        status: SettlementStatus.CONFIRMED,
        confirmations,
        confirmedAt: new Date(),
      },
    });
  }

  markFailed(id: string, reason: string) {
    return this.prisma.settlement.update({
      where: { id },
      data: {
        status: SettlementStatus.FAILED,
        metadata: { failureReason: reason } as Prisma.InputJsonValue,
      },
    });
  }

  listPending(limit = 100) {
    return this.prisma.settlement.findMany({
      where: {
        status: {
          in: [SettlementStatus.PENDING, SettlementStatus.BROADCASTED],
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: { order: true },
    });
  }
}
