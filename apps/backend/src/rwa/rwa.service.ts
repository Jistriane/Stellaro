import { Injectable, Optional } from '@nestjs/common';
import { Prisma, RwaAsset } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SorobanService } from '../chain/soroban.service';
import { SsiService } from '../ssi/ssi.service';
import { IpfsService } from './ipfs.service';
import { ForbiddenException, Logger } from '@nestjs/common';

type RwaListQuery = {
  page?: string | number;
  pageSize?: string | number;
  status?: string;
  assetClass?: string;
  search?: string;
};

type RwaAssetView = {
  id: string;
  name: string;
  assetClass: string;
  status: string;
  whitelistRequired: boolean;
  annualYieldBps: number;
  documentHash?: string;
};

type RwaListResult = {
  items: RwaAssetView[];
  total: number;
  page: number;
  pageSize: number;
};

@Injectable()
export class RwaService {
  private readonly logger = new Logger(RwaService.name);

  constructor(
    @Optional() private readonly prisma?: PrismaService,
    private readonly soroban?: SorobanService,
    private readonly ssiService?: SsiService,
    private readonly ipfsService?: IpfsService,
  ) {}

  private items = [
    {
      id: 'rwa-001',
      name: 'Stellaro Real Estate Note',
      assetClass: 'real-estate',
      status: 'scaffold',
      whitelistRequired: true,
      annualYieldBps: 820,
    },
    {
      id: 'rwa-002',
      name: 'Receivables Basket',
      assetClass: 'receivables',
      status: 'scaffold',
      whitelistRequired: true,
      annualYieldBps: 940,
    },
  ];

  private parsePagination(query: RwaListQuery) {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(query.pageSize ?? 20) || 20),
    );
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
  }

  private toView(asset: RwaAsset): RwaAssetView {
    return {
      id: asset.publicId,
      name: asset.name,
      assetClass: asset.assetClass,
      status: asset.status,
      whitelistRequired: asset.whitelistRequired,
      annualYieldBps: asset.annualYieldBps,
    };
  }

  private async ensureSeeded() {
    if (!this.prisma) {
      return;
    }

    const total = await this.prisma.rwaAsset.count();
    if (total > 0) {
      return;
    }

    await this.prisma.rwaAsset.createMany({
      data: this.items.map((item) => ({
        publicId: item.id,
        name: item.name,
        assetClass: item.assetClass,
        status: item.status,
        whitelistRequired: item.whitelistRequired,
        annualYieldBps: item.annualYieldBps,
      })),
    });
  }

  async createAsset(input: {
    name: string;
    assetClass: string;
    annualYieldBps: number;
    documentPayload?: Record<string, any>;
  }) {
    let documentHash = undefined;

    // 1. Ancora o documento legal off-chain no IPFS
    if (this.ipfsService && input.documentPayload) {
      documentHash = await this.ipfsService.uploadLegalDocument(
        input.documentPayload,
      );
    }

    if (this.prisma) {
      try {
        await this.ensureSeeded();
        const total = await this.prisma.rwaAsset.count();
        const created = await this.prisma.rwaAsset.create({
          data: {
            publicId: `rwa-${String(total + 1).padStart(3, '0')}`,
            name: input.name,
            assetClass: input.assetClass,
            status: 'draft',
            whitelistRequired: true,
            annualYieldBps: input.annualYieldBps,
          },
        });
        return this.toView(created);
      } catch {
        // Continue to in-memory fallback when DB is unavailable.
      }
    }

    const asset: RwaAssetView = {
      id: `rwa-${String(this.items.length + 1).padStart(3, '0')}`,
      name: input.name,
      assetClass: input.assetClass,
      status: 'draft',
      whitelistRequired: true,
      annualYieldBps: input.annualYieldBps,
      documentHash,
    };

    this.items = [...this.items, asset];
    return asset;
  }

  async listAssets(query: RwaListQuery = {}): Promise<RwaListResult> {
    const { page, pageSize, skip, take } = this.parsePagination(query);

    if (this.prisma) {
      try {
        await this.ensureSeeded();
        const where: Prisma.RwaAssetWhereInput = {
          ...(query.status ? { status: query.status } : {}),
          ...(query.assetClass ? { assetClass: query.assetClass } : {}),
          ...(query.search
            ? {
                OR: [
                  { name: { contains: query.search, mode: 'insensitive' } },
                  { publicId: { contains: query.search, mode: 'insensitive' } },
                ],
              }
            : {}),
        };

        const [total, rows] = await Promise.all([
          this.prisma.rwaAsset.count({ where }),
          this.prisma.rwaAsset.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take,
          }),
        ]);

        return {
          items: rows.map((row) => this.toView(row)),
          total,
          page,
          pageSize,
        };
      } catch {
        // Continue to in-memory fallback when DB is unavailable.
      }
    }

    const search = query.search?.toLowerCase().trim();
    const filtered = this.items.filter((item) => {
      if (query.status && item.status !== query.status) return false;
      if (query.assetClass && item.assetClass !== query.assetClass)
        return false;
      if (search) {
        const haystack = `${item.id} ${item.name}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    const total = filtered.length;
    const items = filtered.slice(skip, skip + take);

    return { items, total, page, pageSize };
  }

  async getOverview(query: RwaListQuery = {}) {
    const paged = await this.listAssets(query);

    return {
      module: 'rwa',
      status: 'integrated-with-soroban',
      readiness: 0.75,
      items: paged.items,
      total: paged.total,
      page: paged.page,
      pageSize: paged.pageSize,
      nextSteps: [
        'Implementar upload de documentos legais para IPFS/Arweave',
        'Refinar whitelist dinâmica baseada em múltiplos emissores',
        'Adicionar auditoria automática via ElizaOS',
      ],
    };
  }

  async mintAsset(id: string, userAddress: string, amount: string) {
    this.logger.log(`Attempting to mint RWA ${id} for ${userAddress}`);

    // PLD/FT COMPLIANCE GATE: Check KYC Verifiable Credential via Veramo
    if (this.ssiService) {
      const hasKyc = await this.ssiService.verifyOnChain(userAddress);
      if (!hasKyc) {
        this.logger.warn(
          `Compliance Gate blocked RWA minting for ${userAddress}: Missing KYCVerified VC`,
        );
        throw new ForbiddenException(
          'Usuário não possui a Credencial Verificável de KYC requerida para interagir com Real World Assets.',
        );
      }
      this.logger.log(
        `Compliance Gate passed for ${userAddress}. Executing mint.`,
      );
    }

    if (this.soroban) {
      return this.soroban.mintRwa(userAddress, amount);
    }
    throw new Error('Soroban service not available');
  }

  async startAuction(
    sellerSecret: string,
    assetToken: string,
    amount: string,
    minBid: string,
    duration: number,
  ) {
    if (this.soroban) {
      return this.soroban.startAuction(
        sellerSecret,
        assetToken,
        amount,
        minBid,
        duration,
      );
    }
    throw new Error('Soroban service not available');
  }

  async placeBid(bidderSecret: string, auctionId: number, bidAmount: string) {
    if (this.soroban) {
      return this.soroban.placeBid(bidderSecret, auctionId, bidAmount);
    }
    throw new Error('Soroban service not available');
  }
}
