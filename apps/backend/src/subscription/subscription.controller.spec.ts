import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let service: SubscriptionService;

  const mockSubscriptionService = {
    getOverview: jest.fn(),
    createPlan: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        {
          provide: SubscriptionService,
          useValue: mockSubscriptionService,
        },
      ],
    }).compile();

    controller = module.get<SubscriptionController>(SubscriptionController);
    service = module.get<SubscriptionService>(SubscriptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return subscriptions overview from service', () => {
    const mockOverview = {
      module: 'subscription',
      status: 'frontend-and-api-scaffold',
      readiness: 0.45,
      plans: [],
      nextSteps: [],
    };
    mockSubscriptionService.getOverview.mockReturnValue(mockOverview);

    const result = controller.getOverview();

    expect(result).toEqual(mockOverview);
    expect(service.getOverview).toHaveBeenCalledTimes(1);
  });

  it('should create recurring plan using service', () => {
    const payload = {
      name: 'Monthly Operations',
      cadence: 'monthly',
      amount: '199.90',
      currency: 'STLT',
    };
    const created = {
      id: 'sub-003',
      ...payload,
      status: 'draft',
    };
    mockSubscriptionService.createPlan.mockReturnValue(created);

    const result = controller.createPlan(payload);

    expect(result).toEqual(created);
    expect(service.createPlan).toHaveBeenCalledWith(payload);
    expect(service.createPlan).toHaveBeenCalledTimes(1);
  });
});
