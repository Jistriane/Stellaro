/**
 * Redis Caching Service - Stellaro
 *
 * Estratégia multi-camada:
 * 1. In-memory cache (rápido)
 * 2. Redis (distribuído)
 * 3. Database (persistência)
 */

import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export interface CacheConfig {
  ttl: number; // seconds
  key: string;
  tags?: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;
  private memoryCache: Map<string, { data: any; expiresAt: number }> =
    new Map();
  private stats = { hits: 0, misses: 0 };

  // Padrões de cache comum
  private readonly CACHE_TTL = {
    PRICES: 60, // 1 minuto (preços mudam frequente)
    PORTFOLIO: 300, // 5 minutos
    ANALYTICS: 3600, // 1 hora
    USER_DATA: 1800, // 30 minutos
    MARKET_DATA: 120, // 2 minutos
  };

  constructor(private configService: ConfigService) {
    this.initRedis();
  }

  private initRedis() {
    const directUrl = this.configService.get<string>('REDIS_URL');
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<string>('REDIS_PORT');
    const redisUrl =
      directUrl ?? (host && port ? `redis://${host}:${port}` : undefined) ?? 'redis://localhost:6379';

    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    this.redis.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.redis.connect().catch((err) => {
      this.logger.error(`Failed to connect to Redis: ${err.message}`);
    });
  }

  /**
   * Obter valor com estratégia L1 (memória) → L2 (Redis) → L3 (DB)
   */
  async get<T>(key: string): Promise<T | null> {
    // L1: In-memory cache
    const memCached = this.getFromMemory<T>(key);
    if (memCached) {
      this.stats.hits++;
      this.logger.debug(`[L1] Cache hit: ${key}`);
      return memCached;
    }

    // L2: Redis
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        this.stats.hits++;
        this.logger.debug(`[L2] Cache hit: ${key}`);

        const parsed = JSON.parse(cached);
        this.setInMemory(key, parsed, 300); // Cache em memória por 5 min
        return parsed;
      }
    } catch (error) {
      this.logger.error(`Redis get error for ${key}: ${error.message}`);
    }

    this.stats.misses++;
    this.logger.debug(`[L3] Cache miss: ${key}`);
    return null;
  }

  /**
   * Setar valor (ambas as camadas)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const cacheTtl = ttl || this.CACHE_TTL.USER_DATA;

    // L1: In-memory
    this.setInMemory(key, value, Math.min(cacheTtl, 600)); // Max 10 min em memória

    // L2: Redis
    try {
      await this.redis.setex(key, cacheTtl, JSON.stringify(value));
      this.logger.debug(`Cache set: ${key} (TTL: ${cacheTtl}s)`);
    } catch (error) {
      this.logger.error(`Redis set error for ${key}: ${error.message}`);
    }
  }

  /**
   * Invalidar cache (ambas as camadas)
   */
  async invalidate(pattern: string): Promise<number> {
    // L1: In-memory
    const keysToDelete: string[] = [];
    for (const [key] of this.memoryCache.entries()) {
      if (this.patternMatch(key, pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.memoryCache.delete(key));

    // L2: Redis
    let deletedCount = 0;
    try {
      if (pattern.includes('*')) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          deletedCount = await this.redis.del(...keys);
        }
      } else {
        deletedCount = await this.redis.del(pattern);
      }
      this.logger.log(`Cache invalidated: ${pattern} (${deletedCount} keys)`);
    } catch (error) {
      this.logger.error(`Redis invalidate error: ${error.message}`);
    }

    return deletedCount + keysToDelete.length;
  }

  /**
   * Cache com callback (carrega do DB se necessário)
   */
  async remember<T>(
    key: string,
    ttl: number,
    callback: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) {
      return cached;
    }

    const value = await callback();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Cache para queryies complexas (com invalidação automática)
   */
  async cacheQuery<T>(
    query: string,
    callback: () => Promise<T>,
    options: {
      ttl?: number;
      tags?: string[];
      dependencies?: string[];
    } = {},
  ): Promise<T> {
    const key = `query:${Buffer.from(query).toString('base64')}`;
    const ttl = options.ttl || 3600;
    const tags = options.tags || [];
    const dependencies = options.dependencies || [];

    // Tentar cache
    const cached = await this.get<T>(key);
    if (cached) return cached;

    // Executar query
    const result = await callback();

    // Cachear com tags para invalidação agrupada
    await this.set(key, result, ttl);

    // Registrar tags para invalidação posterior
    if (tags.length > 0) {
      await this.addTaggedKey(key, tags);
    }

    // Registrar dependências
    if (dependencies.length > 0) {
      await this.setKeyDependencies(key, dependencies);
    }

    return result;
  }

  /**
   * Invalidar por tags
   */
  async invalidateByTag(tag: string): Promise<number> {
    try {
      const keys = await this.redis.smembers(`tag:${tag}`);
      let count = 0;

      for (const key of keys) {
        this.memoryCache.delete(key);
        const deleted = await this.redis.del(key);
        count += deleted;
      }

      await this.redis.del(`tag:${tag}`);
      this.logger.log(`Cache invalidated by tag: ${tag} (${count} keys)`);
      return count;
    } catch (error) {
      this.logger.error(`Error invalidating by tag: ${error.message}`);
      return 0;
    }
  }

  /**
   * Limpar cache expirado
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, { expiresAt }] of this.memoryCache.entries()) {
      if (expiresAt < now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.memoryCache.delete(key));

    this.logger.debug(
      `Cleaned up ${keysToDelete.length} expired keys from memory`,
    );

    // Redis limpa automaticamente com SETEX
  }

  /**
   * Estatísticas de cache
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      memoryUsage: this.getMemoryUsage(),
    };
  }

  /**
   * Reset de estatísticas
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Warm up cache com dados críticos
   */
  async warmUp(data: Map<string, { value: any; ttl: number }>): Promise<void> {
    this.logger.log(`Warming up cache with ${data.size} keys`);

    for (const [key, { value, ttl }] of data.entries()) {
      try {
        await this.set(key, value, ttl);
      } catch (error) {
        this.logger.error(`Failed to warm up ${key}: ${error.message}`);
      }
    }

    this.logger.log('Cache warm-up completed');
  }

  /**
   * Monitorar saúde do Redis
   */
  async health(): Promise<{
    redis: boolean;
    memory: string;
    connected: boolean;
  }> {
    try {
      const info = await this.redis.info('memory');
      const connected = this.redis.status === 'ready';

      return {
        redis: true,
        memory:
          info.split('\r\n').find((line) => line.includes('used_memory:')) ||
          '',
        connected,
      };
    } catch {
      return {
        redis: false,
        memory: '',
        connected: false,
      };
    }
  }

  /**
   * Privados
   */

  private getFromMemory<T>(key: string): T | null {
    const cached = this.memoryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    if (cached) {
      this.memoryCache.delete(key);
    }
    return null;
  }

  private setInMemory(key: string, data: any, ttl: number): void {
    this.memoryCache.set(key, {
      data,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  private patternMatch(key: string, pattern: string): boolean {
    if (!pattern.includes('*')) return key === pattern;

    const regex = new RegExp(
      `^${pattern.replace(/\*/g, '.*').replace(/\?/g, '.')}$`,
    );
    return regex.test(key);
  }

  private getMemoryUsage(): number {
    let size = 0;
    for (const { data } of this.memoryCache.values()) {
      size += JSON.stringify(data).length;
    }
    return size;
  }

  private async addTaggedKey(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      await this.redis.sadd(`tag:${tag}`, key);
    }
  }

  private async setKeyDependencies(
    key: string,
    dependencies: string[],
  ): Promise<void> {
    for (const dep of dependencies) {
      await this.redis.sadd(`deps:${key}`, dep);
    }
  }
}
