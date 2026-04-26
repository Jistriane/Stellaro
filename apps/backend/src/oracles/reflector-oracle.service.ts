import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StellarSdk from '@stellar/stellar-sdk';

/**
 * Reflector Network Oracle Service
 * Fornece dados de preços com latência <500ms
 * Multi-source com fallback para Stellar DEX
 */

export interface PriceData {
  asset: string;
  price: number;
  timestamp: number;
  source: 'reflector' | 'stellar_dex' | 'chainlink';
  confidence: number; // 0-100
}

export interface OracleConfig {
  reflectorUrl: string;
  stellarHorizon: string;
  chainlinkUrl?: string;
  cacheTimeout: number; // ms
  maxLatency: number; // ms
}

@Injectable()
export class ReflectorOracleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReflectorOracleService.name);
  private readonly config: OracleConfig;
  private readonly priceCache: Map<string, PriceData> = new Map();
  private readonly server: StellarSdk.Horizon.Server;
  private cacheWarmerTimer: NodeJS.Timeout | null = null;

  constructor(private configService: ConfigService) {
    const useStub = this.configService.get('ORACLE_MODE') === 'stub';
    
    this.config = {
      reflectorUrl: useStub
        ? 'stub'
        : (this.configService.get('REFLECTOR_URL') || 'https://api.reflector.network'),
      stellarHorizon:
        this.configService.get('STELLAR_HORIZON') ||
        'https://horizon.stellar.org',
      chainlinkUrl: this.configService.get('CHAINLINK_URL'),
      cacheTimeout: 5000, // 5s cache
      maxLatency: 500, // 500ms SLA
    };

    this.server = new StellarSdk.Horizon.Server(this.config.stellarHorizon);
    
    if (useStub) {
      this.logger.log('Running in STUB mode - returning fixed prices');
    }
  }

  async onModuleInit() {
    this.logger.log('Initializing Reflector Oracle Service...');
    await this.healthCheck();
    this.startCacheWarmer();
  }

  onModuleDestroy() {
    if (this.cacheWarmerTimer) {
      clearInterval(this.cacheWarmerTimer);
      this.cacheWarmerTimer = null;
    }
  }

  /**
   * Obtém preço com fallback multi-source
   */
  async getPrice(
    asset: string,
    quoteCurrency = 'USD',
  ): Promise<PriceData | null> {
    const startTime = Date.now();
    const cacheKey = `${asset}/${quoteCurrency}`;

    // 1. Tenta cache primeiro
    const cached = this.priceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cached;
    }

    // 2. Tenta Reflector Network (primary)
    try {
      const reflectorPrice = await this.fetchFromReflector(
        asset,
        quoteCurrency,
      );
      if (reflectorPrice) {
        const latency = Date.now() - startTime;
        if (latency > this.config.maxLatency) {
          this.logger.warn(
            `Reflector latency ${latency}ms exceeds SLA ${this.config.maxLatency}ms`,
          );
        }
        this.priceCache.set(cacheKey, reflectorPrice);
        return reflectorPrice;
      }
    } catch (error) {
      this.logger.debug(`Reflector fetch failed: ${error.message}`);
    }

    // 3. Fallback: Stellar DEX
    try {
      const dexPrice = await this.fetchFromStellarDEX(asset, quoteCurrency);
      if (dexPrice) {
        this.priceCache.set(cacheKey, dexPrice);
        return dexPrice;
      }
    } catch (error) {
      this.logger.debug(`Stellar DEX fetch failed: ${error.message}`);
    }

    // 4. Fallback: Chainlink (se configurado)
    if (this.config.chainlinkUrl) {
      try {
        const chainlinkPrice = await this.fetchFromChainlink(
          asset,
          quoteCurrency,
        );
        if (chainlinkPrice) {
          this.priceCache.set(cacheKey, chainlinkPrice);
          return chainlinkPrice;
        }
      } catch (error) {
        this.logger.debug(`Chainlink fetch failed: ${error.message}`);
      }
    }

    this.logger.debug(`All oracle sources failed for ${cacheKey}, using stub`);
    return null;
  }

  /**
   * Fetches price from Reflector Network
   */
  private async fetchFromReflector(
    asset: string,
    quote: string,
  ): Promise<PriceData | null> {
    // Stub mode para testes
    if (this.config.reflectorUrl === 'stub') {
      const stubPrices: Record<string, number> = {
        'XLM/USD': 0.12,
        'USDC/USD': 1.0,
        'BTC/USD': 45000,
        'ETH/USD': 2800,
      };
      
      const key = `${asset}/${quote}`;
      if (stubPrices[key]) {
        return {
          asset,
          price: stubPrices[key],
          timestamp: Date.now(),
          source: 'reflector',
          confidence: 100,
        };
      }
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.maxLatency,
    );

    try {
      const response = await fetch(
        `${this.config.reflectorUrl}/api/prices/${asset}/${quote}`,
        {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        asset,
        price: parseFloat(data.price),
        timestamp: data.timestamp || Date.now(),
        source: 'reflector',
        confidence: data.confidence || 95,
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        this.logger.warn(`Reflector timeout for ${asset}/${quote}`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Fetches price from Stellar DEX orderbook
   */
  private async fetchFromStellarDEX(
    asset: string,
    quote: string,
  ): Promise<PriceData | null> {
    try {
      // Mapeia assets para Stellar codes
      const baseAsset = this.mapToStellarAsset(asset);
      const quoteAsset = this.mapToStellarAsset(quote);

      if (!baseAsset || !quoteAsset) {
        return null;
      }

      const orderbook = await this.server
        .orderbook(baseAsset, quoteAsset)
        .limit(10)
        .call();

      if (!orderbook.bids || orderbook.bids.length === 0) {
        return null;
      }

      // Usa median dos top 5 bids
      const prices = orderbook.bids
        .slice(0, 5)
        .map((bid) => parseFloat(bid.price));
      const medianPrice = this.calculateMedian(prices);

      return {
        asset,
        price: medianPrice,
        timestamp: Date.now(),
        source: 'stellar_dex',
        confidence: 80, // Menor confidence que Reflector
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetches price from Chainlink (placeholder)
   */
  private async fetchFromChainlink(
    asset: string,
    quote: string,
  ): Promise<PriceData | null> {
    // TODO: Implementar integração Chainlink quando necessário
    this.logger.warn('Chainlink integration not implemented yet');
    return null;
  }

  /**
   * Calcula preço agregado de múltiplas fontes (median filtering)
   */
  async getAggregatedPrice(
    asset: string,
    quoteCurrency = 'USD',
  ): Promise<PriceData | null> {
    const prices: PriceData[] = [];

    // Coleta de todas as fontes em paralelo
    const [reflector, dex, chainlink] = await Promise.allSettled([
      this.fetchFromReflector(asset, quoteCurrency),
      this.fetchFromStellarDEX(asset, quoteCurrency),
      this.config.chainlinkUrl
        ? this.fetchFromChainlink(asset, quoteCurrency)
        : Promise.resolve(null),
    ]);

    if (reflector.status === 'fulfilled' && reflector.value) {
      prices.push(reflector.value);
    }
    if (dex.status === 'fulfilled' && dex.value) {
      prices.push(dex.value);
    }
    if (chainlink.status === 'fulfilled' && chainlink.value) {
      prices.push(chainlink.value);
    }

    if (prices.length === 0) {
      return null;
    }

    // Weighted median por confidence
    const weightedPrices = prices.map((p) => ({
      price: p.price,
      weight: p.confidence,
    }));

    const medianPrice = this.calculateWeightedMedian(weightedPrices);
    const avgConfidence =
      prices.reduce((sum, p) => sum + p.confidence, 0) / prices.length;

    return {
      asset,
      price: medianPrice,
      timestamp: Date.now(),
      source: 'reflector', // Primary source
      confidence: avgConfidence,
    };
  }

  /**
   * Health check do serviço
   */
  private async healthCheck(): Promise<boolean> {
    try {
      // Testa Reflector
      const testPrice = await this.getPrice('XLM', 'USD');
      if (!testPrice) {
        this.logger.warn('Reflector health check failed');
        return false;
      }

      this.logger.log(
        `Reflector Oracle healthy - XLM/USD: $${testPrice.price}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Cache warmer para assets populares
   */
  private startCacheWarmer() {
    const popularAssets = ['XLM', 'USDC', 'BTC', 'ETH'];

    if (this.cacheWarmerTimer) {
      clearInterval(this.cacheWarmerTimer);
    }

    this.cacheWarmerTimer = setInterval(
      async () => {
        for (const asset of popularAssets) {
          try {
            await this.getPrice(asset, 'USD');
          } catch (error) {
            this.logger.debug(
              `Cache warm failed for ${asset}: ${error.message}`,
            );
          }
        }
      },
      this.config.cacheTimeout / 2,
    ); // Refresh a cada 2.5s

    // Evita bloquear o encerramento do processo de testes.
    this.cacheWarmerTimer.unref();
  }

  /**
   * Mapeia asset code para Stellar Asset
   */
  private mapToStellarAsset(code: string): StellarSdk.Asset | null {
    switch (code.toUpperCase()) {
      case 'XLM':
        return StellarSdk.Asset.native();
      case 'USD':
      case 'USDC':
        return new StellarSdk.Asset(
          'USDC',
          'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        );
      case 'BRL':
        return new StellarSdk.Asset(
          'BRL',
          'GDVKY2GU2DRXWTBEYJJWSFXIGBZV6AZNBVVSUHEPZI54LIS6BA7DVVSP',
        );
      default:
        return null;
    }
  }

  /**
   * Calcula mediana de array
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calcula mediana ponderada
   */
  private calculateWeightedMedian(
    items: Array<{ price: number; weight: number }>,
  ): number {
    if (items.length === 0) return 0;

    const sorted = [...items].sort((a, b) => a.price - b.price);
    const totalWeight = sorted.reduce((sum, item) => sum + item.weight, 0);
    const halfWeight = totalWeight / 2;

    let cumulativeWeight = 0;
    for (const item of sorted) {
      cumulativeWeight += item.weight;
      if (cumulativeWeight >= halfWeight) {
        return item.price;
      }
    }

    return sorted[sorted.length - 1].price;
  }

  /**
   * Limpa cache (útil para testes)
   */
  clearCache() {
    this.priceCache.clear();
    this.logger.debug('Price cache cleared');
  }
}
