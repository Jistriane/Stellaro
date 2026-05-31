import { Injectable, Optional } from '@nestjs/common';
import { Prisma, SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SorobanService } from '../chain/soroban.service';

type SubscriptionListQuery = {
  page?: string | number;
  pageSize?: string | number;
  status?: string;
  cadence?: string;
  search?: string;
};

type SubscriptionPlanView = {
  id: string;
  name: string;
  cadence: string;
  amount: string;
  currency: string;
  status: string;
};

type SubscriptionListResult = {
  plans: SubscriptionPlanView[];
  total: number;
  page: number;
  pageSize: number;
};

@Injectable()
export class SubscriptionService {
  constructor(
    @Optional() private readonly prisma?: PrismaService,
    private readonly soroban?: SorobanService,
  ) {}

  private plans = [
    {
      id: 'sub-001',
      name: 'Basic Recurring Payment',
      cadence: 'monthly',
      amount: '25.00',
      currency: 'STLT',
      status: 'scaffold',
    },
    {
      id: 'sub-002',
      name: 'RWA Dividend Sweep',
      cadence: 'quarterly',
      amount: '125.00',
      currency: 'STLT',
      status: 'scaffold',
    },
  ];

  async createPlan(input: {
    name: string;
    cadence: string;
    amount: string;
    currency: string;
  }) {
    if (this.prisma) {
      try {
        await this.ensureSeeded();
        const total = await this.prisma.subscriptionPlan.count();
        const created = await this.prisma.subscriptionPlan.create({
          data: {
            publicId: `sub-${String(total + 1).padStart(3, '0')}`,
            name: input.name,
            cadence: input.cadence,
            amount: input.amount,
            currency: input.currency,
            status: 'draft',
          },
        });
        return this.toView(created as any);
      } catch {
        // fallback
      }
    }

    const plan = {
      id: `sub-${String(this.plans.length + 1).padStart(3, '0')}`,
      name: input.name,
      cadence: input.cadence,
      amount: input.amount,
      currency: input.currency,
      status: 'draft',
    };

    this.plans = [...this.plans, plan];
    return plan;
  }

  private parsePagination(query: SubscriptionListQuery) {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(query.pageSize ?? 20) || 20),
    );
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
  }

  private toView(plan: SubscriptionPlan): SubscriptionPlanView {
    return {
      id: plan.publicId,
      name: plan.name,
      cadence: plan.cadence,
      amount: plan.amount,
      currency: plan.currency,
      status: plan.status,
    };
  }

  private async ensureSeeded() {
    if (!this.prisma) {
      return;
    }

    const total = await this.prisma.subscriptionPlan.count();
    if (total > 0) {
      return;
    }

    await this.prisma.subscriptionPlan.createMany({
      data: this.plans.map((plan) => ({
        publicId: plan.id,
        name: plan.name,
        cadence: plan.cadence,
        amount: plan.amount,
        currency: plan.currency,
        status: plan.status,
      })),
    });
  }

  async authorizeSubscription(input: {
    userSecret: string;
    merchant: string;
    token: string;
    amount: string;
    frequencyLedgers: number;
  }) {
    if (this.soroban) {
      return this.soroban.authorizeSubscription(
        input.userSecret,
        input.merchant,
        input.token,
        input.amount,
        input.frequencyLedgers,
      );
    }
    throw new Error('Soroban service unavailable');
  }

  async listPlans(
    query: SubscriptionListQuery = {},
  ): Promise<SubscriptionListResult> {
    const { page, pageSize, skip, take } = this.parsePagination(query);

    if (this.prisma) {
      try {
        await this.ensureSeeded();
        const where: Prisma.SubscriptionPlanWhereInput = {
          ...(query.status ? { status: query.status } : {}),
          ...(query.cadence ? { cadence: query.cadence } : {}),
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
          this.prisma.subscriptionPlan.count({ where }),
          this.prisma.subscriptionPlan.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take,
          }),
        ]);

        return {
          plans: rows.map((row) => this.toView(row)),
          total,
          page,
          pageSize,
        };
      } catch {
        // Fallback
      }
    }

    const search = query.search?.toLowerCase().trim();
    const filtered = this.plans.filter((plan) => {
      if (query.status && plan.status !== query.status) return false;
      if (query.cadence && plan.cadence !== query.cadence) return false;
      if (search) {
        const haystack = `${plan.id} ${plan.name}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    const total = filtered.length;
    const plans = filtered.slice(skip, skip + take);

    return { plans, total, page, pageSize };
  }

  async getOverview(query: SubscriptionListQuery = {}) {
    const paged = await this.listPlans(query);

    return {
      module: 'subscription',
      status: 'integrated-with-soroban',
      readiness: 0.8,
      plans: paged.plans,
      total: paged.total,
      page: paged.page,
      pageSize: paged.pageSize,
      nextSteps: [
        'Dashboard de monitoramento RiskGuardian para falhas em massa',
        'Suporte a pagamentos variáveis baseados em consumo',
        'Interface de gestão de assinaturas para merchants',
      ],
    };
  }

  async processDuePayments(merchantSecret: string, userAddresses: string[]) {
    if (!this.soroban) throw new Error('Soroban service unavailable');

    const results = [];
    for (const user of userAddresses) {
      try {
        const txHash = await this.soroban.executeSubscriptionWithdraw(
          merchantSecret,
          user,
        );
        results.push({ user, success: true, txHash });
      } catch (error) {
        results.push({ user, success: false, error: error.message });
      }
    }
    return { processedAt: new Date().toISOString(), results };
  }
}
