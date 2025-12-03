import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Compliance & Reserves (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/compliance/reserves/check (GET)', () => {
    it('should return collateralization status', () => {
      return request(app.getHttpServer())
        .get('/compliance/reserves/check')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('healthy');
          expect(res.body).toHaveProperty('ratio');
          expect(res.body).toHaveProperty('snapshot');
          expect(typeof res.body.healthy).toBe('boolean');
          expect(typeof res.body.ratio).toBe('number');
          
          const snapshot = res.body.snapshot;
          expect(snapshot).toHaveProperty('timestamp');
          expect(snapshot).toHaveProperty('stablecoinSupply');
          expect(snapshot).toHaveProperty('totalReserveValue');
          expect(snapshot).toHaveProperty('collateralizationRatio');
          expect(snapshot).toHaveProperty('assets');
          expect(Array.isArray(snapshot.assets)).toBe(true);
        });
    });

    it('should have minimum 120% collateralization or flag unhealthy', () => {
      return request(app.getHttpServer())
        .get('/compliance/reserves/check')
        .expect(200)
        .expect((res) => {
          const { healthy, ratio } = res.body;
          if (healthy) {
            expect(ratio).toBeGreaterThanOrEqual(120);
          } else {
            expect(ratio).toBeLessThan(120);
          }
        });
    });
  });

  describe('/compliance/reserves/snapshot (GET)', () => {
    it('should return detailed reserve snapshot', () => {
      return request(app.getHttpServer())
        .get('/compliance/reserves/snapshot')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('stablecoinSupply');
          expect(res.body).toHaveProperty('totalReserveValue');
          expect(res.body).toHaveProperty('collateralizationRatio');
          expect(res.body).toHaveProperty('assets');
          
          // Validar estrutura de assets
          res.body.assets.forEach((asset: any) => {
            expect(asset).toHaveProperty('code');
            expect(asset).toHaveProperty('amount');
            expect(asset).toHaveProperty('valueUSD');
            expect(asset).toHaveProperty('lastUpdated');
          });
        });
    });
  });

  describe('/compliance/reserves/proof (POST)', () => {
    it('should generate proof of reserves', () => {
      return request(app.getHttpServer())
        .post('/compliance/reserves/proof')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('hash');
          expect(res.body).toHaveProperty('txHash');
          expect(res.body).toHaveProperty('snapshot');
          expect(typeof res.body.hash).toBe('string');
          expect(res.body.hash).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex
        });
    }, 30000); // Timeout estendido para tx on-chain
  });
});
