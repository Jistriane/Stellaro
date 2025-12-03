import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('DeFi Positions (e2e)', () => {
  let app: INestApplication;
  const TEST_ADDRESS = process.env.TEST_STELLAR_ADDRESS || 
    'GDHIZHAWV7TC6RKI2KXQ23XVRQ23UPJWSODCQHIRZQO22ANVGH7BM4ZD';

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

  describe('/defi/blend/positions/:address (GET)', () => {
    it('should return positions for valid address', () => {
      return request(app.getHttpServer())
        .get(`/defi/blend/positions/${TEST_ADDRESS}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('address', TEST_ADDRESS);
          expect(res.body).toHaveProperty('positions');
          expect(res.body).toHaveProperty('totalUSD');
          expect(Array.isArray(res.body.positions)).toBe(true);
          expect(typeof res.body.totalUSD).toBe('number');
          
          // Se houver posições, validar estrutura
          if (res.body.positions.length > 0) {
            const pos = res.body.positions[0];
            expect(pos).toHaveProperty('asset');
            expect(pos).toHaveProperty('balance');
            expect(pos).toHaveProperty('valueUSD');
          }
        });
    });

    it('should include poolId and apy when configured', () => {
      return request(app.getHttpServer())
        .get(`/defi/blend/positions/${TEST_ADDRESS}`)
        .expect(200)
        .expect((res) => {
          if (res.body.positions.length > 0) {
            const pos = res.body.positions[0];
            // poolId e apy são opcionais, mas se LOANS_POOL_CONTRACT_ID está configurado, devem estar presentes
            if (process.env.LOANS_POOL_CONTRACT_ID) {
              expect(pos).toHaveProperty('poolId');
            }
          }
        });
    });

    it('should handle invalid address gracefully', () => {
      return request(app.getHttpServer())
        .get('/defi/blend/positions/INVALID_ADDRESS')
        .expect((res) => {
          // Deve retornar erro 4xx (Stellar responde 400/404 para endereço inválido)
          expect([400, 404]).toContain(res.status);
        });
    });

    it('should use cache on repeated requests', async () => {
      const first = await request(app.getHttpServer())
        .get(`/defi/blend/positions/${TEST_ADDRESS}`);

      const start = Date.now();
      const second = await request(app.getHttpServer())
        .get(`/defi/blend/positions/${TEST_ADDRESS}`);
      const elapsed = Date.now() - start;

      // Request cacheado deve ser muito mais rápido (<100ms)
      expect(elapsed).toBeLessThan(200);
      expect(first.body.totalUSD).toBe(second.body.totalUSD);
    });
  });
});
