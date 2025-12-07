import { OraclesController } from './oracles.controller';
import { OraclesService } from './oracles.service';

describe('OraclesController', () => {
  let controller: OraclesController;
  let service: jest.Mocked<OraclesService>;

  beforeEach(() => {
    service = {
      getPrice: jest.fn(),
      getAggregatedPrices: jest.fn(),
      detectAnomalies: jest.fn(),
      getSocialSentiment: jest.fn(),
      getDefiAlerts: jest.fn(),
      getCrossChainEvents: jest.fn(),
    } as unknown as jest.Mocked<OraclesService>;

    controller = new OraclesController(service);
  });

  it('returns price for base/quote', async () => {
    service.getPrice.mockResolvedValue({ base: 'USD', quote: 'BRL', value: 5.2 } as any);

    const result = await controller.price('USD', 'BRL');

    expect(service.getPrice).toHaveBeenCalledWith('USD', 'BRL');
    expect(result).toEqual({ base: 'USD', quote: 'BRL', value: 5.2 });
  });

  it('splits pair on fx endpoint and reuses price lookup', async () => {
    service.getPrice.mockResolvedValue({ base: 'EUR', quote: 'USD', value: 1.1 } as any);

    const result = await controller.fx('EUR/USD');

    expect(service.getPrice).toHaveBeenCalledWith('EUR', 'USD');
    expect(result).toEqual({ base: 'EUR', quote: 'USD', value: 1.1 });
  });

  it('returns alerts from service', async () => {
    const alerts = [{ id: '1', type: 'defi' }];
    service.getDefiAlerts.mockResolvedValue(alerts as any);

    const result = await controller.alerts();

    expect(service.getDefiAlerts).toHaveBeenCalledTimes(1);
    expect(result).toBe(alerts);
  });
});
