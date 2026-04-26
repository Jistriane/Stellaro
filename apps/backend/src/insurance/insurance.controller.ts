import { Body, Controller, Post } from '@nestjs/common';
import { InsuranceService } from './insurance.service';

@Controller('insurance')
export class InsuranceController {
  constructor(private readonly service: InsuranceService) {}

  @Post('deposit')
  deposit(@Body() body: { userSecret: string; amount: string }) {
    return this.service.deposit(body.userSecret, body.amount);
  }
}
