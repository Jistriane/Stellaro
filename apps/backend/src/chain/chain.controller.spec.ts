import { ChainController } from './chain.controller';
import { ChainService } from './chain.service';
import { SorobanService } from './soroban.service';

describe('ChainController', () => {
  let controller: ChainController;
  let service: jest.Mocked<ChainService>;
  let soroban: jest.Mocked<SorobanService>;

  beforeEach(() => {
    service = {
      getConfig: jest.fn(),
      simulateContractCallReal: jest.fn(),
      simulateContractCall: jest.fn(),
    } as unknown as jest.Mocked<ChainService>;
    soroban = {} as unknown as jest.Mocked<SorobanService>;

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

    controller = new ChainController(service, soroban);
  });

  it('reports health using real and stub simulations', async () => {
    const result = await controller.health();

    expect(service.getConfig).toHaveBeenCalled();
    expect(service.simulateContractCallReal).toHaveBeenCalledWith({
      contractId: 'health-check',
      method: 'ping',
      args: [],
    });
    expect(service.simulateContractCall).not.toHaveBeenCalled();
    expect(result).toEqual({
      network: 'testnet',
      rpcUrl: 'rpc',
      sdkAvailable: true,
      rpcOk: true,
      estimatedFee: 123,
    });
  });
});
