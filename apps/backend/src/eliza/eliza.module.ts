import { Module } from '@nestjs/common';
import { ElizaService } from './eliza.service';
import { ElizaController } from './eliza.controller';
import { MemoryModule } from '../memory/memory.module';
import { ActionsModule } from '../actions/actions.module';

@Module({
  imports: [MemoryModule, ActionsModule],
  controllers: [ElizaController],
  providers: [ElizaService],
  exports: [ElizaService],
})
export class ElizaModule {}
