import { Controller, Get, Query } from '@nestjs/common';
import { OraclesService } from './oracles.service';

@Controller('oracles')
export class OraclesController {
  constructor(private readonly oracles: OraclesService) {}

  @Get('price')
  async price(@Query('base') base: string, @Query('quote') quote: string) {
    return this.oracles.getPrice(base, quote);
  }

  @Get('fx')
  async fx(@Query('pair') pair: string) {
    // ex: pair=USD/BRL
    const [base, quote] = pair?.split('/') ?? ['USD', 'USD'];
    return this.oracles.getPrice(base, quote);
  }

  @Get('alerts')
  async alerts() {
    return this.oracles.getDefiAlerts();
  }
}
