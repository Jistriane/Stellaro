import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SsiService } from './ssi.service';

@Controller('ssi')
export class SsiController {
  constructor(private readonly service: SsiService) {}

  @Get()
  getOverview(
    @Query()
    query: {
      page?: string;
      pageSize?: string;
      status?: string;
      type?: string;
      search?: string;
    } = {},
  ) {
    return this.service.getOverview(query);
  }

  @Post()
  issueCredential(
    @Body()
    body: { type: string; issuer: string },
  ) {
    return this.service.issueCredential(body);
  }
}