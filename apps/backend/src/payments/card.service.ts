import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ActionsService } from '../actions/actions.service';
import axios, { AxiosInstance } from 'axios';

export interface CardToken {
  id: string;
  last4: string;
  brand: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  status: 'active' | 'blocked' | 'deleted';
}

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);
  private readonly client: AxiosInstance | null = null;
  private readonly enabled: boolean;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private actions: ActionsService,
  ) {
    const apiKey =
      this.config.get<string>('CARD_API_KEY') || process.env.CARD_API_KEY;
    const apiUrl =
      this.config.get<string>('CARD_API_URL') || process.env.CARD_API_URL;
    this.enabled = !!apiKey && !!apiUrl;

    if (this.enabled && apiUrl) {
      this.client = axios.create({
        baseURL: apiUrl,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
      this.logger.log('Card integration enabled');
    }
  }

  async tokenizeCard(params: {
    userId: string;
    number: string;
    holderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  }): Promise<{ ok: boolean; token?: CardToken; error?: string }> {
    try {
      this.logger.log(`Tokenizing card for user: ${params.userId}`);

      if (!this.enabled || !this.client) {
        // Stub: simular tokenização local
        const token: CardToken = {
          id: `card_tok_${Math.random().toString(36).substring(7)}`,
          last4: params.number.slice(-4),
          brand: 'Visa', // Mock
          holderName: params.holderName,
          expiryMonth: params.expiryMonth,
          expiryYear: params.expiryYear,
          status: 'active',
        };

        // Salvar no banco (criptografado em prod)
        await this.prisma.auditLog.create({
          data: {
            userId: params.userId,
            action: 'CARD_TOKENIZED',
            level: 'INFO',
            metadata: { last4: token.last4, brand: token.brand, stub: true },
          },
        });

        return { ok: true, token };
      }

      // Chamada real ao gateway (Dock/Stripe/etc)
      const response = await this.client.post<CardToken>('/cards/tokenize', {
        number: params.number,
        holderName: params.holderName,
        expiryMonth: params.expiryMonth,
        expiryYear: params.expiryYear,
        cvv: params.cvv,
      });

      const token = response.data;

      // Salvar no banco
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: 'CARD_TOKENIZED',
          level: 'INFO',
          metadata: { last4: token.last4, brand: token.brand },
        },
      });

      return { ok: true, token };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Card tokenization failed: ${msg}`);
      return { ok: false, error: msg };
    }
  }

  async chargeCard(params: {
    userId: string;
    tokenId: string;
    amount: number;
    currency: string;
  }): Promise<{ ok: boolean; txHash?: string; error?: string }> {
    try {
      this.logger.log(
        `Charging card ${params.tokenId} for ${params.amount} ${params.currency}`,
      );

      if (!this.enabled || !this.client) {
        // Stub: sucesso simulado
        await this.prisma.auditLog.create({
          data: {
            userId: params.userId,
            action: 'CARD_CHARGED',
            level: 'INFO',
            metadata: {
              amount: params.amount,
              currency: params.currency,
              stub: true,
            },
          },
        });
        return { ok: true, txHash: 'stub_charge_hash' };
      }

      const response = await this.client.post<{ txHash: string }>(
        '/cards/charge',
        {
          tokenId: params.tokenId,
          amount: params.amount,
          currency: params.currency,
        },
      );

      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: 'CARD_CHARGED',
          level: 'INFO',
          metadata: {
            amount: params.amount,
            currency: params.currency,
            txHash: response.data.txHash,
          },
        },
      });

      return { ok: true, txHash: response.data.txHash };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Card charge failed: ${msg}`);
      return { ok: false, error: msg };
    }
  }
}
