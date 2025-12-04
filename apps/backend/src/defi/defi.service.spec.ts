import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DefiService } from './defi.service';
import { ChainService } from '../chain/chain.service';
import { PrismaService } from '../prisma/prisma.service';

// Specs aimed at parameter validation and dry-run paths without real network calls.

describe('DefiService', () => {
  let module: TestingModule;
  let service: DefiService;

  beforeAll(async () => {
    const chainStub: Partial<ChainService> = {
      // provide minimal methods used by DefiService in a deterministic way
      getConfig: () => ({ network: 'TESTNET' } as any),
      simulateContractCallReal: async (_input?: any) => ({ ok: true, estimatedFee: 0.0001 }),
      submitTxReal: async (_input?: any) => ({ ok: true, txHash: 'TX_TEST', error: undefined }),
    };

    const prismaStub: Partial<PrismaService> = {
      auditLog: { create: async () => ({}) } as any,
      riskExecution: { create: async () => ({}) } as any,
    };

    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        DefiService,
        { provide: ChainService, useValue: chainStub },
        { provide: PrismaService, useValue: prismaStub },
      ],
    }).compile();

    service = module.get<DefiService>(DefiService);
  });

  afterAll(async () => {
    if (module) await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should support loan policy decisions deterministically', async () => {
    const approved = await service.loanByScore({ userScore: 700, amount: 10_000 });
    expect(approved.ok).toBe(true);

    const denied = await service.loanByScore({ userScore: 500, amount: 10_000 });
    expect(denied.ok).toBe(false);
  });

  it('should support dry-run for stake, unstake and LP ops', async () => {
    const stake = await service.stake({ poolId: 'POOL1', amount: 10, dryRun: true });
    expect(stake.ok).toBe(true);
    expect(stake.dryRun?.estimatedFee).toBeDefined();

    const unstake = await service.unstake({ poolId: 'POOL1', amount: 5, dryRun: true });
    expect(unstake.ok).toBe(true);
    expect(unstake.dryRun?.estimatedFee).toBeDefined();

    const addLp = await service.addLiquidity({ poolId: 'POOL1', amounts: [1, 2], dryRun: true });
    expect(addLp.ok).toBe(true);
    expect(addLp.dryRun?.estimatedFee).toBeDefined();

    const remLp = await service.removeLiquidity({ poolId: 'POOL1', share: 1, dryRun: true });
    expect(remLp.ok).toBe(true);
    expect(remLp.dryRun?.estimatedFee).toBeDefined();
  });

  it('should apply flash loan guard policy', async () => {
    const allowed = await service.flashLoanGuard({ txPreview: {}, maxAmount: 50_000, riskBps: 500 });
    expect(allowed.ok).toBe(true);
    const blocked = await service.flashLoanGuard({ txPreview: {}, maxAmount: 200_000, riskBps: 900 });
    expect(blocked.ok).toBe(false);
  });
});
