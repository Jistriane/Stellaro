import { Body, Controller, ForbiddenException, Get, Post, Query, Param } from '@nestjs/common';
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
    const nodeEnv = process.env.NODE_ENV ?? 'development';
    if (nodeEnv.toLowerCase() === 'production') {
      throw new ForbiddenException('Direct secret submission is disabled in production.');
    }
    return this.service.createProposal(body);
  }

  @Post(':id/vote')
  vote(
    @Param('id') id: string,
    @Body() body: { support: boolean; voterSecret: string },
  ) {
    const nodeEnv = process.env.NODE_ENV ?? 'development';
    if (nodeEnv.toLowerCase() === 'production') {
      throw new ForbiddenException('Direct secret submission is disabled in production.');
    }
    return this.service.vote(Number(id), body.support, body.voterSecret);
  }

  @Post(':id/execute')
  execute(@Param('id') id: string, @Body() body: { signerSecret: string }) {
    const nodeEnv = process.env.NODE_ENV ?? 'development';
    if (nodeEnv.toLowerCase() === 'production') {
      throw new ForbiddenException('Direct secret submission is disabled in production.');
    }
    return this.service.execute(Number(id), body.signerSecret);
  }
}
