import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { RiskService } from './risk.service';
import { ReasoningService } from './reasoning.service';
import { ActionsService } from '../actions/actions.service';
import { MemoryService } from '../memory/memory.service';

// These tests avoid external dependencies and focus on deterministic paths
// such as missing configuration, simple metric calculations, and graceful errors.

describe('RiskService', () => {
  let module: TestingModule;
  let service: RiskService;

  beforeAll(async () => {
    const reasoningStub = ({
      decide: (_body: any) => ({ proposalId: 'P1', confidence: 0.9, actions: [] }),
    } as unknown) as ReasoningService;
    const actionsStub = ({
      swap: async () => ({ ok: true, action: 'swap' }),
      partialLiquidation: async () => ({ ok: true, action: 'partialLiquidation' }),
      autoHedge: async () => ({ ok: true, action: 'autoHedge' }),
      stableMigration: async () => ({ ok: true, action: 'stableMigration' }),
      cardBlock: async () => ({ ok: true, action: 'cardBlock' }),
    } as unknown) as ActionsService;
    const memoryStub = ({
      logEvent: async () => ({ ok: true, id: 'E1' }),
      history: (_userId: string) => ({ events: [] }),
      recordProposal: async () => ({ ok: true, id: 'P1' }),
      recordExecution: async () => ({ ok: true, id: 'X1' }),
    } as unknown) as MemoryService;

    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        RiskService,
        { provide: ReasoningService, useValue: reasoningStub },
        { provide: ActionsService, useValue: actionsStub },
        { provide: MemoryService, useValue: memoryStub },
      ],
    }).compile();

    service = module.get<RiskService>(RiskService);
  });

  afterAll(async () => {
    if (module) await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should ingest signals deterministically', async () => {
    const res = service.ingestSignals({ signals: [], context: { userId: 'U1' } } as any);
    expect(res.ok).toBe(true);
    expect(res.received).toBeDefined();
  });

  it('should return a neutral summary for new user', () => {
    const summary = service.getSummary('U2');
    expect(summary.userId).toBe('U2');
    expect(summary.riskLevel).toBe('neutral');
  });

  it('should decide and execute actions gracefully', async () => {
    const proposal = service.decide({ userId: 'U3', context: {} } as any);
    expect(proposal.proposalId).toBe('P1');

    const exec = service.execute({ userId: 'U3', proposalId: 'P1', action: 'swap', params: { amount: 1 } } as any);
    expect(exec.executed).toBe(true);
  });
});
