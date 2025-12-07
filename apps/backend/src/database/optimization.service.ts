/**
 * Database Query Optimization Service
 * 
 * Best practices:
 * - Eager loading (relations)
 * - Select apenas colunas necessárias
 * - Índices estratégicos
 * - Connection pooling
 * - Query caching
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from './cache.service';

@Injectable()
export class DatabaseOptimizationService {
  private readonly logger = new Logger(DatabaseOptimizationService.name);

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  /**
   * Otimizado: Buscar usuário com portfólio (sem cache)
   */
  async getUserWithPortfolio(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        // Eager load portfolio
        portfolio: {
          select: {
            id: true,
            assetCode: true,
            quantity: true,
            value: true,
          },
          orderBy: { value: 'desc' },
          take: 10, // Apenas top 10 assets
        },
        // Eager load metadata essencial
        metadata: {
          select: {
            totalValue: true,
            riskScore: true,
          },
        },
      },
    });
  }

  /**
   * Com cache distribuído
   */
  async getUserWithPortfolioCached(userId: string) {
    return this.cache.remember(
      `user:${userId}:portfolio`,
      300, // 5 minutos
      () => this.getUserWithPortfolio(userId),
    );
  }

  /**
   * Buscar múltiplos usuários em lote (evita N+1)
   */
  async getUsersWithPortfolios(userIds: string[]) {
    // Batch query (1 query ao invés de N)
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        portfolio: {
          select: { assetCode: true, quantity: true },
        },
      },
    });

    // Map para acesso rápido
    return new Map(users.map((u) => [u.id, u]));
  }

  /**
   * Paginar resultados com cursor (melhor que offset)
   */
  async getTransactionsPaginated(
    userId: string,
    limit: number = 20,
    cursor?: string,
  ) {
    return this.prisma.transaction.findMany({
      where: { userId },
      take: limit + 1, // +1 para verificar se há mais
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        amount: true,
        fee: true,
        createdAt: true,
      },
    });
  }

  /**
   * Agregações com Prisma (evita client-side processing)
   */
  async getPortfolioStats(userId: string) {
    const stats = await this.prisma.portfolio.aggregate({
      where: { userId },
      _sum: { value: true },
      _avg: { value: true },
      _max: { value: true },
      _min: { value: true },
      _count: true,
    });

    return {
      totalValue: stats._sum.value || 0,
      averageValue: stats._avg.value || 0,
      maxAsset: stats._max.value || 0,
      minAsset: stats._min.value || 0,
      assetCount: stats._count,
    };
  }

  /**
   * Busca com full-text search (PostgreSQL)
   */
  async searchTransactions(userId: string, query: string) {
    return this.prisma.$queryRawUnsafe(`
      SELECT id, type, description, amount, createdAt
      FROM transactions
      WHERE "userId" = $1
      AND (
        description ILIKE $2
        OR type ILIKE $2
      )
      ORDER BY "createdAt" DESC
      LIMIT 50
    `, userId, `%${query}%`);
  }

  /**
   * Índices de banco de dados (criar uma vez)
   */
  async ensureIndexes() {
    this.logger.log('Ensuring database indexes...');

    const indexes = [
      // Índices simples
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_portfolio_userid ON portfolio("userId")`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_userid ON transactions("userId", "createdAt")`,
      
      // Índices compostos
      `CREATE INDEX IF NOT EXISTS idx_portfolio_userid_asset ON portfolio("userId", "assetCode")`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions("userId", "type", "createdAt")`,
      
      // Índices para range queries
      `CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions("createdAt" DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_portfolio_value ON portfolio("value" DESC)`,
      
      // Full-text search index (PostgreSQL)
      `CREATE INDEX IF NOT EXISTS idx_transactions_description ON transactions USING GIN(
        to_tsvector('english', description)
      )`,
    ];

    for (const index of indexes) {
      try {
        await this.prisma.$executeRawUnsafe(index);
        this.logger.debug(`Index ensured: ${index.substring(0, 50)}...`);
      } catch (error) {
        // Index pode já existir
        if (!error.message.includes('already exists')) {
          this.logger.error(`Index error: ${error.message}`);
        }
      }
    }
  }

  /**
   * Connection pool monitoring
   */
  async getConnectionPoolStats() {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          datname,
          numbackends,
          usename
        FROM pg_stat_database
        WHERE datname = current_database()
      `;

      return result[0];
    } catch (error) {
      this.logger.error(`Error getting pool stats: ${error.message}`);
      return null;
    }
  }

  /**
   * Warm up cache com dados críticos
   */
  async warmupCriticalData() {
    this.logger.log('Warming up critical data cache...');

    // Top 100 usuários ativos
    const topUsers = await this.prisma.user.findMany({
      where: { status: 'active' },
      orderBy: { lastActiveAt: 'desc' },
      take: 100,
      select: { id: true },
    });

    const warmupMap = new Map();
    for (const user of topUsers) {
      warmupMap.set(`user:${user.id}:portfolio`, {
        value: await this.getUserWithPortfolio(user.id),
        ttl: 300,
      });
    }

    await this.cache.warmUp(warmupMap);
  }

  /**
   * Batch upsert (melhor que múltiplos updates)
   */
  async batchUpsertPortfolio(
    userId: string,
    assets: Array<{ code: string; quantity: number; value: number }>,
  ) {
    return this.prisma.$transaction([
      // Delete antigos
      this.prisma.portfolio.deleteMany({
        where: { userId },
      }),
      // Insert novos
      this.prisma.portfolio.createMany({
        data: assets.map((asset) => ({
          userId,
          assetCode: asset.code,
          quantity: asset.quantity,
          value: asset.value,
        })),
      }),
    ]);
  }

  /**
   * Limpeza de dados antigos (arquivamento)
   */
  async archiveOldTransactions(daysOld: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const archived = await this.prisma.transaction.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: 'completed',
      },
    });

    this.logger.log(`Archived ${archived.count} old transactions`);
    return archived;
  }

  /**
   * Query explain analysis
   */
  async explainQuery(sql: string) {
    try {
      const plan = await this.prisma.$queryRawUnsafe(`EXPLAIN ${sql}`);
      this.logger.log('Query plan:', plan);
      return plan;
    } catch (error) {
      this.logger.error(`Explain error: ${error.message}`);
      return null;
    }
  }

  /**
   * Connection pool tuning
   */
  getConnectionPoolConfig() {
    return {
      // Baseado em recomendações Prisma/PostgreSQL
      max: parseInt(process.env.DATABASE_POOL_SIZE || '20'),
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      // Para aplicações Serverless
      connection: {
        timezone: 'UTC',
      },
    };
  }

  /**
   * Detecção de slow queries
   */
  async monitorSlowQueries(thresholdMs: number = 1000) {
    // Enable slow query log no PostgreSQL
    const result = await this.prisma.$queryRaw`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        max_time
      FROM pg_stat_statements
      WHERE mean_time > $1
      ORDER BY mean_time DESC
      LIMIT 10
    `;

    return result;
  }
}
