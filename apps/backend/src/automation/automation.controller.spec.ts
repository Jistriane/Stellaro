import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';

describe('AutomationController', () => {
  let controller: AutomationController;
  let service: jest.Mocked<AutomationService>;

  beforeEach(() => {
    service = {
      riskPipeline: jest.fn(),
      onboardingPipeline: jest.fn(),
      compliancePipeline: jest.fn(),
      creditPipeline: jest.fn(),
      reportsPipeline: jest.fn(),
    } as unknown as jest.Mocked<AutomationService>;

    controller = new AutomationController(service);
  });

  it('delegates risk pipeline', () => {
    const body = { asset: 'XLM', thresholdBps: 100 } as any;
    service.riskPipeline.mockReturnValue({ ok: true } as any);

    const result = controller.risk(body);

    expect(service.riskPipeline).toHaveBeenCalledWith(body);
    expect(result).toEqual({ ok: true });
  });

  it('delegates reports pipeline', () => {
    const body = { lang: 'en', notifyTo: 'ops@' } as any;
    service.reportsPipeline.mockReturnValue({ queued: true } as any);

    const result = controller.reports(body);

    expect(service.reportsPipeline).toHaveBeenCalledWith(body);
    expect(result).toEqual({ queued: true });
  });
});
