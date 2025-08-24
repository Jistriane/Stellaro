import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ComplianceGuard } from './payments.guard';

@Controller('payments')
export class PaymentsController {
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
}
