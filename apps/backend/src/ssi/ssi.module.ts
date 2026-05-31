import { Module } from '@nestjs/common';
import { SsiController } from './ssi.controller';
import { SsiService } from './ssi.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ChainModule } from '../chain/chain.module';

@Module({
  imports: [PrismaModule, ChainModule],
  controllers: [SsiController],
  providers: [SsiService],
  exports: [SsiService],
})
export class SsiModule {}
