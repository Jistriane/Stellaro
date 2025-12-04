import { Test, TestingModule } from '@nestjs/testing';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { ExecutionContext } from '@nestjs/common';

describe('GovernanceController', () => {
  let mod: TestingModule;
  let controller: GovernanceController;

  const governanceStub = {
    setPause: jest.fn(),
    setMintEnabled: jest.fn(),
    setBurnEnabled: jest.fn(),
    setMintCap: jest.fn(),
    updateMinter: jest.fn(),
  };

  // Mock guards
  const mockGuard = {
    canActivate: (context: ExecutionContext) => true,
  };

  beforeAll(async () => {
    mod = await Test.createTestingModule({
      controllers: [GovernanceController],
      providers: [{ provide: GovernanceService, useValue: governanceStub }],
    })
      .overrideGuard(require('../auth/session.guard').SessionGuard)
      .useValue(mockGuard)
      .overrideGuard(require('../auth/mfa.guard').MfaGuard)
      .useValue(mockGuard)
      .compile();

    controller = mod.get<GovernanceController>(GovernanceController);
  });

  afterAll(async () => {
    await mod.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('setPause', () => {
    it('should pause stablecoin', async () => {
      const body = {
        stablecoin: 'C...',
        paused: true,
        dryRun: false,
      };
      const mockResult = { ok: true, txHash: '0xABC...' };
      governanceStub.setPause.mockResolvedValue(mockResult);

      const result = await controller.setPause(body);

      expect(result).toEqual(mockResult);
      expect(governanceStub.setPause).toHaveBeenCalledWith(body);
    });

    it('should unpause stablecoin with dry run', async () => {
      const body = {
        stablecoin: 'C...',
        paused: false,
        dryRun: true,
        userId: 'user-1',
      };
      const mockResult = { ok: true, dryRun: true };
      governanceStub.setPause.mockResolvedValue(mockResult);

      const result = await controller.setPause(body);

      expect(result).toEqual(mockResult);
      expect(governanceStub.setPause).toHaveBeenCalledWith(body);
    });
  });

  describe('setMintEnabled', () => {
    it('should enable minting', async () => {
      const body = {
        stablecoin: 'C...',
        enabled: true,
      };
      const mockResult = { ok: true, txHash: '0xDEF...' };
      governanceStub.setMintEnabled.mockResolvedValue(mockResult);

      const result = await controller.setMintEnabled(body);

      expect(result).toEqual(mockResult);
      expect(governanceStub.setMintEnabled).toHaveBeenCalledWith(body);
    });

    it('should disable minting with proposal', async () => {
      const body = {
        stablecoin: 'C...',
        enabled: false,
        proposalId: 'prop-1',
      };
      const mockResult = { ok: true, txHash: '0x123...' };
      governanceStub.setMintEnabled.mockResolvedValue(mockResult);

      const result = await controller.setMintEnabled(body);

      expect(result).toEqual(mockResult);
      expect(governanceStub.setMintEnabled).toHaveBeenCalledWith(body);
    });
  });

  describe('setBurnEnabled', () => {
    it('should enable burning', async () => {
      const body = {
        stablecoin: 'C...',
        enabled: true,
      };
      const mockResult = { ok: true, txHash: '0x456...' };
      governanceStub.setBurnEnabled.mockResolvedValue(mockResult);

      const result = await controller.setBurnEnabled(body);

      expect(result).toEqual(mockResult);
      expect(governanceStub.setBurnEnabled).toHaveBeenCalledWith(body);
    });
  });
});
