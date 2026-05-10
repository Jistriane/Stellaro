import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockSorobanService: any;

  beforeEach(() => {
    mockSorobanService = {
      getContractData: jest.fn().mockResolvedValue({ value: 100 }),
      invokeContract: jest.fn().mockResolvedValue({ success: true }),
      executeContractCall: jest.fn().mockResolvedValue({ supply: 5000000 }),
    };

    service = new AnalyticsService(mockSorobanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getGlobalMetrics returns protocol metrics', async () => {
    const metrics = await service.getGlobalMetrics();
    expect(metrics).toHaveProperty('totalValueLocked');
    expect(metrics).toHaveProperty('totalDebt');
    expect(metrics).toHaveProperty('globalHealthFactor');
    expect(metrics).toHaveProperty('activeAuctions');
    expect(metrics).toHaveProperty('protocolRevenue');
    expect(metrics.totalValueLocked).toBeGreaterThan(0);
    expect(metrics.globalHealthFactor).toBeGreaterThan(1);
  });

  it('getGlobalMetrics handles errors gracefully', async () => {
    mockSorobanService.getContractData.mockRejectedValueOnce(new Error('Network error'));
    expect(await service.getGlobalMetrics()).toHaveProperty('totalValueLocked');
  });

  it('getAuctionHistory returns auction records', async () => {
    const history = await service.getAuctionHistory();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]).toHaveProperty('id');
    expect(history[0]).toHaveProperty('asset');
    expect(history[0]).toHaveProperty('recovered');
  });

  it('auction history contains expected fields', async () => {
    const history = await service.getAuctionHistory();
    const auction = history[0];
    expect(typeof auction.recovered).toBe('number');
    expect(typeof auction.date).toBe('string');
    expect(auction.recovered).toBeGreaterThan(0);
  });
});
