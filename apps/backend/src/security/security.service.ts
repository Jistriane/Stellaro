import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { PasskeyService } from '../passkey/passkey.service';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly passkey: PasskeyService,
  ) {}

  async blockUser(userId: string, reason?: string) {
    await this.redis.set(
      `block:user:${userId}`,
      { reason: reason ?? 'blocked_by_admin', ts: Date.now() },
      24 * 3600,
    );
    await this.passkey.revokeUserSessions(userId);
    return { ok: true };
  }

  async unblockUser(userId: string) {
    await this.redis.del(`block:user:${userId}`);
    return { ok: true };
  }

  async revokeSessions(userId: string) {
    return this.passkey.revokeUserSessions(userId);
  }

  async rotateTokens(userId: string) {
    // Integração com provedores para rotacionar tokens (PIX/Cards)
    this.logger.log(`Initiating token rotation for user: ${userId}`);

    try {
      // 1. Rotacionar tokens de sessão/JWT (invalida os antigos)
      await this.passkey.revokeUserSessions(userId);

      // 2. Se o usuário tiver integração PIX/Card ativa, poderíamos chamar as APIs aqui
      // Por enquanto, registramos que a rotação lógica foi disparada
      const metadata = {
        automated: true,
        rotatedAt: new Date().toISOString(),
        services: ['auth', 'session'],
      };

      // Registrar auditoria
      await this.prisma.auditLog.create({
        data: {
          userId,
          channel: 'BOTH',
          level: 'WARN',
          action: 'TOKEN_ROTATION_EXECUTED',
          metadata,
        },
      });

      return { ok: true, rotatedAt: metadata.rotatedAt };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Token rotation failed for ${userId}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Rotação global de chaves de infraestrutura (apenas admin)
   */
  async rotateInfrastructureKeys() {
    this.logger.warn('GLOBAL INFRASTRUCTURE KEY ROTATION INITIATED');

    // Em produção, isso integraria com AWS Secrets Manager, Azure Key Vault ou HashiCorp Vault
    // Aqui simulamos a expiração de caches e refresh de tokens de serviço
    await this.redis.del('config:global:tokens');

    await this.prisma.auditLog.create({
      data: {
        channel: 'BOTH',
        level: 'SECURITY',
        action: 'INFRA_KEY_ROTATION',
        metadata: {
          timestamp: new Date().toISOString(),
          scope: 'infrastructure',
        },
      },
    });

    return { ok: true, status: 'keys_rotated' };
  }
}
