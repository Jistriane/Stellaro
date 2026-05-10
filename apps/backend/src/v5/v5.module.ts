import { Module } from '@nestjs/common';
import { RoboAdvisorService } from './robo-advisor.service';
import { RoboAdvisorController } from './robo-advisor.controller';
import { NotificationService } from './notification.service';
import { BridgeService } from './bridge.service';
import { AnalyticsService } from './analytics.service';
import { PaymentsV5Service } from './payments_v5.service';
import { TaxReportingService } from './tax-reporting.service';
import { WebhookService } from './webhook.service';
import { ZkCreditService } from './zk-credit.service';
import { ChainModule } from '../chain/chain.module';
import { PrismaModule } from '../prisma/prisma.module';

import { StablecoinService } from './stablecoin.service';
import { RiskGuardianService } from './risk-guardian.service';
import { StressTestService } from './stress-test.service';

@Module({
  imports: [ChainModule, PrismaModule],
  controllers: [RoboAdvisorController],
  providers: [
    RoboAdvisorService,
    NotificationService,
    BridgeService,
    AnalyticsService,
    PaymentsV5Service,
    TaxReportingService,
    WebhookService,
    ZkCreditService,
    StablecoinService,
    RiskGuardianService,
    StressTestService,
  ],
  exports: [
    RoboAdvisorService,
    StablecoinService,
    RiskGuardianService,
    StressTestService,
  ],
})
export class V5Module {}
