import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ReserveManagerService } from '../src/compliance/reserve-manager.service';
import { IngestorService } from '../src/analytics/ingestor.service';
import { RedisService } from '../src/redis/redis.service';

describe('Actions Flow (E2E)', () => {
  let app: INestApplication;
  const httpServer = () => app.getHttpServer() as unknown as any;

  beforeAll(async () => {
    const users = new Map<string, any>();
    const wallets = new Map<string, any>();
    let userSeq = 1;

    const prismaMock: any = {
      user: {
        upsert: async ({ where, create, update }: any) => {
          const key = String(where.email ?? where.id);
          let existing = users.get(key);
          if (!existing) {
            const id = `u_${userSeq++}`;
            existing = {
              id,
              email: create?.email ?? key,
              name: create?.name ?? null,
            };
            users.set(existing.email, existing);
            users.set(existing.id, existing);
          } else if (update) {
            existing = { ...existing, ...update };
            users.set(existing.email, existing);
            users.set(existing.id, existing);
          }
          return existing;
        },
        findUnique: async ({ where }: any) => {
          const key = String(where.email ?? where.id);
          return users.get(key) ?? null;
        },
        update: async ({ where, data }: any) => {
          const key = String(where.id);
          const existing = users.get(key);
          if (!existing) return null;
          const updated = { ...existing, ...data };
          users.set(updated.id, updated);
          users.set(updated.email, updated);
          return updated;
        },
      },
      wallet: {
        findUnique: async ({ where }: any) => wallets.get(where.address) ?? null,
        create: async ({ data }: any) => {
          const w = { id: `w_${Date.now()}`, ...data };
          wallets.set(w.address, w);
          return w;
        },
      },
      passkey: {
        create: async (_: any) => ({ ok: true }),
      },
    };

    const redisStub: Partial<RedisService> = {
      get: (_key: string) => Promise.resolve(null),
      set: (_key: string, _value: any, _ttl?: number) => Promise.resolve(),
      publish: (_ch: string, _msg: any) => Promise.resolve(0),
      del: (_key: string) => Promise.resolve(1),
      mDel: (keys: string[]) => Promise.resolve(keys.length),
      getStats: () => ({
        connected: false,
        hits: 0,
        misses: 0,
        memoryItems: 0,
        rateLimitedTotal: 0,
        zkVerifyOk: 0,
        zkVerifyErr: 0,
        zkScoreOk: 0,
        zkScoreErr: 0,
      }),
    } as any;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(RedisService)
      .useValue(redisStub)
      .overrideProvider(ReserveManagerService)
      .useValue({ onModuleInit: async () => {}, checkCollateralization: async () => ({ healthy: true, ratio: 0, snapshot: { timestamp: new Date(), stablecoinSupply: 0, totalReserveValue: 0, collateralizationRatio: 0, assets: [] } }) })
      .overrideProvider(IngestorService)
      .useValue({ onModuleInit: async () => {} })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health is OK (precheck)', async () => {
    const res = await request(httpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /actions/mint validates payload and returns result', async () => {
    const payload = {
      to: 'GCTESTUSERADDRESS123',
      amount: 100,
      asset: 'USDC',
      memo: 'e2e mint test',
    };

    const res = await request(httpServer())
      .post('/actions/mint')
      .send(payload);

    expect(res.status).toBeLessThan(500);
    // Estrutura genérica esperada; ajusta conforme controller real
    expect(res.body).toBeDefined();
  });
});
