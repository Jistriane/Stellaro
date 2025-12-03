import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PixController } from './pix.controller';
import { PixService } from './pix.service';
import { ComplianceModule } from '../compliance/compliance.module';
import { ActionsModule } from '../actions/actions.module';
import { PrismaService } from '../prisma/prisma.service';
import { ComplianceGuard } from './payments.guard';

@Module({
  imports: [ConfigModule, ComplianceModule, ActionsModule],
  controllers: [PaymentsController, PixController],
  providers: [ComplianceGuard, PixService, PrismaService],
  exports: [PixService],
})
export class PaymentsModule {}
