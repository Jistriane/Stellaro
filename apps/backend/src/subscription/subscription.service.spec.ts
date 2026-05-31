import { SubscriptionService } from './subscription.service';

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  beforeEach(() => {
    service = new SubscriptionService();
  });

  it('returns overview with default plans', async () => {
    const overview = await service.getOverview();

    expect(overview.module).toBe('subscription');
    expect(overview.plans.length).toBeGreaterThanOrEqual(2);
    expect(overview.total).toBeGreaterThanOrEqual(2);
  });

  it('creates recurring plan and updates list size', async () => {
    const before = (await service.listPlans()).total;

    const created = await service.createPlan({
      name: 'Quarterly Treasury Sync',
      cadence: 'quarterly',
      amount: '340.00',
      currency: 'STLT',
    });

    const after = (await service.listPlans()).total;

    expect(created.id).toMatch(/^sub-\d{3}$/);
    expect(created.status).toBe('draft');
    expect(after).toBe(before + 1);
  });

  it('supports filtering and pagination', async () => {
    const filtered = await service.listPlans({
      status: 'scaffold',
      page: 1,
      pageSize: 1,
    });

    expect(filtered.page).toBe(1);
    expect(filtered.pageSize).toBe(1);
    expect(filtered.plans.length).toBe(1);
    expect(filtered.total).toBeGreaterThanOrEqual(1);
    expect(filtered.plans[0].status).toBe('scaffold');
  });
});
