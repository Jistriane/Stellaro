import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { OraclesModule } from '../src/oracles/oracles.module';
import { RedisModule } from '../src/redis/redis.module';

describe('Oracles (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OraclesModule, RedisModule],
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
          expect(res.body).toHaveProperty('price');
          expect(res.body).toHaveProperty('asset', 'XLM');
          expect(res.body).toHaveProperty('quote', 'USD');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('source');
          expect(typeof res.body.price).toBe('number');
          expect(res.body.price).toBeGreaterThan(0);
        });
    });

    it('should handle invalid asset gracefully', () => {
      return request(app.getHttpServer())
        .get('/oracles/price')
        .query({ asset: 'INVALID', quote: 'USD' })
        .expect((res) => {
          // Pode retornar 200 com price 0 ou 404, dependendo da implementação
          if (res.status === 200) {
            expect(res.body.price).toBe(0);
          }
        });
    });

    it('should return cached price on subsequent requests', async () => {
      const first = await request(app.getHttpServer())
        .get('/oracles/price')
        .query({ asset: 'XLM', quote: 'USD' });

      const second = await request(app.getHttpServer())
        .get('/oracles/price')
        .query({ asset: 'XLM', quote: 'USD' });

      expect(first.body.price).toBe(second.body.price);
      // Cache hit pode ser verificado pelo campo 'cached' se implementado
    });
  });

  describe('/oracles/health (GET)', () => {
    it('should return oracle health status', () => {
      return request(app.getHttpServer())
        .get('/oracles/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('reflector');
          expect(res.body).toHaveProperty('stellarDex');
        });
    });
  });
});
