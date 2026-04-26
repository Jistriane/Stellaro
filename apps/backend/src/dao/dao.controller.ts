import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DaoService } from './dao.service';

@Controller('dao')
export class DaoController {
  constructor(private readonly service: DaoService) {}

  @Get()
  getOverview(
    @Query()
    query: {
      page?: string;
      pageSize?: string;
      status?: string;
      search?: string;
    } = {},
  ) {
    return this.service.getOverview(query);
  }

  @Post()
  createProposal(
    @Body()
    body: { title: string; quorumBps: number; timelockHours: number },
  ) {
    return this.service.createProposal(body);
  }
}
