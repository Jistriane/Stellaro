import { DaoService } from './dao.service';

describe('DaoService', () => {
  let service: DaoService;

  beforeEach(() => {
    service = new DaoService();
  });

  it('returns overview with initial proposals', async () => {
    const overview = await service.getOverview();

    expect(overview.module).toBe('dao');
    expect(overview.proposals.length).toBeGreaterThanOrEqual(2);
    expect(overview.total).toBeGreaterThanOrEqual(2);
    expect(overview.readiness).toBeGreaterThan(0);
  });

  it('creates proposal and updates list size', async () => {
    const before = (await service.listProposals()).total;

    const created = await service.createProposal({
      title: 'Enable staged cross-chain pilot',
      quorumBps: 2800,
      timelockHours: 36,
    });

    const after = (await service.listProposals()).total;

    expect(created.id).toMatch(/^dao-\d{3}$/);
    expect(created.status).toBe('draft');
    expect(after).toBe(before + 1);
  });

  it('supports filtering and pagination', async () => {
    const filtered = await service.listProposals({
      status: 'draft',
      page: 1,
      pageSize: 1,
    });

    expect(filtered.page).toBe(1);
    expect(filtered.pageSize).toBe(1);
    expect(filtered.proposals.length).toBe(1);
    expect(filtered.total).toBeGreaterThanOrEqual(1);
    expect(filtered.proposals[0].status).toBe('draft');
  });
});
