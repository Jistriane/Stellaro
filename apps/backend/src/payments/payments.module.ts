import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PixController } from './pix.controller';
import { PixService } from './pix.service';
import { CardService } from './card.service';
import { X402Controller } from './x402.controller';
import { X402Service } from './x402.service';
import { EtherfuseController } from './etherfuse.controller';
import { EtherfuseService } from './etherfuse.service';
import { ComplianceModule } from '../compliance/compliance.module';
import { ActionsModule } from '../actions/actions.module';
import { PrismaService } from '../prisma/prisma.service';
import { ComplianceGuard } from './payments.guard';

@Module({
  imports: [ConfigModule, ComplianceModule, ActionsModule],
  controllers: [
    PaymentsController,
    PixController,
    X402Controller,
    EtherfuseController,
  ],
  providers: [
    ComplianceGuard,
    PixService,
    PrismaService,
    CardService,
    X402Service,
    EtherfuseService,
  ],
  exports: [PixService, CardService, X402Service, EtherfuseService],
})
export class PaymentsModule {}
