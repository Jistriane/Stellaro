import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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
    body: { userSecret: string; merchant: string; token: string; amount: string; frequencyLedgers: number },
  ) {
    return this.service.authorizeSubscription(body);
  }
}
