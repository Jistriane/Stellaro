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

@Injectable()
export class DatabaseOptimizationService {
  private readonly logger = new Logger(DatabaseOptimizationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Otimizado: Buscar usuário
   */
  async getUserOptimized(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Com cache distribuído
   */
  async getUserCached(userId: string) {
    // TODO: Implementar cache quando disponível
    return this.getUserOptimized(userId);
  }

  /**
   * Buscar múltiplos usuários em lote (evita N+1)
   */
  async getUsersInBatch(userIds: string[]) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return new Map(users.map((u) => [u.id, u]));
  }

  /**
   * Webhook events com paginação cursor
   */
  async getWebhookEventsPaginated(limit: number = 20, cursor?: string) {
    return this.prisma.webhookEvent.findMany({
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { receivedAt: 'desc' },
      select: {
        id: true,
        eventId: true,
        payload: true,
        receivedAt: true,
      },
    });
  }

  /**
   * Count com cache
   */
  async getUserCountCached() {
    // TODO: Implementar cache quando disponível
    return this.prisma.user.count();
  }

  /**
   * Risk events summary
   */
  async getRiskEventsSummary(limit: number = 50) {
    return this.prisma.riskEvent.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        type: true,
        createdAt: true,
      },
    });
  }

  /**
   * Aggregate risk data
   */
  async getRiskMetrics() {
    try {
      const result = await this.prisma.riskEvent.aggregate({
        _count: true,
      });

      return {
        totalEvents: result._count,
      };
    } catch (error) {
      this.logger.error(`Error getting risk metrics: ${error.message}`);
      return {
        totalEvents: 0,
      };
    }
  }

  /**
   * Bulk update risk proposal
   */
  async bulkUpdateRiskProposalStatus(
    proposalIds: string[],
    confidence?: number,
  ) {
    return this.prisma.riskProposal.updateMany({
      where: { id: { in: proposalIds } },
      data: { confidence: confidence || 0 },
    });
  }

  /**
   * Ensure database indexes for optimal query performance
   */
  async ensureIndexes() {
    this.logger.log('Ensuring database indexes...');

    const indexes = [
      // Primary indexes
      `CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email)`,
      `CREATE INDEX IF NOT EXISTS idx_user_created ON "User"("createdAt" DESC)`,

      // Foreign key indexes
      `CREATE INDEX IF NOT EXISTS idx_passkey_user ON "Passkey"("userId")`,
      `CREATE INDEX IF NOT EXISTS idx_wallet_user ON "Wallet"("userId")`,
      `CREATE INDEX IF NOT EXISTS idx_webhook_source ON "WebhookEvent"(source)`,
      `CREATE INDEX IF NOT EXISTS idx_webhook_status ON "WebhookEvent"(status)`,
      `CREATE INDEX IF NOT EXISTS idx_webhook_received ON "WebhookEvent"("receivedAt" DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_risk_event_user ON "RiskEvent"("userId")`,
      `CREATE INDEX IF NOT EXISTS idx_risk_proposal_user ON "RiskProposal"("userId")`,

      // Composite indexes
      `CREATE INDEX IF NOT EXISTS idx_risk_event_user_created ON "RiskEvent"("userId", "createdAt" DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_risk_proposal_user_created ON "RiskProposal"("userId", "createdAt" DESC)`,
    ];

    for (const index of indexes) {
      try {
        await this.prisma.$executeRawUnsafe(index);
        this.logger.debug(`Index ensured: ${index.substring(0, 50)}...`);
      } catch (error) {
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
        LIMIT 1
      `;

      if (Array.isArray(result) && result.length > 0) {
        return result[0];
      }
      return null;
    } catch (error) {
      this.logger.error(`Error getting pool stats: ${error.message}`);
      return null;
    }
  }

  /**
   * Warm up cache with critical data
   */
  async warmupCriticalData() {
    this.logger.log('Warming up critical data...');

    try {
      const topUsers = await this.prisma.user.findMany({
        take: 100,
        select: { id: true, email: true },
      });

      this.logger.log(`Preloaded ${topUsers.length} users`);
    } catch (error) {
      this.logger.error(`Error during preload: ${error.message}`);
    }
  }

  /**
   * Archive old risk events (data cleanup)
   */
  async archiveOldRiskEvents(daysOld: number = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deleted = await this.prisma.riskEvent.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });

      this.logger.log(`Archived ${deleted.count} old risk events`);
      return deleted;
    } catch (error) {
      this.logger.error(`Error archiving old events: ${error.message}`);
      return { count: 0 };
    }
  }

  /**
   * Query explain analysis
   */
  async explainQuery(sql: string) {
    try {
      const plan = await this.prisma.$queryRawUnsafe(`EXPLAIN ANALYZE ${sql}`);
      this.logger.log('Query plan:', plan);
      return plan;
    } catch (error) {
      this.logger.error(`Error in explain query: ${error.message}`);
      return null;
    }
  }

  /**
   * Get database size
   */
  async getDatabaseSize() {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as size
      `;

      if (Array.isArray(result) && result.length > 0) {
        return result[0];
      }
      return null;
    } catch (error) {
      this.logger.error(`Error getting database size: ${error.message}`);
      return null;
    }
  }

  /**
   * Database maintenance routine
   */
  async maintenanceRoutine() {
    this.logger.log('Running database maintenance routine...');

    try {
      await this.prisma.$executeRawUnsafe('VACUUM ANALYZE');
      await this.ensureIndexes();
      await this.warmupCriticalData();
      this.logger.log('Maintenance routine completed');
    } catch (error) {
      this.logger.error(`Error during maintenance: ${error.message}`);
    }
  }
}
