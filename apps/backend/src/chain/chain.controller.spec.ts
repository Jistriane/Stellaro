import { ChainController } from './chain.controller';
import { ChainService } from './chain.service';

describe('ChainController', () => {
  let controller: ChainController;
  let service: jest.Mocked<ChainService>;

  beforeEach(() => {
    service = {
      getConfig: jest.fn(),
      simulateContractCallReal: jest.fn(),
      simulateContractCall: jest.fn(),
    } as unknown as jest.Mocked<ChainService>;

    service.getConfig.mockReturnValue({
      network: 'testnet',
      sorobanRpcUrl: 'rpc',
    } as any);
    service.simulateContractCallReal.mockResolvedValue({
      ok: true,
      estimatedFee: 123,
    } as any);
    service.simulateContractCall.mockResolvedValue({
      ok: true,
      estimatedFee: 456,
    } as any);

    controller = new ChainController(service);
  });

  it('reports health using real and stub simulations', async () => {
    const result = await controller.health();

    expect(service.getConfig).toHaveBeenCalled();
    expect(service.simulateContractCallReal).toHaveBeenCalledWith({
      contractId: 'health-check',
      method: 'ping',
      args: [],
    });
    expect(service.simulateContractCall).toHaveBeenCalled();
    expect(result).toEqual({
      network: 'testnet',
      rpcUrl: 'rpc',
      sdkAvailable: true,
      rpcOk: true,
      estimatedFee: 123,
    });
  });
});
