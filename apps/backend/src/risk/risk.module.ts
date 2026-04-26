import { Module } from '@nestjs/common';
import { RiskController } from './risk.controller';
import { RiskService } from './risk.service';
import { ActionsModule } from '../actions/actions.module';
import { MemoryModule } from '../memory/memory.module';
import { ReasoningService } from './reasoning.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ActionsModule, MemoryModule, PrismaModule],
  controllers: [RiskController],
  providers: [RiskService, ReasoningService],
  exports: [RiskService],
})
export class RiskModule {}
