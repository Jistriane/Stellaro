/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';

// In-memory stores for mock Prisma
export function createPrismaMock(): Partial<Record<keyof PrismaService, any>> & any {
  // Entity stores
  const users = new Map<string, any>();
  const wallets = new Map<string, any>();
  const passkeys: any[] = [];
  const pixPayments = new Map<string, any>(); // key: txId
  const pixWithdrawals = new Map<string, any>(); // key: transferId

  let userSeq = 1;

  function clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v));
  }

  const prisma: any = {
    // Users
    user: {
      upsert: async ({ where, create, update }: any) => {
        const key = String(where.email ?? where.id);
        let existing = users.get(key);
        if (!existing) {
          const id = String(create?.id ?? `u_${userSeq++}`);
          existing = { id, email: create?.email ?? key, name: create?.name ?? null };
        }
        if (update) {
          existing = { ...existing, ...update };
        }
        users.set(existing.id, existing);
        users.set(existing.email, existing);
        return clone(existing);
      },
      findUnique: async ({ where }: any) => {
        const key = String(where.email ?? where.id);
        const found = users.get(key) ?? null;
        return clone(found);
      },
      update: async ({ where, data }: any) => {
        const key = String(where.id ?? where.email);
        const existing = users.get(key);
        if (!existing) return null;
        const updated = { ...existing, ...data };
        users.set(updated.id, updated);
        users.set(updated.email, updated);
        return clone(updated);
      },
      deleteMany: async ({ where }: any = {}) => {
        let count = 0;
        if (!where || Object.keys(where).length === 0) {
          count = users.size;
          users.clear();
        } else if (where.email) {
          const u = users.get(String(where.email));
          if (u) {
            users.delete(u.id);
            users.delete(u.email);
            count = 1;
          }
        }
        return { count };
      },
    },

    // Wallets
    wallet: {
      findUnique: async ({ where }: any) => clone(wallets.get(where.address) ?? null),
      create: async ({ data }: any) => {
        const w = { id: `w_${Date.now()}`, ...data };
        wallets.set(w.address, w);
        return clone(w);
      },
    },

    // Passkeys
    passkey: {
      create: async ({ data }: any) => {
        const pk = { id: `pk_${Date.now()}`, ...data };
        passkeys.push(pk);
        return clone(pk);
      },
    },

    // PIX Payments
    pixPayment: {
      create: async ({ data }: any) => {
        const now = new Date();
        const rec = {
          id: `pp_${now.getTime()}`,
          status: 'pending',
          mintedAt: null,
          mintTxHash: null,
          ...data,
          createdAt: data?.createdAt ?? now,
        };
        pixPayments.set(rec.txId, rec);
        return clone(rec);
      },
      findUnique: async ({ where }: any) => clone(pixPayments.get(where.txId) ?? null),
      update: async ({ where, data }: any) => {
        let current: any = null;
        if (where?.txId) {
          current = pixPayments.get(where.txId) ?? null;
        } else if (where?.id) {
          // localizar por id
          for (const v of pixPayments.values()) {
            if (v.id === where.id) {
              current = v;
              break;
            }
          }
        }
        if (!current) return null;
        const updated = { ...current, ...data };
        pixPayments.set(updated.txId, updated);
        return clone(updated);
      },
      deleteMany: async (_: any = {}) => {
        const count = pixPayments.size;
        pixPayments.clear();
        return { count };
      },
    },

    // PIX Withdrawals
    pixWithdrawal: {
      create: async ({ data }: any) => {
        const now = new Date();
        const rec = {
          id: `pw_${now.getTime()}`,
          status: 'processing',
          burnTxHash: data?.burnTxHash ?? `burn_${now.getTime()}`,
          transferId: data?.transferId ?? `tr_${now.getTime()}`,
          ...data,
        };
        pixWithdrawals.set(rec.transferId, rec);
        return clone(rec);
      },
      findUnique: async ({ where }: any) => clone(pixWithdrawals.get(where.transferId) ?? null),
      update: async ({ where, data }: any) => {
        const current = pixWithdrawals.get(where.transferId);
        if (!current) return null;
        const updated = { ...current, ...data };
        pixWithdrawals.set(updated.transferId, updated);
        return clone(updated);
      },
      deleteMany: async (_: any = {}) => {
        const count = pixWithdrawals.size;
        pixWithdrawals.clear();
        return { count };
      },
    },

    // No-ops to emulate Prisma lifecycle in Nest
    $connect: async () => {},
    $disconnect: async () => {},
  };

  return prisma as PrismaService;
}

export function createRedisStub(): Partial<RedisService> {
  const memory = new Map<string, string>();
  let hits = 0;
  let misses = 0;
  const stats = {
    connected: false,
    hits: 0,
    misses: 0,
    memoryItems: 0,
    rateLimitedTotal: 0,
    zkVerifyOk: 0,
    zkVerifyErr: 0,
    zkScoreOk: 0,
    zkScoreErr: 0,
  };

  return {
    get: async <T = any>(key: string): Promise<T | null> => {
      if (memory.has(key)) {
        hits++;
        stats.hits = hits;
        return JSON.parse(memory.get(key) as string) as T;
      }
      misses++;
      stats.misses = misses;
      return null;
    },
    set: async (key: string, value: any, _ttl?: number) => {
      memory.set(key, JSON.stringify(value));
      stats.memoryItems = memory.size;
    },
    publish: async (_ch: string, _msg: any) => 0,
    del: async (key: string) => (memory.delete(key) ? 1 : 0),
    mDel: async (keys: string[]) => {
      let c = 0;
      for (const k of keys) if (memory.delete(k)) c++;
      stats.memoryItems = memory.size;
      return c;
    },
    incRateLimited: () => {
      stats.rateLimitedTotal += 1;
    },
    incZkVerify: (ok: boolean) => {
      if (ok) stats.zkVerifyOk += 1;
      else stats.zkVerifyErr += 1;
    },
    incZkScore: (ok: boolean) => {
      if (ok) stats.zkScoreOk += 1;
      else stats.zkScoreErr += 1;
    },
    getStats: () => ({ ...stats }),
  } as any;
}

// Lightweight stubs for services with onModuleInit side-effects
export function createReserveManagerStub() {
  return {
    onModuleInit: async () => {},
    checkCollateralization: async () => ({
      healthy: true,
      ratio: 150,
      snapshot: {
        timestamp: new Date(),
        stablecoinSupply: 1000000,
        totalReserveValue: 1500000,
        collateralizationRatio: 150,
        assets: [],
      },
    }),
    // API usada pelo controller
    getCurrentSnapshot: async () => ({
      timestamp: new Date(),
      stablecoinSupply: 1000000,
      totalReserveValue: 1500000,
      collateralizationRatio: 150,
      assets: [],
    }),
    generateProofOfReserves: async () => ({
      hash: '0'.repeat(64),
      txHash: '0'.repeat(64),
      snapshot: {
        timestamp: new Date(),
        stablecoinSupply: 1000000,
        totalReserveValue: 1500000,
        collateralizationRatio: 150,
        assets: [],
      },
    }),
  };
}

export function createIngestorStub() {
  return {
    onModuleInit: async () => {},
  };
}
