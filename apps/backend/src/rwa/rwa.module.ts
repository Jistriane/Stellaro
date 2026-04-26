import { Module } from '@nestjs/common';
import { RwaController } from './rwa.controller';
import { RwaService } from './rwa.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RwaController],
  providers: [RwaService],
  exports: [RwaService],
})
export class RwaModule {}