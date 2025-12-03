import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface ReflectorPrice {
  symbol: string;
  price: number;
  timestamp: number;
  source: string;
}

export interface ReflectorAsset {
  asset: string;
  price: number;
  last_update: number;
}

@Injectable()
export class ReflectorService {
  private readonly logger = new Logger(ReflectorService.name);
  private readonly reflectorUrl: string;
  private readonly cache = new Map<string, { data: ReflectorPrice; expiresAt: number }>();
  private readonly CACHE_TTL = 60000; // 1 minute

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.reflectorUrl = this.configService.get<string>(
      'REFLECTOR_URL',
      'https://api.reflector.network',
    );
  }

  /**
   * Get current price for a Stellar asset from Reflector Network
   * @param assetCode Asset code (e.g., 'USDC', 'XLM', 'BTC')
   * @param assetIssuer Optional asset issuer for non-native assets
   * @returns Current price in USD
   */
  async getPrice(assetCode: string, assetIssuer?: string): Promise<ReflectorPrice> {
    const cacheKey = `${assetCode}:${assetIssuer || 'native'}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cached.data;
    }

    try {
      const asset = assetIssuer ? `${assetCode}:${assetIssuer}` : assetCode;
      const url = `${this.reflectorUrl}/api/v1/prices/${asset}`;

      this.logger.debug(`Fetching price for ${asset} from ${url}`);

      const response = await firstValueFrom(
        this.httpService.get<ReflectorAsset>(url, {
          timeout: 5000,
        }),
      );

      const price: ReflectorPrice = {
        symbol: assetCode,
        price: response.data.price,
        timestamp: response.data.last_update,
        source: 'reflector',
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: price,
        expiresAt: Date.now() + this.CACHE_TTL,
      });

      return price;
    } catch (error) {
      this.logger.error(`Failed to fetch price for ${assetCode}:`, error.message);
      
      // Fallback to cached data if available (even if expired)
      if (cached) {
        this.logger.warn(`Using expired cache for ${cacheKey}`);
        return cached.data;
      }

      throw new Error(`Unable to fetch price for ${assetCode}`);
    }
  }

  /**
   * Get prices for multiple assets in parallel
   * @param assets Array of asset codes
   * @returns Map of asset codes to prices
   */
  async getPrices(assets: string[]): Promise<Map<string, ReflectorPrice>> {
    const pricePromises = assets.map((asset) => this.getPrice(asset));
    const prices = await Promise.all(pricePromises);

    const priceMap = new Map<string, ReflectorPrice>();
    prices.forEach((price) => {
      priceMap.set(price.symbol, price);
    });

    return priceMap;
  }

  /**
   * Calculate USD value of an asset amount
   * @param assetCode Asset code
   * @param amount Amount of the asset
   * @param assetIssuer Optional asset issuer
   * @returns USD value
   */
  async getUsdValue(
    assetCode: string,
    amount: number,
    assetIssuer?: string,
  ): Promise<number> {
    const price = await this.getPrice(assetCode, assetIssuer);
    return amount * price.price;
  }

  /**
   * Get historical price data (if supported by Reflector)
   * @param assetCode Asset code
   * @param from Start timestamp
   * @param to End timestamp
   * @returns Array of historical prices
   */
  async getHistoricalPrices(
    assetCode: string,
    from: number,
    to: number,
  ): Promise<ReflectorPrice[]> {
    try {
      const url = `${this.reflectorUrl}/api/v1/history/${assetCode}`;
      
      const response = await firstValueFrom(
        this.httpService.get<ReflectorAsset[]>(url, {
          params: { from, to },
          timeout: 10000,
        }),
      );

      return response.data.map((item) => ({
        symbol: assetCode,
        price: item.price,
        timestamp: item.last_update,
        source: 'reflector',
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch historical prices for ${assetCode}:`, error.message);
      throw new Error(`Unable to fetch historical prices for ${assetCode}`);
    }
  }

  /**
   * Clear price cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log('Price cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
