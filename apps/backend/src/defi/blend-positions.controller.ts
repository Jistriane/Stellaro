import { Controller, Get, Param } from '@nestjs/common';
import { BlendYieldService } from './blend-yield.service';

@Controller('defi/blend/positions')
export class BlendPositionsController {
  constructor(private readonly blendYieldService: BlendYieldService) {}

  @Get('status')
  getStatus() {
    return this.blendYieldService.getOverview();
  }

  @Get(':address')
  getPositions(@Param('address') address: string) {
    // Stub de posições para desenvolvimento
    const positions = [
      {
        asset: 'BTC',
        poolId: 'pool-btc-1',
        valueUSD: 25000,
        apy: 0.06,
        accruedInterestUSD: 75,
      },
      {
        asset: 'ETH',
        poolId: 'pool-eth-2',
        valueUSD: 15000,
        apy: 0.08,
        accruedInterestUSD: 60,
      },
    ];
    return positions;
  }
}
