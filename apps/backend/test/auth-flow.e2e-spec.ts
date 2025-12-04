/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ReserveManagerService } from '../src/compliance/reserve-manager.service';
import { IngestorService } from '../src/analytics/ingestor.service';
import { RedisService } from '../src/redis/redis.service';

describe('Auth Flow (E2E)', () => {
  let app: INestApplication;
  // Helper para compatibilidade com supertest em ambientes com lint estrito
  const httpServer = () => app.getHttpServer() as unknown as any;

  beforeAll(async () => {
    const users = new Map<string, any>();
    const wallets = new Map<string, any>();
    let userSeq = 1;

    const prismaMock: Partial<Record<keyof PrismaService, any>> & any = {
      user: {
        upsert: async ({ where, create, update }: any) => {
          const key = String(where.email ?? where.id);
          let existing = users.get(key);
          if (!existing) {
            const id = `u_${userSeq++}`;
            existing = { id, email: create?.email ?? key, name: create?.name ?? null };
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
      getStats: () => ({ connected: false, hits: 0, misses: 0, memoryItems: 0, rateLimitedTotal: 0, zkVerifyOk: 0, zkVerifyErr: 0, zkScoreOk: 0, zkScoreErr: 0 }),
    } as any;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(RedisService)
      .useValue(redisStub)
      .overrideProvider(ReserveManagerService)
      .useValue({
        onModuleInit: async () => {},
        checkCollateralization: async () => ({
          healthy: true,
          ratio: 0,
          snapshot: {
            timestamp: new Date(),
            stablecoinSupply: 0,
            totalReserveValue: 0,
            collateralizationRatio: 0,
            assets: [],
          },
        }),
      })
      .overrideProvider(IngestorService)
      .useValue({
        onModuleInit: async () => {},
      })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const res = await request(httpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /auth/register + /auth/login minimal flow', async () => {
    const email = `user+e2e${Date.now()}@test.local`;
    const password = 'Test@12345';

    const reg = await request(httpServer())
      .post('/auth/register')
      .send({ email, password });
    expect(reg.status).toBeLessThan(500);

    const login = await request(httpServer())
      .post('/auth/login')
      .send({ email, password });
    expect(login.status).toBeLessThan(500);
    expect(login.body).toBeDefined();
  });
});
