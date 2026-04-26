import { Module } from '@nestjs/common';
import { SsiController } from './ssi.controller';
import { SsiService } from './ssi.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SsiController],
  providers: [SsiService],
  exports: [SsiService],
})
export class SsiModule {}