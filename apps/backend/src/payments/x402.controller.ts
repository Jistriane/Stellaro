import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';
import { X402Service } from './x402.service';

class QuoteX402Dto {
  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsString()
  asset?: string;

  @IsOptional()
  @IsString()
  walletAddress?: string;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsIn(['deposit', 'withdrawal', 'subscription', 'api-access'])
  intent?: 'deposit' | 'withdrawal' | 'subscription' | 'api-access';
}

@ApiTags('payments')
@Controller('payments/x402')
export class X402Controller {
  constructor(private readonly x402Service: X402Service) {}

  @Get('status')
  @ApiOperation({
    summary: 'Returns x402 settlement rail status and config surface',
  })
  getStatus() {
    return this.x402Service.getStatus();
  }

  @Post('quote')
  @ApiOperation({
    summary: 'Generates a base x402 quote for facilitator settlement',
  })
  createQuote(@Body() dto: QuoteX402Dto) {
    return this.x402Service.createQuote(dto);
  }
}
