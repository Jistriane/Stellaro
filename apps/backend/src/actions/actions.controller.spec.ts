import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';

describe('ActionsController', () => {
  let mod: TestingModule;
  let controller: ActionsController;

  const actionsStub = {
    stablecoinMintGuarded: jest.fn(),
    stablecoinBurn: jest.fn(),
    stablecoinTransfer: jest.fn(),
  };

  beforeAll(async () => {
    mod = await Test.createTestingModule({
      controllers: [ActionsController],
      providers: [{ provide: ActionsService, useValue: actionsStub }],
    }).compile();

    controller = mod.get<ActionsController>(ActionsController);
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

  describe('stablecoinMint', () => {
    it('should mint stablecoin with valid params', async () => {
      const body = {
        to: 'GC...',
        amount: 1000,
        riskBps: 500,
        dryRun: true,
      };
      const mockResult = { ok: true, txHash: '0xABC...' };
      actionsStub.stablecoinMintGuarded.mockResolvedValue(mockResult);

      const result = await controller.stablecoinMint(body);

      expect(result).toEqual(mockResult);
      expect(actionsStub.stablecoinMintGuarded).toHaveBeenCalledWith({
        to: 'GC...',
        amount: 1000,
        riskBps: 500,
        dryRun: true,
        userId: undefined,
        proposalId: undefined,
      });
    });

    it('should mint with userId and proposalId', async () => {
      const body = {
        to: 'GC...',
        amount: '500',
        riskBps: 300,
        userId: 'user-1',
        proposalId: 'prop-1',
      };
      const mockResult = { ok: true, txHash: '0xDEF...' };
      actionsStub.stablecoinMintGuarded.mockResolvedValue(mockResult);

      const result = await controller.stablecoinMint(body);

      expect(result).toEqual(mockResult);
      expect(actionsStub.stablecoinMintGuarded).toHaveBeenCalledWith({
        to: 'GC...',
        amount: '500',
        riskBps: 300,
        dryRun: false,
        userId: 'user-1',
        proposalId: 'prop-1',
      });
    });

    it('should throw BAD_REQUEST if to is missing', async () => {
      const body = { amount: 1000, riskBps: 500 } as any;

      await expect(controller.stablecoinMint(body)).rejects.toThrow(
        new HttpException(
          'Invalid body: to, amount, riskBps are required',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw BAD_REQUEST if amount is missing', async () => {
      const body = { to: 'GC...', riskBps: 500 } as any;

      await expect(controller.stablecoinMint(body)).rejects.toThrow(
        new HttpException(
          'Invalid body: to, amount, riskBps are required',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw BAD_REQUEST if riskBps is missing', async () => {
      const body = { to: 'GC...', amount: 1000 } as any;

      await expect(controller.stablecoinMint(body)).rejects.toThrow(
        new HttpException(
          'Invalid body: to, amount, riskBps are required',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('stablecoinBurn', () => {
    it('should burn stablecoin with valid params', async () => {
      const body = {
        from: 'GC...',
        amount: 500,
        dryRun: false,
      };
      const mockResult = { ok: true, txHash: '0x123...' };
      actionsStub.stablecoinBurn.mockResolvedValue(mockResult);

      const result = await controller.stablecoinBurn(body);

      expect(result).toEqual(mockResult);
      expect(actionsStub.stablecoinBurn).toHaveBeenCalledWith({
        from: 'GC...',
        amount: 500,
        dryRun: false,
        userId: undefined,
        proposalId: undefined,
      });
    });

    it('should burn with userId and proposalId', async () => {
      const body = {
        from: 'GB...',
        amount: '250',
        userId: 'user-2',
        proposalId: 'prop-2',
      };
      const mockResult = { ok: true, txHash: '0x456...' };
      actionsStub.stablecoinBurn.mockResolvedValue(mockResult);

      const result = await controller.stablecoinBurn(body);

      expect(result).toEqual(mockResult);
      expect(actionsStub.stablecoinBurn).toHaveBeenCalledWith({
        from: 'GB...',
        amount: '250',
        dryRun: false,
        userId: 'user-2',
        proposalId: 'prop-2',
      });
    });

    it('should throw BAD_REQUEST if from is missing', async () => {
      const body = { amount: 500 } as any;

      await expect(controller.stablecoinBurn(body)).rejects.toThrow(
        new HttpException(
          'Invalid body: from, amount are required',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw BAD_REQUEST if amount is missing', async () => {
      const body = { from: 'GC...' } as any;

      await expect(controller.stablecoinBurn(body)).rejects.toThrow(
        new HttpException(
          'Invalid body: from, amount are required',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('stablecoinTransfer', () => {
    it('should transfer stablecoin with valid params', async () => {
      const body = {
        from: 'GA...FROM',
        to: 'GB...TO',
        amount: 250,
        dryRun: true,
      };
      const mockResult = { ok: true, method: 'transfer' };
      actionsStub.stablecoinTransfer.mockResolvedValue(mockResult);

      const result = await controller.stablecoinTransfer(body);

      expect(result).toEqual(mockResult);
      expect(actionsStub.stablecoinTransfer).toHaveBeenCalledWith({
        from: 'GA...FROM',
        to: 'GB...TO',
        amount: 250,
        dryRun: true,
        userId: undefined,
        proposalId: undefined,
      });
    });

    it('should transfer with metadata', async () => {
      const body = {
        from: 'GA...FROM',
        to: 'GB...TO',
        amount: '1000',
        userId: 'user-3',
        proposalId: 'prop-3',
      };
      const mockResult = { ok: true, method: 'transfer' };
      actionsStub.stablecoinTransfer.mockResolvedValue(mockResult);

      const result = await controller.stablecoinTransfer(body);

      expect(result).toEqual(mockResult);
      expect(actionsStub.stablecoinTransfer).toHaveBeenCalledWith({
        from: 'GA...FROM',
        to: 'GB...TO',
        amount: '1000',
        dryRun: false,
        userId: 'user-3',
        proposalId: 'prop-3',
      });
    });

    it('should throw BAD_REQUEST if from is missing', async () => {
      const body = { to: 'GB...', amount: 250 } as any;

      await expect(controller.stablecoinTransfer(body)).rejects.toThrow(
        new HttpException(
          'Invalid body: from, to, amount are required',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw BAD_REQUEST if to is missing', async () => {
      const body = { from: 'GA...', amount: 250 } as any;

      await expect(controller.stablecoinTransfer(body)).rejects.toThrow(
        new HttpException(
          'Invalid body: from, to, amount are required',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw BAD_REQUEST if amount is missing', async () => {
      const body = { from: 'GA...', to: 'GB...' } as any;

      await expect(controller.stablecoinTransfer(body)).rejects.toThrow(
        new HttpException(
          'Invalid body: from, to, amount are required',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });
});
