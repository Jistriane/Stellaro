import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { ExchangeController } from './exchange.controller';
import { ExchangeProviderService } from './exchange-provider.service';
import { ExchangeService } from './exchange.service';
import { QuotesRepository } from './quotes.repository';
import { OrdersRepository } from './orders.repository';

@Module({
  imports: [ConfigModule, PrismaModule, ComplianceModule],
  controllers: [ExchangeController],
  providers: [
    ExchangeProviderService,
    ExchangeService,
    QuotesRepository,
    OrdersRepository,
  ],
  exports: [
    ExchangeProviderService,
    ExchangeService,
    QuotesRepository,
    OrdersRepository,
  ],
})
export class ExchangeModule {}
