import { Injectable } from '@nestjs/common';
import { IngestSignalsDto } from './dto/signal.dto';
import { DecideDto } from './dto/decide.dto';
import { ExecuteDto } from './dto/execute.dto';
import { ReasoningService } from './reasoning.service';
import { ActionsService } from '../actions/actions.service';
import { MemoryService } from '../memory/memory.service';
import { PrismaService } from '../prisma/prisma.service';

export type RiskLevel = 'low' | 'neutral' | 'high';

export interface RiskSummary {
  userId: string;
  exposure: Record<string, unknown>;
  riskLevel: RiskLevel;
}

export interface ProposedAction {
  type: string;
  [key: string]: unknown;
}

export interface DecisionProposal {
  proposalId: string;
  confidence: number;
  actions: ProposedAction[];
}

export interface IngestSignalsResult {
  ok: boolean;
  received: IngestSignalsDto;
}

@Injectable()
export class RiskService {
  constructor(
    private readonly reasoning: ReasoningService,
    private readonly actions: ActionsService,
    private readonly memory: MemoryService,
    private readonly prisma: PrismaService,
  ) {}

  async ingestSignals(dto: IngestSignalsDto): Promise<IngestSignalsResult> {
    // Normalização e validação de sinais realizada pelo DTO validation pipe
    const ctx = (dto as unknown as { context?: { userId?: string } }).context;
    const userId = ctx?.userId ?? 'unknown';
    await this.memory.logEvent(userId, 'SIGNAL_INGEST', dto);
    return { ok: true, received: dto };
  }

  async getSummary(userId: string): Promise<RiskSummary & { events: any[] }> {
    // Buscar eventos de risco reais no banco de dados
    const [events, auditLogs] = await Promise.all([
      this.prisma.riskEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.auditLog.findMany({
        where: { userId, level: { in: ['WARN', 'ERROR', 'SECURITY'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Calcular nível de risco baseado nos logs recentes
    let riskLevel: RiskLevel = 'low';
    const securityAlerts = auditLogs.filter((log) => log.level === 'SECURITY');
    if (securityAlerts.length > 0) {
      riskLevel = 'high';
    } else if (auditLogs.length > 2 || events.length > 5) {
      riskLevel = 'neutral';
    }

    return {
      userId,
      exposure: {
        eventsCount: events.length,
        auditAlerts: auditLogs.length,
        lastAlert: auditLogs[0]?.createdAt || null,
      },
      riskLevel,
      events: events.map((e) => ({
        id: e.id,
        type: e.type,
        timestamp: e.createdAt,
        payload: e.payload,
      })),
    };
  }

  decide(body: DecideDto): DecisionProposal {
    const proposal = this.reasoning.decide(body);
    void this.memory.recordProposal(body.userId, proposal);
    return proposal;
  }

  execute(body: ExecuteDto): { executed: boolean; request: ExecuteDto } {
    // Delegação básica conforme a ação
    const { action, params } = body;
    // Não aguardar resultado específico por ora; apenas delegar
    switch (action) {
      case 'swap':
        void this.actions.swap(params as any);
        break;
      case 'partialLiquidation':
        void this.actions.partialLiquidation(params as any);
        break;
      case 'autoHedge':
        void this.actions.autoHedge(params as any);
        break;
      case 'stableMigration':
        void this.actions.stableMigration(params as any);
        break;
      case 'cardBlock':
        void this.actions.cardBlock(params as any);
        break;
      default:
        break;
    }
    void this.memory.recordExecution({
      userId: body.userId,
      proposalId: body.proposalId,
      action: body.action,
      params: body.params,
      executed: true,
    });
    return { executed: true, request: body };
  }
}
