import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { BlendPositionsService } from './positions.service';

@Controller('defi/blend')
export class BlendPositionsController {
  constructor(private readonly positionsService: BlendPositionsService) {}

  @Get('positions/:address')
  async getPositions(@Param('address') address: string, @Query('quote') quote: string = 'USD') {
    // Validação rápida de endereço Stellar: começa com 'G' e tem 56 chars
    if (!/^G[A-Z0-9]{55}$/.test(address)) {
      throw new BadRequestException('Invalid Stellar address');
    }
    return this.positionsService.getPositions(address, quote);
  }
}
