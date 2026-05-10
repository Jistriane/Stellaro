import { DatabaseOptimizationService } from './optimization.service';

const mockPrisma: any = {
  user: {
    findUnique: jest.fn().mockResolvedValue({ id: 'u1', email: 'user@example.com' }),
    findMany: jest.fn().mockResolvedValue([
      { id: 'u1', email: 'a@b.com', createdAt: new Date() },
    ]),
    count: jest.fn().mockResolvedValue(42),
  },
  webhookEvent: {
    findMany: jest.fn().mockResolvedValue([
      { id: 'ev1', eventId: 'evt-1', payload: {}, receivedAt: new Date() },
    ]),
  },
  riskEvent: {
    findMany: jest.fn().mockResolvedValue([
      { id: 'r1', userId: 'u1', type: 'liquidation', createdAt: new Date() },
    ]),
    aggregate: jest.fn().mockResolvedValue({ _count: 15 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
  },
  riskProposal: {
    updateMany: jest.fn().mockResolvedValue({ count: 3 }),
  },
  $executeRawUnsafe: jest.fn().mockResolvedValue(true),
  $queryRaw: jest.fn().mockResolvedValue([{ size: '50 MB' }]),
  $queryRawUnsafe: jest.fn().mockResolvedValue([{ datname: 'db1', numbackends: 5 }]),
};

describe('DatabaseOptimizationService', () => {
  let service: DatabaseOptimizationService;

  beforeEach(() => {
    service = new (DatabaseOptimizationService as any)(mockPrisma);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getUserOptimized selects specific fields', async () => {
    const user = await service.getUserOptimized('u1');
    expect(user).toHaveProperty('id', 'u1');
    expect(user).toHaveProperty('email');
  });

  it('getUserCached delegates to getUserOptimized', async () => {
    const user = await service.getUserCached('u1');
    expect(user).toBeDefined();
    expect(mockPrisma.user.findUnique).toHaveBeenCalled();
  });

  it('getUsersInBatch loads multiple users by ID', async () => {
    const map = await service.getUsersInBatch(['u1', 'u2']);
    expect(map).toBeInstanceOf(Map);
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['u1', 'u2'] } },
      select: expect.any(Object),
    });
  });

  it('getWebhookEventsPaginated returns paginated events', async () => {
    const events = await service.getWebhookEventsPaginated(20, 'cursor1');
    expect(Array.isArray(events)).toBe(true);
    expect(mockPrisma.webhookEvent.findMany).toHaveBeenCalled();
  });

  it('getUserCountCached returns user count', async () => {
    const count = await service.getUserCountCached();
    expect(count).toBe(42);
    expect(mockPrisma.user.count).toHaveBeenCalled();
  });

  it('getRiskEventsSummary returns limited risk events', async () => {
    const events = await service.getRiskEventsSummary(50);
    expect(Array.isArray(events)).toBe(true);
    expect(events[0]).toHaveProperty('type', 'liquidation');
  });

  it('getRiskMetrics aggregates risk event counts', async () => {
    const metrics = await service.getRiskMetrics();
    expect(metrics).toHaveProperty('totalEvents', 15);
  });

  it('bulkUpdateRiskProposalStatus updates multiple proposals', async () => {
    const result = await service.bulkUpdateRiskProposalStatus(['p1', 'p2', 'p3'], 0.85);
    expect(result).toHaveProperty('count', 3);
    expect(mockPrisma.riskProposal.updateMany).toHaveBeenCalled();
  });

  it('ensureIndexes executes index creation', async () => {
    await service.ensureIndexes();
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled();
  });

  it('getConnectionPoolStats retrieves pool info', async () => {
    const stats = await service.getConnectionPoolStats();
    expect(stats).toBeDefined();
    expect(typeof stats).toBe('object');
  });

  it('warmupCriticalData preloads top users', async () => {
    await service.warmupCriticalData();
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      take: 100,
      select: expect.any(Object),
    });
  });

  it('archiveOldRiskEvents deletes events older than cutoff', async () => {
    const result = await service.archiveOldRiskEvents(90);
    expect(result).toHaveProperty('count', 5);
  });

  it('getDatabaseSize queries database size', async () => {
    const size = await service.getDatabaseSize();
    expect(size).toHaveProperty('size', '50 MB');
  });

  it('maintenanceRoutine runs full maintenance', async () => {
    await service.maintenanceRoutine();
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled();
  });
});
