import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RwaService } from './rwa.service';

@Controller('rwa')
export class RwaController {
  constructor(private readonly service: RwaService) {}

  @Get()
  getOverview(
    @Query()
    query: {
      page?: string;
      pageSize?: string;
      status?: string;
      assetClass?: string;
      search?: string;
    } = {},
  ) {
    return this.service.getOverview(query);
  }

  @Post()
  createAsset(
    @Body()
    body: { name: string; assetClass: string; annualYieldBps: number },
  ) {
    return this.service.createAsset(body);
  }

  @Post('mint')
  mintAsset(
    @Body()
    body: { id: string; userAddress: string; amount: string },
  ) {
    return this.service.mintAsset(body.id, body.userAddress, body.amount);
  }
}