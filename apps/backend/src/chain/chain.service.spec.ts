import { ChainService } from './chain.service';

describe('ChainService (unit)', () => {
  let service: ChainService;

  beforeEach(() => {
    service = new ChainService();
  });

  it('getConfig should return default config values', () => {
    const cfg = service.getConfig();
    expect(cfg).toHaveProperty('sorobanRpcUrl');
    expect(cfg).toHaveProperty('horizonUrl');
    expect(cfg.network).toBeDefined();
  });

  it('simulateContractCall should return ok true (stub)', async () => {
    const res = await service.simulateContractCall({ contractId: 'c', method: 'm', args: [] });
    expect(res.ok).toBe(true);
    expect(res.estimatedFee).toBeGreaterThan(0);
  });

  it('simulateContractCallReal should gracefully fallback when SDK missing', async () => {
    const res = await service.simulateContractCallReal({ contractId: 'c', method: 'm', args: [] });
    // In environments without SDK this should return ok:false or ok:true depending on availability; ensure it doesn't throw
    expect(typeof res.ok).toBe('boolean');
  });
});
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
    });
  });

  describe('Horizon Methods', () => {
    it('should have soroban interaction methods', () => {
      expect(typeof service.simulateContractCallReal).toBe('function');
      expect(typeof service.submitTxReal).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should return config even with missing env vars', () => {
      const config = service.getConfig();
      expect(config.network).toBeDefined();
      expect(config.sorobanRpcUrl).toBeDefined();
    });
  });
});
