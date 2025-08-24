import { Injectable } from '@nestjs/common';
import { IngestSignalsDto } from './dto/signal.dto';
import { DecideDto } from './dto/decide.dto';
import { ExecuteDto } from './dto/execute.dto';
import { ReasoningService } from './reasoning.service';
import { ActionsService } from '../actions/actions.service';
import { MemoryService } from '../memory/memory.service';

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
  ) {}

  ingestSignals(body: IngestSignalsDto): IngestSignalsResult {
    // TODO: normalizar/validar sinais
    const ctx = (body as unknown as { context?: { userId?: string } }).context;
    const userId = ctx?.userId ?? 'unknown';
    void this.memory.logEvent(userId, 'SIGNAL_INGEST', body);
    return { ok: true, received: body };
  }

  getSummary(userId: string): RiskSummary {
    // Exemplo: enriquecer o resumo com histórico (stub)
    const history = this.memory.history(userId);
    return {
      userId,
      exposure: { eventsCount: history.events.length },
      riskLevel: 'neutral',
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
        void this.actions.swap(params);
        break;
      case 'partialLiquidation':
        void this.actions.partialLiquidation(params);
        break;
      case 'autoHedge':
        void this.actions.autoHedge(params);
        break;
      case 'stableMigration':
        void this.actions.stableMigration(params);
        break;
      case 'cardBlock':
        void this.actions.cardBlock(params);
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
