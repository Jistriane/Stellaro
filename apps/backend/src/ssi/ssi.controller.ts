import { Body, Controller, Get, Post, Query, Param } from '@nestjs/common';
import { SsiService } from './ssi.service';

@Controller('ssi')
export class SsiController {
  constructor(private readonly service: SsiService) {}

  @Get('status')
  getStatus() {
    return this.service.getIssuanceStatus();
  }

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
    body: {
      userAddress: string;
      type: string;
      issuer: string;
      vcHash?: string;
    },
  ) {
    return this.service.issueCredential(body);
  }

  @Get('verify/:address')
  verifyOnChain(@Param('address') address: string) {
    return this.service.verifyOnChain(address);
  }
}
