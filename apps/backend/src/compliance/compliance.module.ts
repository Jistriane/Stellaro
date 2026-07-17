import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { ReservesController } from './reserves.controller';
import { ReserveManagerService } from './reserve-manager.service';
import { OraclesModule } from '../oracles/oracles.module';
import { ChainModule } from '../chain/chain.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { TravelRuleProviderService } from './travel-rule-provider.service';

@Module({
  imports: [
    OraclesModule,
    ChainModule,
    PrismaModule,
    NotificationsModule,
    AuthModule,
  ],
  providers: [
    ComplianceService,
    ReserveManagerService,
    TravelRuleProviderService,
  ],
  controllers: [ComplianceController, ReservesController],
  exports: [
    ComplianceService,
    ReserveManagerService,
    TravelRuleProviderService,
  ],
})
export class ComplianceModule {}
