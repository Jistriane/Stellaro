import { Injectable, Optional } from '@nestjs/common';
import { Prisma, SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(@Optional() private readonly prisma?: PrismaService) {}

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

  private parsePagination(query: SubscriptionListQuery) {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 20) || 20));
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

  async createPlan(input: { name: string; cadence: string; amount: string; currency?: string }) {
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
            currency: input.currency ?? 'STLT',
            status: 'draft',
          },
        });
        return this.toView(created);
      } catch {
        // Continue to in-memory fallback when DB is unavailable.
      }
    }

    const plan: SubscriptionPlanView = {
      id: `sub-${String(this.plans.length + 1).padStart(3, '0')}`,
      name: input.name,
      cadence: input.cadence,
      amount: input.amount,
      currency: input.currency ?? 'STLT',
      status: 'draft',
    };

    this.plans = [...this.plans, plan];
    return plan;
  }

  async listPlans(query: SubscriptionListQuery = {}): Promise<SubscriptionListResult> {
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

        return { plans: rows.map((row) => this.toView(row)), total, page, pageSize };
      } catch {
        // Continue to in-memory fallback when DB is unavailable.
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
      status: 'frontend-and-api-scaffold',
      readiness: 0.25,
      plans: paged.plans,
      total: paged.total,
      page: paged.page,
      pageSize: paged.pageSize,
      nextSteps: [
        'Conectar ao Subscription Manager contract',
        'Adicionar agendamento e retry idempotente',
        'Expor webhook de confirmação',
      ],
    };
  }
}