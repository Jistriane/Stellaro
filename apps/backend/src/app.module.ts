import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WalletsModule } from './wallets/wallets.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { RiskModule } from './risk/risk.module';
import { MemoryModule } from './memory/memory.module';
import { ActionsModule } from './actions/actions.module';
import { OraclesModule } from './oracles/oracles.module';
import { ScoreModule } from './score/score.module';
import { ChainModule } from './chain/chain.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ComplianceModule } from './compliance/compliance.module';
import { PaymentsModule } from './payments/payments.module';
import { AutomationModule } from './automation/automation.module';
import { GovernanceModule } from './governance/governance.module';
import { DefiModule } from './defi/defi.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PasskeyModule } from './passkey/passkey.module';
import { SecurityModule } from './security/security.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    WalletsModule,
    WebhooksModule,
    RiskModule,
    MemoryModule,
    ActionsModule,
    OraclesModule,
    ScoreModule,
    ChainModule,
    NotificationsModule,
    ComplianceModule,
    PaymentsModule,
    AutomationModule,
    GovernanceModule,
    DefiModule,
    AnalyticsModule,
    PasskeyModule,
    SecurityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
