import { Test } from '@nestjs/testing';
import { EtherfuseController } from './etherfuse.controller';
import { EtherfuseService } from './etherfuse.service';

describe('EtherfuseController', () => {
  let controller: EtherfuseController;
  let etherfuseService: { getStatus: jest.Mock; createQuote: jest.Mock; createOrder: jest.Mock };

  beforeEach(async () => {
    const mockEtherfuseService = {
      getStatus: jest.fn(),
      createQuote: jest.fn(),
      createOrder: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [EtherfuseController],
      providers: [{ provide: EtherfuseService, useValue: mockEtherfuseService }],
    }).compile();

    controller = module.get(EtherfuseController);
    etherfuseService = module.get(EtherfuseService);
  });

  it('should return etherfuse status', () => {
    etherfuseService.getStatus.mockReturnValue({
      enabled: true,
      mode: 'stub',
      configuredMode: null,
      fallbackActive: true,
      fallbackReason: 'ETHERFUSE credentials not fully configured; using implicit stub mode',
    });

    expect(controller.getStatus()).toEqual({
      enabled: true,
      mode: 'stub',
      configuredMode: null,
      fallbackActive: true,
      fallbackReason: 'ETHERFUSE credentials not fully configured; using implicit stub mode',
    });
    expect(etherfuseService.getStatus).toHaveBeenCalled();
  });

  it('should create etherfuse quote', async () => {
    const dto = { amount: '50.00', quoteType: 'onramp' as const };
    etherfuseService.createQuote.mockResolvedValue({ ok: true, quote: { id: 'quote-1' } });

    await expect(controller.createQuote(dto)).resolves.toEqual({ ok: true, quote: { id: 'quote-1' } });
    expect(etherfuseService.createQuote).toHaveBeenCalledWith(dto);
  });

  it('should create etherfuse order', async () => {
    const dto = { quoteId: 'quote-1', walletAddress: 'GABC123' };
    etherfuseService.createOrder.mockResolvedValue({ ok: true, order: { id: 'order-1' } });

    await expect(controller.createOrder(dto)).resolves.toEqual({ ok: true, order: { id: 'order-1' } });
    expect(etherfuseService.createOrder).toHaveBeenCalledWith(dto);
  });
});
