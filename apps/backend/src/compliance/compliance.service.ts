import { Injectable, Logger } from '@nestjs/common';
import { Prisma, TravelRuleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SorobanService } from '../chain/soroban.service';
import * as StellarSdk from '@stellar/stellar-sdk';
import { TravelRuleProviderService } from './travel-rule-provider.service';

export interface KycResult {
  ok: boolean;
  level: 'basic' | 'enhanced' | 'denied';
  reasons?: string[];
}

type KycSubmissionBody = {
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  dob?: string;
  publicKey?: string;
  document: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  revenue?: string;
};

type KycFiles = {
  idDocument?: Array<{
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
  }>;
  selfie?: Array<{
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
  }>;
  addressProof?: Array<{
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
  }>;
  revenueProof?: Array<{
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
  }>;
};

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sorobanService: SorobanService,
    private readonly travelRuleProvider: TravelRuleProviderService,
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

  async submitKycApplication(body: KycSubmissionBody, files: KycFiles) {
    const baseResult = await this.kycCheck(body.document, body.name);
    const attachmentMeta = {
      idDocument: files.idDocument?.[0]
        ? {
            name: files.idDocument[0].originalname,
            type: files.idDocument[0].mimetype,
            size: files.idDocument[0].size,
            path: files.idDocument[0].path,
          }
        : null,
      selfie: files.selfie?.[0]
        ? {
            name: files.selfie[0].originalname,
            type: files.selfie[0].mimetype,
            size: files.selfie[0].size,
            path: files.selfie[0].path,
          }
        : null,
      addressProof: files.addressProof?.[0]
        ? {
            name: files.addressProof[0].originalname,
            type: files.addressProof[0].mimetype,
            size: files.addressProof[0].size,
            path: files.addressProof[0].path,
          }
        : null,
      revenueProof: files.revenueProof?.[0]
        ? {
            name: files.revenueProof[0].originalname,
            type: files.revenueProof[0].mimetype,
            size: files.revenueProof[0].size,
            path: files.revenueProof[0].path,
          }
        : null,
    };

    const profilePayload = {
      applicant: {
        name: body.name,
        email: body.email ?? null,
        phone: body.phone ?? null,
        dob: body.dob ?? null,
        publicKey: body.publicKey ?? null,
      },
      identity: {
        document: body.document,
      },
      address: {
        addressLine1: body.addressLine1 ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        postalCode: body.postalCode ?? null,
        country: body.country ?? 'BR',
      },
      financial: {
        revenue: body.revenue ?? null,
      },
      attachments: attachmentMeta,
      screening: {
        ok: baseResult.ok,
        level: baseResult.level,
        reasons: baseResult.reasons ?? [],
      },
      submittedAt: new Date().toISOString(),
    };

    let referenceId: string | null = null;
    if (body.userId) {
      const created = await this.prisma.kycProfile.create({
        data: {
          userId: body.userId,
          provider: 'MANUAL',
          status: baseResult.ok ? 'PENDING' : 'REJECTED',
          data: profilePayload,
        },
      });
      referenceId = created.id;
    }

    return {
      ok: baseResult.ok,
      level: baseResult.level,
      reasons: baseResult.reasons,
      status: baseResult.ok ? 'waiting_validation' : 'rejected',
      uploaded: {
        idDocument: Boolean(attachmentMeta.idDocument),
        selfie: Boolean(attachmentMeta.selfie),
        addressProof: Boolean(attachmentMeta.addressProof),
        revenueProof: Boolean(attachmentMeta.revenueProof),
      },
      referenceId,
    };
  }

  async getLatestKycForUser(userId: string) {
    const latest = await this.prisma.kycProfile.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    if (!latest) {
      return {
        hasSubmission: false,
        status: 'Not started',
        progressPct: 0,
        nextStep: 'Submit KYC application',
        documents: [],
      };
    }

    const rawData = (latest.data ?? {}) as any;
    const attachments = rawData.attachments ?? {};
    const docs = [
      {
        key: 'idDocument',
        label: 'ID (front/back)',
        file: attachments.idDocument ?? null,
      },
      {
        key: 'selfie',
        label: 'Selfie holding ID',
        file: attachments.selfie ?? null,
      },
      {
        key: 'addressProof',
        label: 'Proof of address',
        file: attachments.addressProof ?? null,
      },
      {
        key: 'revenueProof',
        label: 'Revenue proof',
        file: attachments.revenueProof ?? null,
      },
    ].map((item) => ({
      ...item,
      status: item.file
        ? latest.status === 'APPROVED'
          ? 'Approved'
          : latest.status === 'REJECTED'
            ? 'Rejected'
            : 'Under review'
        : 'Pending',
    }));

    const progressPct = docs.reduce(
      (acc, item) => acc + (item.file ? 25 : 0),
      0,
    );
    const nextPending = docs.find((item) => !item.file);

    return {
      hasSubmission: true,
      referenceId: latest.id,
      status:
        latest.status === 'APPROVED'
          ? 'Approved'
          : latest.status === 'REJECTED'
            ? 'Rejected'
            : 'Waiting for validation',
      progressPct,
      nextStep: nextPending
        ? `Upload ${nextPending.label}`
        : 'Awaiting compliance validation',
      level: latest.status === 'APPROVED' ? 'Enhanced' : 'Basic',
      documents: docs,
      updatedAt: latest.updatedAt,
    };
  }

  async getKycHistoryForUser(userId: string) {
    const rows = await this.prisma.kycProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      items: rows.map((row) => ({
        id: row.id,
        status:
          row.status === 'APPROVED'
            ? 'Approved'
            : row.status === 'REJECTED'
              ? 'Rejected'
              : 'Waiting for validation',
        provider: row.provider,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
    };
  }

  /**
   * Issues an on-chain credential after KYC approval
   */
  async issueOnChainVC(userId: string, userAddress: string) {
    this.logger.log(`Issuing On-Chain VC for user ${userId} at ${userAddress}`);

    try {
      const adminSecret =
        process.env.MASTER_SECRET_KEY ?? process.env.STELLAR_SECRET_KEY;
      const registryContractId =
        process.env.VC_REGISTRY_CONTRACT_ID || process.env.VC_REGISTRY_ID;

      if (!registryContractId) {
        throw new Error('VC Registry contract ID not configured');
      }
      if (!adminSecret) {
        throw new Error('Admin secret key not configured');
      }

      await this.sorobanService.executeContractCall(
        registryContractId,
        'issue_vc',
        [
          StellarSdk.Address.fromString(userAddress).toScVal(),
          StellarSdk.xdr.ScVal.scvString('KYC-PASSPORT'),
        ],
        adminSecret,
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

  async checkTravelRule(params: {
    userId: string;
    walletAddress?: string | null;
    vaspCode?: string | null;
    direction: 'OUTBOUND' | 'INBOUND';
    asset?: string | null;
    amount?: string | null;
  }) {
    const nonTravelRuleAssets = new Set(['BRL', 'USD', 'EUR']);
    if (params.asset && nonTravelRuleAssets.has(params.asset.toUpperCase())) {
      return {
        ok: true,
        status: TravelRuleStatus.NOT_REQUIRED,
        allowed: true,
        reason: 'fiat_pair_not_subject_to_travel_rule',
      };
    }

    const result = await this.travelRuleProvider.checkTransfer(params);
    await this.prisma.travelRuleCheck.create({
      data: {
        userId: params.userId,
        walletAddress: params.walletAddress ?? null,
        vaspCode: params.vaspCode ?? null,
        direction: params.direction,
        asset: params.asset ?? null,
        amount: params.amount ?? null,
        status: result.status,
        providerRef: result.providerRef ?? null,
        reason: result.reason ?? null,
        payload: result.payload as Prisma.InputJsonValue | undefined,
      },
    });

    const allowed =
      result.status === TravelRuleStatus.CLEARED ||
      result.status === TravelRuleStatus.NOT_REQUIRED;

    return {
      ok: allowed,
      allowed,
      status: result.status,
      reason: result.reason ?? null,
      providerRef: result.providerRef ?? null,
      payload: result.payload ?? null,
    };
  }

  getTravelRuleProviderStatus() {
    return this.travelRuleProvider.getStatus();
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
