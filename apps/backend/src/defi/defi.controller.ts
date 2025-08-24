import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DefiService } from './defi.service';
import { SessionGuard } from '../auth/session.guard';

@Controller('defi')
@UseGuards(SessionGuard)
export class DefiController {
  constructor(private readonly service: DefiService) {}

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
}
