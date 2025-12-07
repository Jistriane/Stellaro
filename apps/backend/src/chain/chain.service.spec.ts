import { Test, TestingModule } from '@nestjs/testing';
import { ChainService } from './chain.service';

describe('ChainService', () => {
  let service: ChainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChainService],
    }).compile();

    service = module.get<ChainService>(ChainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfig', () => {
    it('should return configuration with defaults', () => {
      const config = service.getConfig();

      expect(config).toHaveProperty('network');
      expect(config).toHaveProperty('sorobanRpcUrl');
      expect(config).toHaveProperty('horizonUrl');
      expect(config.network).toBe('testnet');
    });

    it('should use testnet as default', () => {
      const originalNetwork = process.env.STELLAR_NETWORK;
      delete process.env.STELLAR_NETWORK;

      const config = service.getConfig();

      expect(config.network).toBe('testnet');

      if (originalNetwork) {
        process.env.STELLAR_NETWORK = originalNetwork;
      }
    });
  });

  describe('Contract Methods', () => {
    it('should have required contract methods', () => {
      expect(service.simulateContractCallReal).toBeDefined();
      expect(service.submitTxReal).toBeDefined();
      expect(service.getContractValue).toBeDefined();
    });
  });

  describe('Horizon Methods', () => {
    it('should have required horizon methods', () => {
      expect(service.getAccount).toBeDefined();
      expect(service.getTransaction).toBeDefined();
      expect(service.listTransactions).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid addresses gracefully', async () => {
      const result = await service.getContractValue('INVALID', 'key');
      expect(result).toBeDefined();
    });

    it('should return config even with missing env vars', () => {
      const config = service.getConfig();
      expect(config.network).toBeDefined();
      expect(config.sorobanRpcUrl).toBeDefined();
    });
  });
});
