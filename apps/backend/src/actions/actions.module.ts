import { Module } from '@nestjs/common';
import { ActionsService } from './actions.service';
import { ChainModule } from '../chain/chain.module';
import { ActionsController } from './actions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ChainModule, PrismaModule],
  controllers: [ActionsController],
  providers: [ActionsService],
  exports: [ActionsService],
})
export class ActionsModule {}
