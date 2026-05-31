import { Test, TestingModule } from '@nestjs/testing';
import { AutomationService } from './automation.service';
import { OraclesService } from '../oracles/oracles.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ComplianceService } from '../compliance/compliance.service';

const createMocks = () => {
  const oracles = {
    getPrice: jest.fn(),
  } as unknown as jest.Mocked<OraclesService>;
  const notifications = {
    send: jest.fn(),
  } as unknown as jest.Mocked<NotificationsService>;
  const compliance = {
    kycCheck: jest.fn(),
    amlScreening: jest.fn(),
  } as unknown as jest.Mocked<ComplianceService>;

  return { oracles, notifications, compliance };
};

describe('AutomationService', () => {
  let service: AutomationService;
  let oracles: jest.Mocked<OraclesService>;
  let notifications: jest.Mocked<NotificationsService>;
  let compliance: jest.Mocked<ComplianceService>;

  beforeEach(async () => {
    const mocks = createMocks();
    oracles = mocks.oracles;
    notifications = mocks.notifications;
    compliance = mocks.compliance;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationService,
        { provide: OraclesService, useValue: oracles },
        { provide: NotificationsService, useValue: notifications },
        { provide: ComplianceService, useValue: compliance },
      ],
    }).compile();

    service = module.get(AutomationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('riskPipeline returns price and triggers notification when configured', async () => {
    oracles.getPrice.mockResolvedValue({ value: 5.1 });

    const result = await service.riskPipeline({
      asset: 'USD/BRL',
      thresholdBps: 50,
      notifyTo: 'user@test',
    });

    expect(result.ok).toBe(true);
    expect(result.price.value).toBe(5.1);
    expect(oracles.getPrice).toHaveBeenCalledWith('USD', 'BRL');
    expect(notifications.send).toHaveBeenCalledWith(
      'email',
      'user@test',
      'Risk Pipeline',
      'USD/BRL=5.1',
    );
  });

  it('onboardingPipeline returns KYC result and optionally notifies', async () => {
    compliance.kycCheck.mockResolvedValue({ ok: true, level: 'APPROVED' });

    const result = await service.onboardingPipeline({
      document: '123',
      name: 'Alice',
      notifyTo: 'user@test',
    });

    expect(result.ok).toBe(true);
    expect(result.kyc.level).toBe('APPROVED');
    expect(compliance.kycCheck).toHaveBeenCalledWith('123', 'Alice');
    expect(notifications.send).toHaveBeenCalledWith(
      'email',
      'user@test',
      'Onboarding',
      'KYC=APPROVED',
    );
  });

  it('compliancePipeline returns AML result and notification when requested', async () => {
    compliance.amlScreening.mockResolvedValue({ ok: false, flagged: true });

    const result = await service.compliancePipeline({
      address: 'GABC',
      notifyTo: 'user@test',
    });

    expect(result.ok).toBe(false);
    expect(result.aml.flagged).toBe(true);
    expect(compliance.amlScreening).toHaveBeenCalledWith('GABC');
    expect(notifications.send).toHaveBeenCalledWith(
      'email',
      'user@test',
      'Compliance',
      'AML flagged=true',
    );
  });

  it('creditPipeline computes clamped score and notifies', async () => {
    const result = await service.creditPipeline({
      userId: 'u1',
      income: 5000,
      notifyTo: 'user@test',
    });

    expect(result.ok).toBe(true);
    expect(result.score).toBe(500);
    expect(notifications.send).toHaveBeenCalledWith(
      'email',
      'user@test',
      'Credit',
      'Score=500',
    );
  });

  it('creditPipeline clamps score to 1000 when income is high', async () => {
    const result = await service.creditPipeline({
      userId: 'u1',
      income: 20000,
    });

    expect(result.score).toBe(1000);
    expect(notifications.send).not.toHaveBeenCalled();
  });

  it('reportsPipeline returns localized content and can notify', async () => {
    const resultPt = await service.reportsPipeline({
      lang: 'pt',
      notifyTo: 'user@test',
    });
    const resultEn = await service.reportsPipeline({ lang: 'en' });

    expect(resultPt.content).toContain('Relatório consolidado');
    expect(resultEn.content).toContain('Consolidated report');
    expect(notifications.send).toHaveBeenCalledWith(
      'email',
      'user@test',
      'Relatório',
      expect.stringContaining('Relatório consolidado'),
    );
  });
});
