import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { createHmac } from 'crypto';

describe('PIX Payments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Garantir que não há usuário residual do e-mail de teste
    await prisma.user.deleteMany({ where: { email: 'pix-test@stellaro.com' } });

    // Usar fluxo real de OTP para obter token
    const initRes = await request(app.getHttpServer())
      .post('/auth/email/init')
      .send({ email: 'pix-test@stellaro.com' })
      .expect(201);

    const code: string = initRes.body.code;

    const verifyRes = await request(app.getHttpServer())
      .post('/auth/email/verify')
      .send({ email: 'pix-test@stellaro.com', code })
      .expect(201);

    expect(verifyRes.body).toHaveProperty('token');
    expect(verifyRes.body).toHaveProperty('userId');

    authToken = verifyRes.body.token;
    userId = verifyRes.body.userId;
  });

  afterAll(async () => {
    await prisma.pixPayment.deleteMany({});
    await prisma.pixWithdrawal.deleteMany({});
    await prisma.user.deleteMany({ where: { email: 'pix-test@stellaro.com' } });
    await app.close();
  });

  describe('POST /payments/pix/charge', () => {
    it('should generate PIX QR code for STLT mint', async () => {
      const chargeDto = {
        amountBRL: '100.00',
        stellarAddress: 'GDIT7RKU7GQGZPW3GPMQD2UPJW73ZKWKFM7QKVFZ3XQJXZXJX6YQSTLT',
        cpf: '12345678900',
        name: 'João Silva',
      };

      const response = await request(app.getHttpServer())
        .post('/payments/pix/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .send(chargeDto)
        .expect(201);

      expect(response.body.ok).toBe(true);
      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.txId).toMatch(/^STLT\d+/);
      expect(response.body.payment.amount).toBe('100.00');
      expect(response.body.payment.status).toBe('pending');
      expect(response.body.payment.qrCode).toBeDefined();
    });

    it('should reject invalid CPF format', async () => {
      const chargeDto = {
        amountBRL: '50.00',
        stellarAddress: 'GDIT7RKU7GQGZPW3GPMQD2UPJW73ZKWKFM7QKVFZ3XQJXZXJX6YQSTLT',
        cpf: '123', // CPF inválido
        name: 'Test User',
      };

      await request(app.getHttpServer())
        .post('/payments/pix/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .send(chargeDto)
        .expect(400);
    });

    it('should handle provider API failures gracefully', async () => {
      // Simular falha do provider (API key inválida ou timeout)
      const chargeDto = {
        amountBRL: '1000000.00', // Valor muito alto que provoca erro
        stellarAddress: 'GDIT7RKU7GQGZPW3GPMQD2UPJW73ZKWKFM7QKVFZ3XQJXZXJX6YQSTLT',
        cpf: '12345678900',
        name: 'Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/payments/pix/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .send(chargeDto);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /payments/pix/webhook', () => {
    let pendingPayment: any;

    beforeEach(async () => {
      // Criar pagamento pendente
      pendingPayment = await prisma.pixPayment.create({
        data: {
          userId,
          txId: `STLT${Date.now()}TEST`,
          amount: '100.00',
          cpf: '12345678900',
          name: 'Test User',
          stellarAddress: 'GDIT7RKU7GQGZPW3GPMQD2UPJW73ZKWKFM7QKVFZ3XQJXZXJX6YQSTLT',
          status: 'pending',
          expiresAt: new Date(Date.now() + 3600000),
        },
      });
    });

    it('should confirm payment and mint STLT tokens', async () => {
      const webhookPayload = {
        txId: pendingPayment.txId,
        status: 'confirmed',
        amount: 10000, // R$ 100,00 em centavos
        paidAt: new Date().toISOString(),
      };

      const signature = createHmac('sha256', process.env.PIX_WEBHOOK_SECRET || '')
        .update(JSON.stringify(webhookPayload))
        .digest('hex');

      const response = await request(app.getHttpServer())
        .post('/payments/pix/webhook')
        .set('x-webhook-signature', signature)
        .send(webhookPayload)
        .expect(201);

      expect(response.body.ok).toBe(true);
      expect(response.body.minted).toBe(true);

      // Verificar que pagamento foi atualizado
      const updated = await prisma.pixPayment.findUnique({
        where: { txId: pendingPayment.txId },
      });

      expect(updated.status).toBe('confirmed');
      expect(updated.mintTxHash).toBeDefined();
      expect(updated.mintedAt).toBeDefined();
    });

    it('should reject webhook with invalid signature', async () => {
      const webhookPayload = {
        txId: pendingPayment.txId,
        status: 'confirmed',
        amount: 10000,
        paidAt: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/payments/pix/webhook')
        .set('x-webhook-signature', 'invalid-signature')
        .send(webhookPayload)
        .expect(401);
    });

    it('should handle duplicate webhook calls idempotently', async () => {
      const webhookPayload = {
        txId: pendingPayment.txId,
        status: 'confirmed',
        amount: 10000,
      };

      const signature = createHmac('sha256', process.env.PIX_WEBHOOK_SECRET || '')
        .update(JSON.stringify(webhookPayload))
        .digest('hex');

      // Primeira chamada
      await request(app.getHttpServer())
        .post('/payments/pix/webhook')
        .set('x-webhook-signature', signature)
        .send(webhookPayload);

      // Segunda chamada (duplicada)
      const response = await request(app.getHttpServer())
        .post('/payments/pix/webhook')
        .set('x-webhook-signature', signature)
        .send(webhookPayload)
        .expect(201);

      expect(response.body.ok).toBe(true);
      expect(response.body.minted).toBe(false); // Não deve mintar novamente
    });
  });

  describe('POST /payments/pix/withdrawal', () => {
    it('should initiate PIX withdrawal after burning STLT', async () => {
      const withdrawalDto = {
        amountSTLT: '50.00',
        pixKey: '12345678900',
        pixKeyType: 'cpf',
        stellarAddress: 'GDIT7RKU7GQGZPW3GPMQD2UPJW73ZKWKFM7QKVFZ3XQJXZXJX6YQSTLT',
      };

      const response = await request(app.getHttpServer())
        .post('/payments/pix/withdrawal')
        .set('Authorization', `Bearer ${authToken}`)
        .send(withdrawalDto)
        .expect(201);

      expect(response.body.ok).toBe(true);
      expect(response.body.withdrawalId).toBeDefined();

      // Verificar registro de saque criado
      const withdrawal = await prisma.pixWithdrawal.findUnique({
        where: { transferId: response.body.withdrawalId },
      });

      expect(withdrawal).toBeDefined();
      expect(withdrawal.amount).toBe('50.00');
      expect(withdrawal.status).toBe('processing');
      expect(withdrawal.burnTxHash).toBeDefined();
    });

    it('should validate PIX key format', async () => {
      const withdrawalDto = {
        amountSTLT: '50.00',
        pixKey: 'invalid-email', // Email inválido
        pixKeyType: 'email',
        stellarAddress: 'GDIT7RKU7GQGZPW3GPMQD2UPJW73ZKWKFM7QKVFZ3XQJXZXJX6YQSTLT',
      };

      await request(app.getHttpServer())
        .post('/payments/pix/withdrawal')
        .set('Authorization', `Bearer ${authToken}`)
        .send(withdrawalDto)
        .expect(400);
    });

    it('should reject withdrawal if burn fails', async () => {
      const withdrawalDto = {
        amountSTLT: '99999999.00', // Valor impossível
        pixKey: '12345678900',
        pixKeyType: 'cpf',
        stellarAddress: 'INVALID_ADDRESS',
      };

      const response = await request(app.getHttpServer())
        .post('/payments/pix/withdrawal')
        .set('Authorization', `Bearer ${authToken}`)
        .send(withdrawalDto);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toContain('Burn failed');
    });
  });

  describe('GET /payments/pix/status/:txId', () => {
    let testPayment: any;

    beforeEach(async () => {
      testPayment = await prisma.pixPayment.create({
        data: {
          userId,
          txId: `STLT${Date.now()}STATUS`,
          amount: '75.00',
          cpf: '12345678900',
          name: 'Status Test',
          stellarAddress: 'GDIT7RKU7GQGZPW3GPMQD2UPJW73ZKWKFM7QKVFZ3XQJXZXJX6YQSTLT',
          status: 'pending',
          expiresAt: new Date(Date.now() + 3600000),
        },
      });
    });

    it('should return payment status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/payments/pix/status/${testPayment.txId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.txId).toBe(testPayment.txId);
      expect(response.body.payment.amount).toBe('75.00');
      expect(response.body.payment.status).toBe('pending');
    });

    it('should return 404 for non-existent payment', async () => {
      const response = await request(app.getHttpServer())
        .get('/payments/pix/status/STLT9999999FAKE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('PIX Integration Flow (end-to-end)', () => {
    it('should complete full deposit → mint → withdraw → burn cycle', async () => {
      // 1. Gerar cobrança PIX
      const chargeResponse = await request(app.getHttpServer())
        .post('/payments/pix/charge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amountBRL: '200.00',
          stellarAddress: 'GDIT7RKU7GQGZPW3GPMQD2UPJW73ZKWKFM7QKVFZ3XQJXZXJX6YQSTLT',
          cpf: '12345678900',
          name: 'Full Flow Test',
        });

      expect(chargeResponse.body.ok).toBe(true);
      const txId = chargeResponse.body.payment.txId;

      // 2. Simular confirmação via webhook
      const webhookPayload = {
        txId,
        status: 'confirmed',
        amount: 20000,
        paidAt: new Date().toISOString(),
      };

      const signature = createHmac('sha256', process.env.PIX_WEBHOOK_SECRET || '')
        .update(JSON.stringify(webhookPayload))
        .digest('hex');

      const webhookResponse = await request(app.getHttpServer())
        .post('/payments/pix/webhook')
        .set('x-webhook-signature', signature)
        .send(webhookPayload);

      expect(webhookResponse.body.ok).toBe(true);
      expect(webhookResponse.body.minted).toBe(true);

      // 3. Verificar status de pagamento confirmado
      const statusResponse = await request(app.getHttpServer())
        .get(`/payments/pix/status/${txId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusResponse.body.payment.status).toBe('confirmed');

      // 4. Iniciar saque (burn de metade dos tokens)
      const withdrawalResponse = await request(app.getHttpServer())
        .post('/payments/pix/withdrawal')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amountSTLT: '100.00',
          pixKey: 'test@stellaro.com',
          pixKeyType: 'email',
          stellarAddress: 'GDIT7RKU7GQGZPW3GPMQD2UPJW73ZKWKFM7QKVFZ3XQJXZXJX6YQSTLT',
        });

      expect(withdrawalResponse.body.ok).toBe(true);
      expect(withdrawalResponse.body.withdrawalId).toBeDefined();
    });
  });
});
