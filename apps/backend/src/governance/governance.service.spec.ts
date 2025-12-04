import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { GovernanceService } from './governance.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChainService } from '../chain/chain.service';

// Deterministic specs: proposal creation, update, state transitions and validations.

describe('GovernanceService', () => {
  let module: TestingModule;
  let service: GovernanceService;

  beforeAll(async () => {
    const prismaStub: Partial<PrismaService> = {
      proposal: {
        create: async (args?: any) => ({ id: 'GP1', status: 'DRAFT', ...args?.data }),
        update: async (args?: any) => ({ id: args?.where?.id ?? 'GP1', ...args?.data }),
        findUnique: async (args?: any) => ({ id: args?.where?.id ?? 'GP1', status: 'DRAFT' }),
      },
      auditLog: { create: async () => ({}) } as any,
      riskExecution: { create: async () => ({}) } as any,
    };
    const chainStub: Partial<ChainService> = {
      getConfig: () => ({ network: 'TESTNET' } as any),
      simulateContractCallReal: async () => ({ ok: true, estimatedFee: 0.0001 }),
      submitTxReal: async () => ({ ok: true, txHash: 'TX_GOV', error: undefined }),
    };

    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        GovernanceService,
        { provide: PrismaService, useValue: prismaStub },
        { provide: ChainService, useValue: chainStub },
      ],
    }).compile();

    service = module.get<GovernanceService>(GovernanceService);
  });

  afterAll(async () => {
    if (module) await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should dry-run governance flag proposal and voting', async () => {
    const flag = await service.proposeFlag({
      proposer: 'GABC',
      target: 'CTARGET',
      method: 'set_mint_enabled',
      value: true,
      start: Date.now(),
      end: Date.now() + 3600_000,
      quorum: 10,
      dryRun: true,
    } as any);
    expect(flag.ok).toBe(true);
    expect(flag.dryRun?.estimatedFee).toBeDefined();

    const vote = await service.vote({ voter: 'GABC', proposalId: 1, support: true, weight: 5, dryRun: true } as any);
    expect(vote.ok).toBe(true);
    expect(vote.dryRun?.estimatedFee).toBeDefined();
  });

  it('should execute proposal dry-run', async () => {
    const exec = await service.execute({ proposalId: 1, dryRun: true } as any);
    expect(exec.ok).toBe(true);
    expect(exec.dryRun?.estimatedFee).toBeDefined();
  });

  it('should set governance toggles dry-run (pause/mint/burn/risk)', async () => {
    const pause = await service.setPause({ stablecoin: 'STABLE', paused: true, dryRun: true } as any);
    expect(pause.ok).toBe(true);
    const mint = await service.setMintEnabled({ stablecoin: 'STABLE', enabled: false, dryRun: true } as any);
    expect(mint.ok).toBe(true);
    const burn = await service.setBurnEnabled({ stablecoin: 'STABLE', enabled: false, dryRun: true } as any);
    expect(burn.ok).toBe(true);
    const risk = await service.setRiskThreshold({ stablecoin: 'STABLE', riskBps: 500, dryRun: true } as any);
    expect(risk.ok).toBe(true);
  });
});
