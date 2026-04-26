import { RwaService } from './rwa.service';

describe('RwaService', () => {
  let service: RwaService;

  beforeEach(() => {
    service = new RwaService();
  });

  it('returns overview with initial assets', async () => {
    const overview = await service.getOverview();

    expect(overview.module).toBe('rwa');
    expect(overview.items.length).toBeGreaterThanOrEqual(2);
    expect(overview.total).toBeGreaterThanOrEqual(2);
    expect(overview.readiness).toBeGreaterThan(0);
  });

  it('creates new asset and updates list size', async () => {
    const before = (await service.listAssets()).total;

    const created = await service.createAsset({
      name: 'Infra Notes BRL',
      assetClass: 'receivables',
      annualYieldBps: 970,
    });

    const after = (await service.listAssets()).total;

    expect(created.id).toMatch(/^rwa-\d{3}$/);
    expect(created.status).toBe('draft');
    expect(after).toBe(before + 1);
  });

  it('supports filtering and pagination', async () => {
    const filtered = await service.listAssets({ status: 'scaffold', page: 1, pageSize: 1 });

    expect(filtered.page).toBe(1);
    expect(filtered.pageSize).toBe(1);
    expect(filtered.items.length).toBe(1);
    expect(filtered.total).toBeGreaterThanOrEqual(1);
    expect(filtered.items[0].status).toBe('scaffold');
  });
});
