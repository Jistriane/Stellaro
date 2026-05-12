import { SsiService } from './ssi.service';

describe('SsiService', () => {
  let service: SsiService;
  let sorobanService: { registerUserVc: jest.Mock; hasValidVc: jest.Mock };

  beforeEach(() => {
    sorobanService = {
      registerUserVc: jest.fn().mockResolvedValue('tx-test-123'),
      hasValidVc: jest.fn().mockResolvedValue(true),
    };
    service = new SsiService(undefined, sorobanService as any);
  });

  it('returns overview with initial credentials', async () => {
    const overview = await service.getOverview();

    expect(overview.module).toBe('ssi');
    expect(overview.credentials.length).toBeGreaterThanOrEqual(2);
    expect(overview.total).toBeGreaterThanOrEqual(2);
    expect(overview.readiness).toBeGreaterThan(0);
  });

  it('issues credential and updates list size', async () => {
    const before = (await service.listCredentials()).total;

    const created = await service.issueCredential({
      userAddress: 'GTESTUSERADDRESS1234567890ABCDEFGHJKLMNPQRSTUVWXYZ23456',
      type: 'ProofOfIncome',
      issuer: 'stellaro-compliance',
    });

    const after = (await service.listCredentials()).total;

    expect(created.id).toMatch(/^vc-\d{3}$/);
    expect(created.status).toBe('active');
    expect(created.txHash).toBe('tx-test-123');
    expect(created.vcHash).toMatch(/^[a-f0-9]{64}$/);
    expect(sorobanService.registerUserVc).toHaveBeenCalledTimes(1);
    expect(after).toBe(before + 1);
  });

  it('supports filtering and pagination', async () => {
    const filtered = await service.listCredentials({ status: 'active', page: 1, pageSize: 1 });

    expect(filtered.page).toBe(1);
    expect(filtered.pageSize).toBe(1);
    expect(filtered.credentials.length).toBe(1);
    expect(filtered.total).toBeGreaterThanOrEqual(1);
    expect(filtered.credentials[0].status).toBe('active');
  });
});
