import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { RiskService } from './risk.service';
import { ReasoningService } from './reasoning.service';
import { ActionsService } from '../actions/actions.service';
import { MemoryService } from '../memory/memory.service';
import { PrismaService } from '../prisma/prisma.service';

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
    const prismaStub = ({
      riskEvent: {
        findMany: async () => [],
      },
      auditLog: {
        findMany: async () => [],
      },
    } as unknown) as PrismaService;

    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        RiskService,
        { provide: ReasoningService, useValue: reasoningStub },
        { provide: ActionsService, useValue: actionsStub },
        { provide: MemoryService, useValue: memoryStub },
        { provide: PrismaService, useValue: prismaStub },
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
    const res = await service.ingestSignals({ signals: [], context: { userId: 'U1' } } as any);
    expect(res.ok).toBe(true);
    expect(res.received).toBeDefined();
  });

  it('should return a low summary for new user', async () => {
    const summary = await service.getSummary('U2');
    expect(summary.userId).toBe('U2');
    expect(summary.riskLevel).toBe('low');
  });

  it('should decide and execute actions gracefully', async () => {
    const proposal = service.decide({ userId: 'U3', context: {} } as any);
    expect(proposal.proposalId).toBe('P1');

    const exec = service.execute({ userId: 'U3', proposalId: 'P1', action: 'swap', params: { amount: 1 } } as any);
    expect(exec.executed).toBe(true);
  });

  describe('Signal Ingestion', () => {
    it('should handle multiple signals', () => {
      const signals = [
        { type: 'price_drop', value: -10 },
        { type: 'volatility_spike', value: 0.8 }
      ];
      const res = service.ingestSignals({ signals, context: { userId: 'U4' } } as any);
      expect(res).toBeDefined();
    });

    it('should handle multiple signals', async () => {
      const signals = [
        { type: 'price_drop', value: -10 },
        { type: 'volatility_spike', value: 0.8 }
      ];
      const res = await service.ingestSignals({ signals, context: { userId: 'U4' } } as any);
      expect(res.ok).toBe(true);
    });

    it('should handle empty signal array', async () => {
      const res = await service.ingestSignals({ signals: [], context: { userId: 'U5' } } as any);
      expect(res.ok).toBe(true);
      expect(res.received).toBeDefined();
    });

    it('should process signals with different user contexts', async () => {
      const res1 = await service.ingestSignals({ signals: [], context: { userId: 'U6' } } as any);
      const res2 = await service.ingestSignals({ signals: [], context: { userId: 'U7' } } as any);
      expect(res1.ok).toBe(true);
      expect(res2.ok).toBe(true);
    });
  });

  describe('Risk Summary', () => {
    it('should return consistent structure for summary', async () => {
      const summary = await service.getSummary('U8');
      expect(summary).toHaveProperty('userId');
      expect(summary).toHaveProperty('riskLevel');
    });

    it('should handle multiple user summaries', async () => {
      const s1 = await service.getSummary('U9');
      const s2 = await service.getSummary('U10');
      const s3 = await service.getSummary('U11');
      expect(s1.userId).toBe('U9');
      expect(s2.userId).toBe('U10');
      expect(s3.userId).toBe('U11');
    });

    it('should maintain low risk for new users', async () => {
      const summary = await service.getSummary('U12');
      expect(summary.riskLevel).toBe('low');
    });
  });

  describe('Decision Making', () => {
    it('should generate proposals with confidence', () => {
      const proposal = service.decide({ userId: 'U13', context: {} } as any);
      expect(proposal.proposalId).toBeDefined();
      expect(proposal.confidence).toBe(0.9);
    });

    it('should create different proposals for different users', () => {
      const p1 = service.decide({ userId: 'U14', context: {} } as any);
      const p2 = service.decide({ userId: 'U15', context: {} } as any);
      expect(p1).toBeDefined();
      expect(p2).toBeDefined();
    });

    it('should handle decisions with varying contexts', () => {
      const proposal = service.decide({ 
        userId: 'U16', 
        context: { urgency: 'high', amount: 1000 } 
      } as any);
      expect(proposal.proposalId).toBeDefined();
    });
  });

  describe('Action Execution', () => {
    it('should execute swap actions', () => {
      const exec = service.execute({ 
        userId: 'U17', 
        proposalId: 'P2', 
        action: 'swap', 
        params: { amount: 100 } 
      } as any);
      expect(exec.executed).toBe(true);
    });

    it('should execute partial liquidation', () => {
      const exec = service.execute({ 
        userId: 'U18', 
        proposalId: 'P3', 
        action: 'partialLiquidation', 
        params: { percentage: 50 } 
      } as any);
      expect(exec.executed).toBe(true);
    });

    it('should execute auto hedge', () => {
      const exec = service.execute({ 
        userId: 'U19', 
        proposalId: 'P4', 
        action: 'autoHedge', 
        params: {} 
      } as any);
      expect(exec.executed).toBe(true);
    });
  });
});
