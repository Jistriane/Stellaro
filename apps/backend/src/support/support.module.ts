import { Module } from '@nestjs/common';
import { ElizaModule } from '../eliza/eliza.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportRepository } from './support.repository';

@Module({
  imports: [PrismaModule, ElizaModule],
  controllers: [SupportController],
  providers: [SupportService, SupportRepository],
  exports: [SupportService, SupportRepository],
})
export class SupportModule {}
