import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

/**
 * Passkey Session Manager
 * Implementa Session Keys para batch operations
 * Reduz necessidade de re-autenticação biométrica
 */

export interface SessionKeyConfig {
  duration: number; // seconds
  maxAmount: string; // max value per operation
  allowedOperations: string[];
  allowedDestinations: string[];
  biometricRefresh: boolean;
}

export interface SessionKey {
  id: string;
  userId: string;
  publicKey: string;
  config: SessionKeyConfig;
  createdAt: Date;
  expiresAt: Date;
  lastUsed?: Date;
  operationsCount: number;
}

export interface BatchOperation {
  type: 'payment' | 'swap' | 'manage_offer' | 'mint' | 'burn';
  destination?: string;
  amount?: string;
  asset?: string;
}

@Injectable()
export class PasskeySessionService {
  private readonly logger = new Logger(PasskeySessionService.name);
  private readonly activeSessions: Map<string, SessionKey> = new Map();

  constructor(private prisma: PrismaService) {}

  /**
   * Cria nova session key após autenticação passkey
   */
  async createSession(
    userId: string,
    credentialId: string,
    config: Partial<SessionKeyConfig> = {},
  ): Promise<SessionKey> {
    // Valida que passkey existe
    const passkey = await this.prisma.passkey.findUnique({
      where: { credentialId },
    });

    if (!passkey || passkey.userId !== userId) {
      throw new Error('Invalid passkey');
    }

    // Gera keypair temporária
    const sessionKeyPair = this.generateSessionKeyPair();

    const sessionConfig: SessionKeyConfig = {
      duration: config.duration || 3600, // 1h default
      maxAmount: config.maxAmount || '1000',
      allowedOperations: config.allowedOperations || [
        'payment',
        'swap',
        'manage_offer',
      ],
      allowedDestinations: config.allowedDestinations || ['*'],
      biometricRefresh: config.biometricRefresh ?? true,
    };

    const now = new Date();
    const session: SessionKey = {
      id: crypto.randomUUID(),
      userId,
      publicKey: sessionKeyPair.publicKey,
      config: sessionConfig,
      createdAt: now,
      expiresAt: new Date(now.getTime() + sessionConfig.duration * 1000),
      operationsCount: 0,
    };

    // Armazena em memória (pode usar Redis para produção)
    this.activeSessions.set(session.id, session);

    // Incrementa signCount no passkey
    await this.prisma.passkey.update({
      where: { credentialId },
      data: { signCount: { increment: 1 } },
    });

    this.logger.log(
      `Session created for user ${userId}, expires at ${session.expiresAt.toISOString()}`,
    );

    return session;
  }

  /**
   * Valida e retorna session ativa
   */
  async getActiveSession(sessionId: string): Promise<SessionKey | null> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Verifica expiração
    if (new Date() > session.expiresAt) {
      this.activeSessions.delete(sessionId);
      this.logger.debug(`Session ${sessionId} expired`);
      return null;
    }

    return session;
  }

  /**
   * Executa batch de operações usando session key
   */
  async executeBatch(
    sessionId: string,
    operations: BatchOperation[],
  ): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
    requiresRefresh?: boolean;
  }> {
    const session = await this.getActiveSession(sessionId);

    if (!session) {
      return {
        success: false,
        error: 'Session invalid or expired',
        requiresRefresh: true,
      };
    }

    // Valida permissões
    const validation = this.validateOperations(session, operations);
    if (!validation.valid) {
      this.logger.warn(
        `Permission denied for session ${sessionId}: ${validation.reason}`,
      );

      // Se excedeu limite de valor, solicita biometric refresh
      if (validation.reason === 'amount_exceeded') {
        return {
          success: false,
          error: 'Amount limit exceeded',
          requiresRefresh: true,
        };
      }

      return {
        success: false,
        error: validation.reason,
      };
    }

    try {
      // TODO: Integrar com Stellar SDK para submeter batch
      // Por ora, simula execução
      const txHash = this.simulateBatchExecution(operations);

      // Atualiza session stats
      session.lastUsed = new Date();
      session.operationsCount += operations.length;
      this.activeSessions.set(sessionId, session);

      this.logger.log(
        `Batch executed: ${operations.length} ops, tx: ${txHash}`,
      );

      return {
        success: true,
        txHash,
      };
    } catch (error) {
      this.logger.error(`Batch execution failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Refresh session com nova autenticação biométrica
   */
  async refreshSession(
    sessionId: string,
    credentialId: string,
  ): Promise<SessionKey | null> {
    const oldSession = await this.getActiveSession(sessionId);

    if (!oldSession) {
      return null;
    }

    // Invalida session antiga
    this.activeSessions.delete(sessionId);

    // Cria nova session com mesma config
    return this.createSession(
      oldSession.userId,
      credentialId,
      oldSession.config,
    );
  }

  /**
   * Revoga session
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    const deleted = this.activeSessions.delete(sessionId);
    if (deleted) {
      this.logger.log(`Session ${sessionId} revoked`);
    }
    return deleted;
  }

  /**
   * Revoga todas sessions de um usuário
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    let count = 0;
    for (const [id, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(id);
        count++;
      }
    }
    this.logger.log(`Revoked ${count} sessions for user ${userId}`);
    return count;
  }

  /**
   * Valida se operações estão dentro dos limites da session
   */
  private validateOperations(
    session: SessionKey,
    operations: BatchOperation[],
  ): { valid: boolean; reason?: string } {
    // Valida tipos de operação
    for (const op of operations) {
      if (!session.config.allowedOperations.includes(op.type)) {
        return {
          valid: false,
          reason: `Operation ${op.type} not allowed`,
        };
      }
    }

    // Valida destinos
    if (!session.config.allowedDestinations.includes('*')) {
      for (const op of operations) {
        if (
          op.destination &&
          !session.config.allowedDestinations.includes(op.destination)
        ) {
          return {
            valid: false,
            reason: `Destination ${op.destination} not allowed`,
          };
        }
      }
    }

    // Valida valor total
    const totalValue = operations.reduce((sum, op) => {
      return sum + parseFloat(op.amount || '0');
    }, 0);

    if (totalValue > parseFloat(session.config.maxAmount)) {
      return {
        valid: false,
        reason: 'amount_exceeded',
      };
    }

    return { valid: true };
  }

  /**
   * Gera keypair temporária para session
   */
  private generateSessionKeyPair(): {
    publicKey: string;
    privateKey: string;
  } {
    const keyPair = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey, // Armazena criptografado em produção
    };
  }

  /**
   * Simula execução de batch (placeholder)
   */
  private simulateBatchExecution(operations: BatchOperation[]): string {
    // TODO: Integrar com Stellar SDK
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(operations))
      .digest('hex');
    return hash.substring(0, 64);
  }

  /**
   * Cleanup de sessions expiradas (executar periodicamente)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    let count = 0;

    for (const [id, session] of this.activeSessions.entries()) {
      if (now > session.expiresAt) {
        this.activeSessions.delete(id);
        count++;
      }
    }

    if (count > 0) {
      this.logger.debug(`Cleaned up ${count} expired sessions`);
    }

    return count;
  }

  /**
   * Obtém estatísticas de sessions
   */
  getSessionStats() {
    const sessions = Array.from(this.activeSessions.values());
    const now = new Date();

    return {
      total: sessions.length,
      active: sessions.filter((s) => now <= s.expiresAt).length,
      expired: sessions.filter((s) => now > s.expiresAt).length,
      byUser: sessions.reduce(
        (acc, s) => {
          acc[s.userId] = (acc[s.userId] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }
}
