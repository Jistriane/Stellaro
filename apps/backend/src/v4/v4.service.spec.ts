import { V4Service } from './v4.service';

describe('V4Service', () => {
  const rwaStub = {
    getOverview: jest.fn().mockReturnValue({
      module: 'rwa',
      status: 'frontend-and-api-scaffold',
      readiness: 0.4,
      items: [{ id: 'rwa-001' }],
      nextSteps: ['rwa-step'],
    }),
  };

  const ssiStub = {
    getOverview: jest.fn().mockReturnValue({
      module: 'ssi',
      status: 'frontend-and-api-scaffold',
      readiness: 0.3,
      credentials: [{ id: 'vc-001' }, { id: 'vc-002' }],
      nextSteps: ['ssi-step'],
    }),
  };

  const subscriptionStub = {
    getOverview: jest.fn().mockReturnValue({
      module: 'subscription',
      status: 'frontend-and-api-scaffold',
      readiness: 0.2,
      plans: [{ id: 'sub-001' }],
      nextSteps: ['subscription-step'],
    }),
  };

  const daoStub = {
    getOverview: jest.fn().mockReturnValue({
      module: 'dao',
      status: 'frontend-and-api-scaffold',
      readiness: 0.5,
      proposals: [{ id: 'dao-001' }, { id: 'dao-002' }, { id: 'dao-003' }],
      nextSteps: ['dao-step'],
    }),
  };

  let service: V4Service;

  beforeEach(() => {
    jest.clearAllMocks();
    const insuranceStub = {
      getOverview: jest.fn().mockReturnValue({
        module: 'insurance',
        status: 'scaffold',
        readiness: 0.2,
        nextSteps: ['insurance-step'],
      }),
    };

    service = new V4Service(
      rwaStub as any,
      ssiStub as any,
      subscriptionStub as any,
      daoStub as any,
      insuranceStub as any,
    );
  });

  it('aggregates modules and readiness', async () => {
    const result = await service.getOverview();

    expect(result.module).toBe('v4');
    expect(result.modules).toHaveLength(5);
    expect(result.modules.find((m) => m.id === 'rwa')?.items).toBe(1);
    expect(result.modules.find((m) => m.id === 'ssi')?.items).toBe(2);
    expect(result.modules.find((m) => m.id === 'subscription')?.items).toBe(1);
    expect(result.modules.find((m) => m.id === 'dao')?.items).toBe(3);
    expect(result.readiness).toBeCloseTo((0.4 + 0.3 + 0.2 + 0.5 + 0.2) / 5, 6);
    expect(result.nextSteps).toEqual([
      'rwa-step',
      'ssi-step',
      'subscription-step',
      'dao-step',
      'insurance-step',
    ]);
  });
});
