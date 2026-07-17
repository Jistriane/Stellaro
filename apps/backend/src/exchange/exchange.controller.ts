import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwt.guard';
import { User } from '../auth/user.decorator';
import { ExchangeService } from './exchange.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetQuoteDto } from './dto/get-quote.dto';

type JwtUser = { id: string };

@ApiTags('exchange')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('exchange')
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Get('quotes')
  @ApiOperation({ summary: 'Gera quote temporaria para FX/crypto exchange' })
  async getQuote(@User() user: JwtUser, @Query() query: GetQuoteDto) {
    const quote = await this.exchangeService.createQuote({
      userId: user.id,
      pair: `${query.from}/${query.to}`,
      baseAsset: query.from,
      quoteAsset: query.to,
      side: query.side,
      amountIn: query.amount,
    });

    return { ok: true, quote };
  }

  @Post('orders')
  @ApiOperation({ summary: 'Cria ordem a partir de quote valida' })
  async createOrder(@User() user: JwtUser, @Body() dto: CreateOrderDto) {
    const order = await this.exchangeService.createOrder({
      userId: user.id,
      quoteId: dto.quoteId,
      walletId: dto.walletId,
      metadata: dto.clientRequestId
        ? { clientRequestId: dto.clientRequestId }
        : undefined,
    });

    return { ok: true, order };
  }

  @Get('orders')
  @ApiOperation({ summary: 'Lista ordens do usuario autenticado' })
  async listOrders(@User() user: JwtUser) {
    const orders = await this.exchangeService.listOrdersByUser(user.id);
    return { ok: true, orders };
  }

  @Get('status')
  @ApiOperation({ summary: 'Retorna status do provider de exchange e fallback' })
  getStatus() {
    return this.exchangeService.getProviderStatus();
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Busca detalhes de uma ordem do usuario autenticado' })
  async getOrder(@User() user: JwtUser, @Param('id') id: string) {
    const order = await this.exchangeService.getOrderById(id);
    if (order && order.userId !== user.id) {
      throw new ForbiddenException('Order does not belong to authenticated user');
    }
    return {
      ok: true,
      order,
    };
  }
}
