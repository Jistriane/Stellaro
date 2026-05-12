import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { HttpException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

describe('ComplianceController', () => {
  let controller: ComplianceController;
  let service: jest.Mocked<ComplianceService>;
  let redis: jest.Mocked<RedisService>;

  beforeEach(() => {
    service = {
      kycCheck: jest.fn(),
      submitKycApplication: jest.fn(),
      amlScreening: jest.fn(),
      canRoutePixOrCard: jest.fn(),
    } as unknown as jest.Mocked<ComplianceService>;
    redis = {
      get: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;
    controller = new ComplianceController(service, redis);
  });

  it('valida campos obrigatorios no KYC', async () => {
    await expect(controller.kyc({} as any, { document: '', name: '' } as any, {} as any)).rejects.toBeInstanceOf(HttpException);
  });

  it('envia submissao KYC completa quando payload expandido estiver presente', async () => {
    service.submitKycApplication.mockResolvedValue({ ok: true } as any);
    redis.get.mockResolvedValue({ userId: 'u-1' } as any);
    const body = {
      name: 'Alice',
      document: '12345678901',
      addressLine1: 'Rua A, 100',
      city: 'Sao Paulo',
      state: 'SP',
      postalCode: '01000-000',
      revenue: '12000',
    };
    const files = {
      idDocument: [{}],
      selfie: [{}],
      addressProof: [{}],
      revenueProof: [{}],
    } as any;
    const req = { headers: { authorization: 'Bearer token-1' } } as any;

    const res = await controller.kyc(req, body as any, files);

    expect(service.submitKycApplication).toHaveBeenCalledWith({ ...body, userId: 'u-1' }, files);
    expect(res).toEqual({ ok: true });
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
