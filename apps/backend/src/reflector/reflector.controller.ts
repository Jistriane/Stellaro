import {
  Controller,
  Get,
  Param,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReflectorService, ReflectorPrice } from './reflector.service';

@ApiTags('reflector')
@Controller('reflector')
export class ReflectorController {
  constructor(private readonly reflectorService: ReflectorService) {}

  @Get('price/:asset')
  @ApiOperation({
    summary: 'Get current price for an asset from Reflector Network',
  })
  @ApiParam({ name: 'asset', description: 'Asset code (e.g., USDC, XLM, BTC)' })
  @ApiQuery({
    name: 'issuer',
    required: false,
    description: 'Asset issuer address',
  })
  @ApiResponse({ status: 200, description: 'Current asset price' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async getPrice(
    @Param('asset') asset: string,
    @Query('issuer') issuer?: string,
  ): Promise<ReflectorPrice> {
    return this.reflectorService.getPrice(asset, issuer);
  }

  @Get('prices')
  @ApiOperation({ summary: 'Get prices for multiple assets' })
  @ApiQuery({
    name: 'assets',
    description: 'Comma-separated list of asset codes',
  })
  @ApiResponse({ status: 200, description: 'Map of asset prices' })
  async getPrices(
    @Query('assets') assets: string,
  ): Promise<Record<string, ReflectorPrice>> {
    const assetArray = assets.split(',').map((a) => a.trim());
    const priceMap = await this.reflectorService.getPrices(assetArray);

    const result: Record<string, ReflectorPrice> = {};
    priceMap.forEach((price, symbol) => {
      result[symbol] = price;
    });

    return result;
  }

  @Get('value/:asset/:amount')
  @ApiOperation({ summary: 'Calculate USD value of an asset amount' })
  @ApiParam({ name: 'asset', description: 'Asset code' })
  @ApiParam({ name: 'amount', description: 'Amount of the asset' })
  @ApiQuery({
    name: 'issuer',
    required: false,
    description: 'Asset issuer address',
  })
  @ApiResponse({ status: 200, description: 'USD value of the asset amount' })
  async getUsdValue(
    @Param('asset') asset: string,
    @Param('amount') amount: string,
    @Query('issuer') issuer?: string,
  ): Promise<{ asset: string; amount: number; usdValue: number }> {
    const numAmount = parseFloat(amount);
    const usdValue = await this.reflectorService.getUsdValue(
      asset,
      numAmount,
      issuer,
    );

    return {
      asset,
      amount: numAmount,
      usdValue,
    };
  }

  @Get('history/:asset')
  @ApiOperation({ summary: 'Get historical price data for an asset' })
  @ApiParam({ name: 'asset', description: 'Asset code' })
  @ApiQuery({ name: 'from', description: 'Start timestamp (Unix)' })
  @ApiQuery({ name: 'to', description: 'End timestamp (Unix)' })
  @ApiResponse({ status: 200, description: 'Historical price data' })
  async getHistoricalPrices(
    @Param('asset') asset: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<ReflectorPrice[]> {
    const fromTimestamp = parseInt(from, 10);
    const toTimestamp = parseInt(to, 10);

    return this.reflectorService.getHistoricalPrices(
      asset,
      fromTimestamp,
      toTimestamp,
    );
  }

  @Delete('cache')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear price cache' })
  @ApiResponse({ status: 204, description: 'Cache cleared successfully' })
  async clearCache(): Promise<void> {
    this.reflectorService.clearCache();
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics' })
  async getCacheStats(): Promise<{ size: number; keys: string[] }> {
    return this.reflectorService.getCacheStats();
  }
}
