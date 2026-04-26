import { Test, TestingModule } from '@nestjs/testing';
import { RwaController } from './rwa.controller';
import { RwaService } from './rwa.service';

describe('RwaController', () => {
  let controller: RwaController;
  let service: RwaService;

  const mockRwaService = {
    getOverview: jest.fn(),
    createAsset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RwaController],
      providers: [
        {
          provide: RwaService,
          useValue: mockRwaService,
        },
      ],
    }).compile();

    controller = module.get<RwaController>(RwaController);
    service = module.get<RwaService>(RwaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return RWA overview from service', () => {
    const mockOverview = {
      module: 'rwa',
      status: 'frontend-and-api-scaffold',
      readiness: 0.48,
      items: [],
      nextSteps: [],
    };
    mockRwaService.getOverview.mockReturnValue(mockOverview);

    const result = controller.getOverview();

    expect(result).toEqual(mockOverview);
    expect(service.getOverview).toHaveBeenCalledTimes(1);
  });

  it('should create asset using service', () => {
    const payload = {
      name: 'Receivable Desk',
      assetClass: 'receivables',
      annualYieldBps: 980,
    };
    const created = {
      id: 'rwa-003',
      ...payload,
      status: 'draft',
    };
    mockRwaService.createAsset.mockReturnValue(created);

    const result = controller.createAsset(payload);

    expect(result).toEqual(created);
    expect(service.createAsset).toHaveBeenCalledWith(payload);
    expect(service.createAsset).toHaveBeenCalledTimes(1);
  });
});
