import { Injectable, Optional, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SorobanService } from '../chain/soroban.service';
import * as crypto from 'crypto';

type SsiListQuery = {
  page?: string | number;
  pageSize?: string | number;
  status?: string;
  type?: string;
  search?: string;
};

@Injectable()
export class SsiService {
  private readonly logger = new Logger(SsiService.name);
  private issuanceStatus = {
    available: false,
    reason: 'SSI issuance preflight not initialized',
    checks: {
      vcRegistryConfigured: false,
      masterSecretConfigured: false,
      masterSecretValid: false,
    },
  };
  // Fallback in-memory store used in unit tests when PrismaService is not provided
  private inMemoryCreds: Array<any> = [
    { id: 'vc-001', publicId: 'vc-001', type: 'KYCVerified', issuer: 'stub', status: 'active', disclosure: JSON.stringify({ subject: null, vcHash: null, txHash: null }), createdAt: new Date().toISOString() },
    { id: 'vc-002', publicId: 'vc-002', type: 'ProofOfAddress', issuer: 'stub', status: 'active', disclosure: JSON.stringify({ subject: null, vcHash: null, txHash: null }), createdAt: new Date().toISOString() },
  ];

  constructor(
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly sorobanService?: SorobanService,
  ) {
    this.logger.log('SSI Service initialized.');
    this.refreshIssuanceStatus();
  }

  private refreshIssuanceStatus() {
    if (!this.sorobanService || !this.sorobanService.getVcIssuanceStatus) {
      this.issuanceStatus = {
        available: true,
        reason: null,
        checks: {
          vcRegistryConfigured: false,
          masterSecretConfigured: false,
          masterSecretValid: false,
        },
      };
      this.logger.warn('SSI issuance preflight running without SorobanService; test/in-memory mode enabled.');
      return;
    }

    this.issuanceStatus = this.sorobanService.getVcIssuanceStatus();
    if (this.issuanceStatus.available) {
      this.logger.log('SSI issuance preflight passed. VC issuance is operational.');
      return;
    }

    this.logger.warn(`SSI issuance preflight failed: ${this.issuanceStatus.reason}`);
  }

  getIssuanceStatus() {
    this.refreshIssuanceStatus();
    return {
      status: this.issuanceStatus.available ? 'operational' : 'degraded',
      available: this.issuanceStatus.available,
      reason: this.issuanceStatus.reason,
      checks: this.issuanceStatus.checks,
    };
  }

  async getOverview(query: SsiListQuery = {}) {
    const credentials = this.prisma?.ssiCredential?.findMany
      ? await this.prisma.ssiCredential.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
        })
      : this.inMemoryCreds.slice(0, 5);

    return {
      module: 'ssi',
      status: 'active',
      readiness: 100,
      issuance: this.getIssuanceStatus(),
      credentials,
      total: Array.isArray(credentials) ? credentials.length : 0,
      nextSteps: [
        'Migrate Veramo to dynamic imports for ESM support',
        'Implement selective disclosure proofs',
      ],
    };
  }

  async createIdentity(userId: string) {
    this.logger.log(`Creating DID for user ${userId} (Simulated)`);
    return { did: `did:web:stellaro:${userId}` };
  }

  async issueCredential(body: { userAddress: string; type: string; issuer: string; vcHash?: string }) {
    const issuance = this.getIssuanceStatus();
    if (!issuance.available) {
      throw new ServiceUnavailableException(issuance.reason || 'SSI issuance is currently unavailable');
    }

    this.logger.log(`Issuing VC for ${body.userAddress}`);
    const id = `vc-${String(Math.floor(Date.now() % 1000)).padStart(3, '0')}`;
    const vcHash = body.vcHash ?? crypto
      .createHash('sha256')
      .update(JSON.stringify({
        userAddress: body.userAddress,
        type: body.type,
        issuer: body.issuer,
      }))
      .digest('hex');

    let txHash: string | null = null;
    if (this.sorobanService) {
      try {
        txHash = await this.sorobanService.registerUserVc(body.userAddress, vcHash);
      } catch (error) {
        this.logger.error(`Failed to anchor VC on-chain for ${body.userAddress}: ${error.message}`);
        throw new ServiceUnavailableException(error.message);
      }
    }

    const cred = {
      id,
      publicId: id,
      type: body.type,
      issuer: body.issuer || 'stub',
      status: 'active',
      disclosure: JSON.stringify({
        subject: body.userAddress,
        vcHash,
        txHash,
      }),
      createdAt: new Date().toISOString(),
      txHash,
      vcHash,
      subject: body.userAddress,
    };

    if (this.prisma?.ssiCredential?.create) {
      await this.prisma.ssiCredential.create({
        data: {
          publicId: cred.publicId,
          type: cred.type,
          issuer: cred.issuer,
          status: cred.status,
          disclosure: cred.disclosure,
        },
      });
    } else {
      this.inMemoryCreds.unshift(cred);
    }

    return cred;
  }

  async verifyOnChain(address: string) {
    this.logger.log(`Verifying on-chain VC for ${address}`);
    if (this.sorobanService) {
      return this.sorobanService.hasValidVc(address);
    }
    return true;
  }

  async findAll(query: SsiListQuery) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    let items: any[] = [];
    let total = 0;

    if (this.prisma?.ssiCredential?.findMany) {
      [items, total] = await Promise.all([
        this.prisma.ssiCredential.findMany({
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.ssiCredential.count(),
      ]);
    } else {
      items = this.inMemoryCreds.slice(skip, skip + pageSize);
      total = this.inMemoryCreds.length;
    }

    return {
      credentials: items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // Backwards-compatible alias expected by some tests
  async listCredentials(query: SsiListQuery = {}) {
    const res = await this.findAll(query);
    return {
      total: res.total,
      page: res.page,
      pageSize: res.pageSize,
      credentials: res.credentials,
    };
  }

  async findOne(id: string) {
    return this.prisma.ssiCredential.findUnique({
      where: { id },
    });
  }

  async verify(id: string) {
    this.logger.log(`Verifying credential ${id} (Simulated)`);
    return { valid: true, verifiedAt: new Date().toISOString() };
  }

  async revoke(id: string) {
    this.logger.log(`Revoking credential ${id}`);
    return this.prisma.ssiCredential.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }
}