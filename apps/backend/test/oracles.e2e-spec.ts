import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Oracles (e2e)', () => {
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

  describe('/oracles/price (GET)', () => {
    it('should return price for XLM/USD', () => {
      return request(app.getHttpServer())
        .get('/oracles/price')
        .query({ asset: 'XLM', quote: 'USD' })
        .expect(200)
        .expect((res) => {
          // Resposta real: { value: number, decimals: number, feed: string, quote: string }
          expect(res.body).toHaveProperty('value');
          expect(res.body).toHaveProperty('decimals');
          expect(typeof res.body.value).toBe('number');
          expect(res.body.value).toBeGreaterThan(0);
        });
    });

    it('should handle invalid asset gracefully', () => {
      return request(app.getHttpServer())
        .get('/oracles/price')
        .query({ asset: 'INVALID', quote: 'USD' })
        .expect((res) => {
          // Com stub oracle, sempre retorna valor
          expect(res.body).toHaveProperty('value');
          expect(res.body.feed).toBe('stub');
        });
    });

    it('should return cached price on subsequent requests', async () => {
      const first = await request(app.getHttpServer())
        .get('/oracles/price')
        .query({ asset: 'XLM', quote: 'USD' });

      const second = await request(app.getHttpServer())
        .get('/oracles/price')
        .query({ asset: 'XLM', quote: 'USD' });

      expect(first.body.value).toBe(second.body.value);
      // Com stub oracle, valores devem ser iguais
    });
  });

  describe('/chain/health (GET)', () => {
    it('should return blockchain health status', () => {
      return request(app.getHttpServer())
        .get('/chain/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('horizon');
          expect(res.body).toHaveProperty('soroban');
        });
    });
  });
});
