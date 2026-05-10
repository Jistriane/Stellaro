import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SorobanService } from '../chain/soroban.service';
import * as StellarSdk from '@stellar/stellar-sdk';

export interface KycResult {
  ok: boolean;
  level: 'basic' | 'enhanced' | 'denied';
  reasons?: string[];
}

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sorobanService: SorobanService
  ) {}

  kycCheck(document: string, name: string): Promise<KycResult> {
    this.logger.log(`Starting KYC check for: ${name}`);

    if (!document || !name) {
      return Promise.resolve({
        ok: false,
        level: 'denied',
        reasons: ['invalid_input'],
      });
    }

    const cleanDoc = document.replace(/\D/g, '');
    if (cleanDoc.length < 11) {
      return Promise.resolve({
        ok: false,
        level: 'denied',
        reasons: ['invalid_document_format'],
      });
    }

    const isFlagged = cleanDoc.startsWith('000');
    if (isFlagged) {
      return Promise.resolve({
        ok: false,
        level: 'denied',
        reasons: ['sanction_list_match_detected'],
      });
    }

    return Promise.resolve({ ok: true, level: 'basic' });
  }

  /**
   * Issues an on-chain credential after KYC approval
   */
  async issueOnChainVC(userId: string, userAddress: string) {
    this.logger.log(`Issuing On-Chain VC for user ${userId} at ${userAddress}`);
    
    try {
      const adminSecret = process.env.MASTER_SECRET_KEY;
      const registryContractId = process.env.VC_REGISTRY_CONTRACT_ID || process.env.VC_REGISTRY_ID;

      if (!registryContractId) {
        throw new Error('VC Registry contract ID not configured');
      }

      await this.sorobanService.executeContractCall(
        registryContractId,
        'issue_vc',
        [
          StellarSdk.Address.fromString(userAddress).toScVal(),
          StellarSdk.xdr.ScVal.scvString('KYC-PASSPORT')
        ],
        adminSecret
      );

      this.logger.log(`Successfully issued VC for ${userAddress}`);
      return { success: true };
    } catch (e) {
      this.logger.error(`Failed to issue on-chain VC: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  async amlScreening(
    address: string,
  ): Promise<{ ok: boolean; flagged: boolean; reasons?: string[] }> {
    this.logger.log(`AML screening for address: ${address}`);

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
