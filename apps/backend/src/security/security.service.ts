import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { PasskeyService } from '../passkey/passkey.service';

@Injectable()
export class SecurityService {
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
    // Stub: aqui integrar com provedor de cartões/pagamentos para rotacionar tokens
    // Registrar auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        channel: 'OFFCHAIN',
        level: 'WARN',
        message: 'rotate_tokens',
        metadata: { automated: true },
      } as any,
    });
    return { ok: true };
  }
}
