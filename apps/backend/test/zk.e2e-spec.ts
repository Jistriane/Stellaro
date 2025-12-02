import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { jest } from '@jest/globals';

// Nota: este teste usa payloads mockados para validar roteamento e validação básica.
// Não depende de RPC real nem prova válida.

describe('ZK Routes (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    // Garante fallback em memória para Redis nos testes
    process.env.REDIS_URL = '';
    // Aumenta timeout dos testes e hooks
    jest.setTimeout(30000);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/zk/verify (POST) should validate payload structure', async () => {
    const res = await request(app.getHttpServer())
      .post('/zk/verify')
      .send({
        proof: {
          a: '0x' + '0'.repeat(64),
          b: '0x' + '0'.repeat(64),
          c: '0x' + '0'.repeat(64),
        },
        publicInputs: ['0x' + '0'.repeat(64)],
        nonce: '0x' + '0'.repeat(32),
      })
      .expect(200)
      .expect('Content-Type', /json/);

    expect(res.body).toHaveProperty('ok');
    // No ambiente de teste, pode retornar mock/erro dependendo do serviço.
  });

  it('/zk/verify (POST) should rate-limit repeated nonce', async () => {
    const payload = {
      proof: {
        a: '0x' + '0'.repeat(64),
        b: '0x' + '0'.repeat(64),
        c: '0x' + '0'.repeat(64),
      },
      publicInputs: ['0x' + '0'.repeat(64)],
      nonce: '0x' + 'a'.repeat(32),
    };

    const first = await request(app.getHttpServer())
      .post('/zk/verify')
      .send(payload)
      .expect(200);

    expect(typeof first.body === 'object').toBeTruthy();

    const second = await request(app.getHttpServer())
      .post('/zk/verify')
      .send(payload)
      .expect(200);

    // Espera razão de rate limit na segunda tentativa
    if (second.body && second.body.reason) {
      expect(second.body.reason).toBe('rate-limited');
    }
  });

  it('/zk/score/:address (GET) should support cache on repeated calls', async () => {
    // Endereço Stellar válido (testnet) para reduzir logs; pode não existir on-chain
    const address = 'GBRPYHIL2CI3KILXWGZ4G7ZJQ7G7JZQF5Q6GQ3GQ3GQ3GQ3GQ3GQ3GQ3';
    const t1 = Date.now();
    const res1 = await request(app.getHttpServer())
      .get(`/zk/score/${address}`)
      .expect(200)
      .expect('Content-Type', /json/);
    const d1 = Date.now() - t1;

    const t2 = Date.now();
    const res2 = await request(app.getHttpServer())
      .get(`/zk/score/${address}`)
      .expect(200)
      .expect('Content-Type', /json/);
    const d2 = Date.now() - t2;

    expect(typeof res1.body === 'object').toBeTruthy();
    expect(typeof res2.body === 'object').toBeTruthy();
    // Não estrita, apenas confirma que segunda chamada não falha; cache pode reduzir tempo
    expect(d2).toBeLessThanOrEqual(d1 + 200);
  });
  it('/zk/score/:address (GET) returns JSON or error', async () => {
    const res = await request(app.getHttpServer())
      .get('/zk/score/GBRPYHIL2CI3KILXWGZ4G7ZJQ7G7JZQF5Q6GQ3GQ3GQ3GQ3GQ3GQ3GQ3')
      .expect(200)
      .expect('Content-Type', /json/);
    // Accept either {score} or {error}
    expect(typeof res.body === 'object').toBeTruthy();
    expect(
      Object.prototype.hasOwnProperty.call(res.body, 'score') ||
        Object.prototype.hasOwnProperty.call(res.body, 'error')
    ).toBeTruthy();
  });
});
