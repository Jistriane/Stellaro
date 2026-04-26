import { Injectable } from '@nestjs/common';
import { RwaService } from '../rwa/rwa.service';
import { SsiService } from '../ssi/ssi.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { DaoService } from '../dao/dao.service';
import { InsuranceService } from '../insurance/insurance.service';

@Injectable()
export class V4Service {
  constructor(
    private readonly rwa: RwaService,
    private readonly ssi: SsiService,
    private readonly subscription: SubscriptionService,
    private readonly dao: DaoService,
    private readonly insurance: InsuranceService,
  ) {}

  async getOverview() {
    const [rwa, ssi, subscription, dao, insurance] = await Promise.all([
      Promise.resolve(this.rwa.getOverview()),
      Promise.resolve(this.ssi.getOverview()),
      Promise.resolve(this.subscription.getOverview()),
      Promise.resolve(this.dao.getOverview()),
      Promise.resolve(this.insurance.getOverview()),
    ]);

    const modules = [
      {
        id: 'rwa',
        title: 'RWA Tokenization',
        href: '/rwa',
        status: rwa.status,
        readiness: rwa.readiness,
        items: rwa.items.length,
      },
      {
        id: 'ssi',
        title: 'SSI / Verifiable Credentials',
        href: '/ssi',
        status: ssi.status,
        readiness: ssi.readiness,
        items: ssi.credentials.length,
      },
      {
        id: 'subscription',
        title: 'Pagamentos recorrentes',
        href: '/recurring-payments',
        status: subscription.status,
        readiness: subscription.readiness,
        items: subscription.plans.length,
      },
      {
        id: 'dao',
        title: 'DAO / Governança',
        href: '/dao',
        status: dao.status,
        readiness: dao.readiness,
        items: dao.proposals.length,
      },
      {
        id: 'insurance',
        title: 'Pool de Seguros',
        href: '/insurance',
        status: insurance.status,
        readiness: insurance.readiness,
        items: 0,
      },
    ];

    const readiness = modules.reduce((sum, module) => sum + module.readiness, 0) / modules.length;

    return {
      module: 'v4',
      status: 'integrated-with-soroban',
      readiness,
      modules,
      nextSteps: [
        ...rwa.nextSteps,
        ...ssi.nextSteps,
        ...subscription.nextSteps,
        ...dao.nextSteps,
        ...insurance.nextSteps,
      ],
    };
  }
}