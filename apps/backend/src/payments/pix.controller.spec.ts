import { Test } from '@nestjs/testing';
import { PixController } from './pix.controller';
import { PixService } from './pix.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';

describe('PixController', () => {
  let controller;
  let pixService;

  beforeEach(async () => {
    const mockPixService = {
      generatePixCharge: jest.fn(),
      handlePixWebhook: jest.fn(),
      initPixWithdrawal: jest.fn(),
      getPaymentStatus: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [PixController],
      providers: [{ provide: PixService, useValue: mockPixService }],
    }).compile();

    controller = module.get(PixController);
    pixService = module.get(PixService);
  });

  describe('generateCharge', () => {
    it('should generate PIX charge successfully', async () => {
      const req = { user: { id: 'user123' } };
      const dto = {
        amountBRL: '100.00',
        stellarAddress: 'GABC',
        cpf: '12345678901',
        name: 'Test User',
      };

      pixService.generatePixCharge.mockResolvedValueOnce({
        ok: true,
        txId: 'pix-tx-123',
        qrCode: 'data:image/png;base64,abc',
      });

      const result = await controller.generateCharge(req, dto);

      expect(result.ok).toBe(true);
      expect(result.txId).toBe('pix-tx-123');
      expect(pixService.generatePixCharge).toHaveBeenCalledWith({
        userId: 'user123',
        ...dto,
      });
    });

    it('should throw BadRequestException for invalid CPF', async () => {
      const req = { user: { id: 'user123' } };
      const dto = {
        amountBRL: '100.00',
        stellarAddress: 'GABC',
        cpf: 'invalid',
        name: 'Test User',
      };

      pixService.generatePixCharge.mockResolvedValueOnce({
        ok: false,
        error: 'Invalid CPF format',
      });

      await expect(controller.generateCharge(req, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid amount', async () => {
      const req = { user: { id: 'user123' } };
      const dto = {
        amountBRL: '-10',
        stellarAddress: 'GABC',
        cpf: '12345678901',
        name: 'Test User',
      };

      pixService.generatePixCharge.mockResolvedValueOnce({
        ok: false,
        error: 'Invalid amount',
      });

      await expect(controller.generateCharge(req, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return result with ok:false for provider errors', async () => {
      const req = { user: { id: 'user123' } };
      const dto = {
        amountBRL: '100.00',
        stellarAddress: 'GABC',
        cpf: '12345678901',
        name: 'Test User',
      };

      pixService.generatePixCharge.mockResolvedValueOnce({
        ok: false,
        error: 'Provider unavailable',
      });

      const result = await controller.generateCharge(req, dto);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Provider unavailable');
    });

    it('should handle anonymous user', async () => {
      const req = { user: null };
      const dto = {
        amountBRL: '100.00',
        stellarAddress: 'GABC',
        cpf: '12345678901',
        name: 'Test User',
      };

      pixService.generatePixCharge.mockResolvedValueOnce({
        ok: true,
        txId: 'pix-tx-456',
      });

      const result = await controller.generateCharge(req, dto);

      expect(pixService.generatePixCharge).toHaveBeenCalledWith({
        userId: 'anonymous',
        ...dto,
      });
    });
  });

  describe('handleWebhook', () => {
    const webhookSecret = 'test-secret';

    beforeEach(() => {
      process.env.PIX_WEBHOOK_SECRET = webhookSecret;
    });

    it('should process webhook with valid signature', async () => {
      const dto = {
        txId: 'pix-tx-123',
        status: 'confirmed' as const,
        amount: 100,
        paidAt: '2025-12-07T12:00:00Z',
      };

      const payload = JSON.stringify(dto);
      const signature = createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      pixService.handlePixWebhook.mockResolvedValueOnce({
        ok: true,
        processed: true,
      });

      const result = await controller.handleWebhook(signature, dto);

      expect(result.ok).toBe(true);
      expect(pixService.handlePixWebhook).toHaveBeenCalledWith(dto);
    });

    it('should throw UnauthorizedException for invalid signature', async () => {
      const dto = {
        txId: 'pix-tx-123',
        status: 'confirmed' as const,
        amount: 100,
      };

      const invalidSignature = 'invalid-signature';

      await expect(
        controller.handleWebhook(invalidSignature, dto),
      ).rejects.toThrow(UnauthorizedException);

      expect(pixService.handlePixWebhook).not.toHaveBeenCalled();
    });

    it('should process failed payment webhook', async () => {
      const dto = {
        txId: 'pix-tx-789',
        status: 'failed' as const,
        amount: 50,
      };

      const payload = JSON.stringify(dto);
      const signature = createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      pixService.handlePixWebhook.mockResolvedValueOnce({
        ok: true,
        processed: true,
      });

      const result = await controller.handleWebhook(signature, dto);

      expect(result.ok).toBe(true);
      expect(pixService.handlePixWebhook).toHaveBeenCalledWith(dto);
    });
  });

  describe('initWithdrawal', () => {
    it('should initiate withdrawal successfully', async () => {
      const req = { user: { id: 'user123' } };
      const dto = {
        amountSTLT: '100.00',
        pixKey: '12345678901',
        pixKeyType: 'cpf' as const,
        stellarAddress: 'GABC',
      };

      pixService.initPixWithdrawal.mockResolvedValueOnce({
        ok: true,
        withdrawalId: 'withdrawal-123',
      });

      const result = await controller.initWithdrawal(req, dto);

      expect(result.ok).toBe(true);
      expect(result.withdrawalId).toBe('withdrawal-123');
      expect(pixService.initPixWithdrawal).toHaveBeenCalledWith({
        userId: 'user123',
        ...dto,
      });
    });

    it('should throw BadRequestException for invalid amount', async () => {
      const req = { user: { id: 'user123' } };
      const dto = {
        amountSTLT: '-50',
        pixKey: '12345678901',
        pixKeyType: 'cpf' as const,
        stellarAddress: 'GABC',
      };

      pixService.initPixWithdrawal.mockResolvedValueOnce({
        ok: false,
        error: 'Invalid amount',
      });

      await expect(controller.initWithdrawal(req, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid PIX key', async () => {
      const req = { user: { id: 'user123' } };
      const dto = {
        amountSTLT: '100.00',
        pixKey: 'invalid-email',
        pixKeyType: 'email' as const,
        stellarAddress: 'GABC',
      };

      pixService.initPixWithdrawal.mockResolvedValueOnce({
        ok: false,
        error: 'Invalid PIX key format',
      });

      await expect(controller.initWithdrawal(req, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return result with ok:false for burn failure', async () => {
      const req = { user: { id: 'user123' } };
      const dto = {
        amountSTLT: '100.00',
        pixKey: 'test@example.com',
        pixKeyType: 'email' as const,
        stellarAddress: 'GABC',
      };

      pixService.initPixWithdrawal.mockResolvedValueOnce({
        ok: false,
        error: 'Burn failed',
      });

      const result = await controller.initWithdrawal(req, dto);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Burn failed');
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status', async () => {
      const txId = 'pix-tx-123';

      pixService.getPaymentStatus.mockResolvedValueOnce({
        ok: true,
        status: 'confirmed',
        amount: 100,
      });

      const result = await controller.getPaymentStatus(txId);

      expect(result.ok).toBe(true);
      expect(result.status).toBe('confirmed');
      expect(pixService.getPaymentStatus).toHaveBeenCalledWith(txId);
    });

    it('should handle non-existent payment', async () => {
      const txId = 'non-existent';

      pixService.getPaymentStatus.mockResolvedValueOnce({
        ok: false,
        error: 'Payment not found',
      });

      const result = await controller.getPaymentStatus(txId);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Payment not found');
    });
  });
});
