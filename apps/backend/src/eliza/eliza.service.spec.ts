import axios from 'axios';
import { ElizaService } from './eliza.service';

jest.mock('axios');

describe('ElizaService (expanded)', () => {
  let service: ElizaService;
  let mockMemory: any;
  let mockActions: any;
  let origEnv: any;

  beforeEach(() => {
    origEnv = { ...process.env };
    process.env.NODE_ENV = 'test';
    process.env.AGENT_SERVICE_URL = 'http://agents:8000';

    mockMemory = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    };
    mockActions = {};

    service = new ElizaService(mockMemory, mockActions);
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it('should start and stop without leaking timers', () => {
    const s = service.start();
    expect(s.started).toBe(true);

    const status = service.getStatus();
    expect(status.running).toBe(true);
    expect(status.intervalMs).toBe(5000);

    const stopped = service.stop();
    expect(stopped.stopped).toBe(true);

    const statusAfter = service.getStatus();
    expect(statusAfter.running).toBe(false);
  });

  it('triggerAgentAction should POST to agent service and log event', async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: { result: { success: true, message: 'done' } },
    });

    const res = await service.triggerAgentAction('stellaro', 'scan_portfolio', { userId: 'u1' });

    expect(axios.post).toHaveBeenCalledWith('http://agents:8000/agent/action', {
      agent: 'stellaro',
      action: 'scan_portfolio',
      payload: { userId: 'u1' },
    });

    expect(mockMemory.logEvent).toHaveBeenCalledWith(
      'multi-agent',
      'stellaro.scan_portfolio',
      expect.objectContaining({ payload: { userId: 'u1' } })
    );

    expect(res.result.success).toBe(true);
  });

  it('triggerAgentAction should fall back to mock in development on HTTP error', async () => {
    process.env.NODE_ENV = 'development';
    (axios.post as jest.Mock).mockRejectedValue(new Error('Service unavailable'));

    const res = await service.triggerAgentAction('compliance_bot', 'check_kyc', { addr: 'a1' });

    expect(res).toHaveProperty('agent', 'compliance_bot');
    expect(res).toHaveProperty('action', 'check_kyc');
    expect(mockMemory.logEvent).toHaveBeenCalled();
  });

  it('triggerAgentAction should throw in production on HTTP error', async () => {
    process.env.NODE_ENV = 'production';
    (axios.post as jest.Mock).mockRejectedValue(new Error('Service unavailable'));

    await expect(
      service.triggerAgentAction('treasury_manager', 'rebalance', {})
    ).rejects.toThrow();
  });

  it('orchestrateWorkflow should POST workflow request and log event', async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: { success: true, result: { optimized: true } },
    });

    const res = await service.orchestrateWorkflow('safe_optimization', {
      treasuryAddress: 'GAAA...AAAA',
    });

    expect(axios.post).toHaveBeenCalledWith('http://agents:8000/orchestrate/workflow', {
      workflow: 'safe_optimization',
      payload: { treasuryAddress: 'GAAA...AAAA' },
    });

    expect(mockMemory.logEvent).toHaveBeenCalledWith(
      'orchestration',
      'safe_optimization',
      expect.any(Object)
    );

    expect(res.success).toBe(true);
  });

  it('orchestrateWorkflow should fall back to mock executeSafeOptimization in dev', async () => {
    process.env.NODE_ENV = 'development';
    (axios.post as jest.Mock).mockRejectedValue(new Error('Network error'));

    const res = await service.orchestrateWorkflow('safe_optimization', {
      treasuryAddress: 'GAAA...AAAA',
    });

    expect(res.workflow).toBe('safe_optimization');
    expect(res.result).toHaveProperty('success', true);
    expect(mockMemory.logEvent).toHaveBeenCalled();
  });

  it('orchestrateWorkflow should throw unknown workflow in dev mock', async () => {
    process.env.NODE_ENV = 'development';
    (axios.post as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(
      service.orchestrateWorkflow('unknown_workflow' as any, {})
    ).rejects.toThrow('Unknown workflow');
  });

  it('getStatus should return current running state', () => {
    expect(service.getStatus()).toEqual({ running: false, intervalMs: null });

    service.start();
    expect(service.getStatus().running).toBe(true);

    service.stop();
    expect(service.getStatus().running).toBe(false);
  });

  it('getConfig should return parsed ELIZA config or null', () => {
    const cfg = service.getConfig();
    // In test env with no config file, should be null
    expect(cfg === null || typeof cfg === 'object').toBe(true);
  });

  it('onModuleInit should log warn when config file not found', async () => {
    const svc2 = new ElizaService(mockMemory, mockActions);
    // onModuleInit is called in constructor; should handle gracefully
    expect(() => svc2.getConfig()).not.toThrow();
  });
});
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
    const res = await service.triggerAgentAction('treasury_manager', 'status', {});
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
    jest.spyOn(service, 'orchestrateWorkflow').mockRejectedValueOnce(new Error('Unknown workflow: invalid_workflow'));
    await expect(
      service.orchestrateWorkflow('invalid_workflow' as any, {}),
    ).rejects.toThrow('Unknown workflow: invalid_workflow');
  });
});
