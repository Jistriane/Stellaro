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

  describe('Staking Operations', () => {
    it('should stake with actual transaction when not dry-run', async () => {
      const result = await service.stake({ poolId: 'POOL1', amount: 100, dryRun: false });
      expect(result.ok).toBe(true);
      expect(result.txHash).toBeDefined();
    });

    it('should handle different pool IDs', async () => {
      const pool1 = await service.stake({ poolId: 'POOL1', amount: 10, dryRun: true });
      const pool2 = await service.stake({ poolId: 'POOL2', amount: 20, dryRun: true });
      expect(pool1.ok).toBe(true);
      expect(pool2.ok).toBe(true);
    });

    it('should handle varying stake amounts', async () => {
      const small = await service.stake({ poolId: 'POOL1', amount: 1, dryRun: true });
      const large = await service.stake({ poolId: 'POOL1', amount: 1000000, dryRun: true });
      expect(small.ok).toBe(true);
      expect(large.ok).toBe(true);
    });
  });

  describe('Unstaking Operations', () => {
    it('should unstake with actual transaction when not dry-run', async () => {
      const result = await service.unstake({ poolId: 'POOL1', amount: 50, dryRun: false });
      expect(result.ok).toBe(true);
      expect(result.txHash).toBeDefined();
    });

    it('should handle different unstake amounts', async () => {
      const partial = await service.unstake({ poolId: 'POOL1', amount: 10, dryRun: true });
      const full = await service.unstake({ poolId: 'POOL1', amount: 100, dryRun: true });
      expect(partial.ok).toBe(true);
      expect(full.ok).toBe(true);
    });
  });

  describe('Liquidity Operations', () => {
    it('should add liquidity with multiple amounts', async () => {
      const result = await service.addLiquidity({ 
        poolId: 'POOL1', 
        amounts: [100, 200, 300], 
        dryRun: true 
      });
      expect(result.ok).toBe(true);
      expect(result.dryRun?.estimatedFee).toBeDefined();
    });

    it('should remove liquidity with different share amounts', async () => {
      const small = await service.removeLiquidity({ poolId: 'POOL1', share: 0.1, dryRun: true });
      const large = await service.removeLiquidity({ poolId: 'POOL1', share: 0.9, dryRun: true });
      expect(small.ok).toBe(true);
      expect(large.ok).toBe(true);
    });

    it('should handle liquidity operations without dry-run', async () => {
      const add = await service.addLiquidity({ 
        poolId: 'POOL1', 
        amounts: [50, 50], 
        dryRun: false 
      });
      expect(add.ok).toBe(true);
      expect(add.txHash).toBeDefined();
    });
  });

  describe('Loan Scoring', () => {
    it('should approve loans for high credit scores', async () => {
      const result = await service.loanByScore({ userScore: 800, amount: 50000 });
      expect(result.ok).toBe(true);
    });

    it('should deny loans for low credit scores', async () => {
      const result = await service.loanByScore({ userScore: 400, amount: 10000 });
      expect(result.ok).toBe(false);
    });

    it('should handle borderline credit scores', async () => {
      const result = await service.loanByScore({ userScore: 650, amount: 20000 });
      expect(result.ok).toBeDefined();
      expect(typeof result.ok).toBe('boolean');
    });

    it('should consider loan amount in approval', async () => {
      const smallLoan = await service.loanByScore({ userScore: 700, amount: 1000 });
      const largeLoan = await service.loanByScore({ userScore: 700, amount: 100000 });
      expect(smallLoan.ok).toBe(true);
      expect(largeLoan).toBeDefined();
    });
  });

  describe('Flash Loan Guard', () => {
    it('should allow low-risk flash loans', async () => {
      const result = await service.flashLoanGuard({ 
        txPreview: {}, 
        maxAmount: 10000, 
        riskBps: 100 
      });
      expect(result.ok).toBe(true);
    });

    it('should block high-risk flash loans', async () => {
      const result = await service.flashLoanGuard({ 
        txPreview: {}, 
        maxAmount: 500000, 
        riskBps: 1500 
      });
      expect(result.ok).toBe(false);
    });

    it('should handle medium-risk scenarios', async () => {
      const result = await service.flashLoanGuard({ 
        txPreview: {}, 
        maxAmount: 75000, 
        riskBps: 700 
      });
      expect(result).toBeDefined();
      expect(typeof result.ok).toBe('boolean');
    });
  });
});
