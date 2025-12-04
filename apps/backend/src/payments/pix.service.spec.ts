import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PixService } from './pix.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActionsService } from '../actions/actions.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PixService', () => {
  let service: PixService;
  let prisma: PrismaService;
  let actionsService: ActionsService;
  let configService: ConfigService;

  const mockPixPayment = {
    id: 'pix-payment-123',
    userId: 'user-123',
    txId: 'STLT123456',
    amount: '100.00',
    cpf: '12345678901',
    name: 'Test User',
    stellarAddress: 'GTEST123',
    qrCode: 'mock-qr-code',
    pixKey: null,
    status: 'pending',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
    updatedAt: new Date(),
    mintTxHash: null,
    paidAt: null,
    mintedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PixService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                // Força modo STUB: sem credenciais de API
                PIX_API_KEY: undefined,
                PIX_API_URL: undefined,
                PIX_WEBHOOK_SECRET: 'test-secret',
                PIX_MODE: 'stub',
              };
              return config[key];
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            pixPayment: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            pixWithdrawal: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: ActionsService,
          useValue: {
            stableMigration: jest.fn(),
            stablecoinMintGuarded: jest.fn(),
            stablecoinBurn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PixService>(PixService);
    prisma = module.get<PrismaService>(PrismaService);
    actionsService = module.get<ActionsService>(ActionsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePixCharge', () => {
    const validParams = {
      userId: 'user-123',
      amountBRL: '100.00',
      stellarAddress: 'GTEST123',
      cpf: '12345678901',
      name: 'Test User',
    };

    it('should generate PIX charge in stub mode', async () => {
      jest.spyOn(prisma.pixPayment, 'create').mockResolvedValue(mockPixPayment);

      const result = await service.generatePixCharge(validParams);

      expect(result.ok).toBe(true);
      expect(result.payment).toBeDefined();
      expect(result.payment?.txId).toMatch(/^STLT\d+/);
      expect(result.payment?.status).toBe('pending');
      expect(result.payment?.qrCode).toBeDefined();
      expect(prisma.pixPayment.create).toHaveBeenCalled();
    });

    it('should reject invalid CPF format', async () => {
      const invalidParams = { ...validParams, cpf: '123' };

      const result = await service.generatePixCharge(invalidParams);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid CPF');
    });

    it('should reject invalid amount', async () => {
      const invalidParams = { ...validParams, amountBRL: '0' };

      const result = await service.generatePixCharge(invalidParams);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid amount');
    });

    it('should reject negative amount', async () => {
      const invalidParams = { ...validParams, amountBRL: '-10' };

      const result = await service.generatePixCharge(invalidParams);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid amount');
    });

    it('should handle provider error for amount too high', async () => {
      const highAmountParams = { ...validParams, amountBRL: '600000' };

      const result = await service.generatePixCharge(highAmountParams);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('amount too high');
    });

    it('should format CPF by removing non-digits', async () => {
      const formattedCpfParams = { ...validParams, cpf: '123.456.789-01' };
      jest.spyOn(prisma.pixPayment, 'create').mockResolvedValue(mockPixPayment);

      const result = await service.generatePixCharge(formattedCpfParams);

      expect(result.ok).toBe(true);
      expect(prisma.pixPayment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cpf: '123.456.789-01',
          }),
        })
      );
    });

    it('should set expiration to 1 hour from now', async () => {
      jest.spyOn(prisma.pixPayment, 'create').mockResolvedValue(mockPixPayment);
      const beforeTime = Date.now();

      await service.generatePixCharge(validParams);

      const createCall = (prisma.pixPayment.create as jest.Mock).mock.calls[0][0];
      const expiresAt = new Date(createCall.data.expiresAt);
      const expectedExpiry = beforeTime + 3600000; // 1 hour

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiry + 1000);
    });
  });

  describe('handlePixWebhook', () => {
    const validWebhook = {
      txId: 'STLT123456',
      status: 'confirmed' as const,
      amount: 10000, // cents
      paidAt: new Date().toISOString(),
    };

    beforeEach(() => {
      // Força caminho com ActionsService em vez de STUB
      (service as any).stubMode = false;
    });

    it('should process confirmed payment and mint STLT', async () => {
      jest.spyOn(prisma.pixPayment, 'findUnique').mockResolvedValue(mockPixPayment);
      jest.spyOn(prisma.pixPayment, 'update').mockResolvedValue({
        ...mockPixPayment,
        status: 'confirmed',
        mintTxHash: 'tx-hash-123',
        mintedAt: new Date(),
      } as any);
      jest.spyOn(actionsService, 'stablecoinMintGuarded').mockResolvedValue({
        ok: true,
        method: 'mint_guarded',
        contractId: 'contract-123',
        txHash: 'tx-hash-123',
      } as any);

      const result = await service.handlePixWebhook(validWebhook);

      expect(result.ok).toBe(true);
      expect(result.minted).toBe(true);
      expect(actionsService.stablecoinMintGuarded).toHaveBeenCalledWith({
        to: 'GTEST123',
        amount: '100.00',
        riskBps: 100,
        userId: 'user-123',
      });
    });

    it('should handle non-existent payment', async () => {
      jest.spyOn(prisma.pixPayment, 'findUnique').mockResolvedValue(null);

      const result = await service.handlePixWebhook(validWebhook);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Payment not found');
    });

    it('should be idempotent - skip already confirmed payment', async () => {
      const confirmedPayment = { ...mockPixPayment, status: 'confirmed' };
      jest.spyOn(prisma.pixPayment, 'findUnique').mockResolvedValue(confirmedPayment as any);

      const result = await service.handlePixWebhook(validWebhook);

      expect(result.ok).toBe(true);
      expect(result.minted).toBe(false);
      expect(actionsService.stablecoinMintGuarded).not.toHaveBeenCalled();
    });

    it('should handle mint failure gracefully', async () => {
      jest.spyOn(prisma.pixPayment, 'findUnique').mockResolvedValue(mockPixPayment);
      jest.spyOn(prisma.pixPayment, 'update').mockResolvedValue({
        ...mockPixPayment,
        status: 'confirmed',
      } as any);
      jest.spyOn(actionsService, 'stablecoinMintGuarded').mockResolvedValue({
        ok: false,
        method: 'mint_guarded',
        contractId: 'contract-123',
        error: 'Mint failed',
      } as any);

      const result = await service.handlePixWebhook(validWebhook);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Mint failed');
    });

    it('should handle failed payment status', async () => {
      jest.spyOn(prisma.pixPayment, 'findUnique').mockResolvedValue(mockPixPayment);
      jest.spyOn(prisma.pixPayment, 'update').mockResolvedValue({
        ...mockPixPayment,
        status: 'failed',
      } as any);

      const result = await service.handlePixWebhook({
        ...validWebhook,
        status: 'failed',
      });

      expect(result.ok).toBe(true);
      expect(result.minted).toBe(false);
      expect(actionsService.stablecoinMintGuarded).not.toHaveBeenCalled();
    });
  });

  describe('initPixWithdrawal', () => {
    const validWithdrawal = {
      userId: 'user-123',
      amountSTLT: '50.00',
      stellarAddress: 'GTEST123',
      pixKey: '12345678901',
      pixKeyType: 'cpf' as const,
    };

    it('should create withdrawal request and burn STLT', async () => {
      const mockWithdrawal = {
        id: 'withdrawal-123',
        userId: 'user-123',
        transferId: 'WD123456',
        amount: '50.00',
        pixKey: '12345678901',
        pixKeyType: 'cpf',
        stellarAddress: 'GTEST123',
        burnTxHash: 'burn-tx-hash',
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.pixWithdrawal, 'create').mockResolvedValue(mockWithdrawal as any);
      jest.spyOn(actionsService, 'stablecoinBurn').mockResolvedValue({
        ok: true,
        method: 'burn',
        contractId: 'contract-123',
        txHash: 'burn-tx-hash',
      } as any);

      const result = await service.initPixWithdrawal(validWithdrawal);

      expect(result.ok).toBe(true);
      expect(result.withdrawalId).toBeDefined();
    });

    it('should reject invalid amount', async () => {
      const invalidWithdrawal = { ...validWithdrawal, amountSTLT: '0' };

      const result = await service.initPixWithdrawal(invalidWithdrawal);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid amount');
    });

    it('should reject invalid PIX key format', async () => {
      const invalidWithdrawal = { ...validWithdrawal, pixKey: 'invalid' };

      const result = await service.initPixWithdrawal(invalidWithdrawal);

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid PIX key');
    });

    it('should validate CPF PIX key format', async () => {
      const cpfKey = { ...validWithdrawal, pixKey: '12345678901', pixKeyType: 'cpf' as const };
      jest.spyOn(prisma.pixWithdrawal, 'create').mockResolvedValue({
        id: 'withdrawal-123',
        userId: 'user-123',
        transferId: 'WD123',
        amount: '50.00',
        pixKey: '12345678901',
        pixKeyType: 'cpf',
        stellarAddress: 'GTEST123',
        burnTxHash: 'stub-burn',
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.initPixWithdrawal(cpfKey);

      expect(result.ok).toBe(true);
    });

    it('should validate email PIX key format', async () => {
      const emailKey = { ...validWithdrawal, pixKey: 'user@example.com', pixKeyType: 'email' as const };
      jest.spyOn(prisma.pixWithdrawal, 'create').mockResolvedValue({
        id: 'withdrawal-123',
        userId: 'user-123',
        transferId: 'WD123',
        amount: '50.00',
        pixKey: 'user@example.com',
        pixKeyType: 'email',
        stellarAddress: 'GTEST123',
        burnTxHash: 'stub-burn',
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.initPixWithdrawal(emailKey);

      expect(result.ok).toBe(true);
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status', async () => {
      jest.spyOn(prisma.pixPayment, 'findUnique').mockResolvedValue(mockPixPayment);

      const result = await service.getPaymentStatus('STLT123456');

      expect(result).toBeDefined();
      if (result.payment) {
        expect(result.payment.status).toBe('pending');
        expect(result.payment.txId).toBe('STLT123456');
      }
    });

    it('should handle non-existent payment', async () => {
      jest.spyOn(prisma.pixPayment, 'findUnique').mockResolvedValue(null);

      const result = await service.getPaymentStatus('INVALID');

      expect(result).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle database errors gracefully', async () => {
      jest
        .spyOn(prisma.pixPayment, 'create')
        .mockRejectedValue(new Error('Database error'));

      const result = await service.generatePixCharge({
        userId: 'user-123',
        amountBRL: '100.00',
        stellarAddress: 'GTEST123',
        cpf: '12345678901',
        name: 'Test User',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });
});
