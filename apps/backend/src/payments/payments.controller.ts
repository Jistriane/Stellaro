import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ComplianceGuard } from './payments.guard';
import { ActionsService } from '../actions/actions.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly actions: ActionsService) {}

  // Stubs de rotas PIX e Cartões, protegidas por ComplianceGuard

  @UseGuards(ComplianceGuard)
  @Post('pix/send')
  async sendPix(
    @Body() body: { userId: string; to: string; amount: number; memo?: string },
  ) {
    // Integrar provedor PIX no futuro
    return { ok: true, provider: 'pix-stub', ...body };
  }

  @UseGuards(ComplianceGuard)
  @Post('card/charge')
  async chargeCard(
    @Body()
    body: {
      userId: string;
      pan_last4: string;
      amount: number;
      currency: string;
      descriptor?: string;
    },
  ) {
    // Integrar gateway de cartões no futuro
    return { ok: true, provider: 'card-stub', ...body };
  }

  @UseGuards(ComplianceGuard)
  @Post('stablecoin/transfer')
  async settleStablecoin(
    @Body()
    body: {
      from: string;
      to: string;
      amount: string | number;
      dryRun?: boolean;
      userId?: string;
      proposalId?: string;
    },
  ) {
    if (!body?.from || !body?.to || body.amount === undefined) {
      throw new HttpException(
        'Invalid body: from, to, amount are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.actions.stablecoinTransfer({
      from: body.from,
      to: body.to,
      amount: body.amount,
      dryRun: Boolean(body.dryRun),
      userId: body.userId,
      proposalId: body.proposalId,
    });
  }
}
