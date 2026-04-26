import { SsiService } from './ssi.service';

describe('SsiService', () => {
  let service: SsiService;

  beforeEach(() => {
    service = new SsiService();
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
      type: 'ProofOfIncome',
      issuer: 'stellaro-compliance',
    });

    const after = (await service.listCredentials()).total;

    expect(created.id).toMatch(/^vc-\d{3}$/);
    expect(created.status).toBe('active');
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
