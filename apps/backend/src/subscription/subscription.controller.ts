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

  @Post()
  createPlan(
    @Body()
    body: {
      name: string;
      cadence: string;
      amount: string;
      currency?: string;
    },
  ) {
    return this.service.createPlan(body);
  }
}
