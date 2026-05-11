import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';
import { EtherfuseService } from './etherfuse.service';

class QuoteEtherfuseDto {
  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsIn(['onramp', 'offramp', 'swap'])
  quoteType?: 'onramp' | 'offramp' | 'swap';

  @IsOptional()
  @IsString()
  sourceAsset?: string;

  @IsOptional()
  @IsString()
  targetAsset?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  walletAddress?: string;
}

class CreateEtherfuseOrderDto {
  @IsString()
  quoteId: string;

  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @IsOptional()
  @IsString()
  walletAddress?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  memo?: string;
}

@ApiTags('payments')
@Controller('payments/etherfuse')
export class EtherfuseController {
  constructor(private readonly etherfuseService: EtherfuseService) {}

  @Get('status')
  @ApiOperation({ summary: 'Returns Etherfuse rail status and runtime configuration' })
  getStatus() {
    return this.etherfuseService.getStatus();
  }

  @Post('quote')
  @ApiOperation({ summary: 'Creates an Etherfuse quote (stub or live)' })
  async createQuote(@Body() dto: QuoteEtherfuseDto) {
    return this.etherfuseService.createQuote(dto);
  }

  @Post('order')
  @ApiOperation({ summary: 'Creates an Etherfuse order from a quoteId (stub or live)' })
  async createOrder(@Body() dto: CreateEtherfuseOrderDto) {
    return this.etherfuseService.createOrder(dto);
  }
}
