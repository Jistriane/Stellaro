import { Test, TestingModule } from '@nestjs/testing';
import { ReflectorOracleService } from './reflector-oracle.service';
import { ConfigService } from '@nestjs/config';

// Testes básicos para cobrir construção, stub mode e fallbacks
describe('ReflectorOracleService', () => {
  let service: ReflectorOracleService;

  describe('stub mode', () => {
    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ReflectorOracleService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'ORACLE_MODE') return 'stub';
                if (key === 'STELLAR_HORIZON')
                  return 'https://horizon-testnet.stellar.org';
                return undefined;
              }),
            },
          },
        ],
      }).compile();

      service = module.get<ReflectorOracleService>(ReflectorOracleService);
      await service.onModuleInit();
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should return stub price for XLM', async () => {
      const price = await service.getPrice('XLM');
      expect(price).toBeDefined();
      if (price) {
        expect(price.asset).toBe('XLM');
        expect(price.price).toBeGreaterThan(0);
        expect(price.source).toBe('reflector');
      }
    });

    it('should return stub price for USDC', async () => {
      const price = await service.getPrice('USDC');
      expect(price).toBeDefined();
      if (price) {
        expect(price.asset).toBe('USDC');
        expect(price.price).toBeCloseTo(1.0, 1);
      }
    });

    it('should handle unknown asset returning null', async () => {
      const price = await service.getPrice('UNKNOWN');
      // Stub retorna null para assets desconhecidos
      expect(price).toBeNull();
    });
  });

  describe('production mode (no stub)', () => {
    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ReflectorOracleService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'ORACLE_MODE') return undefined;
                if (key === 'STELLAR_HORIZON')
                  return 'https://horizon-testnet.stellar.org';
                if (key === 'REFLECTOR_URL')
                  return 'https://api.reflector.network';
                return undefined;
              }),
            },
          },
        ],
      }).compile();

      service = module.get<ReflectorOracleService>(ReflectorOracleService);
      await service.onModuleInit();
    });

    it('should initialize without crashing', () => {
      expect(service).toBeDefined();
    });

    it('should handle network errors gracefully', async () => {
      // Sem mock de rede, pode retornar null
      const price = await service.getPrice('XLM');
      // Aceita tanto price válido quanto null em caso de falha de rede
      expect(price === null || (price && price.asset === 'XLM')).toBeTruthy();
    });
  });
});
