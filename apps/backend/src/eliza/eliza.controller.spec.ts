import { ElizaController } from './eliza.controller';
import { ElizaService } from './eliza.service';

describe('ElizaController', () => {
  let controller: ElizaController;
  let service: jest.Mocked<ElizaService>;

  beforeEach(() => {
    service = {
      getStatus: jest.fn(),
      getConfig: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      triggerAgentAction: jest.fn(),
      orchestrateWorkflow: jest.fn(),
    } as unknown as jest.Mocked<ElizaService>;

    controller = new ElizaController(service);
  });

  it('returns health from service', () => {
    service.getStatus.mockReturnValue({ running: true });

    expect(controller.health()).toEqual({ running: true });
    expect(service.getStatus).toHaveBeenCalledTimes(1);
  });

  it('returns config or empty object', () => {
    service.getConfig.mockReturnValue(undefined as any);

    expect(controller.config()).toEqual({});
    expect(service.getConfig).toHaveBeenCalledTimes(1);
  });

  it('starts and stops agent', () => {
    controller.start();
    controller.stop();

    expect(service.start).toHaveBeenCalledTimes(1);
    expect(service.stop).toHaveBeenCalledTimes(1);
  });

  it('triggers risk analysis agent', async () => {
    service.triggerAgentAction.mockResolvedValue({ ok: true } as any);

    const result = await controller.triggerRiskAnalysis('G1');

    expect(service.triggerAgentAction).toHaveBeenCalledWith(
      'stellaro',
      'analyze_portfolio',
      {
        userAddress: 'G1',
      },
    );
    expect(result).toEqual({ ok: true });
  });

  it('orchestrates transaction compliance workflow', async () => {
    const payload = {
      userAddress: 'G2',
      amountUSD: 10,
      asset: 'USDC',
      destination: 'G3',
    };
    service.orchestrateWorkflow.mockResolvedValue({ status: 'ok' } as any);

    const result = await controller.orchestrateTransactionCompliance(payload);

    expect(service.orchestrateWorkflow).toHaveBeenCalledWith(
      'transaction_compliance',
      payload,
    );
    expect(result).toEqual({ status: 'ok' });
  });
});
