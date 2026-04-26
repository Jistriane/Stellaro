import { Test, TestingModule } from '@nestjs/testing';
import { DaoController } from './dao.controller';
import { DaoService } from './dao.service';

describe('DaoController', () => {
  let controller: DaoController;
  let service: DaoService;

  const mockDaoService = {
    getOverview: jest.fn(),
    createProposal: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DaoController],
      providers: [
        {
          provide: DaoService,
          useValue: mockDaoService,
        },
      ],
    }).compile();

    controller = module.get<DaoController>(DaoController);
    service = module.get<DaoService>(DaoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return DAO overview from service', () => {
    const mockOverview = {
      module: 'dao',
      status: 'frontend-and-api-scaffold',
      readiness: 0.58,
      proposals: [],
      nextSteps: [],
    };
    mockDaoService.getOverview.mockReturnValue(mockOverview);

    const result = controller.getOverview();

    expect(result).toEqual(mockOverview);
    expect(service.getOverview).toHaveBeenCalledTimes(1);
  });

  it('should create proposal using service', () => {
    const payload = {
      title: 'Add conservative treasury strategy',
      quorumBps: 3000,
      timelockHours: 48,
    };
    const created = {
      id: 'dao-003',
      ...payload,
      status: 'draft',
    };
    mockDaoService.createProposal.mockReturnValue(created);

    const result = controller.createProposal(payload);

    expect(result).toEqual(created);
    expect(service.createProposal).toHaveBeenCalledWith(payload);
    expect(service.createProposal).toHaveBeenCalledTimes(1);
  });
});
