import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DefiService } from './defi.service';
import { BlendYieldService } from './blend-yield.service';
import { SessionGuard } from '../auth/session.guard';

@ApiTags('defi')
@Controller('defi')
@UseGuards(SessionGuard)
export class DefiController {
  constructor(
    private readonly service: DefiService,
    private readonly blendService: BlendYieldService,
  ) {}

  @Post('yield/stake')
  stake(
    @Body()
    body: {
      poolId: string;
      amount: string | number;
      dryRun?: boolean;
      userId?: string;
      proposalId?: string;
    },
  ) {
    return this.service.stake(body);
  }

  @Post('yield/unstake')
  unstake(
    @Body()
    body: {
      poolId: string;
      amount: string | number;
      dryRun?: boolean;
      userId?: string;
      proposalId?: string;
    },
  ) {
    return this.service.unstake(body);
  }

  @Post('lp/add')
  addLiquidity(
    @Body()
    body: {
      poolId: string;
      amounts: Array<string | number>;
      dryRun?: boolean;
      userId?: string;
      proposalId?: string;
    },
  ) {
    return this.service.addLiquidity(body);
  }

  @Post('lp/remove')
  removeLiquidity(
    @Body()
    body: {
      poolId: string;
      share: string | number;
      dryRun?: boolean;
      userId?: string;
      proposalId?: string;
    },
  ) {
    return this.service.removeLiquidity(body);
  }

  @Post('flash-loan/guard')
  flashLoanGuard(
    @Body()
    body: {
      txPreview: unknown;
      maxAmount: number;
      riskBps: number;
      userId?: string;
      proposalId?: string;
    },
  ) {
    return this.service.flashLoanGuard(body);
  }

  @Post('lending/loan-by-score')
  loanByScore(
    @Body()
    body: {
      userScore: number;
      amount: number;
      userId?: string;
      proposalId?: string;
    },
  ) {
    return this.service.loanByScore(body);
  }

  // Blend Protocol Endpoints
  @Post('blend/auto-compound')
  @ApiOperation({ summary: 'Auto-compound Blend rewards' })
  @ApiResponse({ status: 200, description: 'Compound results' })
  async autoCompound(@Body() body: { userAddress: string }) {
    return this.blendService.autoCompound(body.userAddress);
  }

  @Get('blend/optimal-pool/:asset')
  @ApiOperation({ summary: 'Find optimal pool for asset' })
  @ApiResponse({ status: 200, description: 'Pool analysis' })
  async findOptimalPool(@Param('asset') asset: string) {
    return this.blendService.findOptimalPool(asset);
  }

  @Post('blend/rebalance')
  @ApiOperation({ summary: 'Rebalance portfolio across pools' })
  @ApiResponse({ status: 200, description: 'Rebalance operations' })
  async rebalancePortfolio(
    @Body()
    body: {
      userAddress: string;
      targetAllocation: Record<string, number>;
    },
  ) {
    const targetMap = new Map(Object.entries(body.targetAllocation));
    return this.blendService.rebalancePortfolio(body.userAddress, targetMap);
  }
}
