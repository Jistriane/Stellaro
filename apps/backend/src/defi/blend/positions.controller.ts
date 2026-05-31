import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { BlendYieldService } from '../blend-yield.service';
import { BlendPositionsService } from './positions.service';

@Controller('defi/blend')
export class BlendPositionsController {
  constructor(
    private readonly positionsService: BlendPositionsService,
    private readonly blendYieldService: BlendYieldService,
  ) {}

  @Get('positions/status')
  getStatus() {
    return this.blendYieldService.getOverview();
  }

  @Get('positions/:address')
  async getPositions(
    @Param('address') address: string,
    @Query('quote') quote: string = 'USD',
  ) {
    // Validação rápida de endereço Stellar: começa com 'G' e tem 56 chars
    if (!/^G[A-Z0-9]{55}$/.test(address)) {
      throw new BadRequestException('Invalid Stellar address');
    }
    return this.positionsService.getPositions(address, quote);
  }
}
