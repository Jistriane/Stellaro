import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ReserveManagerService, ReserveSnapshot, CollateralizationAlert } from './reserve-manager.service';
import * as StellarSdk from '@stellar/stellar-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { ReflectorOracleService } from '../oracles/reflector-oracle.service';
import { SorobanService } from '../chain/soroban.service';
import { NotificationService } from '../notifications/notification.service';

describe('ReserveManagerService', () => {
  let service: ReserveManagerService;
  let prisma: PrismaService;
  let oracleService: ReflectorOracleService;
  let sorobanService: SorobanService;
  let notificationService: NotificationService;
  let configService: ConfigService;

  const mockHorizonServer = {
    loadAccount: jest.fn(),
    submitTransaction: jest.fn(),
  };

  const TEST_SECRET = StellarSdk.Keypair.random().secret();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReserveManagerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                STELLAR_HORIZON: 'https://horizon-testnet.stellar.org',
                RESERVE_ACCOUNT: 'GARESERVEACCOUNTTEST',
                STABLECOIN_CONTRACT_ID: 'CSTLT123',
                STELLAR_SECRET_KEY: TEST_SECRET,
                RESERVES_PUBLISH_DISABLED: undefined,
              };
              return config[key];
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            dashboardSnapshot: {
              create: jest.fn(),
            },
            auditLog: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: ReflectorOracleService,
          useValue: {
            getPrice: jest.fn(),
          },
        },
        {
          provide: SorobanService,
          useValue: {
            getStablecoinSupply: jest.fn(),
            setMintingEnabled: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            sendWarningAlert: jest.fn(),
            sendUndercollateralizationAlert: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReserveManagerService>(ReserveManagerService);
    prisma = module.get<PrismaService>(PrismaService);
    oracleService = module.get<ReflectorOracleService>(ReflectorOracleService);
    sorobanService = module.get<SorobanService>(SorobanService);
    notificationService = module.get<NotificationService>(NotificationService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock Horizon Server
    jest.spyOn(service['server'], 'loadAccount').mockImplementation(mockHorizonServer.loadAccount);
    jest.spyOn(service['server'], 'submitTransaction').mockImplementation(mockHorizonServer.submitTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('checkCollateralization', () => {
    it('should return healthy when ratio >= 120%', async () => {
      jest.spyOn(sorobanService, 'getStablecoinSupply').mockResolvedValue(1000);
      mockHorizonServer.loadAccount.mockResolvedValue({
        balances: [
          { asset_type: 'native', balance: '1500' }, // XLM
        ],
      });
      jest.spyOn(oracleService, 'getPrice').mockResolvedValue({
        source: 'reflector',
        asset: 'XLM',
        price: 1.0,
        timestamp: new Date(),
      });

      const result = await service.checkCollateralization();

      expect(result.healthy).toBe(true);
      expect(result.ratio).toBe(150); // 1500/1000 * 100
      expect(result.snapshot.collateralizationRatio).toBe(150);
    });

    it('should handle undercollateralization (ratio < 120%)', async () => {
      jest.spyOn(sorobanService, 'getStablecoinSupply').mockResolvedValue(1000);
      mockHorizonServer.loadAccount.mockResolvedValue({
        balances: [
          { asset_type: 'native', balance: '1100' }, // 110%
        ],
      });
      jest.spyOn(oracleService, 'getPrice').mockResolvedValue({
        source: 'reflector',
        asset: 'XLM',
        price: 1.0,
        timestamp: new Date(),
      });

      const freezeMintingSpy = jest.spyOn(service as any, 'freezeMinting').mockResolvedValue(undefined);
      const notifyAdminsSpy = jest.spyOn(service as any, 'notifyAdmins').mockResolvedValue(undefined);

      const result = await service.checkCollateralization();

      expect(result.healthy).toBe(false);
      expect(result.ratio).toBeCloseTo(110, 1);
      expect(freezeMintingSpy).toHaveBeenCalled();
      expect(notifyAdminsSpy).toHaveBeenCalled();
    });

    it('should send warning when ratio < 125%', async () => {
      jest.spyOn(sorobanService, 'getStablecoinSupply').mockResolvedValue(1000);
      mockHorizonServer.loadAccount.mockResolvedValue({
        balances: [
          { asset_type: 'native', balance: '1220' }, // 122%
        ],
      });
      jest.spyOn(oracleService, 'getPrice').mockResolvedValue({
        source: 'reflector',
        asset: 'XLM',
        price: 1.0,
        timestamp: new Date(),
      });

      const sendWarningAlertSpy = jest.spyOn(service as any, 'sendWarningAlert').mockResolvedValue(undefined);

      const result = await service.checkCollateralization();

      expect(result.healthy).toBe(true);
      expect(result.ratio).toBe(122);
      expect(sendWarningAlertSpy).toHaveBeenCalled();
    });
  });

  describe('getCurrentSnapshot', () => {
    it('should generate complete snapshot with multiple assets', async () => {
      jest.spyOn(sorobanService, 'getStablecoinSupply').mockResolvedValue(10000);
      mockHorizonServer.loadAccount.mockResolvedValue({
        balances: [
          { asset_type: 'native', balance: '5000' }, // XLM
          { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GUSDC...', balance: '7000' },
          { asset_type: 'credit_alphanum4', asset_code: 'BTC', asset_issuer: 'GBT...', balance: '0.5' },
        ],
      });

      jest.spyOn(oracleService, 'getPrice')
        .mockResolvedValueOnce({ source: 'reflector', asset: 'XLM', price: 0.1, timestamp: new Date() })
        .mockResolvedValueOnce({ source: 'reflector', asset: 'USDC', price: 1.0, timestamp: new Date() })
        .mockResolvedValueOnce({ source: 'reflector', asset: 'BTC', price: 50000, timestamp: new Date() });

      const snapshot = await service.getCurrentSnapshot();

      expect(snapshot.stablecoinSupply).toBe(10000);
      expect(snapshot.assets).toHaveLength(3);
      expect(snapshot.totalReserveValue).toBe(500 + 7000 + 25000); // XLM + USDC + BTC
      expect(snapshot.collateralizationRatio).toBeCloseTo(325, 1); // 32500/10000 * 100
      expect(prisma.dashboardSnapshot.create).toHaveBeenCalled();
    });

    it('should handle zero supply gracefully', async () => {
      jest.spyOn(sorobanService, 'getStablecoinSupply').mockResolvedValue(0);
      mockHorizonServer.loadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '1000' }],
      });
      jest.spyOn(oracleService, 'getPrice').mockResolvedValue({
        source: 'reflector',
        asset: 'XLM',
        price: 1.0,
        timestamp: new Date(),
      });

      const snapshot = await service.getCurrentSnapshot();

      expect(snapshot.collateralizationRatio).toBe(0);
    });

    it('should save snapshot to database', async () => {
      jest.spyOn(sorobanService, 'getStablecoinSupply').mockResolvedValue(1000);
      mockHorizonServer.loadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '1500' }],
        accountId: () => StellarSdk.Keypair.random().publicKey(),
        sequenceNumber: () => '1000',
        incrementSequenceNumber: jest.fn(),
      });
      jest.spyOn(oracleService, 'getPrice').mockResolvedValue({
        source: 'reflector',
        asset: 'XLM',
        price: 1.0,
        timestamp: new Date(),
      });

      await service.getCurrentSnapshot();

      expect(prisma.dashboardSnapshot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          key: 'reserve_snapshot',
          value: expect.any(String),
        }),
      });
    });

    it('should handle oracle errors gracefully', async () => {
      jest.spyOn(sorobanService, 'getStablecoinSupply').mockResolvedValue(1000);
      mockHorizonServer.loadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '1500' }],
      });
      jest.spyOn(oracleService, 'getPrice').mockResolvedValue(null);

      const snapshot = await service.getCurrentSnapshot();

      expect(snapshot.assets[0].valueUSD).toBe(0); // Price unavailable
    });

    it('should filter out liquidity pool shares', async () => {
      jest.spyOn(sorobanService, 'getStablecoinSupply').mockResolvedValue(1000);
      mockHorizonServer.loadAccount.mockResolvedValue({
        balances: [
          { asset_type: 'native', balance: '1500' },
          { asset_type: 'liquidity_pool_shares', balance: '500' },
        ],
      });
      jest.spyOn(oracleService, 'getPrice').mockResolvedValue({
        source: 'reflector',
        asset: 'XLM',
        price: 1.0,
        timestamp: new Date(),
      });

      const snapshot = await service.getCurrentSnapshot();

      expect(snapshot.assets).toHaveLength(1);
      expect(snapshot.assets[0].code).toBe('XLM');
    });
  });

  describe('generateProofOfReserves', () => {
    it.skip('should generate PoR with hash and on-chain publication', async () => {
      jest.spyOn(sorobanService, 'getStablecoinSupply').mockResolvedValue(1000);
      mockHorizonServer.loadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '1500' }],
        accountId: () => StellarSdk.Keypair.random().publicKey(),
        sequenceNumber: () => '1000',
        incrementSequenceNumber: jest.fn(),
      });
      jest.spyOn(oracleService, 'getPrice').mockResolvedValue({
        source: 'reflector',
        asset: 'XLM',
        price: 1.0,
        timestamp: new Date(),
      });
      mockHorizonServer.submitTransaction.mockResolvedValue({
        hash: 'tx123456',
      });
      jest
        .spyOn(service as any, 'publishAuditHash')
        .mockResolvedValue('tx123456');

      const result = await service.generateProofOfReserves();

      expect(result.hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
      expect(result.txHash).toBe('tx123456');
      expect(result.snapshot.auditHash).toBe(result.hash);
    });

    it('should skip on-chain publish when RESERVES_PUBLISH_DISABLED', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'RESERVES_PUBLISH_DISABLED') return 'true';
        return undefined;
      });

      jest.spyOn(sorobanService, 'getStablecoinSupply').mockResolvedValue(1000);
      mockHorizonServer.loadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '1500' }],
      });
      jest.spyOn(oracleService, 'getPrice').mockResolvedValue({
        source: 'reflector',
        asset: 'XLM',
        price: 1.0,
        timestamp: new Date(),
      });

      const result = await service.generateProofOfReserves();

      expect(result.hash).toBeTruthy();
      expect(result.txHash).toBe('');
      expect(mockHorizonServer.submitTransaction).not.toHaveBeenCalled();
    });

    it('should skip when STELLAR_SECRET_KEY is missing', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'STELLAR_SECRET_KEY') return undefined;
        return 'test';
      });

      jest.spyOn(sorobanService, 'getStablecoinSupply').mockResolvedValue(1000);
      mockHorizonServer.loadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '1500' }],
      });
      jest.spyOn(oracleService, 'getPrice').mockResolvedValue({
        source: 'reflector',
        asset: 'XLM',
        price: 1.0,
        timestamp: new Date(),
      });

      const result = await service.generateProofOfReserves();

      expect(result.txHash).toBe('');
      expect(mockHorizonServer.submitTransaction).not.toHaveBeenCalled();
    });

    it('should include collateralization ratio in memo', async () => {
      jest.spyOn(sorobanService, 'getStablecoinSupply').mockResolvedValue(1000);
      mockHorizonServer.loadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '1500' }],
        accountId: () => StellarSdk.Keypair.random().publicKey(),
        sequenceNumber: () => '1000',
        incrementSequenceNumber: jest.fn(),
      });
      jest.spyOn(oracleService, 'getPrice').mockResolvedValue({
        source: 'reflector',
        asset: 'XLM',
        price: 1.0,
        timestamp: new Date(),
      });
      mockHorizonServer.submitTransaction.mockResolvedValue({
        hash: 'tx123456',
      });

      await service.generateProofOfReserves();

      expect(mockHorizonServer.submitTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          memo: expect.objectContaining({
            _value: expect.stringContaining('PoR:150%'),
          }),
        })
      );
    });
  });

  describe('freezeMinting', () => {
    it('should freeze minting via Soroban contract', async () => {
      await service['freezeMinting']();

      expect(sorobanService.setMintingEnabled).toHaveBeenCalledWith(
        'CSTLT123',
        false,
        expect.any(String)
      );
    });

    it('should handle missing configuration gracefully', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      await expect(service['freezeMinting']()).resolves.not.toThrow();
      expect(sorobanService.setMintingEnabled).not.toHaveBeenCalled();
    });

    it('should log errors without throwing', async () => {
      jest.spyOn(sorobanService, 'setMintingEnabled').mockRejectedValue(new Error('Network error'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await service['freezeMinting']();

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to freeze minting'));
    });
  });

  describe('notifyAdmins', () => {
    it('should send warning alert for WARNING severity', async () => {
      const alert: CollateralizationAlert = {
        severity: 'WARNING',
        ratio: 122,
        threshold: 125,
        action: 'MONITOR',
        timestamp: new Date(),
      };

      await service['notifyAdmins'](alert);

      expect(notificationService.sendWarningAlert).toHaveBeenCalledWith(
        122,
        125,
        { action: 'MONITOR' }
      );
    });

    it('should send emergency alert for EMERGENCY severity', async () => {
      const alert: CollateralizationAlert = {
        severity: 'EMERGENCY',
        ratio: 110,
        threshold: 120,
        action: 'FREEZE_MINTING',
        timestamp: new Date(),
      };

      await service['notifyAdmins'](alert);

      expect(notificationService.sendUndercollateralizationAlert).toHaveBeenCalledWith(
        110,
        120,
        { action: 'FREEZE_MINTING' }
      );
    });

    it('should send emergency alert for CRITICAL severity', async () => {
      const alert: CollateralizationAlert = {
        severity: 'CRITICAL',
        ratio: 115,
        threshold: 120,
        action: 'FREEZE_MINTING',
        timestamp: new Date(),
      };

      await service['notifyAdmins'](alert);

      expect(notificationService.sendUndercollateralizationAlert).toHaveBeenCalledWith(
        115,
        120,
        { action: 'FREEZE_MINTING' }
      );
    });
  });

  describe('handleUndercollateralization', () => {
    it('should freeze minting and notify admins', async () => {
      const snapshot: ReserveSnapshot = {
        timestamp: new Date(),
        stablecoinSupply: 1000,
        totalReserveValue: 1100,
        collateralizationRatio: 110,
        assets: [],
      };

      const freezeMintingSpy = jest.spyOn(service as any, 'freezeMinting').mockResolvedValue(undefined);
      const notifyAdminsSpy = jest.spyOn(service as any, 'notifyAdmins').mockResolvedValue(undefined);

      await service['handleUndercollateralization'](snapshot);

      expect(freezeMintingSpy).toHaveBeenCalled();
      expect(notifyAdminsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'EMERGENCY',
          ratio: 110,
          action: 'FREEZE_MINTING',
        })
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'UNDERCOLLATERALIZATION_DETECTED',
          level: 'SECURITY',
        }),
      });
    });
  });

  describe('hashSnapshot', () => {
    it('should generate consistent hash for same snapshot', () => {
      const snapshot: ReserveSnapshot = {
        timestamp: new Date('2024-01-01T00:00:00Z'),
        stablecoinSupply: 1000,
        totalReserveValue: 1500,
        collateralizationRatio: 150,
        assets: [
          {
            code: 'XLM',
            amount: 1500,
            valueUSD: 1500,
            lastUpdated: new Date('2024-01-01T00:00:00Z'),
          },
        ],
      };

      const hash1 = service['hashSnapshot'](snapshot);
      const hash2 = service['hashSnapshot'](snapshot);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate different hash for different snapshots', () => {
      const snapshot1: ReserveSnapshot = {
        timestamp: new Date('2024-01-01T00:00:00Z'),
        stablecoinSupply: 1000,
        totalReserveValue: 1500,
        collateralizationRatio: 150,
        assets: [],
      };

      const snapshot2: ReserveSnapshot = {
        ...snapshot1,
        totalReserveValue: 1600,
      };

      const hash1 = service['hashSnapshot'](snapshot1);
      const hash2 = service['hashSnapshot'](snapshot2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('getStablecoinSupply (private)', () => {
    it('should fetch supply from Soroban contract', async () => {
      jest.spyOn(sorobanService, 'getStablecoinSupply').mockResolvedValue(5000);

      const supply = await service['getStablecoinSupply']();

      expect(supply).toBe(5000);
      expect(sorobanService.getStablecoinSupply).toHaveBeenCalledWith('CSTLT123');
    });

    it('should return 0 when contract ID is missing', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const supply = await service['getStablecoinSupply']();

      expect(supply).toBe(0);
    });

    it('should return 0 on error', async () => {
      jest.spyOn(sorobanService, 'getStablecoinSupply').mockRejectedValue(new Error('RPC error'));

      const supply = await service['getStablecoinSupply']();

      expect(supply).toBe(0);
    });
  });

  describe('getReserveBalances (private)', () => {
    it('should fetch and parse Horizon balances', async () => {
      mockHorizonServer.loadAccount.mockResolvedValue({
        balances: [
          { asset_type: 'native', balance: '1000' },
          { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GUSDC', balance: '500' },
        ],
      });

      const balances = await service['getReserveBalances']();

      expect(balances).toHaveLength(2);
      expect(balances[0]).toEqual({ code: 'XLM', issuer: undefined, amount: 1000 });
      expect(balances[1]).toEqual({ code: 'USDC', issuer: 'GUSDC', amount: 500 });
    });

    it('should return empty array on error', async () => {
      mockHorizonServer.loadAccount.mockRejectedValue(new Error('Account not found'));

      const balances = await service['getReserveBalances']();

      expect(balances).toEqual([]);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete undercollateralization workflow', async () => {
      jest.spyOn(sorobanService, 'getStablecoinSupply').mockResolvedValue(1000);
      mockHorizonServer.loadAccount.mockResolvedValue({
        balances: [{ asset_type: 'native', balance: '1100' }],
      });
      jest.spyOn(oracleService, 'getPrice').mockResolvedValue({
        source: 'reflector',
        asset: 'XLM',
        price: 1.0,
        timestamp: new Date(),
      });

      await service.checkCollateralization();

      expect(sorobanService.setMintingEnabled).toHaveBeenCalledWith('CSTLT123', false, expect.any(String));
      expect(notificationService.sendUndercollateralizationAlert).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UNDERCOLLATERALIZATION_DETECTED',
          }),
        })
      );
    });
  });
});
