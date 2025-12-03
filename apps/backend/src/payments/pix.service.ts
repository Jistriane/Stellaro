import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ActionsService } from '../actions/actions.service';
import axios, { AxiosInstance } from 'axios';
import { randomBytes } from 'crypto';

export interface PixPayment {
  id: string;
  txId: string;
  amount: string;
  cpf: string;
  name: string;
  key?: string;
  qrCode?: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * PIX Integration Service
 * Handles Brazilian instant payments for STLT mint/burn
 * 
 * Flow:
 * 1. User deposits BRL via PIX → generates QR code
 * 2. Webhook confirms payment → mints STLT tokens
 * 3. User burns STLT → withdraws BRL to PIX key
 */
@Injectable()
export class PixService {
  private readonly logger = new Logger(PixService.name);
  private readonly client: AxiosInstance | null = null;
  private readonly enabled: boolean;
  private readonly webhookSecret: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private actions: ActionsService,
  ) {
    const apiKey = this.configService.get('PIX_API_KEY');
    const apiUrl = this.configService.get('PIX_API_URL');
    this.webhookSecret = this.configService.get('PIX_WEBHOOK_SECRET') || '';
    this.enabled = !!apiKey && !!apiUrl;

    if (this.enabled) {
      this.client = axios.create({
        baseURL: apiUrl,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
      this.logger.log('PIX integration enabled');
    } else {
      this.logger.warn('PIX integration disabled (missing API credentials)');
    }
  }

  /**
   * Gera cobrança PIX para mint de STLT
   */
  async generatePixCharge(params: {
    userId: string;
    amountBRL: string;
    stellarAddress: string;
    cpf: string;
    name: string;
  }): Promise<{
    ok: boolean;
    payment?: PixPayment;
    error?: string;
  }> {
    try {
      if (!this.enabled || !this.client) {
        throw new Error('PIX integration not configured');
      }

      const txId = `STLT${Date.now()}${randomBytes(4).toString('hex').toUpperCase()}`;
      const amountCents = Math.round(parseFloat(params.amountBRL) * 100);

      // Chamar API do provider PIX (PJBank, Asaas, etc.)
      const response = await this.client.post('/pix/charges', {
        txId,
        amount: amountCents,
        description: `Mint STLT - ${params.stellarAddress.substring(0, 8)}...`,
        payer: {
          cpf: params.cpf,
          name: params.name,
        },
        expiresIn: 3600, // 1 hora
      });

      const { qrCode, pixKey, expiresAt } = response.data;

      // Salvar pagamento pendente
      const payment = await this.prisma.pixPayment.create({
        data: {
          userId: params.userId,
          txId,
          amount: params.amountBRL,
          cpf: params.cpf,
          name: params.name,
          stellarAddress: params.stellarAddress,
          qrCode,
          pixKey,
          status: 'pending',
          expiresAt: new Date(expiresAt),
        },
      });

      this.logger.log(`PIX charge generated: ${txId} for ${params.amountBRL} BRL`);

      return {
        ok: true,
        payment: {
          id: payment.id,
          txId: payment.txId,
          amount: payment.amount,
          cpf: payment.cpf,
          name: payment.name,
          key: pixKey,
          qrCode,
          status: 'pending',
          createdAt: payment.createdAt,
          expiresAt: payment.expiresAt,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to generate PIX charge: ${error.message}`);
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  /**
   * Processa webhook de confirmação PIX
   * Ativa o mint de STLT quando pagamento é confirmado
   */
  async handlePixWebhook(payload: {
    txId: string;
    status: 'confirmed' | 'failed';
    amount: number;
    paidAt?: string;
  }): Promise<{
    ok: boolean;
    minted?: boolean;
    error?: string;
  }> {
    try {
      const { txId, status, amount } = payload;

      // Buscar pagamento pendente
      const payment = await this.prisma.pixPayment.findUnique({
        where: { txId },
      });

      if (!payment) {
        throw new Error(`Payment not found: ${txId}`);
      }

      if (payment.status !== 'pending') {
        this.logger.warn(`Payment ${txId} already processed (status: ${payment.status})`);
        return { ok: true, minted: false };
      }

      // Atualizar status
      await this.prisma.pixPayment.update({
        where: { id: payment.id },
        data: {
          status,
          paidAt: payload.paidAt ? new Date(payload.paidAt) : new Date(),
        },
      });

      if (status === 'confirmed') {
        // Mint STLT tokens (1 BRL = 1 STLT)
        const stltAmount = payment.amount;

        const mintResult = await this.actions.stablecoinMintGuarded({
          to: payment.stellarAddress,
          amount: stltAmount,
          riskBps: 100, // 1% risk buffer padrão
          userId: payment.userId,
        });

        if (mintResult.ok) {
          await this.prisma.pixPayment.update({
            where: { id: payment.id },
            data: {
              mintTxHash: mintResult.txHash,
              mintedAt: new Date(),
            },
          });

          this.logger.log(`✅ Minted ${stltAmount} STLT for PIX payment ${txId}`);

          return {
            ok: true,
            minted: true,
          };
        } else {
          throw new Error(`Mint failed: ${mintResult.error}`);
        }
      }

      return { ok: true, minted: false };
    } catch (error) {
      this.logger.error(`PIX webhook processing failed: ${error.message}`);
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  /**
   * Inicia saque PIX (burn de STLT → BRL)
   */
  async initPixWithdrawal(params: {
    userId: string;
    amountSTLT: string;
    pixKey: string;
    pixKeyType: 'cpf' | 'email' | 'phone' | 'random';
    stellarAddress: string;
  }): Promise<{
    ok: boolean;
    withdrawalId?: string;
    error?: string;
  }> {
    try {
      if (!this.enabled || !this.client) {
        throw new Error('PIX integration not configured');
      }

      // 1. Burn STLT tokens
      const burnResult = await this.actions.stablecoinBurn({
        from: params.stellarAddress,
        amount: params.amountSTLT,
        userId: params.userId,
      });

      if (!burnResult.ok) {
        throw new Error(`Burn failed: ${burnResult.error}`);
      }

      // 2. Iniciar transferência PIX
      const amountBRL = params.amountSTLT; // 1:1
      const amountCents = Math.round(parseFloat(amountBRL) * 100);

      const response = await this.client.post('/pix/transfers', {
        amount: amountCents,
        pixKey: params.pixKey,
        pixKeyType: params.pixKeyType,
        description: `STLT withdrawal - ${params.stellarAddress.substring(0, 8)}...`,
      });

      const { transferId } = response.data;

      // 3. Registrar saque
      await this.prisma.pixWithdrawal.create({
        data: {
          userId: params.userId,
          transferId,
          amount: amountBRL,
          pixKey: params.pixKey,
          pixKeyType: params.pixKeyType,
          stellarAddress: params.stellarAddress,
          burnTxHash: burnResult.txHash,
          status: 'processing',
        },
      });

      this.logger.log(`PIX withdrawal initiated: ${transferId} for ${amountBRL} BRL`);

      return {
        ok: true,
        withdrawalId: transferId,
      };
    } catch (error) {
      this.logger.error(`PIX withdrawal failed: ${error.message}`);
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  /**
   * Consulta status de pagamento PIX
   */
  async getPaymentStatus(txId: string): Promise<{
    ok: boolean;
    payment?: PixPayment;
    error?: string;
  }> {
    try {
      const payment = await this.prisma.pixPayment.findUnique({
        where: { txId },
      });

      if (!payment) {
        throw new Error(`Payment not found: ${txId}`);
      }

      return {
        ok: true,
        payment: {
          id: payment.id,
          txId: payment.txId,
          amount: payment.amount,
          cpf: payment.cpf,
          name: payment.name,
          status: payment.status as any,
          createdAt: payment.createdAt,
          expiresAt: payment.expiresAt,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message,
      };
    }
  }
}
