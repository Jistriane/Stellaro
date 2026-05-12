import { Test, TestingModule } from '@nestjs/testing';
import { SsiController } from './ssi.controller';
import { SsiService } from './ssi.service';

describe('SsiController', () => {
  let controller: SsiController;
  let service: SsiService;

  const mockSsiService = {
    getOverview: jest.fn(),
    issueCredential: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SsiController],
      providers: [
        {
          provide: SsiService,
          useValue: mockSsiService,
        },
      ],
    }).compile();

    controller = module.get<SsiController>(SsiController);
    service = module.get<SsiService>(SsiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return SSI overview from service', () => {
    const mockOverview = {
      module: 'ssi',
      status: 'frontend-and-api-scaffold',
      readiness: 0.52,
      credentials: [],
      nextSteps: [],
    };
    mockSsiService.getOverview.mockReturnValue(mockOverview);

    const result = controller.getOverview();

    expect(result).toEqual(mockOverview);
    expect(service.getOverview).toHaveBeenCalledTimes(1);
  });

  it('should issue credential using service', () => {
    const payload = {
      userAddress: 'GTESTUSERADDRESS1234567890ABCDEFGHJKLMNPQRSTUVWXYZ23456',
      type: 'ProofOfFunds',
      issuer: 'stellaro-kyc',
    };
    const created = {
      id: 'vc-003',
      ...payload,
      status: 'active',
    };
    mockSsiService.issueCredential.mockReturnValue(created);

    const result = controller.issueCredential(payload);

    expect(result).toEqual(created);
    expect(service.issueCredential).toHaveBeenCalledWith(payload);
    expect(service.issueCredential).toHaveBeenCalledTimes(1);
  });
});
