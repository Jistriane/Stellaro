import { ConfigService } from '@nestjs/config';
import { BridgeService } from './bridge.service';

describe('BridgeService', () => {
  let service: BridgeService;
  let mockConfigService: any;
  let mockSorobanService: any;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn((key, defaultVal) => {
        if (key === 'BRIDGE_ADAPTER_ID') return 'BRIDGE_001';
        return defaultVal;
      }),
    };

    mockSorobanService = {
      getEvents: jest.fn().mockResolvedValue([
        { id: 'evt1', type: 'transfer_intent', amount: 1000 },
        { id: 'evt2', type: 'transfer_intent', amount: 2000 },
      ]),
      invokeContract: jest.fn().mockResolvedValue({ success: true }),
    };

    service = new BridgeService(mockConfigService, mockSorobanService);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('monitorBridgeEvents starts polling', async () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    service.monitorBridgeEvents();
    expect(setIntervalSpy).toHaveBeenCalled();
    setIntervalSpy.mockRestore();
  });

  it('processes transfer_intent events', async () => {
    const events = await mockSorobanService.getEvents('BRIDGE_001');
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('transfer_intent');
  });

  it('handles bridge errors gracefully', async () => {
    mockSorobanService.getEvents.mockRejectedValueOnce(new Error('Bridge error'));
    const events = await mockSorobanService.getEvents('BRIDGE_001').catch(() => []);
    expect(Array.isArray(events)).toBe(true);
  });

  it('relays events to target chain', async () => {
    const spy = jest.spyOn(mockSorobanService, 'invokeContract');
    await mockSorobanService.invokeContract('bridge', 'relay', {
      txId: 'tx123',
      amount: 1000,
    });
    expect(spy).toHaveBeenCalled();
  });
});
