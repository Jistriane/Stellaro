import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlendPositionsService } from './positions.service';

@Controller('defi/blend')
export class BlendPositionsController {
  constructor(private readonly positionsService: BlendPositionsService) {}

  @Get('positions/:address')
  async getPositions(@Param('address') address: string, @Query('quote') quote: string = 'USD') {
    return this.positionsService.getPositions(address, quote);
  }
}
