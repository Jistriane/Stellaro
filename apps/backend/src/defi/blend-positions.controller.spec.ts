import { Test, TestingModule } from '@nestjs/testing';
import { BlendPositionsController } from './blend-positions.controller';
import { BlendYieldService } from './blend-yield.service';

describe('BlendPositionsController', () => {
  let controller: BlendPositionsController;
  let blendYieldService: { getOverview: jest.Mock };

  beforeEach(async () => {
    const mockBlendYieldService = {
      getOverview: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlendPositionsController],
      providers: [{ provide: BlendYieldService, useValue: mockBlendYieldService }],
    }).compile();

    controller = module.get<BlendPositionsController>(BlendPositionsController);
    blendYieldService = module.get(BlendYieldService);
  });

  it('should return blend status', () => {
    blendYieldService.getOverview.mockReturnValue({
      status: 'ready',
      network: 'testnet',
      rpcConfigured: true,
      redisAvailable: true,
      supportedAssets: ['XLM', 'USDC'],
      mockPoolCount: 2,
      cacheTtlSeconds: 300,
    });

    expect(controller.getStatus()).toEqual({
      status: 'ready',
      network: 'testnet',
      rpcConfigured: true,
      redisAvailable: true,
      supportedAssets: ['XLM', 'USDC'],
      mockPoolCount: 2,
      cacheTtlSeconds: 300,
    });
    expect(blendYieldService.getOverview).toHaveBeenCalled();
  });

  it('should return static development positions', () => {
    const positions = controller.getPositions('GABC');

    expect(Array.isArray(positions)).toBe(true);
    expect(positions[0]).toHaveProperty('asset');
    expect(positions[0]).toHaveProperty('poolId');
  });
});
