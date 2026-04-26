import { Module } from '@nestjs/common';
import { DaoController } from './dao.controller';
import { DaoService } from './dao.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DaoController],
  providers: [DaoService],
  exports: [DaoService],
})
export class DaoModule {}