import { ConfigService } from '@nestjs/config';
import { TravelRuleStatus } from '@prisma/client';
import { TravelRuleProviderService } from './travel-rule-provider.service';

describe('TravelRuleProviderService', () => {
  it('usa fallback stub e bloqueia contraparte sinalizada', async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'TRAVEL_RULE_MODE') return 'stub';
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new TravelRuleProviderService(config);

    const result = await service.checkTransfer({
      userId: 'user-1',
      walletAddress: 'blocked-wallet-address',
      direction: 'OUTBOUND',
      asset: 'USDT',
      amount: '500.00',
    });

    expect(result.status).toBe(TravelRuleStatus.BLOCKED);
    expect(result.reason).toBe('counterparty_flagged');
  });

  it('marca manual review para alto valor sem vasp', async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'TRAVEL_RULE_MODE') return 'stub';
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new TravelRuleProviderService(config);

    const result = await service.checkTransfer({
      userId: 'user-1',
      walletAddress: 'gdest123',
      direction: 'OUTBOUND',
      asset: 'BTC',
      amount: '100000.00',
    });

    expect(result.status).toBe(TravelRuleStatus.MANUAL_REVIEW);
    expect(result.reason).toBe('high_value_transfer_without_vasp');
  });
});
