import { Injectable, Optional } from '@nestjs/common';
import { DaoProposal, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SorobanService } from '../chain/soroban.service';

type DaoListQuery = {
  page?: string | number;
  pageSize?: string | number;
  status?: string;
  search?: string;
};

type DaoProposalView = {
  id: string;
  title: string;
  status: string;
  quorumBps: number;
  timelockHours: number;
};

type DaoListResult = {
  proposals: DaoProposalView[];
  total: number;
  page: number;
  pageSize: number;
};

@Injectable()
export class DaoService {
  constructor(
    @Optional() private readonly prisma?: PrismaService,
    private readonly soroban?: SorobanService,
  ) {}

  private proposals = [
    {
      id: 'dao-001',
      title: 'Activate RWA token launch controls',
      status: 'active',
      quorumBps: 2500,
      timelockHours: 24,
    },
    {
      id: 'dao-002',
      title: 'Approve recurring payments pilot',
      status: 'active',
      quorumBps: 3000,
      timelockHours: 48,
    },
  ];

  private parsePagination(query: DaoListQuery) {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 20) || 20));
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
  }

  private toView(proposal: DaoProposal): DaoProposalView {
    return {
      id: proposal.publicId,
      title: proposal.title,
      status: proposal.status,
      quorumBps: proposal.quorumBps,
      timelockHours: proposal.timelockHours,
    };
  }

  private async ensureSeeded() {
    if (!this.prisma) {
      return;
    }

    const total = await this.prisma.daoProposal.count();
    if (total > 0) {
      return;
    }

    await this.prisma.daoProposal.createMany({
      data: this.proposals.map((proposal) => ({
        publicId: proposal.id,
        title: proposal.title,
        status: proposal.status,
        quorumBps: proposal.quorumBps,
        timelockHours: proposal.timelockHours,
      })),
    });
  }

  async createProposal(input: { target: string; action: string; description: string; creatorSecret: string; title: string }) {
    if (this.soroban) {
      // Proposta on-chain
      await this.soroban.createProposal(input.target, input.action, input.description, input.creatorSecret);
    }

    if (this.prisma) {
      try {
        await this.ensureSeeded();
        const total = await this.prisma.daoProposal.count();
        const created = await this.prisma.daoProposal.create({
          data: {
            publicId: `dao-${String(total + 1).padStart(3, '0')}`,
            title: input.title,
            status: 'active',
            quorumBps: 2500, // Default
            timelockHours: 24, // Default
          },
        });
        return this.toView(created);
      } catch {
        // Fallback
      }
    }

    const proposal: DaoProposalView = {
      id: `dao-${String(this.proposals.length + 1).padStart(3, '0')}`,
      title: input.title,
      status: 'active',
      quorumBps: 2500,
      timelockHours: 24,
    };

    this.proposals = [...this.proposals, proposal];
    return proposal;
  }

  async vote(proposalId: number, support: boolean, voterSecret: string) {
    if (this.soroban) {
      return this.soroban.voteOnProposal(proposalId, support, voterSecret);
    }
    throw new Error('Soroban service unavailable');
  }

  async execute(proposalId: number, signerSecret: string) {
    if (this.soroban) {
      return this.soroban.executeProposal(proposalId, signerSecret);
    }
    throw new Error('Soroban service unavailable');
  }

  async listProposals(query: DaoListQuery = {}): Promise<DaoListResult> {
    const { page, pageSize, skip, take } = this.parsePagination(query);

    if (this.prisma) {
      try {
        await this.ensureSeeded();
        const where: Prisma.DaoProposalWhereInput = {
          ...(query.status ? { status: query.status } : {}),
          ...(query.search
            ? {
                OR: [
                  { title: { contains: query.search, mode: 'insensitive' } },
                  { publicId: { contains: query.search, mode: 'insensitive' } },
                ],
              }
            : {}),
        };

        const [total, rows] = await Promise.all([
          this.prisma.daoProposal.count({ where }),
          this.prisma.daoProposal.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take,
          }),
        ]);

        return { proposals: rows.map((row) => this.toView(row)), total, page, pageSize };
      } catch {
        // Fallback
      }
    }

    const search = query.search?.toLowerCase().trim();
    const filtered = this.proposals.filter((proposal) => {
      if (query.status && proposal.status !== query.status) return false;
      if (search) {
        const haystack = `${proposal.id} ${proposal.title}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    const total = filtered.length;
    const proposals = filtered.slice(skip, skip + take);

    return { proposals, total, page, pageSize };
  }

  async getOverview(query: DaoListQuery = {}) {
    const paged = await this.listProposals(query);

    return {
      module: 'dao',
      status: 'integrated-with-soroban',
      readiness: 0.85,
      proposals: paged.proposals,
      total: paged.total,
      page: paged.page,
      pageSize: paged.pageSize,
      nextSteps: [
        'Implementar delegação de votos baseada em stake',
        'Adicionar suporte a propostas complexas (batch executor)',
        'Interface de visualização de votos em tempo real via The Graph',
      ],
    };
  }
}