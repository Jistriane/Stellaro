import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { HttpException } from '@nestjs/common';

describe('ComplianceController', () => {
  let controller: ComplianceController;
  let service: jest.Mocked<ComplianceService>;

  beforeEach(() => {
    service = {
      kycCheck: jest.fn(),
      amlScreening: jest.fn(),
      canRoutePixOrCard: jest.fn(),
    } as unknown as jest.Mocked<ComplianceService>;
    controller = new ComplianceController(service);
  });

  it('valida campos obrigatorios no KYC', async () => {
    await expect(controller.kyc({ document: '', name: '' } as any)).rejects.toBeInstanceOf(HttpException);
  });

  it('chama servico no AML', async () => {
    service.amlScreening.mockResolvedValue({ risk: 'low' } as any);

    const res = await controller.aml({ address: 'G1' } as any);

    expect(service.amlScreening).toHaveBeenCalledWith('G1');
    expect(res).toEqual({ risk: 'low' });
  });

  it('route-check delega para servico', async () => {
    service.canRoutePixOrCard.mockResolvedValue({ ok: true } as any);

    const res = await controller.routeCheck({ userId: 'u1' } as any);

    expect(service.canRoutePixOrCard).toHaveBeenCalledWith('u1');
    expect(res).toEqual({ ok: true });
  });
});
