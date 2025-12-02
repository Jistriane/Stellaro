import { Module } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { MemoryController } from './memory.controller';
import { HistoryController } from './history.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChainModule } from '../chain/chain.module';

@Module({
  imports: [PrismaModule, ChainModule],
  controllers: [MemoryController, HistoryController],
  providers: [MemoryService],
  exports: [MemoryService],
})
export class MemoryModule {}
