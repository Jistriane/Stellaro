import { RiskController } from './risk.controller';
import { RiskService } from './risk.service';

describe('RiskController', () => {
  let controller: RiskController;
  let service: jest.Mocked<RiskService>;

  beforeEach(() => {
    service = {
      ingestSignals: jest.fn(),
      getSummary: jest.fn(),
      decide: jest.fn(),
      execute: jest.fn(),
    } as unknown as jest.Mocked<RiskService>;

    controller = new RiskController(service);
  });

  it('forwards ingestSignals to service', () => {
    const body: any = { signals: ['a'], context: { userId: 'u1' } };
    service.ingestSignals.mockReturnValue({ ok: true, received: body });

    const result = controller.ingestSignals(body);

    expect(service.ingestSignals).toHaveBeenCalledWith(body);
    expect(result).toEqual({ ok: true, received: body });
  });

  it('returns summary for user', () => {
    const summary = {
      userId: 'user-1',
      exposure: { eventsCount: 2 },
      riskLevel: 'neutral',
    };
    service.getSummary.mockReturnValue(summary as any);

    const result = controller.getSummary('user-1');

    expect(service.getSummary).toHaveBeenCalledWith('user-1');
    expect(result).toBe(summary);
  });

  it('delegates decide', () => {
    const dto: any = { userId: 'user-2', data: [] };
    const proposal = { proposalId: 'p1', confidence: 0.9, actions: [] };
    service.decide.mockReturnValue(proposal as any);

    const result = controller.decide(dto);

    expect(service.decide).toHaveBeenCalledWith(dto);
    expect(result).toBe(proposal);
  });

  it('delegates execute', () => {
    const dto: any = { userId: 'u3', action: 'swap', params: {} };
    service.execute.mockReturnValue({ executed: true, request: dto } as any);

    const result = controller.execute(dto);

    expect(service.execute).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ executed: true, request: dto });
  });
});
