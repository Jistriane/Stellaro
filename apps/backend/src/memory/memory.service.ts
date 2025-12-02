import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  history(userId: string) {
    return { userId, events: [] };
  }

  async logEvent(
    userId: string,
    type:
      | 'SIGNAL_INGEST'
      | 'DECISION_MADE'
      | 'ACTION_EXECUTED'
      | string, // Allow custom event types for multi-agent
    payload: unknown,
  ) {
    try {
      const created = await this.prisma.riskEvent.create({
        data: { userId, type, payload: payload as object },
      });
      return { ok: true as const, id: created.id };
    } catch (e) {
      this.logger.error('Failed to log RiskEvent', e as Error);
      return { ok: false as const };
    }
  }

  async recordProposal(
    userId: string,
    proposal: { proposalId: string; confidence: number; actions: unknown },
  ) {
    try {
      const created = await this.prisma.riskProposal.create({
        data: {
          userId,
          proposalId: proposal.proposalId,
          confidence: proposal.confidence,
          actions: proposal.actions as object,
        },
      });
      // também registra evento
      void this.logEvent(userId, 'DECISION_MADE', proposal);
      return { ok: true as const, id: created.id };
    } catch (e) {
      this.logger.error('Failed to record RiskProposal', e as Error);
      return { ok: false as const };
    }
  }

  async recordExecution(input: {
    userId: string;
    proposalId?: string;
    action: string;
    params: unknown;
    executed: boolean;
  }) {
    try {
      const created = await this.prisma.riskExecution.create({
        data: {
          userId: input.userId,
          proposalId: input.proposalId,
          action: input.action,
          params: input.params as object,
          executed: input.executed,
        },
      });
      // também registra evento
      void this.logEvent(input.userId, 'ACTION_EXECUTED', input);
      return { ok: true as const, id: created.id };
    } catch (e) {
      this.logger.error('Failed to record RiskExecution', e as Error);
      return { ok: false as const };
    }
  }
}
