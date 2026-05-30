import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { ReserveManagerService } from '../src/compliance/reserve-manager.service';
import { IngestorService } from '../src/analytics/ingestor.service';
import { createIngestorStub, createPrismaMock, createRedisStub, createReserveManagerStub } from './test-utils';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  const testEmail = `test-${Date.now()}@stellaro.dev`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaMock())
      .overrideProvider(RedisService)
      .useValue(createRedisStub())
      .overrideProvider(ReserveManagerService)
      .useValue(createReserveManagerStub())
      .overrideProvider(IngestorService)
      .useValue(createIngestorStub())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Passkey Registration Flow', () => {
    let challenge: string;

    it('should initialize passkey registration', () => {
      return request(app.getHttpServer())
        .post('/auth/passkey/register/init')
        .send({ email: testEmail })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('challenge');
          expect(res.body).toHaveProperty('rpId');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user).toHaveProperty('name', testEmail);
          challenge = res.body.challenge;
          expect(typeof challenge).toBe('string');
          expect(challenge.length).toBeGreaterThan(0);
        });
    });

    it('should validate challenge format', () => {
      expect(challenge).toBeDefined();
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/); // base64url format
    });
  });

  describe('Passkey Login Flow', () => {
    it('should initialize passkey login for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/passkey/login/init')
        .send({ email: 'nonexistent@stellaro.dev' })
        .expect((res) => {
          // Deve retornar 404 ou success=false
          if (res.status === 200) {
            expect(res.body.ok).toBe(false);
          } else {
            expect(res.status).toBe(404);
          }
        });
    });
  });

  describe('Email OTP Flow', () => {
    let otpCode: string;

    it('should send OTP code', () => {
      return request(app.getHttpServer())
        .post('/auth/email/init')
        .send({ email: testEmail })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('ok', true);
          // Em DEV, código retornado; em PROD, apenas success
          if (res.body.code) {
            otpCode = res.body.code;
            expect(otpCode).toMatch(/^\d{6}$/);
          }
        });
    });

    it('should verify valid OTP code', () => {
      if (!otpCode) {
        return; // Skip if running in prod mode
      }

      return request(app.getHttpServer())
        .post('/auth/email/verify')
        .send({ email: testEmail, code: otpCode })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('ok', true);
          expect(res.body).toHaveProperty('token');
          expect(res.body).toHaveProperty('userId');
          
          // Cookie should be set
          expect(res.headers['set-cookie']).toBeDefined();
          const cookie = res.headers['set-cookie'][0];
          expect(cookie).toContain('token=');
          expect(cookie).toContain('HttpOnly');
        });
    });

    it('should reject invalid OTP code', () => {
      return request(app.getHttpServer())
        .post('/auth/email/verify')
        .send({ email: testEmail, code: '000000' })
        .expect(401);
    });
  });

  describe('Wallet Authentication Flow', () => {
    const testPubkey = 'GDHIZHAWV7TC6RKI2KXQ23XVRQ23UPJWSODCQHIRZQO22ANVGH7BM4ZD';
    let nonce: string;

    it('should issue nonce for wallet', () => {
      return request(app.getHttpServer())
        .post('/auth/nonce')
        .send({ pubkey: testPubkey })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('nonce');
          nonce = res.body.nonce;
          expect(typeof nonce).toBe('string');
        });
    });

    it('should validate nonce is JWT', () => {
      expect(nonce).toBeDefined();
      const parts = nonce.split('.');
      expect(parts).toHaveLength(3); // header.payload.signature
    });
  });

  describe('Profile Management', () => {
    let authToken: string;

    beforeAll(async () => {
      // Create user via email OTP
      const initRes = await request(app.getHttpServer())
        .post('/auth/email/init')
        .send({ email: testEmail });

      if (initRes.body.code) {
        const verifyRes = await request(app.getHttpServer())
          .post('/auth/email/verify')
          .send({ email: testEmail, code: initRes.body.code });

        authToken = verifyRes.body.token;
      }
    });

    it('should get user profile with token', () => {
      if (!authToken) return;

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('email', testEmail);
          expect(res.body.user).toHaveProperty('id');
        });
    });

    it('should update user profile', () => {
      if (!authToken) return;

      return request(app.getHttpServer())
        .patch('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test User' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('name', 'Test User');
        });
    });

    it('should reject unauthenticated profile access', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ authenticated: false, user: null });
        });
    });
  });
});
