import { Module } from '@nestjs/common';
import { V4Controller } from './v4.controller';
import { V4Service } from './v4.service';
import { RwaModule } from '../rwa/rwa.module';
import { SsiModule } from '../ssi/ssi.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { DaoModule } from '../dao/dao.module';
import { InsuranceModule } from '../insurance/insurance.module';

@Module({
  imports: [RwaModule, SsiModule, SubscriptionModule, DaoModule, InsuranceModule],
  controllers: [V4Controller],
  providers: [V4Service],
})
export class V4Module {}