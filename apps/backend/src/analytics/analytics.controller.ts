import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('overview')
  overview() {
    return this.service.getOverview();
  }

  @Get('stablecoin/:contractId')
  stablecoin(@Param('contractId') contractId: string) {
    return this.service.getStablecoin(contractId);
  }
}
