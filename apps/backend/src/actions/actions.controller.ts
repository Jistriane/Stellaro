import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ActionsService } from './actions.service';

@Controller('actions')
export class ActionsController {
  constructor(private readonly actions: ActionsService) {}

  @Post('stablecoin/mint')
  async stablecoinMint(
    @Body()
    body: {
      to: string;
      amount: string | number;
      riskBps: number;
      dryRun?: boolean;
      userId?: string;
      proposalId?: string;
    },
  ) {
    if (!body?.to || body.amount === undefined || body.riskBps === undefined) {
      throw new HttpException(
        'Invalid body: to, amount, riskBps are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.actions.stablecoinMintGuarded({
      to: body.to,
      amount: body.amount,
      riskBps: Number(body.riskBps),
      dryRun: Boolean(body.dryRun),
      userId: body.userId,
      proposalId: body.proposalId,
    });
  }

  @Post('stablecoin/burn')
  async stablecoinBurn(
    @Body()
    body: {
      from: string;
      amount: string | number;
      dryRun?: boolean;
      userId?: string;
      proposalId?: string;
    },
  ) {
    if (!body?.from || body.amount === undefined) {
      throw new HttpException(
        'Invalid body: from, amount are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.actions.stablecoinBurn({
      from: body.from,
      amount: body.amount,
      dryRun: Boolean(body.dryRun),
      userId: body.userId,
      proposalId: body.proposalId,
    });
  }
}
