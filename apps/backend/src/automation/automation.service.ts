import { Injectable } from '@nestjs/common';
import { OraclesService } from '../oracles/oracles.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ComplianceService } from '../compliance/compliance.service';

@Injectable()
export class AutomationService {
  constructor(
    private readonly oracles: OraclesService,
    private readonly notifications: NotificationsService,
    private readonly compliance: ComplianceService,
  ) {}

  async riskPipeline(input: {
    asset: string;
    thresholdBps: number;
    notifyTo?: string;
  }) {
    const price = await this.oracles.getPrice('USD', 'BRL');
    const ok = price.value > 0;
    if (input.notifyTo) {
      await this.notifications.send(
        'email',
        input.notifyTo,
        'Risk Pipeline',
        `USD/BRL=${price.value}`,
      );
    }
    return { ok, price };
  }

  async onboardingPipeline(input: {
    document: string;
    name: string;
    notifyTo?: string;
  }) {
    const kyc = await this.compliance.kycCheck(input.document, input.name);
    if (input.notifyTo) {
      await this.notifications.send(
        'email',
        input.notifyTo,
        'Onboarding',
        `KYC=${kyc.level}`,
      );
    }
    return { ok: kyc.ok, kyc };
  }

  async compliancePipeline(input: { address: string; notifyTo?: string }) {
    const aml = await this.compliance.amlScreening(input.address);
    if (input.notifyTo) {
      await this.notifications.send(
        'email',
        input.notifyTo,
        'Compliance',
        `AML flagged=${aml.flagged}`,
      );
    }
    return { ok: aml.ok, aml };
  }

  async creditPipeline(input: {
    userId: string;
    income?: number;
    notifyTo?: string;
  }) {
    // Stub: cálculo de score simples
    const score = Math.min(
      1000,
      Math.max(300, Math.round((input.income || 1000) / 10)),
    );
    if (input.notifyTo) {
      await this.notifications.send(
        'email',
        input.notifyTo,
        'Credit',
        `Score=${score}`,
      );
    }
    return { ok: true, score };
  }

  async reportsPipeline(input: { lang: 'pt' | 'en'; notifyTo?: string }) {
    const content =
      input.lang === 'pt'
        ? 'Relatório consolidado (stub): métricas de risco e operações.'
        : 'Consolidated report (stub): risk metrics and operations.';
    if (input.notifyTo) {
      await this.notifications.send(
        'email',
        input.notifyTo,
        input.lang === 'pt' ? 'Relatório' : 'Report',
        content,
      );
    }
    return { ok: true, content };
  }
}
