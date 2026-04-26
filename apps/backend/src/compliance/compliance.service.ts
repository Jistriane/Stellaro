import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface KycResult {
  ok: boolean;
  level: 'basic' | 'enhanced' | 'denied';
  reasons?: string[];
}

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private readonly prisma: PrismaService) {}

  kycCheck(document: string, name: string): Promise<KycResult> {
    this.logger.log(`Starting KYC check for: ${name}`);

    if (!document || !name) {
      return Promise.resolve({
        ok: false,
        level: 'denied',
        reasons: ['invalid_input'],
      });
    }

    // Em produção: Integração com Sumsub/SanctionLists
    // Por ora, validamos se o documento está em nossa "black list" interna ou se o formato é inválido
    const cleanDoc = document.replace(/\D/g, '');
    if (cleanDoc.length < 11) {
      return Promise.resolve({
        ok: false,
        level: 'denied',
        reasons: ['invalid_document_format'],
      });
    }

    // Simulação de check de Sanction List (stub expandido)
    const isFlagged = cleanDoc.startsWith('000'); // Exemplo de regra de flag
    if (isFlagged) {
      return Promise.resolve({
        ok: false,
        level: 'denied',
        reasons: ['sanction_list_match_detected'],
      });
    }

    return Promise.resolve({ ok: true, level: 'basic' });
  }

  async amlScreening(
    address: string,
  ): Promise<{ ok: boolean; flagged: boolean; reasons?: string[] }> {
    this.logger.log(`AML screening for address: ${address}`);

    // Regra 1: Checar se o endereço já foi reportado em nosso banco de dados
    const existingAudit = await this.prisma.auditLog.findFirst({
      where: {
        action: 'SECURITY_ALERT',
        resourceId: address,
        level: 'SECURITY',
      },
    });

    if (existingAudit) {
      return {
        ok: false,
        flagged: true,
        reasons: ['address_historically_flagged'],
      };
    }

    // Regra 2: Simular análise de comportamento (volumetria/frequência)
    // Em produção: integrar com Chainalysis ou Elliptic
    return { ok: true, flagged: false };
  }

  async canRoutePixOrCard(
    userId: string,
  ): Promise<{ ok: boolean; allowed: boolean; level: string }> {
    const profile = await this.prisma.kycProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!profile) {
      return { ok: false, allowed: false, level: 'none' };
    }

    const isApproved = profile.status === 'APPROVED';
    return {
      ok: true,
      allowed: isApproved,
      level: isApproved ? 'basic' : 'pending',
    };
  }

  getLimits(userId: string) {
    // Em produção: buscar limites baseados no nível de KYC e histórico
    // Por ora, retornamos limites padrão
    return Promise.resolve({
      userId,
      limits: [
        {
          id: 'pix_daily',
          name: 'PIX Daily Limit',
          current: 0,
          limit: 5000,
          unit: 'BRL',
          category: 'pix',
        },
        {
          id: 'withdraw_daily',
          name: 'Withdraw Daily Limit',
          current: 0,
          limit: 10000,
          unit: 'BRL',
          category: 'withdraw',
        },
        {
          id: 'trade_daily',
          name: 'Trade Daily Limit',
          current: 0,
          limit: 50000,
          unit: 'BRL',
          category: 'trade',
        },
      ],
    });
  }
}
