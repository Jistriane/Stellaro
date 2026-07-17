import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { ExchangeModule } from '../exchange/exchange.module';
import { SettlementController } from './settlement.controller';
import { SettlementProviderService } from './settlement-provider.service';
import { SettlementService } from './settlement.service';
import { SettlementsRepository } from './settlements.repository';

@Module({
  imports: [ConfigModule, PrismaModule, ExchangeModule, ComplianceModule],
  controllers: [SettlementController],
  providers: [
    SettlementProviderService,
    SettlementService,
    SettlementsRepository,
  ],
  exports: [
    SettlementProviderService,
    SettlementService,
    SettlementsRepository,
  ],
})
export class SettlementModule {}
