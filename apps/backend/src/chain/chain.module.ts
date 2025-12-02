import { Module } from '@nestjs/common';
import { ChainService } from './chain.service';
import { ChainController } from './chain.controller';
import { HorizonService } from './horizon.service';
import { SorobanService } from './soroban.service';

@Module({
  controllers: [ChainController],
  providers: [ChainService, HorizonService, SorobanService],
  exports: [ChainService, HorizonService, SorobanService],
})
export class ChainModule {}
