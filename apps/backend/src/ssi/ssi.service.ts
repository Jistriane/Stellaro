import { Injectable, Optional } from '@nestjs/common';
import { Prisma, SsiCredential } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SorobanService } from '../chain/soroban.service';

type SsiListQuery = {
  page?: string | number;
  pageSize?: string | number;
  status?: string;
  type?: string;
  search?: string;
};

type SsiCredentialView = {
  id: string;
  type: string;
  issuer: string;
  status: string;
  disclosure: string;
};

type SsiListResult = {
  credentials: SsiCredentialView[];
  total: number;
  page: number;
  pageSize: number;
};

@Injectable()
export class SsiService {
  constructor(
    @Optional() private readonly prisma?: PrismaService,
    private readonly soroban?: SorobanService,
  ) {}

  private credentials = [
    {
      id: 'vc-kyc-001',
      type: 'KYCVerified',
      issuer: 'stellaro-compliance',
      status: 'active',
      disclosure: 'selective',
    },
    {
      id: 'vc-proof-001',
      type: 'ProofOfAddress',
      issuer: 'stellaro-identity',
      status: 'revocation-ready',
      disclosure: 'selective',
    },
  ];

  private parsePagination(query: SsiListQuery) {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 20) || 20));
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
  }

  private toView(credential: SsiCredential): SsiCredentialView {
    return {
      id: credential.publicId,
      type: credential.type,
      issuer: credential.issuer,
      status: credential.status,
      disclosure: credential.disclosure,
    };
  }

  private async ensureSeeded() {
    if (!this.prisma) {
      return;
    }

    const total = await this.prisma.ssiCredential.count();
    if (total > 0) {
      return;
    }

    await this.prisma.ssiCredential.createMany({
      data: this.credentials.map((credential) => ({
        publicId: credential.id,
        type: credential.type,
        issuer: credential.issuer,
        status: credential.status,
        disclosure: credential.disclosure,
      })),
    });
  }

  async issueCredential(input: { userAddress: string; type: string; issuer: string; vcHash: string }) {
    if (this.soroban) {
      // Registro on-chain
      await this.soroban.registerUserVc(input.userAddress, input.vcHash);
    }

    if (this.prisma) {
      try {
        await this.ensureSeeded();
        const total = await this.prisma.ssiCredential.count();
        const created = await this.prisma.ssiCredential.create({
          data: {
            publicId: `vc-${String(total + 1).padStart(3, '0')}`,
            type: input.type,
            issuer: input.issuer,
            status: 'active',
            disclosure: 'selective',
          },
        });
        return this.toView(created);
      } catch {
        // Fallback
      }
    }

    const credential: SsiCredentialView = {
      id: `vc-${String(this.credentials.length + 1).padStart(3, '0')}`,
      type: input.type,
      issuer: input.issuer,
      status: 'active',
      disclosure: 'selective',
    };

    this.credentials = [...this.credentials, credential];
    return credential;
  }

  async listCredentials(query: SsiListQuery = {}): Promise<SsiListResult> {
    const { page, pageSize, skip, take } = this.parsePagination(query);

    if (this.prisma) {
      try {
        await this.ensureSeeded();
        const where: Prisma.SsiCredentialWhereInput = {
          ...(query.status ? { status: query.status } : {}),
          ...(query.type ? { type: query.type } : {}),
          ...(query.search
            ? {
                OR: [
                  { type: { contains: query.search, mode: 'insensitive' } },
                  { issuer: { contains: query.search, mode: 'insensitive' } },
                  { publicId: { contains: query.search, mode: 'insensitive' } },
                ],
              }
            : {}),
        };

        const [total, rows] = await Promise.all([
          this.prisma.ssiCredential.count({ where }),
          this.prisma.ssiCredential.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take,
          }),
        ]);

        return { credentials: rows.map((row) => this.toView(row)), total, page, pageSize };
      } catch {
        // Fallback
      }
    }

    const search = query.search?.toLowerCase().trim();
    const filtered = this.credentials.filter((credential) => {
      if (query.status && credential.status !== query.status) return false;
      if (query.type && credential.type !== query.type) return false;
      if (search) {
        const haystack = `${credential.id} ${credential.type} ${credential.issuer}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    const total = filtered.length;
    const credentials = filtered.slice(skip, skip + take);

    return { credentials, total, page, pageSize };
  }

  async getOverview(query: SsiListQuery = {}) {
    const paged = await this.listCredentials(query);

    return {
      module: 'ssi',
      status: 'integrated-with-soroban',
      readiness: 0.8,
      credentials: paged.credentials,
      total: paged.total,
      page: paged.page,
      pageSize: paged.pageSize,
      nextSteps: [
        'Integrar com Veramo SDK completo para mobile wallet',
        'Implementar Zero-Knowledge Proofs para apresentação seletiva',
        'Adicionar suporte a DID:Web e DID:Stellar',
      ],
    };
  }

  async verifyOnChain(userAddress: string): Promise<boolean> {
    if (this.soroban) {
      return this.soroban.hasValidVc(userAddress);
    }
    return false;
  }
}