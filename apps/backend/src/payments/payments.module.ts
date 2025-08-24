import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { ComplianceModule } from '../compliance/compliance.module';
import { ComplianceGuard } from './payments.guard';

@Module({
  imports: [ComplianceModule],
  controllers: [PaymentsController],
  providers: [ComplianceGuard],
})
export class PaymentsModule {}
