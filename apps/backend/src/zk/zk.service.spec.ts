import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ZkService } from './zk.service';

describe('ZkService', () => {
  let service: ZkService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZkService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                SOROBAN_RPC_URL: 'https://soroban-testnet.stellar.org',
                STELLAR_NETWORK: 'testnet',
                ZK_VERIFIER_CONTRACT_ID: 'CDJX3YLVANLTRRMMWDJO6NG7ADKJIHPL3WJAZNMNL6BQU6S6D5QXBT3L',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ZkService>(ZkService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verify', () => {
    it('should reject expired proofs', async () => {
      const expiredProof = {
        proof: '01'.repeat(256), // 256 bytes em hex
        publicInputs: '02'.repeat(128), // 128 bytes em hex
        score: 750,
        nonce: '03'.repeat(16), // 16 bytes em hex
        expiresAt: Date.now() - 1000, // expirado
      };

      const result = await service.verify(expiredProof);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('expired');
    });

    it('should reject invalid score', async () => {
      const invalidProof = {
        proof: '01'.repeat(256),
        publicInputs: '02'.repeat(128),
        score: -1,
        nonce: '03'.repeat(16),
        expiresAt: Date.now() + 3600000,
      };

      const result = await service.verify(invalidProof);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('invalid-score');
    });

    it('should reject missing nonce', async () => {
      const invalidProof = {
        proof: '01'.repeat(256),
        publicInputs: '02'.repeat(128),
        score: 750,
        nonce: '',
        expiresAt: Date.now() + 3600000,
      };

      const result = await service.verify(invalidProof);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('missing-nonce');
    });

    it('should reject missing proof', async () => {
      const invalidProof = {
        proof: '',
        publicInputs: '02'.repeat(128),
        score: 750,
        nonce: '03'.repeat(16),
        expiresAt: Date.now() + 3600000,
      };

      const result = await service.verify(invalidProof);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('missing-proof');
    });

    it('should reject invalid proof length', async () => {
      const invalidProof = {
        proof: '01'.repeat(100), // muito curto (200 hex chars = 100 bytes, precisa 512 chars = 256 bytes)
        publicInputs: '02'.repeat(128),
        score: 750,
        nonce: '03'.repeat(16),
        expiresAt: Date.now() + 3600000,
      };

      const result = await service.verify(invalidProof);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('proof-invalid-length');
    });
  });

  describe('getScore', () => {
    it('should return error when contract not configured', async () => {
      // Mock sem contract ID mas com RPC URL
      const mockConfig = {
        get: jest.fn((key: string, defaultValue?: any) => {
          if (key === 'SOROBAN_RPC_URL') return 'https://soroban-testnet.stellar.org';
          if (key === 'STELLAR_NETWORK') return 'testnet';
          if (key === 'ZK_VERIFIER_CONTRACT_ID') return undefined;
          return defaultValue;
        }),
      };
      const newService = new ZkService(mockConfig as any);

      const result = await newService.getScore('GDHIZHAWV7TC6RKI2KXQ23XVRQ23UPJWSODCQHIRZQO22ANVGH7BM4ZD');
      expect(result.error).toBe('missing-contract-id');
    });

    it('should handle valid address format', async () => {
      const result = await service.getScore('GDHIZHAWV7TC6RKI2KXQ23XVRQ23UPJWSODCQHIRZQO22ANVGH7BM4ZD');
      
      // Pode retornar score undefined (sem score ainda) ou erro de simulação
      expect(result).toBeDefined();
      expect(result.score !== undefined || result.error !== undefined).toBe(true);
    });
  });
});
