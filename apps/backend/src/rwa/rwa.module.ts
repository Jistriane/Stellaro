import { Module } from '@nestjs/common';
import { RwaController } from './rwa.controller';
import { RwaService } from './rwa.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ChainModule } from '../chain/chain.module';
import { SsiModule } from '../ssi/ssi.module';
import { IpfsService } from './ipfs.service';

@Module({
  imports: [PrismaModule, ChainModule, SsiModule],
  controllers: [RwaController],
  providers: [RwaService, IpfsService],
  exports: [RwaService],
})
export class RwaModule {}
