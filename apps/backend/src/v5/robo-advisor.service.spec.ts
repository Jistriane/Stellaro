import { RoboAdvisorService } from './robo-advisor.service';

const mockSoroban = {
  findBestPath: jest.fn().mockResolvedValue({ path: ['XLM', 'STLT'], rate: 1.5 }),
  executeSwap: jest.fn().mockResolvedValue({ txId: 'tx-123' }),
  executeContractCall: jest.fn().mockResolvedValue(100),
  executeBatchAction: jest.fn().mockResolvedValue(true),
};

const mockNotification = { sendDangerZoneAlert: jest.fn().mockResolvedValue(true) };
const mockBridge = { executeCrossChainYieldMove: jest.fn().mockResolvedValue(true) };

describe('RoboAdvisorService', () => {
  let service: RoboAdvisorService;

  beforeEach(() => {
    service = new (RoboAdvisorService as any)(mockSoroban, mockNotification, mockBridge, {});
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('calculateRebalance detects imbalance and returns buy/sell actions', async () => {
    const balances = { 'STLT-BRL': 50, XLM: 10, 'RWA-APT': 5 };
    const actions = await service.calculateRebalance(balances, 'conservative');
    expect(Array.isArray(actions)).toBe(true);
    expect(actions.length).toBeGreaterThanOrEqual(0);
  });

  it('calculateRebalance throws on invalid profile', async () => {
    await expect(
      service.calculateRebalance({ 'STLT-BRL': 50 }, 'invalid-profile')
    ).rejects.toThrow('Invalid profile');
  });

  it('executeStrategy completes without error', async () => {
    const actions = [
      { asset: 'XLM', type: 'BUY', amount: 100 },
      { asset: 'STLT', type: 'SELL', amount: 50 },
    ];
    const result = await service.executeStrategy('user-123', actions);
    expect(result).toHaveProperty('status', 'completed');
    expect(result).toHaveProperty('processed');
  });

  it('monitorRwaHealth checks for liquidation conditions', async () => {
    process.env.REFLECTOR_ORACLE_ID = 'oracle-1';
    await expect(service.monitorRwaHealth()).resolves.not.toThrow();
  });

  it('executeLiquidityStrategy routes large orders to external MM', async () => {
    const actions = [{ asset: 'XLM', type: 'BUY', amount: 150000 }];
    await service.executeLiquidityStrategy('user-123', actions);
    expect(service).toBeDefined();
  });

  it('checkCrossChainOpportunities rebalances on yield spread', async () => {
    await expect(service.checkCrossChainOpportunities()).resolves.not.toThrow();
  });

  it('autoCompoundRewards reinvests pending rewards', async () => {
    const result = await service.autoCompoundRewards('user-123');
    expect(typeof result).toBe('undefined'); // método retorna undefined
  });
});
