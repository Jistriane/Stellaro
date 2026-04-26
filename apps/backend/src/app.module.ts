import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MetricsController } from './metrics/metrics.controller';
import { HealthController } from './health/health.controller';
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
import { RwaModule } from './rwa/rwa.module';
import { SsiModule } from './ssi/ssi.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { DaoModule } from './dao/dao.module';
import { V4Module } from './v4/v4.module';
import { DefiModule } from './defi/defi.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PasskeyModule } from './passkey/passkey.module';
import { SecurityModule } from './security/security.module';
import { ZkModule } from './zk/zk.module';
import { RedisModule } from './redis/redis.module';
import { InsuranceModule } from './insurance/insurance.module';
// ReflectorModule optionally loaded in non-test env to avoid optional deps during E2E

const isTest = process.env.NODE_ENV === 'test';
let optionalReflectorModules: any[] = [];
if (!isTest) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ReflectorModule } = require('./reflector/reflector.module');
  optionalReflectorModules = [ReflectorModule];
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: false,
      envFilePath: ['.env.test', '.env'],
    }),
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
    RwaModule,
    SsiModule,
    SubscriptionModule,
    DaoModule,
    V4Module,
    DefiModule,
    AnalyticsModule,
    PasskeyModule,
    SecurityModule,
    RedisModule,
    ZkModule,
    InsuranceModule,
    ...optionalReflectorModules,
  ],
  controllers: [AppController, MetricsController, HealthController],
  providers: [AppService],
})
export class AppModule {}
