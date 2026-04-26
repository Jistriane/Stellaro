import { Module } from '@nestjs/common';
import { RwaController } from './rwa.controller';
import { RwaService } from './rwa.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ChainModule } from '../chain/chain.module';

@Module({
  imports: [PrismaModule, ChainModule],
  controllers: [RwaController],
  providers: [RwaService],
  exports: [RwaService],
})
export class RwaModule {}