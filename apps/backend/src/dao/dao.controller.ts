import { Body, Controller, Get, Post, Query, Param } from '@nestjs/common';
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
    body: {
      target: string;
      action: string;
      description: string;
      creatorSecret: string;
      title: string;
    },
  ) {
    return this.service.createProposal(body);
  }

  @Post(':id/vote')
  vote(
    @Param('id') id: string,
    @Body() body: { support: boolean; voterSecret: string },
  ) {
    return this.service.vote(Number(id), body.support, body.voterSecret);
  }

  @Post(':id/execute')
  execute(@Param('id') id: string, @Body() body: { signerSecret: string }) {
    return this.service.execute(Number(id), body.signerSecret);
  }
}
