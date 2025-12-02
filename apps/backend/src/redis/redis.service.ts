import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

export interface RedisClientLike {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    mode?: string,
    duration?: number,
  ): Promise<'OK' | null>;
  publish(channel: string, message: string): Promise<number>;
  del(key: string): Promise<number>;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientLike | null = null;
  private memory = new Map<string, string>();
  private hits = 0;
  private misses = 0;
  private rateLimitedTotal = 0;
  private zkVerifyOk = 0;
  private zkVerifyErr = 0;
  private zkScoreOk = 0;
  private zkScoreErr = 0;

  async onModuleInit() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn(
        'REDIS_URL não configurado. Usando fallback em memória.',
      );
      return;
    }
    try {
      // Import dinâmico para evitar falhas se pacote não estiver instalado

      const IORedis = require('ioredis');
      const cli = new IORedis(url);
      this.client = {
        get: (k: string) => cli.get(k),
        set: (k: string, v: string, mode?: string, duration?: number) =>
          cli.set(k, v, mode as any, duration as any),
        publish: (c: string, m: string) => cli.publish(c, m),
        del: (k: string) => cli.del(k),
      };
      this.logger.log('Redis conectado.');
    } catch (e) {
      this.logger.error(
        `Falha ao conectar no Redis: ${(e as Error).message}. Fallback em memória.`,
      );
      this.client = null;
    }
  }

  async onModuleDestroy() {
    // ioredis será fechado automaticamente quando processo sair; nada a fazer para fallback
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (this.client) {
      const raw = await this.client.get(key);
      if (raw !== null) {
        this.hits++;
      } else {
        this.misses++;
      }
      return raw ? (JSON.parse(raw) as T) : null;
    }
    const v = this.memory.get(key);
    if (v) {
      this.hits++;
      return JSON.parse(v) as T;
    }
    this.misses++;
    return null;
  }

  async set<T = any>(key: string, value: T, ttlSeconds?: number) {
    const raw = JSON.stringify(value);
    if (this.client) {
      if (ttlSeconds) await this.client.set(key, raw, 'EX', ttlSeconds);
      else await this.client.set(key, raw);
      return;
    }
    this.memory.set(key, raw);
  }

  async publish(channel: string, payload: any) {
    const msg = typeof payload === 'string' ? payload : JSON.stringify(payload);
    if (this.client) return this.client.publish(channel, msg);
    // Fallback: loga publicação
    this.logger.debug(`PUB ${channel}: ${msg}`);
    return 0;
  }

  async del(key: string) {
    if (this.client) return this.client.del(key);
    return this.memory.delete(key) ? 1 : 0;
  }

  incRateLimited() {
    this.rateLimitedTotal++;
  }

  incZkVerify(ok: boolean) {
    if (ok) this.zkVerifyOk++; else this.zkVerifyErr++;
  }

  incZkScore(ok: boolean) {
    if (ok) this.zkScoreOk++; else this.zkScoreErr++;
  }

  getStats() {
    return {
      connected: !!this.client,
      hits: this.hits,
      misses: this.misses,
      memoryItems: this.memory.size,
      rateLimitedTotal: this.rateLimitedTotal,
      zkVerifyOk: this.zkVerifyOk,
      zkVerifyErr: this.zkVerifyErr,
      zkScoreOk: this.zkScoreOk,
      zkScoreErr: this.zkScoreErr,
    };
  }

  async mDel(keys: string[]) {
    let count = 0;
    for (const k of keys) count += await this.del(k);
    return count;
  }
}
