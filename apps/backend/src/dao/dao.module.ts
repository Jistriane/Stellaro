import { Module } from '@nestjs/common';
import { DaoController } from './dao.controller';
import { DaoService } from './dao.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ChainModule } from '../chain/chain.module';

@Module({
  imports: [PrismaModule, ChainModule],
  controllers: [DaoController],
  providers: [DaoService],
  exports: [DaoService],
})
export class DaoModule {}
