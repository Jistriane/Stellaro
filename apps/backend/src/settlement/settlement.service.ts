import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ComplianceService } from '../compliance/compliance.service';
import { OrdersRepository } from '../exchange/orders.repository';
import { SettlementProviderService } from './settlement-provider.service';
import { SettlementsRepository } from './settlements.repository';

@Injectable()
export class SettlementService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly settlementsRepository: SettlementsRepository,
    private readonly settlementProvider: SettlementProviderService,
    private readonly complianceService: ComplianceService,
  ) {}

  async createPendingSettlement(params: {
    orderId: string;
    chain: string;
    asset: string;
    destinationAddress: string;
    metadata?: object;
  }) {
    const order = await this.ordersRepository.findById(params.orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const travelRule = await this.complianceService.checkTravelRule({
      userId: order.userId,
      walletAddress: params.destinationAddress,
      direction: 'OUTBOUND',
      asset: params.asset,
      amount: order.amountOut ?? order.amountIn,
    });
    if (!travelRule.allowed) {
      throw new BadRequestException(
        travelRule.reason ?? `Travel rule status ${travelRule.status}`,
      );
    }

    await this.ordersRepository.markSettling(order.id);

    const baseMetadata =
      params.metadata && typeof params.metadata === 'object'
        ? (params.metadata as Record<string, unknown>)
        : {};

    return this.settlementsRepository.create({
      orderId: order.id,
      chain: params.chain,
      asset: params.asset,
      destinationAddress: params.destinationAddress,
      metadata: {
        ...baseMetadata,
        travelRule: {
          status: travelRule.status,
          reason: travelRule.reason,
          providerRef: travelRule.providerRef ?? null,
          checkedAt: new Date().toISOString(),
        },
      } as Prisma.InputJsonValue,
    });
  }

  async broadcastPendingSettlement(settlementId: string) {
    const settlement = await this.settlementsRepository.findById(settlementId);
    if (!settlement) {
      throw new NotFoundException('Settlement not found');
    }

    const order = await this.ordersRepository.findById(settlement.orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const result = await this.settlementProvider.broadcastSettlement({
      settlementId: settlement.id,
      chain: settlement.chain,
      asset: settlement.asset,
      destinationAddress: settlement.destinationAddress,
      amount: order.amountOut ?? order.amountIn,
    });

    return this.settlementsRepository.markBroadcasted(
      settlement.id,
      result.txHash,
      result.metadata as Prisma.InputJsonValue | undefined,
    );
  }

  markBroadcasted(settlementId: string, txHash: string) {
    return this.settlementsRepository.markBroadcasted(settlementId, txHash);
  }

  async markConfirmed(settlementId: string, confirmations: number) {
    const settlement =
      await this.settlementsRepository.markConfirmed(settlementId, confirmations);
    const order = await this.ordersRepository.findById(settlement.orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    await this.ordersRepository.markSettled(
      settlement.orderId,
      order.amountOut ?? order.amountIn,
    );
    return settlement;
  }

  markFailed(settlementId: string, reason: string) {
    return this.settlementsRepository.markFailed(settlementId, reason);
  }

  listPending(limit?: number) {
    return this.settlementsRepository.listPending(limit);
  }

  listByUser(userId: string, limit?: number) {
    return this.settlementsRepository.listByUser(userId, limit);
  }

  async getByIdForUser(userId: string, settlementId: string) {
    const settlement = await this.settlementsRepository.findById(settlementId);
    if (!settlement) {
      throw new NotFoundException('Settlement not found');
    }
    if (settlement.order.userId !== userId) {
      throw new ForbiddenException(
        'Settlement does not belong to authenticated user',
      );
    }
    return settlement;
  }

  async syncPendingSettlements(limit?: number) {
    const pendings = await this.settlementsRepository.listPending(limit);
    const results = [];

    for (const settlement of pendings) {
      if (!settlement.txHash) {
        results.push(
          await this.broadcastPendingSettlement(settlement.id),
        );
        continue;
      }

      const status = await this.settlementProvider.syncSettlement(
        settlement.txHash,
      );
      if (status.confirmed) {
        results.push(
          await this.markConfirmed(settlement.id, status.confirmations),
        );
      } else {
        results.push(settlement);
      }
    }

    return results;
  }

  getProviderStatus() {
    return this.settlementProvider.getStatus();
  }
}
