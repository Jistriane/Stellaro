import { Test, TestingModule } from '@nestjs/testing';
import { SorobanService } from './soroban.service';
import * as StellarSdk from '@stellar/stellar-sdk';

describe('SorobanService', () => {
  let service: SorobanService;

  beforeEach(async () => {
    process.env.SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
    process.env.LOANSPOOL_INTEREST_BPS = process.env.LOANSPOOL_INTEREST_BPS || '500';
    process.env.LOANSPOOL_LTV_BPS = process.env.LOANSPOOL_LTV_BPS || '7000';
    process.env.LOANSPOOL_MAX_LOAN = process.env.LOANSPOOL_MAX_LOAN || '1000000';

    const module: TestingModule = await Test.createTestingModule({
      providers: [SorobanService],
    }).compile();

    service = module.get<SorobanService>(SorobanService);
    // Prevent real HTTP calls to avoid open handle from axios/follow-redirects
    (service as any).client = {
      post: jest.fn().mockResolvedValue({ data: { result: [] } }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    it('should return events array from mocked client', async () => {
      const result = await service.getEvents('CTEST_NOOP', 1, 2);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle pagination params without crashing', async () => {
      const result = await service.getEvents('CTEST_NOOP', 1, 2, 'token');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('invokeContract', () => {
    it('should invoke read-only contract method or fail gracefully', async () => {
      if (!process.env.SOROBAN_RPC_URL) {
        const degraded = new SorobanService();
        const res = await degraded.invokeContract('C_NOPE', 'get_value', []);
        expect(res).toBeNull();
      } else {
        await expect(service.invokeContract('C_NOPE', 'get_value', [])).rejects.toBeDefined();
      }
    });

    it('should skip invocation in degraded mode', async () => {
      const prev = process.env.SOROBAN_RPC_URL;
      delete (process.env as any).SOROBAN_RPC_URL;
      const degradedService = new SorobanService();

      const result = await degradedService.invokeContract('CTEST123', 'get_value', []);
      expect(result).toBeNull();
      process.env.SOROBAN_RPC_URL = prev;
    });

    it('should pass arguments correctly', async () => {
      const args = [
        StellarSdk.nativeToScVal('test', { type: 'string' }),
        StellarSdk.nativeToScVal(100, { type: 'u64' }),
      ];
      await expect(service.invokeContract('C_NOPE', 'set_value', args)).rejects.toBeDefined();
    });
  });

  describe('getLoansPoolParams', () => {
    it('should fallback to env variables when RPC is unavailable or invalid', async () => {
      const params = await service.getLoansPoolParams('C_NOPE');
      expect(params.interest_bps).toBe(Number(process.env.LOANSPOOL_INTEREST_BPS));
      expect(params.ltv_bps).toBe(Number(process.env.LOANSPOOL_LTV_BPS));
      expect(params.max_loan_amount).toBe(process.env.LOANSPOOL_MAX_LOAN);
    });
  });

  describe('getStablecoinSupply', () => {
    it('should return a number and handle missing/invalid contractId', async () => {
      const s1 = await service.getStablecoinSupply('');
      expect(s1).toBe(0);
      const s2 = await service.getStablecoinSupply('C_INVALID');
      expect(typeof s2).toBe('number');
    });
  });

  describe('getVcIssuanceStatus', () => {
    it('should report unavailable when VC registry is missing', () => {
      const prevVcRegistryId = process.env.VC_REGISTRY_ID;
      const prevMasterSecret = process.env.MASTER_SECRET_KEY;
      delete process.env.VC_REGISTRY_ID;
      process.env.MASTER_SECRET_KEY = prevMasterSecret || '';

      const status = service.getVcIssuanceStatus();

      expect(status.available).toBe(false);
      expect(status.reason).toContain('VC_REGISTRY_ID is not configured');

      if (prevVcRegistryId) process.env.VC_REGISTRY_ID = prevVcRegistryId;
      if (prevMasterSecret) process.env.MASTER_SECRET_KEY = prevMasterSecret;
      else delete process.env.MASTER_SECRET_KEY;
    });

    it('should report unavailable when master secret is missing or invalid', () => {
      const prevVcRegistryId = process.env.VC_REGISTRY_ID;
      const prevMasterSecret = process.env.MASTER_SECRET_KEY;
      process.env.VC_REGISTRY_ID = 'CD3IEVYYTYUYPLM7WT335SM4AO7FX4VMWR5DWXEL3D7CFTDT5NPNRV3Z';
      process.env.MASTER_SECRET_KEY = 'invalid-secret';
      const validitySpy = jest.spyOn(StellarSdk.StrKey, 'isValidEd25519SecretSeed').mockReturnValue(false);

      const status = service.getVcIssuanceStatus();

      expect(status.available).toBe(false);
      expect(status.reason).toContain('MASTER_SECRET_KEY is missing or invalid');
      expect(status.checks.vcRegistryConfigured).toBe(true);
      expect(status.checks.masterSecretConfigured).toBe(true);
      expect(status.checks.masterSecretValid).toBe(false);
      validitySpy.mockRestore();

      if (prevVcRegistryId) process.env.VC_REGISTRY_ID = prevVcRegistryId;
      else delete process.env.VC_REGISTRY_ID;
      if (prevMasterSecret) process.env.MASTER_SECRET_KEY = prevMasterSecret;
      else delete process.env.MASTER_SECRET_KEY;
    });

    it('should report available when registry and master secret are configured', () => {
      const prevVcRegistryId = process.env.VC_REGISTRY_ID;
      const prevMasterSecret = process.env.MASTER_SECRET_KEY;
      process.env.VC_REGISTRY_ID = 'CD3IEVYYTYUYPLM7WT335SM4AO7FX4VMWR5DWXEL3D7CFTDT5NPNRV3Z';
      process.env.MASTER_SECRET_KEY = 'SCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
      const validitySpy = jest.spyOn(StellarSdk.StrKey, 'isValidEd25519SecretSeed').mockReturnValue(true);

      const status = service.getVcIssuanceStatus();

      expect(status.available).toBe(true);
      expect(status.reason).toBeNull();
      expect(status.checks.vcRegistryConfigured).toBe(true);
      expect(status.checks.masterSecretConfigured).toBe(true);
      expect(status.checks.masterSecretValid).toBe(true);
      validitySpy.mockRestore();

      if (prevVcRegistryId) process.env.VC_REGISTRY_ID = prevVcRegistryId;
      else delete process.env.VC_REGISTRY_ID;
      if (prevMasterSecret) process.env.MASTER_SECRET_KEY = prevMasterSecret;
      else delete process.env.MASTER_SECRET_KEY;
    });
  });

  describe('setMintingEnabled', () => {
    it('should enable minting when properly configured', async () => {
      const secret = process.env.SOROBAN_ADMIN_SECRET;
      const contract = process.env.STABLECOIN_CONTRACT_ID;
      if (!secret || !contract) return; // skip sem configuração e2e
      await expect(service.setMintingEnabled(contract, true, secret)).resolves.toBeDefined();
    });

    it('should fail in degraded mode', async () => {
      const prev = process.env.SOROBAN_RPC_URL;
      delete (process.env as any).SOROBAN_RPC_URL;
      const degradedService = new SorobanService();
      await expect(
        degradedService.setMintingEnabled('C_INVALID', true, 'SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
      ).rejects.toBeDefined();
      process.env.SOROBAN_RPC_URL = prev;
    });
  });

  describe('integration scenarios', () => {
    it('freeze workflow when configured', async () => {
      const secret = process.env.SOROBAN_ADMIN_SECRET;
      const contract = process.env.STABLECOIN_CONTRACT_ID;
      if (!secret || !contract) return;
      const supply = await service.getStablecoinSupply(contract);
      expect(typeof supply).toBe('number');
      await expect(service.setMintingEnabled(contract, false, secret)).resolves.toBeDefined();
    });
  });
});
