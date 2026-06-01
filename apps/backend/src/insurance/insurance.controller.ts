import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { InsuranceService } from './insurance.service';

@Controller('insurance')
export class InsuranceController {
  constructor(private readonly service: InsuranceService) {}

  @Post('deposit')
  deposit(@Body() body: { userSecret: string; amount: string }) {
    const nodeEnv = process.env.NODE_ENV ?? 'development';
    if (nodeEnv.toLowerCase() === 'production') {
      throw new ForbiddenException('Direct secret submission is disabled in production.');
    }
    return this.service.deposit(body.userSecret, body.amount);
  }
}
