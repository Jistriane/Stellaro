import axios from 'axios';
import { SorobanService } from './soroban.service';

jest.mock('axios');

describe('SorobanService (expanded)', () => {
  let origEnv: any;
  beforeEach(() => {
    origEnv = { ...process.env };
    jest.clearAllMocks();
  });
  afterEach(() => {
    process.env = origEnv;
  });

  it('getEvents posts to RPC and returns result', async () => {
    process.env.SOROBAN_RPC_URL = 'http://rpc.test';
    const service = new SorobanService();
    const mockResult = { events: [] };
    (service as any).client = { post: jest.fn().mockResolvedValue({ data: { result: mockResult } }) };

    const res = await service.getEvents('C1', 10, 20, 'tok');
    expect((service as any).client.post).toHaveBeenCalled();
    expect(res).toEqual(mockResult);
  });

  it('invokeContract returns null when RPC unavailable', async () => {
    delete process.env.SOROBAN_RPC_URL;
    const service = new SorobanService();
    const res = await service.invokeContract('C1', 'm');
    expect(res).toBeNull();
  });

  it('getLoansPoolParams falls back to env values on failure', async () => {
    delete process.env.SOROBAN_RPC_URL;
    process.env.LOANSPOOL_INTEREST_BPS = '150';
    process.env.LOANSPOOL_LTV_BPS = '6000';
    process.env.LOANSPOOL_MAX_LOAN = '500000';
    const service = new SorobanService();

    const params = await service.getLoansPoolParams('any');
    expect(params.interest_bps).toBe(150);
    expect(params.ltv_bps).toBe(6000);
    expect(params.max_loan_amount).toBe('500000');
  });

  it('findBestPath returns first embedded record on success', async () => {
    const service = new SorobanService();
    (axios.get as jest.Mock).mockResolvedValue({ data: { _embedded: { records: [{ path: [{ asset_code: 'USDC' }] }] } } });
    const res = await service.findBestPath('XLM', 'USDC', '1.0');
    expect(res).toBeDefined();
    expect(res.path[0].asset_code).toBe('USDC');
  });

  it('getStablecoinSupply decodes scvI128 result to numeric supply', async () => {
    const service = new SorobanService();
    // mock invokeContract to return scvI128-like object
    const fakeScVal = {
      switch: () => ({ name: 'scvI128' }),
      i128: () => ({ toString: () => '70000000' }),
    };
    jest.spyOn(service as any, 'invokeContract').mockResolvedValue(fakeScVal);
    const supply = await service.getStablecoinSupply('stable1');
    expect(supply).toBe(7); // 70000000 / 1e7
  });

  it('setMintingEnabled throws when RPC unavailable and forwards to executeContractCall when available', async () => {
    // unavailable
    delete process.env.SOROBAN_RPC_URL;
    const svc1 = new SorobanService();
    await expect(svc1.setMintingEnabled('c', true, 's')).rejects.toThrow('Soroban RPC unavailable');

    // available
    process.env.SOROBAN_RPC_URL = 'http://rpc';
    const svc2 = new SorobanService();
    jest.spyOn(svc2 as any, 'executeContractCall').mockResolvedValue('txhash123');
    const r = await svc2.setMintingEnabled('c', true, 's');
    expect(r).toBe('txhash123');
    expect((svc2 as any).executeContractCall).toHaveBeenCalledWith('c', 'enable_mint', [], 's');
  });

  it('executeBatchAction requires rpcAvailable and returns batch-executed', async () => {
    process.env.SOROBAN_RPC_URL = 'http://rpc';
    const svc = new SorobanService();
    const res = await svc.executeBatchAction({});
    expect(res).toBe('batch-executed');
  });
});
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
