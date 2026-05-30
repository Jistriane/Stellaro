import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BlendPositionsController } from './positions.controller';
import { BlendPositionsService } from './positions.service';

describe('BlendPositionsController', () => {
  let controller: BlendPositionsController;
  let positionsService: { getPositions: jest.Mock };
  const validAddress = `G${'A'.repeat(55)}`;

  beforeEach(async () => {
    const mockPositionsService = {
      getPositions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlendPositionsController],
      providers: [{ provide: BlendPositionsService, useValue: mockPositionsService }],
    }).compile();

    controller = module.get<BlendPositionsController>(BlendPositionsController);
    positionsService = module.get(BlendPositionsService);
  });

  it('delegates position lookup to the service', async () => {
    positionsService.getPositions.mockResolvedValue({
      address: validAddress,
      positions: [
        { asset: 'XLM', balance: '100', valueUSD: 100, apy: 15 },
      ],
      totalUSD: 100,
    });

    const result = await controller.getPositions(
      validAddress,
      'USD',
    );

    expect(result).toEqual({
      address: validAddress,
      positions: [
        { asset: 'XLM', balance: '100', valueUSD: 100, apy: 15 },
      ],
      totalUSD: 100,
    });
    expect(positionsService.getPositions).toHaveBeenCalledWith(
      validAddress,
      'USD',
    );
  });

  it('rejects invalid stellar addresses', async () => {
    await expect(controller.getPositions('invalid-address')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(positionsService.getPositions).not.toHaveBeenCalled();
  });
});