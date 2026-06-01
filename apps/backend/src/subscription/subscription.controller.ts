import { Body, Controller, ForbiddenException, Get, Post, Query } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Get()
  getOverview(
    @Query()
    query: {
      page?: string;
      pageSize?: string;
      status?: string;
      cadence?: string;
      search?: string;
    } = {},
  ) {
    return this.service.getOverview(query);
  }

  @Post('authorize')
  authorize(
    @Body()
    body: {
      userSecret: string;
      merchant: string;
      token: string;
      amount: string;
      frequencyLedgers: number;
    },
  ) {
    const nodeEnv = process.env.NODE_ENV ?? 'development';
    if (nodeEnv.toLowerCase() === 'production') {
      throw new ForbiddenException('Direct secret submission is disabled in production.');
    }
    return this.service.authorizeSubscription(body);
  }

  @Post()
  createPlan(
    @Body()
    body: {
      name: string;
      cadence: string;
      amount: string;
      currency: string;
    },
  ) {
    return this.service.createPlan(body);
  }
}
