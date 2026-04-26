import { Test, TestingModule } from '@nestjs/testing';
import { V4Controller } from './v4.controller';
import { V4Service } from './v4.service';

describe('V4Controller', () => {
  let controller: V4Controller;
  let service: V4Service;

  const mockV4Service = {
    getOverview: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [V4Controller],
      providers: [
        {
          provide: V4Service,
          useValue: mockV4Service,
        },
      ],
    }).compile();

    controller = module.get<V4Controller>(V4Controller);
    service = module.get<V4Service>(V4Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return aggregated v4 overview from service', async () => {
    const mockOverview = {
      module: 'v4',
      status: 'frontend-and-api-scaffold',
      readiness: 0.52,
      modules: [],
      nextSteps: [],
    };
    mockV4Service.getOverview.mockResolvedValue(mockOverview);

    const result = await controller.getOverview();

    expect(result).toEqual(mockOverview);
    expect(service.getOverview).toHaveBeenCalledTimes(1);
  });
});
