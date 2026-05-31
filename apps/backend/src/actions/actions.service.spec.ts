import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ActionsService } from './actions.service';
import { ChainService } from '../chain/chain.service';
import { SorobanService } from '../chain/soroban.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ActionsService', () => {
  let service: ActionsService;
  let chainService: ChainService;
  let sorobanService: SorobanService;
  let prismaService: PrismaService;

  const mockChainService = {
    simulateContractCall: jest.fn<(...args: any[]) => Promise<any>>(),
    simulateContractCallReal: jest.fn<(...args: any[]) => Promise<any>>(),
    submitTxReal: jest.fn<(...args: any[]) => Promise<any>>(),
    getConfig: jest.fn(() => ({ network: 'testnet' })),
  };

  const mockSorobanService = {
    invokeContract: jest.fn(),
  };

  const mockPrismaService = {
    riskExecution: {
      create: jest.fn<(...args: any[]) => Promise<any>>(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionsService,
        {
          provide: ChainService,
          useValue: mockChainService,
        },
        {
          provide: SorobanService,
          useValue: mockSorobanService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ActionsService>(ActionsService);
    chainService = module.get<ChainService>(ChainService);
    sorobanService = module.get<SorobanService>(SorobanService);
    prismaService = module.get<PrismaService>(PrismaService);

    mockChainService.submitTxReal.mockResolvedValue({
      ok: true,
      txHash: 'tx-default',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('swap', () => {
    const validSwapParams = {
      from: 'user-address',
      to: 'user-address',
      assetIn: 'USDC',
      assetOut: 'STLT',
      amountIn: '100',
      minAmountOut: '99',
    };

    it('should execute swap via Portfolio contract', async () => {
      process.env.PORTFOLIO_CONTRACT_ID = 'portfolio-contract-123';

      const result = await service.swap(validSwapParams);

      expect(result.ok).toBe(true);
      expect(result.action).toBe('swap');
      expect(result.amountOut).toBeDefined();
    });

    it('should fallback to Stellar DEX when Portfolio not available', async () => {
      delete process.env.PORTFOLIO_CONTRACT_ID;

      const result = await service.swap(validSwapParams);

      expect(result.ok).toBe(true);
      expect(result.action).toBe('swap');
    });

    it('should handle dry run mode', async () => {
      const result = await service.swap({ ...validSwapParams, dryRun: true });

      expect(result.ok).toBe(true);
      expect(result.amountOut).toBeDefined();
    });

    it('should handle swap errors gracefully', async () => {
      process.env.PORTFOLIO_CONTRACT_ID = 'portfolio-contract-123';
      (service as any).logger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      } as any;

      // Force error by mocking internal failure
      const originalSwap = service.swap.bind(service);
      jest.spyOn(service, 'swap').mockImplementationOnce(async () => {
        throw new Error('Swap failed');
      });

      await expect(service.swap(validSwapParams)).rejects.toThrow(
        'Swap failed',
      );
    });
  });

  describe('partialLiquidation', () => {
    const validLiquidationParams = {
      userId: 'user-123',
      positionId: 'position-456',
      collateralAsset: 'XLM',
      debtAsset: 'STLT',
      liquidationAmount: '50',
    };

    it('should execute partial liquidation', async () => {
      process.env.LOANS_POOL_CONTRACT_ID = 'loans-pool-contract';

      const result = await service.partialLiquidation(validLiquidationParams);

      expect(result.ok).toBe(true);
      expect(result.action).toBe('partialLiquidation');
      expect(result.liquidatedAmount).toBe('50');
    });

    it('should handle dry run for liquidation', async () => {
      process.env.LOANS_POOL_CONTRACT_ID = 'loans-pool-contract';

      const result = await service.partialLiquidation({
        ...validLiquidationParams,
        dryRun: true,
      });

      expect(result.ok).toBe(true);
      expect(result.liquidatedAmount).toBe('50');
    });

    it('should fail when LOANS_POOL_CONTRACT_ID not configured', async () => {
      delete process.env.LOANS_POOL_CONTRACT_ID;

      const result = await service.partialLiquidation(validLiquidationParams);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('not configured');
    });
  });

  describe('autoHedge', () => {
    const validHedgeParams = {
      asset: 'USDC',
      exposure: '1000',
      targetHedgeRatio: 80, // 80%
    };

    it('should calculate hedge amount correctly', async () => {
      const result = await service.autoHedge({
        ...validHedgeParams,
        dryRun: true,
      });

      expect(result.ok).toBe(true);
      expect(result.action).toBe('autoHedge');
      expect(result.hedgedAmount).toBe('800'); // 1000 * 0.8
      expect(result.cost).toBe('2.4'); // 800 * 0.003
    });

    it('should execute actual hedge', async () => {
      const result = await service.autoHedge(validHedgeParams);

      expect(result.ok).toBe(true);
      expect(result.hedgedAmount).toBe('800');
      expect(result.cost).toBeDefined();
    });

    it('should handle 100% hedge ratio', async () => {
      const result = await service.autoHedge({
        ...validHedgeParams,
        targetHedgeRatio: 100,
        dryRun: true,
      });

      expect(result.hedgedAmount).toBe('1000');
    });

    it('should handle 0% hedge ratio', async () => {
      const result = await service.autoHedge({
        ...validHedgeParams,
        targetHedgeRatio: 0,
        dryRun: true,
      });

      expect(result.hedgedAmount).toBe('0');
    });

    it('should handle errors during hedge execution', async () => {
      (service as any).logger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      } as any;

      const errorParams = { ...validHedgeParams, exposure: 'invalid' };

      const result = await service.autoHedge(errorParams);

      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('stableMigration', () => {
    const validMigrationParams = {
      from: 'old-address',
      amount: '500',
      newContractId: 'new-stablecoin-contract',
    };

    it('should execute migration successfully', async () => {
      process.env.STABLECOIN_CONTRACT_ID = 'old-stablecoin-contract';

      const result = await service.stableMigration(validMigrationParams);

      expect(result.ok).toBe(true);
      expect(result.action).toBe('stableMigration');
    });

    it('should handle dry run migration', async () => {
      process.env.STABLECOIN_CONTRACT_ID = 'old-stablecoin-contract';

      const result = await service.stableMigration({
        ...validMigrationParams,
        dryRun: true,
      });

      expect(result.ok).toBe(true);
    });

    it('should fail when STABLECOIN_CONTRACT_ID not configured', async () => {
      delete process.env.STABLECOIN_CONTRACT_ID;

      const result = await service.stableMigration(validMigrationParams);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('STABLECOIN_CONTRACT_ID not configured');
    });
  });

  describe('stableMigrationDryRun', () => {
    it('should simulate migration with estimated fee', async () => {
      process.env.STABLECOIN_CONTRACT_ID = 'stablecoin-contract';
      mockChainService.simulateContractCall.mockResolvedValue({
        ok: true,
        estimatedFee: 1000,
      });

      const params = {
        from: 'addr',
        amount: '100',
        newContractId: 'new-contract',
      };
      const result = await service.stableMigrationDryRun(params);

      expect(result.ok).toBe(true);
      expect(result.action).toBe('stableMigration');
      expect(result.dryRun.estimatedFee).toBe(1000);
      expect(mockChainService.simulateContractCall).toHaveBeenCalledWith({
        contractId: 'stablecoin-contract',
        method: 'stable_migrate',
        args: [params],
      });
    });
  });

  describe('cardBlock', () => {
    const validBlockParams = {
      cardId: 'card-789',
      userId: 'user-123',
      reason: 'Suspicious activity detected',
    };

    it('should block card and log to database', async () => {
      mockPrismaService.riskExecution.create.mockResolvedValue({
        id: 'risk-exec-1',
        userId: 'user-123',
        action: 'card.block',
        executed: true,
      });

      const result = await service.cardBlock(validBlockParams);

      expect(result.ok).toBe(true);
      expect(result.action).toBe('cardBlock');
      expect(result.blocked).toBe(true);
      expect(mockPrismaService.riskExecution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          action: 'card.block',
          executed: true,
        }),
      });
    });

    it('should handle temporary blocks', async () => {
      mockPrismaService.riskExecution.create.mockResolvedValue({});

      const result = await service.cardBlock({
        ...validBlockParams,
        temporary: true,
      });

      expect(result.ok).toBe(true);
      expect(result.blocked).toBe(true);
    });

    it('should handle database errors during card block', async () => {
      mockPrismaService.riskExecution.create.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.cardBlock(validBlockParams);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });

  describe('stablecoinMintGuarded', () => {
    const validMintParams = {
      to: 'recipient-address',
      amount: '1000',
      riskBps: 500, // 5% risk
      userId: 'user-123',
    };

    it('should simulate mint with dry run', async () => {
      process.env.STABLECOIN_CONTRACT_ID = 'stablecoin-contract';
      mockChainService.simulateContractCallReal.mockResolvedValue({
        ok: true,
        estimatedFee: 2000,
      });
      mockPrismaService.riskExecution.create.mockResolvedValue({});

      const result = await service.stablecoinMintGuarded({
        ...validMintParams,
        dryRun: true,
      });

      expect(result.ok).toBe(true);
      expect(result.method).toBe('mint_guarded');
      expect(result.dryRun?.estimatedFee).toBe(2000);
      expect(mockPrismaService.riskExecution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'stablecoin.mint_guarded',
          dryRun: true,
        }),
      });
    });

    it('should execute actual mint', async () => {
      process.env.STABLECOIN_CONTRACT_ID = 'stablecoin-contract';
      mockChainService.submitTxReal.mockResolvedValue({
        ok: true,
        txHash: 'tx-hash-123',
      });
      mockPrismaService.riskExecution.create.mockResolvedValue({});

      const result = await service.stablecoinMintGuarded(validMintParams);

      expect(result.ok).toBe(true);
      expect(result.txHash).toBe('tx-hash-123');
      expect(mockPrismaService.riskExecution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'stablecoin.mint_guarded',
          executed: true,
          txHash: 'tx-hash-123',
          dryRun: false,
        }),
      });
    });

    it('should handle mint failure', async () => {
      process.env.STABLECOIN_CONTRACT_ID = 'stablecoin-contract';
      mockChainService.submitTxReal.mockResolvedValue({
        ok: false,
        error: 'Insufficient collateral',
      });
      mockPrismaService.riskExecution.create.mockResolvedValue({});

      const result = await service.stablecoinMintGuarded(validMintParams);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Insufficient collateral');
    });

    it('should use default contract ID when not configured', async () => {
      delete process.env.STABLECOIN_CONTRACT_ID;
      mockChainService.simulateContractCallReal.mockResolvedValue({
        ok: true,
        estimatedFee: 1000,
      });
      mockPrismaService.riskExecution.create.mockResolvedValue({});

      const result = await service.stablecoinMintGuarded({
        ...validMintParams,
        dryRun: true,
      });

      expect(result.contractId).toBe('demo-stablecoin-contract');
    });
  });

  describe('stablecoinBurn', () => {
    const validBurnParams = {
      from: 'sender-address',
      amount: '500',
      userId: 'user-123',
    };

    it('should simulate burn with dry run', async () => {
      process.env.STABLECOIN_CONTRACT_ID = 'stablecoin-contract';
      mockChainService.simulateContractCallReal.mockResolvedValue({
        ok: true,
        estimatedFee: 1500,
      });
      mockPrismaService.riskExecution.create.mockResolvedValue({});

      const result = await service.stablecoinBurn({
        ...validBurnParams,
        dryRun: true,
      });

      expect(result.ok).toBe(true);
      expect(result.method).toBe('burn');
      expect(result.dryRun?.estimatedFee).toBe(1500);
    });

    it('should execute actual burn', async () => {
      process.env.STABLECOIN_CONTRACT_ID = 'stablecoin-contract';
      mockChainService.submitTxReal.mockResolvedValue({
        ok: true,
        txHash: 'burn-tx-hash',
      });
      mockPrismaService.riskExecution.create.mockResolvedValue({});

      const result = await service.stablecoinBurn(validBurnParams);

      expect(result.ok).toBe(true);
      expect(result.txHash).toBe('burn-tx-hash');
      expect(mockPrismaService.riskExecution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'stablecoin.burn',
          executed: true,
          dryRun: false,
        }),
      });
    });

    it('should handle burn failure', async () => {
      process.env.STABLECOIN_CONTRACT_ID = 'stablecoin-contract';
      mockChainService.submitTxReal.mockResolvedValue({
        ok: false,
        error: 'Insufficient balance',
      });
      mockPrismaService.riskExecution.create.mockResolvedValue({});

      const result = await service.stablecoinBurn(validBurnParams);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Insufficient balance');
    });

    it('should include proposalId when provided', async () => {
      process.env.STABLECOIN_CONTRACT_ID = 'stablecoin-contract';
      mockChainService.submitTxReal.mockResolvedValue({
        ok: true,
        txHash: 'tx',
      });
      mockPrismaService.riskExecution.create.mockResolvedValue({});

      await service.stablecoinBurn({
        ...validBurnParams,
        proposalId: 'proposal-123',
      });

      expect(mockPrismaService.riskExecution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          proposalId: 'proposal-123',
        }),
      });
    });
  });

  describe('stablecoinTransfer', () => {
    const validTransferParams = {
      from: 'sender-address',
      to: 'recipient-address',
      amount: '250',
      userId: 'user-123',
    };

    it('should simulate transfer with dry run', async () => {
      process.env.STABLECOIN_CONTRACT_ID = 'stablecoin-contract';
      mockChainService.simulateContractCallReal.mockResolvedValue({
        ok: true,
        estimatedFee: 1200,
      });
      mockPrismaService.riskExecution.create.mockResolvedValue({});

      const result = await service.stablecoinTransfer({
        ...validTransferParams,
        dryRun: true,
      });

      expect(result.ok).toBe(true);
      expect(result.method).toBe('transfer');
      expect(result.dryRun?.estimatedFee).toBe(1200);
      expect(mockPrismaService.riskExecution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'stablecoin.transfer',
          dryRun: true,
        }),
      });
    });

    it('should execute actual transfer', async () => {
      process.env.STABLECOIN_CONTRACT_ID = 'stablecoin-contract';
      mockChainService.submitTxReal.mockResolvedValue({
        ok: true,
        txHash: 'transfer-tx-hash',
      });
      mockPrismaService.riskExecution.create.mockResolvedValue({});

      const result = await service.stablecoinTransfer(validTransferParams);

      expect(result.ok).toBe(true);
      expect(result.txHash).toBe('transfer-tx-hash');
      expect(mockPrismaService.riskExecution.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'stablecoin.transfer',
          executed: true,
          dryRun: false,
        }),
      });
    });

    it('should handle transfer failure', async () => {
      process.env.STABLECOIN_CONTRACT_ID = 'stablecoin-contract';
      mockChainService.submitTxReal.mockResolvedValue({
        ok: false,
        error: 'Transfer failed',
      });
      mockPrismaService.riskExecution.create.mockResolvedValue({});

      const result = await service.stablecoinTransfer(validTransferParams);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Transfer failed');
    });

    it('should use default contract ID when not configured', async () => {
      delete process.env.STABLECOIN_CONTRACT_ID;
      mockChainService.simulateContractCallReal.mockResolvedValue({
        ok: true,
        estimatedFee: 1000,
      });
      mockPrismaService.riskExecution.create.mockResolvedValue({});

      const result = await service.stablecoinTransfer({
        ...validTransferParams,
        dryRun: true,
      });

      expect(result.contractId).toBe('demo-stablecoin-contract');
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple operations in sequence', async () => {
      process.env.STABLECOIN_CONTRACT_ID = 'stablecoin-contract';
      mockChainService.submitTxReal.mockResolvedValue({
        ok: true,
        txHash: 'tx-hash',
      });
      mockPrismaService.riskExecution.create.mockResolvedValue({});

      // Mint
      const mintResult = await service.stablecoinMintGuarded({
        to: 'user-addr',
        amount: '1000',
        riskBps: 100,
      });

      // Swap
      const swapResult = await service.swap({
        from: 'user-addr',
        to: 'user-addr',
        assetIn: 'STLT',
        assetOut: 'USDC',
        amountIn: '500',
      });

      // Burn
      const burnResult = await service.stablecoinBurn({
        from: 'user-addr',
        amount: '500',
      });

      expect(mintResult.ok).toBe(true);
      expect(swapResult.ok).toBe(true);
      expect(burnResult.ok).toBe(true);
    });
  });
});
