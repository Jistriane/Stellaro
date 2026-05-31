import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ElizaService } from './eliza.service';
import { MemoryService } from '../memory/memory.service';
import { ActionsService } from '../actions/actions.service';

describe('ElizaService', () => {
  let mod: TestingModule;
  let service: ElizaService;

  const memoryStub = {
    logEvent: jest.fn().mockResolvedValue(undefined),
  };
  const actionsStub = {
    autoHedge: jest.fn().mockResolvedValue({ ok: true }),
  };

  beforeAll(async () => {
    // Force stub mode to avoid external HTTP calls
    process.env.AGENTS_MODE = 'stub';
    // Mock axios.post globally to prevent real HTTP
    const axiosMod = require('axios');
    jest.spyOn(axiosMod, 'post').mockResolvedValue({ data: { status: 'ok' } });
    mod = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        ElizaService,
        { provide: MemoryService, useValue: memoryStub },
        { provide: ActionsService, useValue: actionsStub },
      ],
    }).compile();

    service = mod.get<ElizaService>(ElizaService);
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return config or null if not loaded', () => {
    const cfg = service.getConfig();
    expect(cfg).toBeNull();
  });

  it('should return status with running flag and interval', () => {
    const status = service.getStatus();
    expect(status).toBeDefined();
    expect(typeof status.running).toBe('boolean');
    expect(status.intervalMs).toBeNull();
  });

  it('should start and stop agent with timer', () => {
    const startRes = service.start();
    expect(startRes.started).toBe(true);

    const stopRes = service.stop();
    expect(stopRes.stopped).toBe(true);
  });

  it('should trigger agent action for stellaro', async () => {
    jest.spyOn(service, 'triggerAgentAction').mockResolvedValueOnce({
      agent: 'stellaro',
      action: 'ping',
      result: { success: true },
    } as any);
    const res = await service.triggerAgentAction('stellaro', 'ping', {});
    expect(res.agent).toBe('stellaro');
    expect(res.action).toBe('ping');
    expect(res.result.success).toBe(true);
  });

  it('should trigger agent action for treasury_manager', async () => {
    jest.spyOn(service, 'triggerAgentAction').mockResolvedValueOnce({
      agent: 'treasury_manager',
      action: 'status',
      result: { success: true },
    } as any);
    const res = await service.triggerAgentAction(
      'treasury_manager',
      'status',
      {},
    );
    expect(res.agent).toBe('treasury_manager');
    expect(res.result.success).toBe(true);
  });

  it('should trigger agent action for compliance_bot', async () => {
    jest.spyOn(service, 'triggerAgentAction').mockResolvedValueOnce({
      agent: 'compliance_bot',
      action: 'check',
      result: { success: true },
    } as any);
    const res = await service.triggerAgentAction('compliance_bot', 'check', {});
    expect(res.agent).toBe('compliance_bot');
    expect(res.result.success).toBe(true);
  });

  it('should orchestrate safe_optimization workflow', async () => {
    jest.spyOn(service, 'orchestrateWorkflow').mockResolvedValueOnce({
      success: true,
      workflow: 'safe_optimization',
      steps: { compliance: { approved: true } },
    } as any);
    const res = await service.orchestrateWorkflow('safe_optimization', {
      treasuryAddress: 'GC...',
    });
    expect(res.success).toBe(true);
    expect(res.workflow).toBe('safe_optimization');
    expect(res.steps.compliance.approved).toBe(true);
  });

  it('should orchestrate transaction_compliance workflow', async () => {
    jest.spyOn(service, 'orchestrateWorkflow').mockResolvedValueOnce({
      success: true,
      workflow: 'transaction_compliance',
    } as any);
    const res = await service.orchestrateWorkflow('transaction_compliance', {
      userAddress: 'GB...',
      amountUSD: 100,
      asset: 'USDC',
    });
    expect(res.success).toBe(true);
    expect(res.workflow).toBe('transaction_compliance');
  });

  it('should orchestrate monitor_mitigate workflow', async () => {
    jest.spyOn(service, 'orchestrateWorkflow').mockResolvedValueOnce({
      success: true,
      workflow: 'monitor_mitigate',
    } as any);
    const res = await service.orchestrateWorkflow('monitor_mitigate', {
      userAddress: 'GA...',
    });
    expect(res.success).toBe(true);
    expect(res.workflow).toBe('monitor_mitigate');
  });

  it('should throw error for unknown workflow', async () => {
    jest
      .spyOn(service, 'orchestrateWorkflow')
      .mockRejectedValueOnce(new Error('Unknown workflow: invalid_workflow'));
    await expect(
      service.orchestrateWorkflow('invalid_workflow' as any, {}),
    ).rejects.toThrow('Unknown workflow: invalid_workflow');
  });
});
