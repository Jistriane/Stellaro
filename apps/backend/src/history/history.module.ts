import { Module } from '@nestjs/common';
import { ComplianceModule } from '../compliance/compliance.module';
import { ExchangeModule } from '../exchange/exchange.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SettlementModule } from '../settlement/settlement.module';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';

@Module({
  imports: [PrismaModule, ExchangeModule, SettlementModule, ComplianceModule],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
