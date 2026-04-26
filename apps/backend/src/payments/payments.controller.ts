import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PixService } from './pix.service';
import { CardService } from './card.service';
import { ComplianceGuard } from './payments.guard';

@Controller('payments')
@UseGuards(ComplianceGuard)
export class PaymentsController {
  constructor(
    private readonly pixService: PixService,
    private readonly cardService: CardService,
  ) {}

  @Post('pix/mint')
  async mintWithPix(@Body() body: any) {
    return await this.pixService.generatePixCharge(body);
  }

  @Post('card/tokenize')
  async tokenizeCard(@Body() body: any) {
    return await this.cardService.tokenizeCard(body);
  }

  @Post('card/charge')
  async chargeCard(@Body() body: any) {
    return await this.cardService.chargeCard(body);
  }
}
